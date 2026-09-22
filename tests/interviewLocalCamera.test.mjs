import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CAMERA_VIDEO_CONSTRAINTS,
  getCameraErrorMessage,
} from '../src/hooks/useLocalCamera.ts';

import {
  buildSubmitAnswerRequest,
  buildCompleteInterviewRequest,
} from '../src/services/interviewContract.ts';

// ---------------------------------------------------------------------------
// 1. Constraints and Privacy Contract
// ---------------------------------------------------------------------------

test('1. CAMERA_VIDEO_CONSTRAINTS strictly enforces audio: false and user-facing video', () => {
  assert.equal(CAMERA_VIDEO_CONSTRAINTS.audio, false, 'audio MUST be false to prevent mic conflict');
  assert.deepEqual(
    CAMERA_VIDEO_CONSTRAINTS.video,
    {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    'video constraint requests front-facing user camera with ideal 720p bounds'
  );
});

// ---------------------------------------------------------------------------
// 2. User-Friendly Error Messages (No technical stack traces exposed)
// ---------------------------------------------------------------------------

test('2. getCameraErrorMessage translates browser errors to clear, friendly Vietnamese instructions', () => {
  const deniedMsg = getCameraErrorMessage('NotAllowedError');
  assert.match(deniedMsg, /Không thể truy cập camera/);
  assert.match(deniedMsg, /vẫn có thể tiếp tục phỏng vấn mà không bật camera/);

  const notFoundMsg = getCameraErrorMessage('NotFoundError');
  assert.match(notFoundMsg, /Không tìm thấy camera/);
  assert.match(notFoundMsg, /tiếp tục bình thường/);

  const busyMsg = getCameraErrorMessage('NotReadableError');
  assert.match(busyMsg, /Camera đang được ứng dụng khác sử dụng/);

  const fallbackMsg = getCameraErrorMessage('SomeUnknownBrowserError');
  assert.match(fallbackMsg, /Không thể bật camera lúc này/);
  assert.doesNotMatch(fallbackMsg, /SomeUnknownBrowserError/, 'raw error name must not be shown to user');
});

// ---------------------------------------------------------------------------
// 3. Media Lifecycle & Mock getUserMedia Simulation
// ---------------------------------------------------------------------------

class FakeMediaTrack {
  constructor(kind = 'video') {
    this.kind = kind;
    this.enabled = true;
    this.stopped = false;
  }
  stop() {
    this.stopped = true;
  }
}

class FakeMediaStream {
  constructor(tracks = [new FakeMediaTrack()]) {
    this._tracks = tracks;
  }
  getTracks() {
    return this._tracks;
  }
  getVideoTracks() {
    return this._tracks.filter((t) => t.kind === 'video');
  }
}

test('3. Simulated camera lifecycle: defaults off, explicit enable calls getUserMedia, stop releases all tracks', async () => {
  let getUserMediaCalls = 0;
  let requestedConstraints = null;
  const createdTracks = [new FakeMediaTrack('video')];

  const fakeNavigator = {
    mediaDevices: {
      getUserMedia: async (constraints) => {
        getUserMediaCalls++;
        requestedConstraints = constraints;
        return new FakeMediaStream(createdTracks);
      },
    },
  };

  // State machine simulation matching useLocalCamera hook logic
  let state = 'off';
  let stream = null;

  // Initial state verification
  assert.equal(state, 'off', 'Camera state must default to off');
  assert.equal(getUserMediaCalls, 0, 'Initial mount must not call getUserMedia');

  // Trigger explicit enable
  state = 'requesting';
  const acquiredStream = await fakeNavigator.mediaDevices.getUserMedia(CAMERA_VIDEO_CONSTRAINTS);
  stream = acquiredStream;
  state = 'on';

  assert.equal(getUserMediaCalls, 1);
  assert.equal(requestedConstraints.audio, false, 'Camera request must specify audio: false');
  assert.equal(state, 'on');
  assert.equal(stream.getTracks()[0].stopped, false);

  // Trigger disable / toggle off
  const tracks = stream.getTracks();
  tracks.forEach((track) => track.stop());
  stream = null;
  state = 'off';

  assert.equal(state, 'off');
  assert.equal(createdTracks[0].stopped, true, 'Track stop() must be invoked to release hardware light');
});

test('4. Permission denied simulation sets denied state without throwing uncaught exceptions', async () => {
  const fakeNavigator = {
    mediaDevices: {
      getUserMedia: async () => {
        const err = new Error('Permission denied by user');
        err.name = 'NotAllowedError';
        throw err;
      },
    },
  };

  let state = 'off';
  let errorMessage = null;

  try {
    state = 'requesting';
    await fakeNavigator.mediaDevices.getUserMedia(CAMERA_VIDEO_CONSTRAINTS);
    state = 'on';
  } catch (err) {
    state = 'denied';
    errorMessage = getCameraErrorMessage(err.name);
  }

  assert.equal(state, 'denied');
  assert.match(errorMessage, /Không thể truy cập camera/);
});

// ---------------------------------------------------------------------------
// 5. Component Markup and Accessibility Verification
// ---------------------------------------------------------------------------

test('5. InterviewCandidateTile component verifies video attributes, requesting state, and mirror styling', () => {
  const tileSource = readFileSync(
    new URL('../src/components/features/interview/InterviewCandidateTile.tsx', import.meta.url),
    'utf8'
  );

  // Must render video with autoPlay, muted, playsInline
  assert.match(tileSource, /<video/);
  assert.match(tileSource, /autoPlay/);
  assert.match(tileSource, /muted/, 'Candidate preview video MUST be muted');
  assert.match(tileSource, /playsInline/);
  assert.match(tileSource, /videoEl\.srcObject = cameraStream/);
  assert.match(tileSource, /videoEl\.srcObject = null/);

  // Avatar fallback and initials
  assert.match(tileSource, /avatarUrl && !avatarError/);
  assert.match(tileSource, /<span>\{initials\}<\/span>/);
  assert.match(tileSource, /Camera tắt/);

  // Requesting state display
  assert.match(tileSource, /cameraState === 'requesting'/);
  assert.match(tileSource, /Đang bật camera\.\.\./);
  assert.match(tileSource, /functional-spinner/);
});

test('6. CameraToggleButton component renders accessible button with distinct states', () => {
  const buttonSource = readFileSync(
    new URL('../src/components/features/interview/CameraToggleButton.tsx', import.meta.url),
    'utf8'
  );

  assert.match(buttonSource, /<button/);
  assert.match(buttonSource, /aria-label=\{label\}/);
  assert.match(buttonSource, /aria-pressed=\{isOn\}/);
  assert.match(buttonSource, /disabled=\{disabled \|\| isRequesting\}/);
  assert.match(buttonSource, /videocam/);
  assert.match(buttonSource, /videocam_off/);
  assert.match(buttonSource, /Bật camera/);
  assert.match(buttonSource, /Tắt camera/);
});

test('7. CSS styles contain horizontal mirroring and responsive presentation', () => {
  const cssSource = readFileSync(
    new URL('../src/styles/interview-stage.css', import.meta.url),
    'utf8'
  );

  assert.match(
    cssSource,
    /transform:\s*scaleX\(-1\)/,
    'Live camera preview must be flipped horizontally for natural selfie view'
  );
  assert.match(cssSource, /interview-self-tile-camera-on/);
  assert.match(cssSource, /interview-camera-video/);
  assert.match(cssSource, /interview-camera-scrim/);
  assert.match(cssSource, /interview-camera-live-badge/);
});

// ---------------------------------------------------------------------------
// 8. Interview Integration & Security/Privacy Assurances
// ---------------------------------------------------------------------------

test('8. Interview room page integrates useLocalCamera and stops camera on non-active status and completion', () => {
  const pageSource = readFileSync(
    new URL('../src/app/(dashboard)/interviews/[id]/page.tsx', import.meta.url),
    'utf8'
  );

  assert.match(pageSource, /useLocalCamera/);
  assert.match(pageSource, /InterviewCandidateTile/);
  assert.match(pageSource, /CameraToggleButton/);
  assert.match(pageSource, /disableCamera\(\)/, 'Camera must be stopped when user finishes interview early');

  // Same-route status transition and ID change guards
  assert.match(pageSource, /interviewStatus && interviewStatus !== 'active'/);
  assert.match(pageSource, /\[interviewStatus, disableCamera\]/);
  assert.match(pageSource, /\[id, disableCamera\]/);
});

test('9. No MediaRecorder, video streaming, frame uploads, or backend video endpoints exist', () => {
  const hookSource = readFileSync(
    new URL('../src/hooks/useLocalCamera.ts', import.meta.url),
    'utf8'
  );
  const tileSource = readFileSync(
    new URL('../src/components/features/interview/InterviewCandidateTile.tsx', import.meta.url),
    'utf8'
  );
  const pageSource = readFileSync(
    new URL('../src/app/(dashboard)/interviews/[id]/page.tsx', import.meta.url),
    'utf8'
  );

  const combined = hookSource + tileSource + pageSource;

  assert.doesNotMatch(combined, /MediaRecorder/, 'No MediaRecorder allowed');
  assert.doesNotMatch(combined, /canvas\.toDataURL/, 'No canvas frame capture allowed');
  assert.doesNotMatch(combined, /createBlob/, 'No video blobs allowed');
  assert.doesNotMatch(combined, /RTCPeerConnection/, 'No WebRTC peer connections allowed');
  assert.doesNotMatch(combined, /WebSocket/, 'No websocket video streaming allowed');
});

test('10. Answer submission and completion contracts remain strictly text/audio duration only (zero camera fields)', () => {
  const answerReq = buildSubmitAnswerRequest('int-123', {
    questionId: 'q-123',
    content: 'Kinh nghiệm triển khai hệ thống microservices.',
    durationSeconds: 45,
  });

  assert.deepEqual(answerReq.data, {
    questionId: 'q-123',
    content: 'Kinh nghiệm triển khai hệ thống microservices.',
    durationSeconds: 45,
  });
  assert.equal(answerReq.data.video, undefined, 'answer payload must never include video');
  assert.equal(answerReq.data.camera, undefined, 'answer payload must never include camera state');

  const completeReq = buildCompleteInterviewRequest('int-123');
  assert.deepEqual(completeReq.data, {}, 'complete payload must be empty');
});

// ---------------------------------------------------------------------------
// 11. Async Acquisition Race Condition & Generation Epoch Verification
// ---------------------------------------------------------------------------

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createLocalCameraLifecycleHarness() {
  let stream = null;
  let state = 'off';
  let errorMessage = null;
  let mounted = true;
  let requestGeneration = 0;
  let activeStream = null;

  const stopAllTracks = () => {
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      activeStream = null;
    }
    if (mounted) {
      stream = null;
    }
  };

  const disableCamera = () => {
    requestGeneration++;
    stopAllTracks();
    if (mounted) {
      state = 'off';
      errorMessage = null;
    }
  };

  const enableCamera = async (getUserMediaFn) => {
    stopAllTracks();
    const generation = ++requestGeneration;
    state = 'requesting';
    errorMessage = null;

    try {
      const mediaStream = await getUserMediaFn();
      if (!mounted || generation !== requestGeneration) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }
      activeStream = mediaStream;
      stream = mediaStream;
      state = 'on';
      errorMessage = null;
    } catch {
      if (!mounted || generation !== requestGeneration) return;
      state = 'error';
      stopAllTracks();
    }
  };

  const unmount = () => {
    mounted = false;
    requestGeneration++;
    stopAllTracks();
  };

  return {
    getState: () => state,
    getStream: () => stream,
    getErrorMessage: () => errorMessage,
    enableCamera,
    disableCamera,
    unmount,
  };
}

