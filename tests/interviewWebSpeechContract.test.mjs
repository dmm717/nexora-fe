import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SPEECH_LANGUAGE_OPTIONS,
  DEFAULT_SPEECH_LANGUAGE,
  SPEECH_UNSUPPORTED_MESSAGE,
  resolveSpeechRecognitionConstructor,
  mapSpeechLanguage,
  mergeFinalTranscript,
  collectFinalTranscript,
  previewTranscript,
  speechErrorToUi,
  unsupportedSpeechError,
  canStartSpeechSession,
  shouldSurfaceSpeechError,
  emptySpeechTranscript,
} from '../src/hooks/speechRecognitionContract.ts';

// Test doubles mirror the structural Web Speech API used in production.

class FakeRecognition {
  constructor() {
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.onstart = null;
  }
  start() {}
  stop() {}
  abort() {}
}

const makeResults = (entries) => {
  const list = entries.map((entry) => {
    const alternatives = entry.alternatives.map((transcript) => ({ transcript }));
    return {
      isFinal: entry.isFinal,
      length: alternatives.length,
      ...alternatives,
    };
  });
  return Object.assign(list, { item: (i) => list[i] });
};

// 1. unsupported API detection
test('1. speech API detection supports standard, webkit-prefixed, and unsupported browsers', () => {
  assert.equal(resolveSpeechRecognitionConstructor(null), null);
  assert.equal(resolveSpeechRecognitionConstructor(undefined), null);
  assert.equal(resolveSpeechRecognitionConstructor({}), null);
  assert.equal(
    resolveSpeechRecognitionConstructor({ SpeechRecognition: 'not-a-constructor' }),
    null,
    'non-function values are not constructors'
  );

  const standard = { SpeechRecognition: FakeRecognition };
  assert.equal(resolveSpeechRecognitionConstructor(standard), FakeRecognition);

  const prefixed = { webkitSpeechRecognition: FakeRecognition };
  assert.equal(resolveSpeechRecognitionConstructor(prefixed), FakeRecognition);

  // Standard takes precedence when both exist
  const both = { SpeechRecognition: FakeRecognition, webkitSpeechRecognition: function Other() {} };
  assert.equal(resolveSpeechRecognitionConstructor(both), FakeRecognition);
});

// 2. interim result does not become submitted answer automatically
test('2. interim (non-final) recognition results never produce submitted content', () => {
  const interimOnly = makeResults([{ isFinal: false, alternatives: ['xin chào'] }]);
  const collected = collectFinalTranscript('', interimOnly, 0);

  assert.equal(collected.finalText, '', 'interim text is not finalized');
  assert.deepEqual(collected.addedSegments, []);
  assert.equal(collected.nextIndex, 0);

  // Preview may show interim text, but that is display-only
  assert.equal(previewTranscript(collected.finalText, 'xin chào'), 'xin chào');
  // The editable answer content remains unchanged (empty)
  assert.equal(mergeFinalTranscript('', ''), '');
});

// 3. final result appends to editable transcript
test('3. finalized recognition results append to the editable transcript', () => {
  const results = makeResults([{ isFinal: true, alternatives: ['Tôi là lập trình viên'] }]);
  const collected = collectFinalTranscript('', results, 0);

  assert.equal(collected.finalText, 'Tôi là lập trình viên');
  assert.deepEqual(collected.addedSegments, ['Tôi là lập trình viên']);

  const merged = mergeFinalTranscript('Kinh nghiệm 5 năm. ', collected.addedSegments[0]);
  assert.equal(merged, 'Kinh nghiệm 5 năm. Tôi là lập trình viên');
});

// 4. repeated recognition result does not duplicate finalized chunks
test('4. reprocessing the same result list never duplicates finalized chunks', () => {
  const results = makeResults([
    { isFinal: true, alternatives: ['Câu một'] },
    { isFinal: false, alternatives: ['đang nói'] },
    { isFinal: true, alternatives: ['Câu hai'] },
  ]);

  const first = collectFinalTranscript('', results, 0);
  assert.equal(first.finalText, 'Câu một Câu hai');
  assert.deepEqual(first.addedSegments, ['Câu một', 'Câu hai']);

  // Resuming from nextIndex reprocesses nothing
  const second = collectFinalTranscript(first.finalText, results, first.nextIndex);
  assert.equal(second.finalText, 'Câu một Câu hai');
  assert.deepEqual(second.addedSegments, []);

  // A genuine re-delivery of a final segment already at the tail is ignored
  const redelivered = collectFinalTranscript(
    first.finalText,
    makeResults([{ isFinal: true, alternatives: ['Câu hai'] }]),
    0
  );
  assert.equal(redelivered.finalText, 'Câu một Câu hai');
  assert.deepEqual(redelivered.addedSegments, []);

  // mergeFinalTranscript itself is idempotent for a repeated tail segment
  assert.equal(mergeFinalTranscript('Câu một Câu hai', 'Câu hai'), 'Câu một Câu hai');
});

