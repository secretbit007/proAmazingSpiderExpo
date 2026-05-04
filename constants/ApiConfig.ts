import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

/** Base URL for ProAmazingSpiderAPI (no trailing slash). Override via app.json `expo.extra.apiBaseUrl`. */
export const API_BASE_URL: string =
  extra?.apiBaseUrl ?? 'https://guntawong1.sydney:8443/api/v1';

/** Abort fetch after this many ms (network hangs, slow TLS). */
export const API_FETCH_TIMEOUT_MS = 25_000;
