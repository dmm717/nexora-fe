import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const controllerSource = await readFile(
  new URL('../src/services/azureSpeechPlayback.ts', import.meta.url),
  'utf8'
);
const asDataModule = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const apiClientStub = asDataModule(
  'export class ApiError extends Error { constructor(message, code, requestId, status) { super(message); this.code = code; this.requestId = requestId; this.status = status; } }'
);
const tokenManagerStub = asDataModule(
  'export const getInterviewSpeechAuthorization = async () => { throw new Error("Use injected test authorization."); };'
);
const speechConfigStub = asDataModule(
  "export const INTERVIEW_SPEECH_CONFIG = { voiceName: 'de-DE-Seraphina:DragonHDLatestNeural' };"
);
const controllerJs = ts.transpileModule(controllerSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
  .replace(/from ["']\.\/apiClient["']/g, `from '${apiClientStub}'`)
  .replace(/from ["']\.\/speechTokenManager["']/g, `from '${tokenManagerStub}'`)
  .replace(/from ["']\.\.\/config\/speech["']/g, `from '${speechConfigStub}'`);
const controllerModule = await import(
  asDataModule(controllerJs)
);
const { ApiError } = await import(apiClientStub);
const {
  createAzureSpeechPlaybackController,
  getAzureSpeechErrorMessage,
} = controllerModule;

const voiceConfigSource = await readFile(new URL('../src/config/speech.ts', import.meta.url), 'utf8');
const playbackSource = await readFile(
  new URL('../src/services/azureSpeechPlayback.ts', import.meta.url),
  'utf8'
);
const questionSpeakerSource = await readFile(
  new URL('../src/components/features/interview/QuestionSpeaker.tsx', import.meta.url),
  'utf8'
);
const speechDockSource = await readFile(
  new URL('../src/components/features/interview/AudioSpeechDock.tsx', import.meta.url),
  'utf8'
);
const speechApiSource = await readFile(new URL('../src/services/speechApi.ts', import.meta.url), 'utf8');

class FakeAudioElement {
  listeners = new Map();
  pauseCount = 0;

  addEventListener(name, listener) {
    const listeners = this.listeners.get(name) ?? new Set();
    listeners.add(listener);
    this.listeners.set(name, listeners);
  }

  removeEventListener(name, listener) {
    this.listeners.get(name)?.delete(listener);
  }

  pause() {
    this.pauseCount += 1;
  }

  emit(name) {
    for (const listener of this.listeners.get(name) ?? []) listener({ type: name });
  }
}

function createFakeSdk() {
  const calls = {
    authorization: [],
    audioConfigs: [],
    speakers: [],
    synthesizers: [],
  };

  class FakeSpeaker {
    internalAudio = new FakeAudioElement();
    onAudioStart = () => undefined;
    onAudioEnd = () => undefined;
    pauseCount = 0;
    resumeCount = 0;
    closeCount = 0;
    resumeBehavior = 'pending';
    resumeError = new Error('NotAllowedError: blocked by autoplay policy');

    constructor() {
      calls.speakers.push(this);
    }

    pause() {
      this.pauseCount += 1;
    }

    resume(success, error) {
      this.resumeCount += 1;
      if (this.resumeBehavior === 'resolve') success?.();
      if (this.resumeBehavior === 'reject') error?.(this.resumeError);
    }

    close() {
      this.closeCount += 1;
    }
  }

  class FakeSynthesizer {
    closeCount = 0;

    constructor(config, audioConfig) {
      this.config = config;
      this.audioConfig = audioConfig;
      this.requests = [];
      calls.synthesizers.push(this);
    }

    speakTextAsync(text, complete, error) {
      this.requests.push({ text, complete, error });
    }

    close() {
      this.closeCount += 1;
    }
  }

  class FakeSpeechConfig {
    speechSynthesisVoiceName = '';
    speechSynthesisOutputFormat = null;

    static fromAuthorizationToken(token, region) {
      calls.authorization.push({ token, region });
      return new FakeSpeechConfig();
    }
  }

  const sdk = {
    AudioConfig: {
      fromSpeakerOutput(speaker) {
        const config = {
          speaker,
          closeCount: 0,
          close() {
            this.closeCount += 1;
            speaker.close();
          },
        };
        calls.audioConfigs.push(config);
        return config;
      },
    },
    ResultReason: { SynthesizingAudioCompleted: 'completed' },
    SpeakerAudioDestination: FakeSpeaker,
    SpeechConfig: FakeSpeechConfig,
    SpeechSynthesisOutputFormat: { Audio24Khz160KBitRateMonoMp3: 'mp3-24khz' },
    SpeechSynthesizer: FakeSynthesizer,
  };

  return { calls, sdk };
}

const validAuthorization = {
  token: 'test-only-short-lived-token',
  region: 'test-region',
  expiresAt: '2026-01-01T00:10:00.000Z',
};

function makeController(overrides = {}) {
  const fake = createFakeSdk();
  const states = [];
  const controller = createAzureSpeechPlaybackController({
    interviewId: 'interview-123',
    getAuthorization: async () => validAuthorization,
    loadSdk: async () => fake.sdk,
    onStateChange: (state) => states.push(state),
    ...overrides,
  });
  return { ...fake, controller, states };
}

const flushDeferredPlayback = () => new Promise((resolve) => setImmediate(resolve));

test('uses the exact product-selected voice and the authenticated token endpoint', () => {
  assert.match(voiceConfigSource, /voiceName:\s*'de-DE-Seraphina:DragonHDLatestNeural'/);
  assert.match(speechApiSource, /apiClient\.post\(/);
  assert.match(speechApiSource, /\/speech\/interviews\/\$\{encodeURIComponent\(interviewId\)\}\/token/);
  assert.doesNotMatch(playbackSource, /fromSubscription\s*\(/);
  assert.match(playbackSource, /fromAuthorizationToken\(/);
});

test('loads the official SDK lazily and makes one whole-question synthesis request', async () => {
  const fake = createFakeSdk();
  const states = [];
  let sdkLoads = 0;
  const controller = createAzureSpeechPlaybackController({
    interviewId: 'interview-123',
    getAuthorization: async () => validAuthorization,
    loadSdk: async () => {
      sdkLoads += 1;
      return fake.sdk;
    },
    onStateChange: (state) => states.push(state),
  });

  assert.equal(sdkLoads, 0, 'constructing the controller does not load the SDK');
  const question = 'Bạn đã sử dụng React và Next.js để thiết kế REST API bằng ASP.NET Core như thế nào?';
  await controller.speak(question);

  assert.equal(sdkLoads, 1);
  assert.deepEqual(fake.calls.authorization, [{ token: validAuthorization.token, region: 'test-region' }]);
  assert.equal(fake.calls.synthesizers.length, 1);
  assert.equal(fake.calls.synthesizers[0].requests.length, 1);
  assert.equal(fake.calls.synthesizers[0].requests[0].text, question);
  assert.equal(fake.calls.synthesizers[0].config.speechSynthesisVoiceName, 'de-DE-Seraphina:DragonHDLatestNeural');
  assert.equal(fake.calls.synthesizers[0].config.speechSynthesisOutputFormat, 'mp3-24khz');
  assert.equal(states.at(-1).status, 'loading');

  const speaker = fake.calls.speakers[0];
  speaker.onAudioStart(speaker);
  assert.equal(states.at(-1).status, 'loading', 'SDK setup is not mistaken for audible playback');
  await flushDeferredPlayback();
  assert.equal(speaker.resumeCount, 1, 'the deferred resume owns the play Promise');
  speaker.internalAudio.emit('playing');
  assert.equal(states.at(-1).status, 'speaking');

  speaker.internalAudio.emit('ended');
  assert.equal(states.at(-1).status, 'idle');
  assert.ok(speaker.pauseCount > 0);
  assert.ok(fake.calls.synthesizers[0].closeCount > 0);
  assert.ok(fake.calls.audioConfigs[0].closeCount > 0);
});

test('stop during token acquisition prevents late SDK loading and playback', async () => {
  let resolveAuthorization;
  let sdkLoads = 0;
  const fake = createFakeSdk();
  const controller = createAzureSpeechPlaybackController({
    interviewId: 'interview-123',
    getAuthorization: () => new Promise((resolve) => { resolveAuthorization = resolve; }),
    loadSdk: async () => {
      sdkLoads += 1;
      return fake.sdk;
    },
  });

  const attempt = controller.speak('Câu hỏi cũ');
  await controller.stop();
  resolveAuthorization(validAuthorization);
  await attempt;

  assert.equal(sdkLoads, 0);
  assert.equal(fake.calls.synthesizers.length, 0);
});

test('stop during SDK loading prevents stale synthesizer creation', async () => {
  let resolveSdk;
  let sdkLoads = 0;
  const fake = createFakeSdk();
  const controller = createAzureSpeechPlaybackController({
    interviewId: 'interview-123',
    getAuthorization: async () => validAuthorization,
    loadSdk: () => {
      sdkLoads += 1;
      return new Promise((resolve) => { resolveSdk = resolve; });
    },
  });

  const attempt = controller.speak('Câu hỏi đã cũ');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sdkLoads, 1);
  await controller.stop();
  resolveSdk(fake.sdk);
  await attempt;

  assert.equal(fake.calls.synthesizers.length, 0);
});

test('stop invalidates late playback callbacks and pauses the actual destination', async () => {
  const { calls, controller, states } = makeController();
  await controller.speak('Câu hỏi hiện tại');
  const speaker = calls.speakers[0];
  speaker.onAudioStart(speaker);
  await controller.stop();
  assert.equal(speaker.resumeCount, 0, 'stop invalidates deferred playback before resume');
  speaker.internalAudio.emit('playing');
  speaker.onAudioEnd(speaker);

  assert.equal(states.at(-1).status, 'idle');
  assert.equal(states.some((state) => state.status === 'speaking'), false);
  assert.equal(speaker.internalAudio.pauseCount, 1);
  assert.equal(calls.synthesizers[0].closeCount, 1);
});

test('a second replay releases the previous player and ignores its callbacks', async () => {
  const { calls, controller, states } = makeController();
  await controller.speak('Câu hỏi một');
  const firstSpeaker = calls.speakers[0];
  firstSpeaker.onAudioStart(firstSpeaker);

  await controller.speak('Câu hỏi hai');
  assert.equal(firstSpeaker.resumeCount, 0, 'the replaced question cannot resume stale audio');
  firstSpeaker.internalAudio.emit('playing');

  assert.equal(calls.synthesizers.length, 2);
  assert.equal(calls.synthesizers[0].requests[0].text, 'Câu hỏi một');
  assert.equal(calls.synthesizers[1].requests[0].text, 'Câu hỏi hai');
  assert.equal(firstSpeaker.pauseCount, 2, 'playback interception and resource cleanup both pause it');
  assert.equal(firstSpeaker.closeCount, 1);
  assert.equal(calls.audioConfigs[0].closeCount, 1);
  assert.equal(states.at(-1).status, 'loading');
});

test('autoplay rejection reaches safe error and an explicit manual retry succeeds', async () => {
  const { calls, controller, states } = makeController();
  await controller.speak('Câu hỏi tự động đọc');

  const blockedSpeaker = calls.speakers[0];
  blockedSpeaker.resumeBehavior = 'reject';
  blockedSpeaker.resumeError = new Error('NotAllowedError: SECRET provider details');
  blockedSpeaker.onAudioStart(blockedSpeaker);
  await flushDeferredPlayback();

  assert.deepEqual(states.map((state) => state.status), ['loading', 'error']);
  assert.equal(blockedSpeaker.resumeCount, 1);
  assert.equal(blockedSpeaker.closeCount, 1);
  assert.equal(calls.synthesizers[0].closeCount, 1);
  assert.equal(calls.audioConfigs[0].closeCount, 1);
  assert.equal(states.at(-1).error, getAzureSpeechErrorMessage(blockedSpeaker.resumeError));
  assert.match(states.at(-1).error, /tạm thời không khả dụng/i);
  assert.doesNotMatch(states.at(-1).error, /SECRET|NotAllowedError|provider details/i);

  // QuestionSpeaker's error-state button calls speak() only after explicit user input.
  await controller.speak('Câu hỏi được thử lại thủ công');
  const retrySpeaker = calls.speakers[1];
  retrySpeaker.resumeBehavior = 'resolve';
  retrySpeaker.onAudioStart(retrySpeaker);
  await flushDeferredPlayback();

  assert.equal(retrySpeaker.resumeCount, 1);
  assert.equal(states.at(-1).status, 'speaking');
  retrySpeaker.internalAudio.emit('ended');
  assert.equal(states.at(-1).status, 'idle');
});

test('question change before deferred resume cannot start the old question audio', async () => {
  const { calls, controller } = makeController();
  await controller.speak('Câu hỏi cũ');
  const oldSpeaker = calls.speakers[0];
  oldSpeaker.onAudioStart(oldSpeaker);

  await controller.speak('Câu hỏi mới');

  assert.equal(oldSpeaker.resumeCount, 0);
  assert.equal(oldSpeaker.closeCount, 1);
  assert.equal(calls.speakers.length, 2);
  await controller.stop();
});

test('unmount stop before deferred resume prevents playback', async () => {
  const { calls, controller, states } = makeController();
  await controller.speak('Question before unmount');
  const speaker = calls.speakers[0];
  speaker.onAudioStart(speaker);

  // The synthesis hook's unmount cleanup uses this generation-invalidating stop.
  await controller.stop();
  await flushDeferredPlayback();

  assert.equal(speaker.resumeCount, 0);
  assert.equal(speaker.closeCount, 1);
  assert.equal(calls.synthesizers[0].closeCount, 1);
  assert.equal(calls.audioConfigs[0].closeCount, 1);
  assert.equal(states.some((state) => state.status === 'speaking'), false);
});

test('provider errors stay concise and never expose raw SDK diagnostics', () => {
  assert.match(getAzureSpeechErrorMessage(new ApiError('raw', 'RATE_LIMITED', undefined, 429)), /thử lại sau ít phút/i);
  assert.match(getAzureSpeechErrorMessage(new ApiError('raw', 'FEATURE_DISABLED', undefined, 503)), /vẫn có thể đọc câu hỏi/i);

  const rawDiagnostic = 'Authorization token SECRET Azure endpoint details';
  const message = getAzureSpeechErrorMessage(new Error(rawDiagnostic));
  assert.match(message, /tạm thời không khả dụng/i);
  assert.doesNotMatch(message, /SECRET|endpoint|Authorization token/i);
});

test('production interview controls remove browser TTS and await Azure stop before candidate STT', () => {
  assert.doesNotMatch(questionSpeakerSource, /SpeechSynthesisUtterance|window\.speechSynthesis/);
  assert.doesNotMatch(speechDockSource, /SpeechSynthesisUtterance|window\.speechSynthesis/);

  const stopIndex = speechDockSource.indexOf('await onBeforeListening?.()');
  const startIndex = speechDockSource.indexOf('speech.start()');
  assert.ok(stopIndex >= 0 && startIndex > stopIndex, 'candidate STT starts only after parent TTS stop resolves');
  assert.match(questionSpeakerSource, /attemptedQuestionsRef\.current\.has\(questionId\)/);
  assert.match(questionSpeakerSource, /attemptedQuestionsRef\.current\.add\(questionId\)/);
  assert.match(questionSpeakerSource, /queueMicrotask\(/, 'auto-speak is safe against StrictMode effect replay');
  assert.match(questionSpeakerSource, /aria-busy=\{status === 'loading'\}/);
});
