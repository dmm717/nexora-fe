import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const audioSpeechDockSource = readFileSync(
  new URL('../src/components/features/interview/AudioSpeechDock.tsx', import.meta.url),
  'utf8'
);
const cameraToggleButtonSource = readFileSync(
  new URL('../src/components/features/interview/CameraToggleButton.tsx', import.meta.url),
  'utf8'
);
const questionSpeakerSource = readFileSync(
  new URL('../src/components/features/interview/QuestionSpeaker.tsx', import.meta.url),
  'utf8'
);
const roomPageSource = readFileSync(
  new URL('../src/app/(dashboard)/interviews/[id]/page.tsx', import.meta.url),
  'utf8'
);
const stageCssSource = readFileSync(
  new URL('../src/styles/interview-stage.css', import.meta.url),
  'utf8'
);

// ---------------------------------------------------------------------------
// A. DEFAULT Q1 & SINGLE VOICE CONTROL ARCHITECTURE
// ---------------------------------------------------------------------------
test('Requirement A: Exactly ONE microphone control in tray, no extra "Giọng nói" button', () => {
  // Only one microphone button in the tray
  const micButtonMatches = audioSpeechDockSource.match(/className=\{`interview-call-button interview-mic-button/g);
  assert.equal(micButtonMatches?.length, 1, 'Must have exactly one microphone button in AudioSpeechDock');

  // Verify duplicate "Giọng nói" button and mode selector group are completely removed
  assert.doesNotMatch(audioSpeechDockSource, />\s*Giọng nói\s*</, 'Must not render "Giọng nói" text in control tray');
  assert.doesNotMatch(audioSpeechDockSource, /role="group"\s*aria-label="Cách trả lời"/, 'Old mode selector group must be removed');
  assert.doesNotMatch(audioSpeechDockSource, />\s*Trả lời\s*</, 'Old "Trả lời" text label must be removed');
});

// ---------------------------------------------------------------------------
// B. MICROPHONE LIFECYCLE & INTERACTION
// ---------------------------------------------------------------------------
test('Requirement B: Microphone interaction architecture and explicit user action only', async () => {
  const { selectInterviewInputMode } = await import(
    '../src/components/features/interview/inputModeSelection.ts'
  );

  let currentMode = 'chatbox';
  let editorOpen = true;
  let stopCount = 0;

  // 1. Switching from keyboard to voice:
  selectInterviewInputMode(
    currentMode,
    'voice',
    false,
    () => { stopCount++; },
    (next) => { currentMode = next; },
    (open) => { editorOpen = open; }
  );

  assert.equal(currentMode, 'voice', 'Mode must transition to voice');
  assert.equal(editorOpen, false, 'Editor must close when switching to voice');
  assert.equal(stopCount, 1, 'Stop callback invoked on transition');

  // 2. AudioSpeechDock contains handleMicClick that orchestrates voice mode and start/stop
  assert.match(audioSpeechDockSource, /const handleMicClick = \(\) =>/);
  assert.match(audioSpeechDockSource, /if \(speech\.listening\)\s*\{\s*handleStopListening\(\);/);
  assert.match(audioSpeechDockSource, /if \(effectiveMode === 'chatbox'\)\s*\{\s*selectVoice\(\);/);
  assert.match(audioSpeechDockSource, /void handleStartListening\(\);/);

  // 3. Question change does NOT automatically start mic (no auto-start effect)
  assert.doesNotMatch(audioSpeechDockSource, /useEffect\(\(\) => \{\s*handleStartListening\(\)/);
  assert.doesNotMatch(audioSpeechDockSource, /useEffect\(\(\) => \{\s*speech\.start\(\)/);
});

// ---------------------------------------------------------------------------
// C. KEYBOARD CONTRACT (PR #47 PRESERVATION)
// ---------------------------------------------------------------------------
test('Requirement C: Keyboard opens editor and reopens editor when already in chatbox mode', async () => {
  const { selectInterviewInputMode } = await import(
    '../src/components/features/interview/inputModeSelection.ts'
  );

  let currentMode = 'voice';
  let editorOpen = false;
  let stopCount = 0;

  // 1. Click keyboard from voice mode: switches mode and opens editor
  selectInterviewInputMode(
    currentMode,
    'chatbox',
    false,
    () => { stopCount++; },
    (next) => { currentMode = next; },
    (open) => { editorOpen = open; }
  );
  assert.equal(currentMode, 'chatbox');
  assert.equal(editorOpen, true);
  assert.equal(stopCount, 1, 'Previous speech listening must be stopped');

  // 2. Candidate manually closes editor
  editorOpen = false;

  // 3. Candidate clicks keyboard again while already in chatbox mode
  selectInterviewInputMode(
    currentMode,
    'chatbox',
    false,
    () => { stopCount++; },
    (next) => { currentMode = next; },
    (open) => { editorOpen = open; }
  );
  assert.equal(currentMode, 'chatbox', 'Mode remains chatbox');
  assert.equal(editorOpen, true, 'PR #47 contract: editor must reopen when clicking keyboard again');
});

// ---------------------------------------------------------------------------
// D. FORCED TEXT ONLY
// ---------------------------------------------------------------------------
test('Requirement D: forcedTextOnly suppresses microphone control and keeps keyboard functional', async () => {
  const { selectInterviewInputMode } = await import(
    '../src/components/features/interview/inputModeSelection.ts'
  );

  // In source: mic button is guarded by !forcedTextOnly
  assert.match(audioSpeechDockSource, /\{!forcedTextOnly && \(/);

  // In logic: forcedTextOnly prevents switching to voice
  let mode = 'chatbox';
  let editorOpen = false;
  selectInterviewInputMode(
    mode,
    'voice',
    true, // forcedTextOnly
    () => {},
    (next) => { mode = next; },
    (open) => { editorOpen = open; }
  );
  assert.equal(mode, 'chatbox', 'Must reject voice mode transition when forcedTextOnly');

  // Keyboard still opens editor
  selectInterviewInputMode(
    mode,
    'chatbox',
    true, // forcedTextOnly
    () => {},
    (next) => { mode = next; },
    (open) => { editorOpen = open; }
  );
  assert.equal(editorOpen, true, 'Keyboard must remain functional under forcedTextOnly');
});

// ---------------------------------------------------------------------------
// E. CAMERA TOGGLE CONTROL & MORPHICONS
// ---------------------------------------------------------------------------
test('Requirement E: CameraToggleButton is icon-only and uses MorphIcon Video <-> VideoOff', () => {
  assert.match(cameraToggleButtonSource, /import \{ MorphIcon \} from 'morphicons\/react';/);
  assert.match(cameraToggleButtonSource, /import \{ Video, VideoOff \} from 'lucide';/);
  assert.match(cameraToggleButtonSource, /icon=\{isOn \? Video : VideoOff\}/);
  assert.match(cameraToggleButtonSource, /spring="snappy"/);
  assert.match(cameraToggleButtonSource, /reducedMotion="user"/);
  assert.match(cameraToggleButtonSource, /aria-label=\{label\}/);
  assert.match(cameraToggleButtonSource, /aria-pressed=\{isOn\}/);

  // No persistent visible label node
  assert.doesNotMatch(cameraToggleButtonSource, /<span>\{label\}<\/span>/);
  // No Material Symbols
  assert.doesNotMatch(cameraToggleButtonSource, /material-symbols-outlined/);
  assert.doesNotMatch(cameraToggleButtonSource, /videocam/);
});

// ---------------------------------------------------------------------------
// F. QUESTION SPEAKER CONTROL & MORPHICONS
// ---------------------------------------------------------------------------
test('Requirement F: QuestionSpeaker is icon-only and uses MorphIcon Volume2 <-> VolumeX', () => {
  assert.match(questionSpeakerSource, /import \{ MorphIcon \} from 'morphicons\/react';/);
  assert.match(questionSpeakerSource, /import \{ Volume2, VolumeX \} from 'lucide';/);
  assert.match(questionSpeakerSource, /icon=\{status === 'speaking' \? VolumeX : Volume2\}/);
  assert.match(questionSpeakerSource, /spring="snappy"/);
  assert.match(questionSpeakerSource, /reducedMotion="user"/);
  assert.match(questionSpeakerSource, /aria-label=\{label\}/);
  assert.match(questionSpeakerSource, /aria-pressed=\{status === 'speaking'\}/);
  assert.match(questionSpeakerSource, /aria-busy=\{status === 'loading'\}/);

  // Correct labels
  assert.match(questionSpeakerSource, /'Nghe lại câu hỏi'/);
  assert.match(questionSpeakerSource, /'Dừng đọc câu hỏi'/);

  // No persistent visible label node
  assert.doesNotMatch(questionSpeakerSource, /<span>\{label\}<\/span>/);
  // No Material Symbols
  assert.doesNotMatch(questionSpeakerSource, /material-symbols-outlined/);
  assert.doesNotMatch(questionSpeakerSource, /volume_up/);
  assert.doesNotMatch(questionSpeakerSource, /volume_down/);
});

// ---------------------------------------------------------------------------
// G. END CALL CONTROL
// ---------------------------------------------------------------------------
test('Requirement G: End call control is icon-only with PhoneOff, destructive red, and updated dialog', () => {
  assert.match(roomPageSource, /import \{ PhoneOff \} from 'lucide-react';/);
  assert.match(roomPageSource, /<PhoneOff size=\{20\} aria-hidden="true" \/>/);
  assert.match(roomPageSource, /aria-label=\{completing \? 'Đang kết thúc phiên phỏng vấn' : 'Kết thúc phiên phỏng vấn'\}/);
  assert.match(roomPageSource, /disabled=\{submitting \|\| !canFinish\}/);
  assert.match(roomPageSource, /window\.confirm\('Kết thúc phiên phỏng vấn và tổng hợp báo cáo\?'\)/);

  // No persistent visible text node inside the end call button
  assert.doesNotMatch(roomPageSource, />\s*Nộp bài sớm\s*</);
  // No Material Symbols
  assert.doesNotMatch(roomPageSource, /call_end/);
});

// ---------------------------------------------------------------------------
// H. CONTROL CONTENT: NO PERSISTENT VISIBLE TEXT LABELS IN TRAY
// ---------------------------------------------------------------------------
test('Requirement H: Call controls contain no persistent visible textual label nodes', () => {
  // Mic button in AudioSpeechDock has no text node
  const micBlock = audioSpeechDockSource.match(/<button[\s\S]*?interview-mic-button[\s\S]*?<\/button>/)?.[0] ?? '';
  assert.doesNotMatch(micBlock, /<span>\s*\{/);
  assert.doesNotMatch(micBlock, /<span>\s*Trả lời/);
  assert.doesNotMatch(micBlock, /<span>\s*Dừng/);

  // Keyboard button has no text node
  const keyboardBlock = audioSpeechDockSource.match(/<button[\s\S]*?interview-keyboard-button[\s\S]*?<\/button>/)?.[0] ?? '';
  assert.doesNotMatch(keyboardBlock, />\s*Bàn phím\s*</);

  // Camera button has no text node
  assert.doesNotMatch(cameraToggleButtonSource, /<span>\{label\}<\/span>/);

  // Speaker button has no text node
  assert.doesNotMatch(questionSpeakerSource, /<span>\{label\}<\/span>/);

  // End button in page.tsx has no text node
  const endBlock = roomPageSource.match(/<button[\s\S]*?interview-end-button[\s\S]*?<\/button>/)?.[0] ?? '';
  assert.doesNotMatch(endBlock, /<span>\s*\{completing/);
  assert.doesNotMatch(endBlock, />\s*Nộp bài sớm\s*</);
});

// ---------------------------------------------------------------------------
// I. REDUCED MOTION SUPPORT
// ---------------------------------------------------------------------------
test('Requirement I: All MorphIcon instances specify reducedMotion="user" and CSS honors preference', () => {
  // AudioSpeechDock MorphIcon
  assert.match(audioSpeechDockSource, /<MorphIcon[\s\S]*?reducedMotion="user"/);

  // CameraToggleButton MorphIcon
  assert.match(cameraToggleButtonSource, /<MorphIcon[\s\S]*?reducedMotion="user"/);

  // QuestionSpeaker MorphIcon
  assert.match(questionSpeakerSource, /<MorphIcon[\s\S]*?reducedMotion="user"/);

  // interview-stage.css prefers-reduced-motion block resets button transitions
  assert.match(
    stageCssSource,
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.interview-control-tray \.interview-call-button[\s\S]*?transition:\s*none;/
  );
});

// ---------------------------------------------------------------------------
// J. CSS GEOMETRY, COLORS, & MOBILE RESPONSIVENESS
// ---------------------------------------------------------------------------
test('Requirement J: CSS defines 48px square buttons, active red end call, and compact mobile row', () => {
  // 48px square geometry in desktop
  assert.match(stageCssSource, /\.interview-control-tray \.interview-call-button[\s\S]*?width:\s*48px;/);
  assert.match(stageCssSource, /\.interview-control-tray \.interview-call-button[\s\S]*?height:\s*48px;/);

  // Unmistakable destructive red surface for end call
  assert.match(stageCssSource, /\.interview-control-tray \.interview-call-button\.interview-end-button \{[\s\S]*?background:\s*#dc2626;/);
  // Disabled state is visibly distinct
  assert.match(stageCssSource, /\.interview-control-tray \.interview-call-button\.interview-end-button:disabled \{[\s\S]*?opacity:\s*\.?55;/);

  // Mobile layout uses compact flex row with touch target >= 44px
  assert.match(
    stageCssSource,
    /@media \(max-width: 600px\) \{[\s\S]*?\.interview-control-tray \{\s*display:\s*flex;/
  );
  assert.match(
    stageCssSource,
    /@media \(max-width: 600px\) \{[\s\S]*?min-width:\s*44px;/
  );
  // Old 2-column mobile grid is gone
  assert.doesNotMatch(
    stageCssSource,
    /@media \(max-width: 600px\) \{[\s\S]*?grid-template-columns:\s*1fr 1fr;/
  );
});
