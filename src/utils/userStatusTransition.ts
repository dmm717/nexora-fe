export type UserStatusTransition = 'lock' | 'unlock' | null;

export function getUserStatusTransition(currentActive: boolean, targetActive: boolean): UserStatusTransition {
  if (currentActive === targetActive) return null;
  return targetActive ? 'unlock' : 'lock';
}