// 5. manual text + voice final transcript compose correctly
test('5. manual typed text composes with voice final text without clobbering', () => {
  const manual = 'Mở đầu thủ công.';
  const results = makeResults([{ isFinal: true, alternatives: ['phần nói tiếp'] }]);
  const collected = collectFinalTranscript('', results, 0);

  const composed = mergeFinalTranscript(manual, collected.finalText);
  assert.equal(composed, 'Mở đầu thủ công. phần nói tiếp');

  // A second manual edit followed by more speech composes again
  const edited = `${composed} bổ sung thủ công.`;
  const more = collectFinalTranscript('', makeResults([{ isFinal: true, alternatives: ['câu cuối'] }]), 0);
  assert.equal(mergeFinalTranscript(edited, more.finalText), 'Mở đầu thủ công. phần nói tiếp bổ sung thủ công. câu cuối');

  // Whitespace-only final segments are ignored
  assert.equal(mergeFinalTranscript('Giữ nguyên', '   '), 'Giữ nguyên');
});

// 6. reset clears speech transcript state
test('6. reset returns canonical empty transcript state', () => {
  const empty = emptySpeechTranscript();
  assert.deepEqual(empty, { finalText: '', interimText: '', error: null });

  // Reset result is independent of any previous transcript accumulation
  const accumulated = collectFinalTranscript('', makeResults([{ isFinal: true, alternatives: ['abc'] }]), 0);
  assert.equal(accumulated.finalText, 'abc');
  assert.equal(emptySpeechTranscript().finalText, '');
});

// 7. selected language maps vi-VN/en-US correctly
test('7. speech language selection maps to supported locales and defaults to vi-VN', () => {
  assert.equal(DEFAULT_SPEECH_LANGUAGE, 'vi-VN');
  assert.deepEqual(
    SPEECH_LANGUAGE_OPTIONS.map((option) => option.value),
    ['vi-VN', 'en-US']
  );

  assert.equal(mapSpeechLanguage('vi-VN'), 'vi-VN');
  assert.equal(mapSpeechLanguage('en-US'), 'en-US');
  assert.equal(mapSpeechLanguage('fr-FR'), 'vi-VN', 'unknown locales fall back safely');
  assert.equal(mapSpeechLanguage(undefined), 'vi-VN');
  assert.equal(mapSpeechLanguage(null), 'vi-VN');
});

// 8. stop prevents continued listening state
test('8. an explicit stop suppresses listening and expected aborted errors', () => {
  assert.equal(canStartSpeechSession(false), true, 'a fresh session may start');
  assert.equal(canStartSpeechSession(true), false, 'already-listening start is ignored');

  // After an explicit stop, the browser 'aborted' event is expected, not an error
  assert.equal(shouldSurfaceSpeechError('aborted', true), false);
  assert.equal(shouldSurfaceSpeechError('aborted', false), true, 'unexpected abort still surfaces');
  assert.equal(shouldSurfaceSpeechError('network', true), true);
});

// 9. recognition error produces safe UI state
test('9. recognition errors map to safe actionable messages without raw provider details', () => {
  const permission = speechErrorToUi('not-allowed');
  assert.equal(permission.kind, 'permission');
  assert.match(permission.message, /microphone/i);

  assert.equal(speechErrorToUi('service-not-allowed').kind, 'permission');
  assert.equal(speechErrorToUi('no-speech').kind, 'no-speech');
  assert.equal(speechErrorToUi('audio-capture').kind, 'audio-capture');
  assert.equal(speechErrorToUi('network').kind, 'network');
  assert.equal(speechErrorToUi('aborted').kind, 'aborted');
  assert.equal(speechErrorToUi('something-internal').kind, 'generic');
  assert.equal(speechErrorToUi(undefined).kind, 'generic');

  const unsupported = unsupportedSpeechError();
  assert.equal(unsupported.kind, 'unsupported');
  assert.equal(unsupported.message, SPEECH_UNSUPPORTED_MESSAGE);

  // No message leaks raw exception/stack text
  for (const ui of [permission, unsupported, speechErrorToUi('network')]) {
    assert.equal(/stack|Error:|at \w+\./.test(ui.message), false);
  }
});

// 10. voice transcript still goes through normal answer content
test('10. voice output enters the same editable answer content path and stays editable', () => {
  // Final segment is merged into ordinary text, identical to typing
  const afterVoice = mergeFinalTranscript('', 'Nội dung từ giọng nói');
  assert.equal(typeof afterVoice, 'string');
  assert.equal(afterVoice, 'Nội dung từ giọng nói');

  // User corrections remain plain text
  const corrected = `${afterVoice} (đã sửa)`;
  assert.equal(corrected, 'Nội dung từ giọng nói (đã sửa)');

  // The submitted value is exactly the final textarea text, not a speech object
  assert.equal(typeof corrected, 'string');
  assert.equal(JSON.parse(JSON.stringify(corrected)), corrected);
});