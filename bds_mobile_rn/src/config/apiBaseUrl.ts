import { Platform } from 'react-native';

/** Match bds_backend launchSettings HTTP port (default 5062). */
const DEV_HTTP_PORT = 5062;

/** Full backend origin without path, e.g. http://10.0.2.2:5062 — use EXPO_PUBLIC_BACKEND_BASE_URL on a physical device. */
export function getBackendBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEV_HTTP_PORT}`;
  }
  return `http://127.0.0.1:${DEV_HTTP_PORT}`;
}

/** Auth API only */
export function getAuthBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');

  return `${getBackendBaseUrl()}/api/auth`;
}
