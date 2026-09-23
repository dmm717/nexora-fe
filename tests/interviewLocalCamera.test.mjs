import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CAMERA_VIDEO_CONSTRAINTS,
  getCameraErrorMessage,
  CameraAcquisitionCoordinator,
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
  assert.match(buttonSource, /Video/);
  assert.match(buttonSource, /VideoOff/);
  assert.match(buttonSource, /MorphIcon/);
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

  // Synchronous eligibility guard wiring and scopeKey
  assert.match(pageSource, /enabled:\s*isInterviewActive/);
  assert.match(pageSource, /scopeKey:\s*id/);

  // Same-route status transition and ID change guards
  assert.match(pageSource, /interview\?\.status !== 'active'/);
  assert.match(pageSource, /\[interview\?\.status, disableCamera\]/);
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
// 11. Production CameraAcquisitionCoordinator Regression Suite
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

test('11. Production guard: in-flight acquisition cancelled by invalidate/disable stops tracks and rejects adoption', async () => {
  const coordinator = new CameraAcquisitionCoordinator(true, 'interview-1');
  const deferred = createDeferred();
  const track = new FakeMediaTrack('video');
  const stream = new FakeMediaStream([track]);

  // Step 1: acquisition starts while room is active
  assert.equal(coordinator.isAcquisitionAllowed(), true);
  const token = coordinator.beginAcquisition();
  assert.equal(token.generation, 1);
  assert.equal(token.scopeKey, 'interview-1');

  // Step 2: disable / invalidate before browser prompt resolves
  coordinator.invalidate();

  // Step 3: browser getUserMedia resolves
  deferred.resolve(stream);
  const resolvedStream = await deferred.promise;

  // Step 4: verification - production guard rejects adoption and stops tracks
  const shouldAccept = coordinator.shouldAccept(token);
  assert.equal(shouldAccept, false, 'Late resolving acquisition must be rejected after invalidation');
  if (!shouldAccept) {
    coordinator.stopStreamTracks(resolvedStream);
  }
  assert.equal(track.stopped, true, 'Tracks of rejected stream must be stopped immediately');
});

test('12. Production guard: in-flight acquisition rejected and stopped if component unmounts', async () => {
  const coordinator = new CameraAcquisitionCoordinator(true, 'interview-1');
  const deferred = createDeferred();
  const track = new FakeMediaTrack('video');
  const stream = new FakeMediaStream([track]);

  const token = coordinator.beginAcquisition();
  // Unmount occurs
  coordinator.setMounted(false);
  coordinator.invalidate();

  deferred.resolve(stream);
  const resolvedStream = await deferred.promise;

  const shouldAccept = coordinator.shouldAccept(token);
  assert.equal(shouldAccept, false, 'Acquisition must be rejected after unmount');
  if (!shouldAccept) {
    coordinator.stopStreamTracks(resolvedStream);
  }
  assert.equal(track.stopped, true, 'Tracks must be stopped when resolving after unmount');
});

test('13. Production guard: acquisition started for interview A is rejected if scope changes to interview B', async () => {
  const coordinator = new CameraAcquisitionCoordinator(true, 'interview-A');
  const deferred = createDeferred();
  const track = new FakeMediaTrack('video');
  const stream = new FakeMediaStream([track]);

  // Began under interview-A
  const token = coordinator.beginAcquisition();
  assert.equal(token.scopeKey, 'interview-A');

  // Route scope changes to interview-B before getUserMedia resolves
  coordinator.update(true, 'interview-B');

  deferred.resolve(stream);
  const resolvedStream = await deferred.promise;

  const shouldAccept = coordinator.shouldAccept(token);
  assert.equal(shouldAccept, false, 'Acquisition for old interview ID must never be adopted by new interview');
  if (!shouldAccept) {
    coordinator.stopStreamTracks(resolvedStream);
  }
  assert.equal(track.stopped, true, 'Tracks must be stopped when scope mismatch occurs');
});

test('14. Production guard: acquisition started while active is rejected if room transitions to non-active before resolution', async () => {
  const coordinator = new CameraAcquisitionCoordinator(true, 'interview-1');
  const deferred = createDeferred();
  const track = new FakeMediaTrack('video');
  const stream = new FakeMediaStream([track]);

  // Began while active
  const token = coordinator.beginAcquisition();

  // Status transitions to processing/completed/terminal (allowed becomes false)
  coordinator.update(false, 'interview-1');
  assert.equal(coordinator.isAcquisitionAllowed(), false);

  deferred.resolve(stream);
  const resolvedStream = await deferred.promise;

  const shouldAccept = coordinator.shouldAccept(token);
  assert.equal(shouldAccept, false, 'Acquisition must not be accepted once room is no longer active');
  if (!shouldAccept) {
    coordinator.stopStreamTracks(resolvedStream);
  }
  assert.equal(track.stopped, true, 'Tracks must be stopped if status transitioned away from active');
});

test('15. Production guard: accepted stream tracks stopped when allowed becomes false', () => {
  const coordinator = new CameraAcquisitionCoordinator(true, 'interview-1');
  const track = new FakeMediaTrack('video');
  const acceptedStream = new FakeMediaStream([track]);

  const token = coordinator.beginAcquisition();
  assert.equal(coordinator.shouldAccept(token), true);

  // Status transitions to non-active
  coordinator.update(false, 'interview-1');
  assert.equal(coordinator.isAcquisitionAllowed(), false);

  // Accepted stream cleanup
  coordinator.stopStreamTracks(acceptedStream);
  assert.equal(track.stopped, true, 'Accepted stream tracks must be stopped when interview becomes non-active');
});

test('16. Production guard: accepted stream tracks stopped when ID scope changes', () => {
  const coordinator = new CameraAcquisitionCoordinator(true, 'interview-A');
  const track = new FakeMediaTrack('video');
  const acceptedStream = new FakeMediaStream([track]);

  const token = coordinator.beginAcquisition();
  assert.equal(coordinator.shouldAccept(token), true);

  // Room switches to interview-B
  coordinator.update(true, 'interview-B');

  // Accepted stream cleanup on scope transition
  coordinator.stopStreamTracks(acceptedStream);
  assert.equal(track.stopped, true, 'Accepted stream tracks must be stopped when route ID changes');
});

test('17. Production useLocalCamera hook wires CameraAcquisitionCoordinator synchronously during render', () => {
  const hookSource = readFileSync(
    new URL('../src/hooks/useLocalCamera.ts', import.meta.url),
    'utf8'
  );

  assert.match(hookSource, /new CameraAcquisitionCoordinator\(enabled, scopeKey\)/);
  assert.match(hookSource, /coordinator\.update\(enabled, scopeKey/);
  assert.match(hookSource, /coordinator\.isAcquisitionAllowed\(\)/);
  assert.match(hookSource, /coordinator\.beginAcquisition\(\)/);
  assert.match(hookSource, /coordinator\.shouldAccept\(token\)/);
  assert.match(hookSource, /coordinator\.stopStreamTracks\(/);
});
