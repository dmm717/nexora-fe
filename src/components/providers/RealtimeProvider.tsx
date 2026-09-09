'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useAuth } from './AuthBootstrapProvider';
import { refreshSession } from '@/services/authSession';
import { getAccessToken, setAccessToken } from '@/store/authStore';

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

function clearUserScopedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  for (const queryKey of RECOVERY_QUERY_PREFIXES) {
    queryClient.removeQueries({ queryKey });
  }
}

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const seenEventsRef = useRef<Set<string>>(new Set());
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    let disposed = false;
    let connection: signalR.HubConnection | null = null;
    let startPromise: Promise<void> | null = null;

    const stopConnection = async () => {
      if (!connection) return;

      try {
        await connection.stop();
      } catch {
        // Cleanup must never surface a connection shutdown error to the app.
      } finally {
        if (connectionRef.current === connection) {
          connectionRef.current = null;
        }
      }
    };

    if (!authReady || !isAuthenticated) {
      seenEventsRef.current.clear();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset realtime state at the auth boundary
      setIsConnected(false);
      setError(null);
      clearUserScopedQueries(queryClient);

      const previousConnection = connectionRef.current;
      connectionRef.current = null;
      if (previousConnection) {
        void previousConnection.stop().catch(() => undefined);
      }

      return () => {
        disposed = true;
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

    const setupConnection = async () => {
      try {
        if (disposed) return;

        connection = new signalR.HubConnectionBuilder()
          .withUrl(resolveHubUrl(), {
            accessTokenFactory: async () => {
              const currentToken = getAccessToken();
              if (currentToken) return currentToken;

              try {
                const response = await refreshSession();
                setAccessToken(response.data.accessToken);
                return response.data.accessToken;
              } catch {
                return '';
              }
            },
            withCredentials: true,
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.None)
          .build();

        connectionRef.current = connection;

        connection.on('resourceChanged', (value: unknown) => {
          if (disposed) return;
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
          if (disposed) return;
          setIsConnected(false);
        });

        connection.onreconnected(() => {
          if (disposed) return;
          setIsConnected(true);
          setError(null);
          invalidateQueries(queryClient, [...RECOVERY_QUERY_PREFIXES]);
        });

        connection.onclose((closeError) => {
          if (disposed) return;
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
      } catch (caughtError: unknown) {
        if (disposed) return;

        await stopConnection();
        setIsConnected(false);
        setError(caughtError instanceof Error ? caughtError : new Error('Realtime connection failed'));
      }
    };

    void setupConnection();

    return () => {
      disposed = true;
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
  }, [authReady, isAuthenticated, queryClient]);

  return (
    <RealtimeContext.Provider value={{ isConnected, error }}>
      {children}
    </RealtimeContext.Provider>
  );
}
