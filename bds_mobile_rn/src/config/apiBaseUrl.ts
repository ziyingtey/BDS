import { Platform } from 'react-native';

/** Match bds_backend launchSettings HTTP port (default 5062). Override at build: EXPO_PUBLIC_API_BASE_URL */
const DEV_HTTP_PORT = 5062;

export function getAuthBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEV_HTTP_PORT}/api/auth`;
  }
  return `http://127.0.0.1:${DEV_HTTP_PORT}/api/auth`;
}
