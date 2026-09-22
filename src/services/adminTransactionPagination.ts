export interface AdminTransactionCursorState {
  cursor: string | undefined;
  previousCursors: Array<string | undefined>;
}

export function advanceAdminTransactionCursor(
  state: AdminTransactionCursorState,
  nextCursor: string | undefined
): AdminTransactionCursorState {
  if (!nextCursor) return state;

  return {
    cursor: nextCursor,
    previousCursors: [...state.previousCursors, state.cursor],
  };
}

export function retreatAdminTransactionCursor(
  state: AdminTransactionCursorState
): AdminTransactionCursorState {
  if (state.previousCursors.length === 0) return state;

  return {
    cursor: state.previousCursors.at(-1),
    previousCursors: state.previousCursors.slice(0, -1),
  };
}

export function canRetreatAdminTransactionCursor(state: AdminTransactionCursorState): boolean {
  return state.previousCursors.length > 0;
}

export function resetAdminTransactionCursor(): AdminTransactionCursorState {
  return { cursor: undefined, previousCursors: [] };
}
