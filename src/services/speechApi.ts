import { apiClient } from './apiClient';

export interface SpeechAuthorization {
  token: string;
  region: string;
  expiresAt: string;
}

export interface SpeechAuthorizationEnvelope {
  data: SpeechAuthorization;
}

/** Fetch a short-lived Azure Speech authorization using the authenticated API client. */
export const fetchInterviewSpeechAuthorization = async (
  interviewId: string,
): Promise<SpeechAuthorization> => {
  const response = (await apiClient.post(
    `/speech/interviews/${encodeURIComponent(interviewId)}/token`,
  )) as SpeechAuthorizationEnvelope;

  return response.data;
};