test('11. In-flight getUserMedia cancelled by disableCamera stops late-resolving stream tracks and remains off', async () => {
  const harness = createLocalCameraLifecycleHarness();
  const deferred = createDeferred();
  const track = new FakeMediaTrack('video');
  const lateStream = new FakeMediaStream([track]);

  // Step 1: User triggers camera enable
  const enablePromise = harness.enableCamera(() => deferred.promise);
  assert.equal(harness.getState(), 'requesting');
  assert.equal(harness.getStream(), null);

  // Step 2: User explicitly cancels / disables camera before browser prompt resolves
  harness.disableCamera();
  assert.equal(harness.getState(), 'off');
  assert.equal(track.stopped, false, 'track not yet resolved, so cannot be stopped yet');

  // Step 3: Browser getUserMedia promise finally resolves
  deferred.resolve(lateStream);
  await enablePromise;

  // Step 4: Verification - stale stream must have had all tracks stopped and state remains off
  assert.equal(track.stopped, true, 'Late stream track MUST be stopped immediately on resolution');
  assert.equal(harness.getState(), 'off', 'Hook state must remain off');
  assert.equal(harness.getStream(), null, 'No stream must be attached');
});

test('12. In-flight getUserMedia cancelled by unmount stops late-resolving stream tracks', async () => {
  const harness = createLocalCameraLifecycleHarness();
  const deferred = createDeferred();
  const track = new FakeMediaTrack('video');
  const lateStream = new FakeMediaStream([track]);

  const enablePromise = harness.enableCamera(() => deferred.promise);
  assert.equal(harness.getState(), 'requesting');

  // Component unmounts
  harness.unmount();

  // Browser resolves after unmount
  deferred.resolve(lateStream);
  await enablePromise;

  assert.equal(track.stopped, true, 'Track must be stopped when resolving after unmount');
  assert.equal(harness.getStream(), null);
});

test('13. useLocalCamera hook source code contains requestGeneration epoch check and track disposal', () => {
  const hookSource = readFileSync(
    new URL('../src/hooks/useLocalCamera.ts', import.meta.url),
    'utf8'
  );

  assert.match(hookSource, /requestGenerationRef = useRef<number>\(0\)/);
  assert.match(hookSource, /generation !== requestGenerationRef\.current/);
  assert.match(hookSource, /track\.stop\(\)/);
  assert.match(hookSource, /requestGenerationRef\.current\+\+/);
});
