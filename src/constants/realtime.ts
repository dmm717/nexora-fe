/**
 * Safety-net polling interval for async resources that are primarily refreshed
 * by the SignalR resourceChanged notification.
 */
export const REALTIME_FALLBACK_POLL_MS = 15_000;
