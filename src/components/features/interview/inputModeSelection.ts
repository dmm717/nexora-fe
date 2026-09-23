type InputMode = 'voice' | 'chatbox';

export function selectInterviewInputMode(
  currentMode: InputMode,
  nextMode: InputMode,
  forcedTextOnly: boolean,
  stopListening: () => void,
  onModeChange: (mode: InputMode) => void,
  onEditorOpenChange?: (open: boolean) => void
) {
  if (forcedTextOnly && nextMode === 'voice') return;

  if (nextMode !== currentMode) {
    stopListening();
    onModeChange(nextMode);
  }
  onEditorOpenChange?.(nextMode === 'chatbox');
}
