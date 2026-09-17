import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const currentAnswerCaptionPath = path.resolve('src/components/features/interview/CurrentAnswerCaption.tsx');
const interviewStageCssPath = path.resolve('src/styles/interview-stage.css');
const interviewPagePath = path.resolve('src/app/(dashboard)/interviews/[id]/page.tsx');

test('Interview direct submit: CurrentAnswerCaption exposes onSubmit and submitDisabled contract', () => {
  const source = fs.readFileSync(currentAnswerCaptionPath, 'utf8');
  assert.ok(source.includes('onSubmit?: () => void'), 'CurrentAnswerCaptionProps must define onSubmit handler');
  assert.ok(source.includes('submitDisabled?: boolean'), 'CurrentAnswerCaptionProps must define submitDisabled flag');
  assert.ok(source.includes('Nộp câu trả lời'), 'CurrentAnswerCaption must render "Nộp câu trả lời" action button');
  assert.ok(source.includes('Chỉnh sửa câu trả lời'), 'CurrentAnswerCaption must preserve "Chỉnh sửa câu trả lời" action button');
  assert.ok(source.includes('interview-submit-button'), 'Submit button must use interview-submit-button class');
  assert.ok(source.includes('disabled || submitDisabled || listening'), 'Submit button must be disabled when disabled, submitDisabled, or listening is true');
});

test('Interview direct submit: interview-stage.css provides clear primary styling for direct submit CTA', () => {
  const css = fs.readFileSync(interviewStageCssPath, 'utf8');
  assert.ok(css.includes('.interview-current-answer-actions'), 'Must style actions container');
  assert.ok(css.includes('.interview-submit-button'), 'Must style .interview-submit-button');
  assert.ok(css.includes('#d1c6ff'), 'Submit button must have high-contrast light purple background');
  assert.ok(css.includes('#21194b'), 'Submit button must have dark text for strong contrast');
});

test('Interview direct submit: interview page wires direct onSubmit to canonical handleSubmitAnswer', () => {
  const pageSource = fs.readFileSync(interviewPagePath, 'utf8');
  assert.ok(
    pageSource.includes('CurrentAnswerCaption'),
    'Page must render CurrentAnswerCaption'
  );
  assert.ok(
    pageSource.includes('onSubmit={() => {') || pageSource.includes('onSubmit={'),
    'CurrentAnswerCaption must receive onSubmit handler'
  );
  assert.ok(
    /handleSubmitAnswer\(\s*trimmed/.test(pageSource),
    'Direct submit must call handleSubmitAnswer with trimmed draft content'
  );
  assert.ok(
    pageSource.includes('submitDisabled={!canAnswer || isEvaluating || submitting || showCoaching}'),
    'submitDisabled must be wired with interview readiness conditions'
  );
});

test('Interview direct submit: submission guard logic blocks blank draft, listening, evaluating, or submitting', () => {
  const canDirectSubmit = ({
    draft,
    listening,
    canAnswer,
    isEvaluating,
    submitting,
    showCoaching,
  }) => {
    const trimmed = (draft || '').trim();
    if (!trimmed) return false;
    if (listening) return false;
    if (!canAnswer) return false;
    if (isEvaluating) return false;
    if (submitting) return false;
    if (showCoaching) return false;
    return true;
  };

  // Valid draft ready to submit directly without opening editor
  assert.equal(
    canDirectSubmit({
      draft: 'Tôi có kinh nghiệm tối ưu hóa hiệu năng React và Next.js.',
      listening: false,
      canAnswer: true,
      isEvaluating: false,
      submitting: false,
      showCoaching: false,
    }),
    true,
    'Valid non-blank draft with idle speech and ready state can be submitted directly'
  );

  // Blank draft
  assert.equal(
    canDirectSubmit({
      draft: '    ',
      listening: false,
      canAnswer: true,
      isEvaluating: false,
      submitting: false,
      showCoaching: false,
    }),
    false,
    'Blank or whitespace-only draft must be blocked'
  );

  // Still listening
  assert.equal(
    canDirectSubmit({
      draft: 'Đang nói dở dang...',
      listening: true,
      canAnswer: true,
      isEvaluating: false,
      submitting: false,
      showCoaching: false,
    }),
    false,
    'Cannot submit while speech recognition is actively listening'
  );

  // Currently submitting / evaluating / coaching
  assert.equal(
    canDirectSubmit({
      draft: 'Câu trả lời hoàn chỉnh',
      listening: false,
      canAnswer: true,
      isEvaluating: true,
      submitting: false,
      showCoaching: false,
    }),
    false,
    'Cannot submit while evaluation is in progress'
  );

  assert.equal(
    canDirectSubmit({
      draft: 'Câu trả lời hoàn chỉnh',
      listening: false,
      canAnswer: true,
      isEvaluating: false,
      submitting: true,
      showCoaching: false,
    }),
    false,
    'Cannot submit while submission request is inflight'
  );

  assert.equal(
    canDirectSubmit({
      draft: 'Câu trả lời hoàn chỉnh',
      listening: false,
      canAnswer: false,
      isEvaluating: false,
      submitting: false,
      showCoaching: false,
    }),
    false,
    'Cannot submit when candidate cannot answer'
  );
});
