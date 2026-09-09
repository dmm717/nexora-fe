export interface QueryWithData {
  state: {
    data: unknown;
    status?: string;
    error?: unknown;
  };
}

export type RealtimeFallbackInterval = number
  | false
  | ((query: QueryWithData) => number | false | undefined);

export function readStatus(data: unknown): string {
  if (!data || typeof data !== 'object') return '';

  const value = data as { status?: unknown; Status?: unknown };
  const status = value.status ?? value.Status;
  return typeof status === 'string' ? status.toLowerCase() : '';
}
