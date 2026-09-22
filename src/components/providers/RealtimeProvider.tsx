'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useAuth } from './AuthBootstrapProvider';
import { getUsableAccessToken } from '@/services/authSession';
import {
  getAccessToken,
  isPrincipalEpochCurrent,
  subscribeAuthState,
} from '@/store/authStore';
import { getRealtimeInvalidationKeys } from '@/utils/scenarioHelpers';

export interface RealtimeState {
  isConnected: boolean;
  error: Error | null;
}

const defaultState: RealtimeState = {
  isConnected: false,
  error: null,
};

const RealtimeContext = createContext<RealtimeState>(defaultState);

export const useRealtime = () => useContext(RealtimeContext);

interface RealtimeEvent {
  eventId: string;
  resourceType: string;
  resourceId: string;
  status: string;
  occurredAt: string;
}

const MAX_SEEN_EVENTS = 1000;

const RECOVERY_QUERY_PREFIXES: readonly QueryKey[] = [
  ['resume'],
  ['resumeAnalysis'],
  ['interview'],
  ['interviewReport'],
  ['scenarioAttempt'],
  ['scenarioHistory'],
  ['scenarioProgress'],
  ['starAttempt'],
];

function parseResourceChangedEvent(value: unknown): RealtimeEvent | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const eventId = raw.eventId ?? raw.EventId;
  const resourceType = raw.resourceType ?? raw.ResourceType;
  const resourceId = raw.resourceId ?? raw.ResourceId;
  const status = raw.status ?? raw.Status;
  const occurredAt = raw.occurredAt ?? raw.OccurredAt;

  if (
    typeof eventId === 'string' && eventId.length > 0
    && typeof resourceType === 'string' && resourceType.length > 0
    && typeof resourceId === 'string' && resourceId.length > 0
    && typeof status === 'string'
    && typeof occurredAt === 'string'
  ) {
    return {
      eventId,
      resourceType,
      resourceId,
      status,
      occurredAt,
    };
  }

  return null;
}

/**
 * Maps only resource types emitted by the backend to authoritative queries.
 * Events are notifications, so the query functions still fetch the final API state.
 */
function getQueryKeysForEvent(event: RealtimeEvent): QueryKey[] {
  const resourceType = event.resourceType.toLowerCase();
  const status = event.status.toLowerCase();

  const scenarioKeys = getRealtimeInvalidationKeys(event.resourceType, event.resourceId);
  if (scenarioKeys.length > 0) return scenarioKeys;

  switch (resourceType) {
    case 'resume':
      return [['resume', event.resourceId]];
    case 'resumeanalysis':
      return [['resumeAnalysis', event.resourceId]];
    case 'interview':
      return status === 'completed'
        ? [['interview', event.resourceId], ['interviewReport', event.resourceId]]
        : [['interview', event.resourceId]];
    default:
      return [];
  }
}

function resolveHubUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
  const apiUrl = new URL(configuredBaseUrl);
  return new URL('/hubs/realtime', apiUrl.origin).toString();
}

