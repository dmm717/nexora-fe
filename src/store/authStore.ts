/**
 * Memory-only storage for Access Token.
 * Rule 1: Do not use localStorage or sessionStorage for tokens.
 */

let accessToken: string | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};
