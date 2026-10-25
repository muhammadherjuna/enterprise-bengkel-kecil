export const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('bengkelos_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('bengkelos_token', token);
  } else {
    localStorage.removeItem('bengkelos_token');
  }
}

export function generateIdempotencyKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.idempotencyKey) {
    headers.set('x-idempotency-key', options.idempotencyKey);
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // sends and receives HttpOnly cookie
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = json.message || `Request gagal dengan status ${res.status}`;
      const err: any = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      err.status = res.status;
      err.response = json;
      throw err;
    }

    return (json.data !== undefined ? json.data : json) as T;
  } catch (error: any) {
    if (!navigator.onLine || error.message?.includes('Failed to fetch')) {
      const netErr: any = new Error(
        'Koneksi internet atau server terputus. Input form Anda tetap tersimpan. Silakan coba lagi ketika koneksi pulih.',
      );
      netErr.isNetworkError = true;
      throw netErr;
    }
    throw error;
  }
}