function invalidateQueries(queryClient: ReturnType<typeof useQueryClient>, queryKeys: QueryKey[]) {
  for (const queryKey of queryKeys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

const INITIAL_RETRY_DELAYS_MS = [2000, 5000, 10000, 30000] as const;

function getInitialRetryDelay(attempt: number): number {
  const index = Math.min(attempt, INITIAL_RETRY_DELAYS_MS.length - 1);
  return INITIAL_RETRY_DELAYS_MS[index];
}

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady, principalEpoch } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const seenEventsRef = useRef<Set<string>>(new Set());
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    let disposed = false;
    let connection: signalR.HubConnection | null = null;
    let startPromise: Promise<void> | null = null;
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let resolveRetryDelay: (() => void) | null = null;
    const sessionEpoch = principalEpoch;

    const cancelPendingRetry = () => {
      if (retryTimeoutId !== null) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }
      if (resolveRetryDelay !== null) {
        const resolve = resolveRetryDelay;
        resolveRetryDelay = null;
        resolve();
      }
    };

    const waitForRetry = (delayMs: number): Promise<void> => {
      if (disposed) return Promise.resolve();
      return new Promise<void>((resolve) => {
        resolveRetryDelay = resolve;
        retryTimeoutId = setTimeout(() => {
          retryTimeoutId = null;
          resolveRetryDelay = null;
          resolve();
        }, delayMs);
      });
    };

    const stopConnection = async () => {
      cancelPendingRetry();
      if (!connection) return;

      try {
        await connection.stop();
      } catch {
        // Cleanup must never surface a connection shutdown error to the app.
      } finally {
        if (connectionRef.current === connection) {
          connectionRef.current = null;
        }
        connection = null;
      }
    };

    const unsubscribeAuthState = subscribeAuthState((_token, snapshot) => {
      if (snapshot?.principalEpoch === sessionEpoch) return;
      disposed = true;
      cancelPendingRetry();
      void stopConnection();
    });

    if (!authReady || !isAuthenticated) {
      cancelPendingRetry();
      seenEventsRef.current.clear();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset realtime state at the auth boundary
      setIsConnected(false);
      setError(null);

      const previousConnection = connectionRef.current;
      connectionRef.current = null;
      if (previousConnection) {
        void previousConnection.stop().catch(() => undefined);
      }

      return () => {
        disposed = true;
        unsubscribeAuthState();
        cancelPendingRetry();
      };
    }

    // A fresh authenticated session starts with a fresh dedupe window.
    seenEventsRef.current.clear();
    setIsConnected(false);
    setError(null);

    // React StrictMode and auth transitions can run setup again before the
    // previous connection has finished negotiating. Stop that instance first.
    const previousConnection = connectionRef.current;
    connectionRef.current = null;
    if (previousConnection) {
      void previousConnection.stop().catch(() => undefined);
    }

    const connectWithRetry = async () => {
      let retryAttempt = 0;

      while (!disposed) {
        if (!getAccessToken()) return;
        if (!isPrincipalEpochCurrent(sessionEpoch)) return;

        try {
          if (disposed || !isPrincipalEpochCurrent(sessionEpoch)) return;

          connection = new signalR.HubConnectionBuilder()
            .withUrl(resolveHubUrl(), {
              accessTokenFactory: async () => {
                try {
                  if (disposed || !isPrincipalEpochCurrent(sessionEpoch)) return '';
                  const token = await getUsableAccessToken({ refreshIfExpiringWithinSeconds: 60 });
                  return isPrincipalEpochCurrent(sessionEpoch) ? token : '';
                } catch {
                  return '';
                }
              },
              withCredentials: true,
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.None)
            .build();

          if (disposed) {
            void connection.stop().catch(() => undefined);
            connection = null;
            return;
          }

          connectionRef.current = connection;

          connection.on('resourceChanged', (value: unknown) => {
            if (disposed || !isPrincipalEpochCurrent(sessionEpoch)) return;
            const event = parseResourceChangedEvent(value);
            if (!event) return;

            const seenEvents = seenEventsRef.current;
            if (seenEvents.has(event.eventId)) return;

            seenEvents.add(event.eventId);
            if (seenEvents.size > MAX_SEEN_EVENTS) {
              const oldestEventId = seenEvents.values().next().value;
              if (typeof oldestEventId === 'string') {
                seenEvents.delete(oldestEventId);
              }
            }

            invalidateQueries(queryClient, getQueryKeysForEvent(event));
          });

          connection.onreconnecting(() => {
            if (disposed || !isPrincipalEpochCurrent(sessionEpoch)) return;
            setIsConnected(false);
          });

          connection.onreconnected(() => {
            if (disposed || !isPrincipalEpochCurrent(sessionEpoch)) return;
            setIsConnected(true);
            setError(null);
            invalidateQueries(queryClient, [...RECOVERY_QUERY_PREFIXES]);
          });

          connection.onclose((closeError) => {
            if (disposed || !isPrincipalEpochCurrent(sessionEpoch)) return;
            setIsConnected(false);
            if (closeError) setError(closeError);
          });

          if (disposed) {
            await stopConnection();
            return;
          }

          startPromise = connection.start();
          await startPromise;

          if (disposed) {
            await stopConnection();
            return;
          }

          setIsConnected(true);
          setError(null);
          return;
        } catch (caughtError: unknown) {
          if (disposed) return;

          await stopConnection();
          setIsConnected(false);
          setError(caughtError instanceof Error ? caughtError : new Error('Realtime connection failed'));

          if (disposed) return;

          // If the session was invalidated (e.g. 401 refresh failure during negotiate/reconnect),
          // halt retries immediately instead of entering an infinite reconnect loop.
          if (!isPrincipalEpochCurrent(sessionEpoch) || !getAccessToken()) {
            return;
          }

          const delay = getInitialRetryDelay(retryAttempt++);
          await waitForRetry(delay);
        }
      }
    };

    void connectWithRetry();

    return () => {
      disposed = true;
      unsubscribeAuthState();
      cancelPendingRetry();
      setIsConnected(false);

      if (startPromise) {
        void startPromise.then(stopConnection).catch(stopConnection);
      } else {
        void stopConnection();
      }

      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }
    };
  }, [authReady, isAuthenticated, principalEpoch, queryClient]);

  return (
    <RealtimeContext.Provider value={{ isConnected, error }}>
      {children}
    </RealtimeContext.Provider>
  );
}
