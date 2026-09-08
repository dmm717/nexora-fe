'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthBootstrapProvider';
import { refreshSession } from '@/services/authSession';
import { getAccessToken } from '@/store/authStore';

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

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const seenEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      setIsConnected(false);
      return;
    }

    let connection: signalR.HubConnection | null = null;
    let startPromise: Promise<void> | null = null;
    let isMounted = true;

    const setupConnection = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
        const hubUrl = `${baseUrl.replace('/api/v1', '')}/hubs/realtime`;

        connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl, {
            accessTokenFactory: async () => {
              const currentToken = getAccessToken();
              if (currentToken) return currentToken;
              
              try {
                const response = await refreshSession();
                return response.data.accessToken;
              } catch (e) {
                return '';
              }
            },
            withCredentials: true
          })
          .withAutomaticReconnect()
          .configureLogging(signalR.LogLevel.None)
          .build();

        connection.on('resourceChanged', (event: RealtimeEvent) => {
          const seen = seenEventsRef.current;
          if (seen.has(event.eventId)) return;
          
          seen.add(event.eventId);
          if (seen.size > 1000) {
            const firstElement = seen.values().next().value;
            if (firstElement) {
                seen.delete(firstElement);
            }
          }

          let queryKey: string[] | null = null;
          
          if (event.resourceType === 'resumeAnalysis') {
            queryKey = ['resumeAnalysis', event.resourceId];
          } else if (event.resourceType === 'interview') {
            if (event.status === 'completed') {
              queryKey = ['interviewReport', event.resourceId];
              queryClient.invalidateQueries({ queryKey: ['interview', event.resourceId] });
            } else {
              queryKey = ['interview', event.resourceId];
            }
          }

          if (queryKey) {
            queryClient.invalidateQueries({ queryKey });
          }
        });

        connection.onreconnected(() => {
          queryClient.invalidateQueries({ queryKey: ['resumeAnalysis'] });
          queryClient.invalidateQueries({ queryKey: ['interview'] });
          queryClient.invalidateQueries({ queryKey: ['interviewReport'] });
        });

        startPromise = connection.start();
        await startPromise;
        if (isMounted) {
          setIsConnected(true);
          setError(null);
        }
      } catch (err: any) {
        if (!isMounted) {
          // Ignore errors caused by StrictMode unmounting during negotiation
          return;
        }
        console.error('SignalR connection error:', err);
        setError(err);
        setIsConnected(false);
      }
    };

    void setupConnection();

    return () => {
      isMounted = false;
      if (connection) {
        if (startPromise) {
          startPromise.then(() => connection?.stop()).catch(() => {});
        } else {
          connection.stop().catch(console.error);
        }
      }
    };
  }, [isAuthenticated, authReady, queryClient]);

  return (
    <RealtimeContext.Provider value={{ isConnected, error }}>
      {children}
    </RealtimeContext.Provider>
  );
}
