/**
 * apiConfig.ts — Centralized API Client & Environment Configuration
 *
 * Provides environment-aware API URL resolution:
 * - Production: uses relative path or VITE_API_URL / VITE_BACKEND_URL if separate backend host.
 * - Development: falls back to relative or configured dev endpoint.
 */

function getEnvVar(key: string): string {
  try {
    return (import.meta as any).env?.[key] || '';
  } catch {
    return '';
  }
}

export const API_BASE_URL: string = (
  getEnvVar('VITE_API_URL') ||
  getEnvVar('VITE_BACKEND_URL') ||
  ''
).replace(/\/$/, '');

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  return `${API_BASE_URL}${cleanPath}`;
}

export function getProductionAppUrl(): string {
  const envAppUrl = getEnvVar('VITE_APP_URL');
  if (envAppUrl) {
    return envAppUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://oralix.online';
}
