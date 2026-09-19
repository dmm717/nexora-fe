import { fetchInterviewSpeechAuthorization } from './speechApi';
import type { SpeechAuthorization } from './speechApi';

export const SPEECH_TOKEN_MIN_VALIDITY_MS = 60_000;

type SpeechAuthorizationFetcher = (
  interviewId: string,
) => Promise<SpeechAuthorization>;

export const createSpeechTokenManager = (
  fetchAuthorization: SpeechAuthorizationFetcher = fetchInterviewSpeechAuthorization,
) => {
  const cache = new Map<string, SpeechAuthorization>();
  const inFlight = new Map<string, Promise<SpeechAuthorization>>();
  const interviewGenerations = new Map<string, number>();
  let globalGeneration = 0;

  const getInterviewSpeechAuthorization = async (
    interviewId: string,
  ): Promise<SpeechAuthorization> => {
    if (typeof interviewId !== 'string' || interviewId.trim().length === 0) {
      throw new Error('An interview ID is required to authorize speech synthesis.');
    }

    const now = Date.now();
    const cached = cache.get(interviewId);
    if (cached && isUsableAuthorization(cached, now)) {
      return cached;
    }

    const pending = inFlight.get(interviewId);
    if (pending) return pending;

    const requestGlobalGeneration = globalGeneration;
    const requestInterviewGeneration = interviewGenerations.get(interviewId) ?? 0;
    const request = fetchAuthorization(interviewId)
      .then((authorization) => {
        if (!isUsableAuthorization(authorization, Date.now())) {
          throw new Error('Speech authorization is malformed or expires too soon.');
        }

        const wasCleared =
          requestGlobalGeneration !== globalGeneration ||
          requestInterviewGeneration !== (interviewGenerations.get(interviewId) ?? 0);
        if (!wasCleared) cache.set(interviewId, authorization);
        return authorization;
      })
      .finally(() => {
        if (inFlight.get(interviewId) === request) {
          inFlight.delete(interviewId);
        }
      });

    inFlight.set(interviewId, request);
    return request;
  };

  const clearInterviewSpeechAuthorizationCache = (interviewId?: string): void => {
    if (interviewId === undefined) {
      cache.clear();
      inFlight.clear();
      interviewGenerations.clear();
      globalGeneration += 1;
      return;
    }

    cache.delete(interviewId);
    inFlight.delete(interviewId);
    interviewGenerations.set(
      interviewId,
      (interviewGenerations.get(interviewId) ?? 0) + 1,
    );
  };

  return {
    getInterviewSpeechAuthorization,
    clearInterviewSpeechAuthorizationCache,
  };
};

const speechTokenManager = createSpeechTokenManager();

export const getInterviewSpeechAuthorization =
  speechTokenManager.getInterviewSpeechAuthorization;

export const clearInterviewSpeechAuthorizationCache =
  speechTokenManager.clearInterviewSpeechAuthorizationCache;

const isUsableAuthorization = (
  value: unknown,
  now: number,
): value is SpeechAuthorization => {
  if (typeof value !== 'object' || value === null) return false;

  const authorization = value as Partial<SpeechAuthorization>;
  if (
    typeof authorization.token !== 'string' ||
    authorization.token.trim().length === 0 ||
    typeof authorization.region !== 'string' ||
    authorization.region.trim().length === 0 ||
    typeof authorization.expiresAt !== 'string' ||
    authorization.expiresAt.trim().length === 0
  ) {
    return false;
  }

  const expiresAt = Date.parse(authorization.expiresAt);
  return (
    Number.isFinite(expiresAt) &&
    expiresAt > now + SPEECH_TOKEN_MIN_VALIDITY_MS
  );
};
