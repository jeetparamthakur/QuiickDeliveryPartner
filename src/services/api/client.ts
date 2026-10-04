import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';

// JSON API calls use RN fetch for reliable connect timeouts on Android.
// Multipart uploads keep expo/fetch (file streaming).
const jsonApiFetch: typeof globalThis.fetch = globalThis.fetch.bind(globalThis);
const multipartFetch: typeof globalThis.fetch = expoFetch;

const API_REQUEST_TIMEOUT_MS = 20_000;

async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  attempt = 0,
): Promise<Response> {
  const useMultipart = init?.body instanceof FormData;
  const fetchImpl = useMultipart ? multipartFetch : jsonApiFetch;

  if (useMultipart) {
    return fetchImpl(input, init);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const retriable =
      attempt === 0 &&
      (/AbortError|canceled|aborted|ConnectException|ECONNREFUSED|Failed to connect|Network request failed/i.test(
        message,
      ) ||
        (error instanceof Error && error.name === 'AbortError'));
    if (retriable) {
      return apiFetch(input, init, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const FALLBACK_API_BASE_URL = 'http://localhost:3000';

function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;

  const constants = Platform.constants as {
    Model?: string;
    Brand?: string;
    Fingerprint?: string;
  };
  const model = constants.Model ?? '';
  const fingerprint = constants.Fingerprint ?? '';

  return (
    /sdk_gphone|emulator|Android SDK built for/i.test(model) ||
    /generic|google_sdk|goldfish|ranchu|emulator/i.test(fingerprint)
  );
}

/** Live dev machine host from Metro (preferred over stale .env LAN IP). */
function getHostFromMetro(): string | null {
  const sources = [
    Constants.expoGoConfig?.debuggerHost,
    Constants.expoConfig?.hostUri,
    Constants.linkingUri,
  ].filter(Boolean) as string[];

  for (const source of sources) {
    const hostPart = source.replace(/^https?:\/\//, '').split(':')[0]?.toLowerCase();
    if (hostPart === 'localhost' || hostPart === '127.0.0.1') {
      return '127.0.0.1';
    }
    const ip = source.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (ip) return ip[1];
  }

  return null;
}

function getDevMachineHost(): string | null {
  const metroHost = getHostFromMetro();
  if (metroHost) return metroHost;

  const lanHost = process.env.EXPO_PUBLIC_API_LAN_HOST?.trim();
  if (lanHost) {
    const withoutScheme = lanHost.replace(/^https?:\/\//, '');
    return withoutScheme.split(':')[0] ?? null;
  }

  // 10.0.2.2 only reaches your laptop from the Android emulator, not a physical phone.
  if (Platform.OS === 'android' && isAndroidEmulator()) {
    return '10.0.2.2';
  }

  return null;
}

const USE_ADB_REVERSE = process.env.EXPO_PUBLIC_API_VIA_ADB === 'true';

function resolveApiBaseUrl(raw: string): string {
  // adb reverse tcp:3000 tcp:3000 — device 127.0.0.1:3000 → Mac localhost:3000
  if (USE_ADB_REVERSE) return raw;
  if (!raw.includes('localhost') && !raw.includes('127.0.0.1')) return raw;
  const host = getDevMachineHost();
  if (!host) return raw;
  return raw.replace(/localhost|127\.0\.0\.1/g, host);
}

export const API_BASE_URL = resolveApiBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? FALLBACK_API_BASE_URL,
);
export const API_VERSION = process.env.EXPO_PUBLIC_API_VERSION ?? 'v1';
export const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';
const API_DEBUG = __DEV__ && process.env.EXPO_PUBLIC_API_DEBUG !== 'false';

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) return phone;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}/api/${API_VERSION}${path}`;
}

if (API_DEBUG) {
  const tunnelMetro =
    Constants.linkingUri?.includes('exp.direct') ||
    Constants.expoConfig?.hostUri?.includes('exp.direct');
  console.log('[API config]', {
    baseUrl: API_BASE_URL,
    version: API_VERSION,
    mock: USE_MOCK_API,
    adbReverse: USE_ADB_REVERSE,
  });
  if (
    tunnelMetro &&
    /192\.168\.|10\.0\.2\.2/.test(API_BASE_URL) &&
    !USE_ADB_REVERSE
  ) {
    console.warn(
      '[API config] Expo tunnel is on but the API uses a LAN address. The phone often cannot reach 192.168.x.x (mobile data or router isolation). Use npm run start (LAN), or npm run start:usb with USB debugging.',
    );
  }
}

let authTokenGetter: (() => string | null) | null = null;
let refreshTokenGetter: (() => string | null) | null = null;
let onTokensRefreshed: ((token: string, refreshToken: string) => void | Promise<void>) | null = null;
let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAuthTokenGetter(getter: () => string | null) {
  authTokenGetter = getter;
}

export function setRefreshTokenGetter(getter: () => string | null) {
  refreshTokenGetter = getter;
}

export function setOnTokensRefreshed(
  handler: (token: string, refreshToken: string) => void | Promise<void>
) {
  onTokensRefreshed = handler;
}

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

function getUnauthorizedMessage(data: unknown): string {
  return (data as { message?: string }).message ?? 'Session expired';
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = refreshTokenGetter?.();
    if (!refreshToken) return null;

    try {
      const response = await apiFetch(getApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return null;

      const token = (data as { token?: string }).token;
      const nextRefreshToken = (data as { refreshToken?: string }).refreshToken;
      if (!token || !nextRefreshToken) return null;

      await onTokensRefreshed?.(token, nextRefreshToken);
      return token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

function logApi(
  kind: 'request' | 'response' | 'error',
  method: string,
  url: string,
  detail?: unknown
) {
  if (!API_DEBUG) return;

  const prefix = `[API ${kind}] ${method} ${url}`;
  if (kind === 'error') {
    console.error(prefix, detail ?? '');
    return;
  }
  console.log(prefix, detail ?? '');
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
  allowRefresh = true
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const url = getApiUrl(path);
  const startedAt = Date.now();

  const token = authTokenGetter?.();
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  logApi('request', method, url, {
    body: body ?? null,
    hasAuth: Boolean(token),
  });

  try {
    const response = await apiFetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const elapsedMs = Date.now() - startedAt;

    if (response.status === 204) {
      logApi('response', method, url, { status: 204, elapsedMs });
      return undefined as T;
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 && allowRefresh) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        return apiClient<T>(
          path,
          {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${nextToken}`,
            },
          },
          false,
        );
      }
      onUnauthorized?.();
      const error = new ApiError(
        'UNAUTHORIZED',
        getUnauthorizedMessage(data),
        401
      );
      logApi('error', method, url, { status: 401, elapsedMs, error: error.message });
      throw error;
    }

    if (!response.ok) {
      const error = new ApiError(
        (data as { code?: string }).code ?? 'API_ERROR',
        (data as { message?: string }).message ?? 'Something went wrong',
        response.status,
        (data as { details?: unknown }).details
      );
      logApi('error', method, url, {
        status: response.status,
        elapsedMs,
        body: data,
      });
      throw error;
    }

    logApi('response', method, url, {
      status: response.status,
      elapsedMs,
      body: data,
    });

    return data as T;
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    if (error instanceof ApiError) throw error;

    const rawMessage = error instanceof Error ? error.message : String(error);
    const timedOut =
      elapsedMs >= API_REQUEST_TIMEOUT_MS - 1000 &&
      /Fetch request has been canceled|AbortError|timed out|aborted/i.test(rawMessage);
    const cannotReachServer = /ConnectException|ECONNREFUSED|Failed to connect|Network request failed/i.test(
      rawMessage,
    );

    let userMessage = 'No internet connection. Please try again.';
    let hint = 'Check device network connectivity and try again.';
    if (timedOut) {
      userMessage = 'The request timed out. Check Wi‑Fi and try again.';
      hint =
        'If this keeps happening after a reload, force-close Expo Go and reopen. Ensure QuickmartcoreBackend is running (npm run dev).';
    } else if (cannotReachServer) {
      userMessage =
        'Could not reach the API server. Start QuickmartcoreBackend (npm run dev) on port 3000 and keep phone and laptop on the same Wi‑Fi.';
      hint =
        'In ../QuickmartcoreBackend run: npm run dev. App API: npm start (LAN) or set EXPO_PUBLIC_API_LAN_HOST in .env.';
    }

    const networkError = new ApiError('NETWORK_ERROR', userMessage);
    logApi('error', method, url, {
      elapsedMs,
      message: rawMessage,
      hint,
    });
    throw networkError;
  }
}

export async function uploadMultipart<T>(
  path: string,
  type: string,
  uri: string,
): Promise<T> {
  const url = getApiUrl(path);
  const token = authTokenGetter?.();
  const startedAt = Date.now();

  const formData = new FormData();
  const file = new File(uri);
  formData.append('file', file);
  formData.append('type', type);

  logApi('request', 'POST', url, { type, hasAuth: Boolean(token) });

  try {
    const response = await apiFetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    const elapsedMs = Date.now() - startedAt;

    if (response.status === 401) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        const retryResponse = await apiFetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${nextToken}`,
          },
          body: formData,
        });
        const retryData = await retryResponse.json().catch(() => ({}));
        const retryElapsedMs = Date.now() - startedAt;

        if (retryResponse.ok) {
          logApi('response', 'POST', url, {
            status: retryResponse.status,
            elapsedMs: retryElapsedMs,
            body: retryData,
          });
          return retryData as T;
        }

        if (retryResponse.status === 401) {
          onUnauthorized?.();
          const error = new ApiError(
            'UNAUTHORIZED',
            getUnauthorizedMessage(retryData),
            401
          );
          logApi('error', 'POST', url, {
            status: 401,
            elapsedMs: retryElapsedMs,
            error: error.message,
          });
          throw error;
        }

        const error = new ApiError(
          (retryData as { errorCode?: string }).errorCode ?? 'API_ERROR',
          (retryData as { message?: string }).message ?? 'Upload failed',
          retryResponse.status,
        );
        logApi('error', 'POST', url, {
          status: retryResponse.status,
          elapsedMs: retryElapsedMs,
          body: retryData,
        });
        throw error;
      }

      onUnauthorized?.();
      const error = new ApiError(
        'UNAUTHORIZED',
        getUnauthorizedMessage(data),
        401
      );
      logApi('error', 'POST', url, { status: 401, elapsedMs, error: error.message });
      throw error;
    }

    if (!response.ok) {
      const error = new ApiError(
        (data as { errorCode?: string }).errorCode ?? 'API_ERROR',
        (data as { message?: string }).message ?? 'Upload failed',
        response.status,
      );
      logApi('error', 'POST', url, {
        status: response.status,
        elapsedMs,
        body: data,
      });
      throw error;
    }

    logApi('response', 'POST', url, { status: response.status, elapsedMs, body: data });
    return data as T;
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    if (error instanceof ApiError) throw error;

    const networkError = new ApiError(
      'NETWORK_ERROR',
      'Upload failed. Please try again.',
    );
    logApi('error', 'POST', url, {
      elapsedMs,
      message: error instanceof Error ? error.message : String(error),
    });
    throw networkError;
  }
}

export async function uploadImageOnly<T>(path: string, uri: string): Promise<T> {
  const url = getApiUrl(path);
  const token = authTokenGetter?.();
  const startedAt = Date.now();

  const formData = new FormData();
  const file = new File(uri);
  formData.append('file', file);

  logApi('request', 'POST', url, { hasAuth: Boolean(token) });

  try {
    const response = await apiFetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    const elapsedMs = Date.now() - startedAt;

    if (!response.ok) {
      const error = new ApiError(
        (data as { errorCode?: string }).errorCode ?? 'API_ERROR',
        (data as { message?: string }).message ?? 'Upload failed',
        response.status,
      );
      logApi('error', 'POST', url, {
        status: response.status,
        elapsedMs,
        body: data,
      });
      throw error;
    }

    logApi('response', 'POST', url, { status: response.status, elapsedMs, body: data });
    return data as T;
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    if (error instanceof ApiError) throw error;

    const networkError = new ApiError(
      'NETWORK_ERROR',
      'Upload failed. Please try again.',
    );
    logApi('error', 'POST', url, {
      elapsedMs,
      message: error instanceof Error ? error.message : String(error),
    });
    throw networkError;
  }
}
