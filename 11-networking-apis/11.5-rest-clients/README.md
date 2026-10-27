# 📡 11.5 REST Clients (Client Libraries & Patterns)

> **REST Clients** giúp gọi API dễ dàng hơn với interceptors, type safety, retry logic, và error handling. Trong thực tế, việc gọi API không chỉ là `fetch(url)` — production-quality client phải xử lý auth token refresh, rate limiting (429), network failures (5xx), timeouts, cancelation, và typed responses. Bài này cover các patterns cần thiết để build robust API client.

---

## 🎯 fetch vs Axios so sánh — Deep dive

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    fetch vs Axios — Feature Comparison                      │
├──────────────────┬─────────────────────────────┬────────────────────────────┤
│ Feature          │   fetch (native)            │       Axios                │
├──────────────────┼─────────────────────────────┼────────────────────────────┤
│ Bundle size      │ 0 KB (built-in)             │ ~13 KB (gzipped ~5KB)     │
│ Auto JSON parse  │ ❌ Must call res.json()     │ ✅ response.data auto-parsed│
│ Request interceptor│ ❌ No built-in support    │ ✅ axios.interceptors.request│
│ Response interceptor│ ❌ No built-in support   │ ✅ axios.interceptors.response│
│ Timeout          │ Manual (AbortSignal)      │ timeout: 3000 option       │
│ Progress tracking│ Manual (ReadableStream)   │ onUploadProgress, onDownloadProgress│
│ CSRF protection  │ Manual                    │ ✅ Automatic XSRF-TOKEN    │
│ Cancel request   │ AbortController           │ axios.CancelToken (deprecated)│
│                  │                             │ ✅ AbortController wrapper  │
│ Type safety      │ Good (built-in types)     │ Excellent (generics <T>)   │
│ Browser support  │ IE11 ❌                   │ ✅ All browsers             │
│ HTTPS proxy      │ Manual config             │ proxy: { host, port }      │
│ Automatic transforms│ ❌                      │ ✅ request/response data transform│
└──────────────────┴─────────────────────────────┴────────────────────────────┘
```

**Decision rule:** dùng **fetch** khi project không muốn dependency (React Server Components, edge functions). Dùng **Axios** khi cần interceptors, typed API services, hoặc broader browser support.

---

## 11.5.1 Axios Typed Client — Centralized configuration

```typescript
// api/client.ts — Singleton axios instance with interceptors
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Create typed axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: attach auth token ────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach request ID for tracing
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: global error handling ───────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized — token expired, try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;  // Prevent infinite loop

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('refresh_token', data.refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // 429 Rate limited — respect Retry-After header
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60_000;
      console.warn(`Rate limited. Retrying after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(originalRequest);  // Retry once
    }

    // 5xx Server error — don't retry on original request (would loop)
    if (error.response?.status >= 500 && !originalRequest._retry) {
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 11.5.2 Typed API Service — Generic response wrapper

```typescript
// api/users.ts — Type-safe user service
import apiClient from './client';

// ── Types ────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Standard API response envelope
export interface ApiResponse<T> {
  data: T;
  meta: PaginationMeta | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details: Array<{ field: string; message: string }>;
  requestId: string;
  timestamp: string;
}

// ── Service Class ────────────────────────────────────────
class UserService {
  // GET /api/users — list with pagination
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users', { params });
    return response.data;
  }

  // GET /api/users/:id — single user
  async getById(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  }

  // POST /api/users — create user
  async create(data: CreateUserDto): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/users', data);
    return response.data;
  }

  // PATCH /api/users/:id — partial update
  async update(id: string, data: Partial<UpdateUserDto>): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  }

  // DELETE /api/users/:id — soft delete (204 No Content)
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  }

  // GET /api/users/:id/orders — user's orders (nested resource)
  async getOrders(userId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(`/users/${userId}/orders`, { params });
    return response.data;
  }
}

export const userService = new UserService();
```

---

## 11.5.3 Retry Logic — Exponential backoff with jitter

```typescript
// utils/retry.ts — Robust retry with exponential backoff + jitter

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;      // milliseconds
  maxDelay?: number;       // cap delay (default 30s)
  jitter?: boolean;        // add randomness to prevent thundering herd
  retryableStatuses?: number[];  // which HTTP statuses to retry
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  jitter: true,
  retryableStatuses: [429, 500, 502, 503, 504],
};

async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = DEFAULT_OPTIONS
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000, jitter = true, retryableStatuses } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if this error is retryable
      const statusCode = error?.response?.status;
      const isRetryable = statusCode
        ? retryableStatuses?.includes(statusCode) ?? false
        : true;  // Network errors are always retryable

      if (!isRetryable || attempt >= maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const delay = Math.min(exponentialDelay, maxDelay);

      // Add jitter to prevent thundering herd (all clients retrying at same time)
      const finalDelay = jitter
        ? delay + Math.random() * delay  // delay to 2*delay
        : delay;

      console.warn(
        `⚠️ Attempt ${attempt + 1}/${maxRetries + 1} failed (status: ${statusCode}). ` +
        `Retrying in ${Math.round(finalDelay)}ms...`
      );

      await sleep(finalDelay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Usage ─────────────────────────────────────────────────
// Basic usage
const user = await retry(() => userService.getById('123'), 3, 500);

// With custom options (only retry on 5xx)
const orders = await retry(
  () => userService.getOrders('123', { page: 1 }),
  { maxRetries: 5, baseDelay: 500, maxDelay: 10000, retryableStatuses: [500, 502, 503, 504] }
);

// For rate-limited endpoints (429)
const searchResults = await retry(
  () => apiClient.get('/search', { params: { q: query } }),
  { maxRetries: 3, baseDelay: 2000, retryableStatuses: [429] }
);
```

---

## 11.5.4 Error Handling Patterns — Structured error management

```typescript
// errors/ApiError.ts — Custom error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; message: string }>,
    public requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: any): ApiError {
    const error = response?.error || {};
    return new ApiError(
      response?.status || 500,
      error.code || 'UNKNOWN_ERROR',
      error.message || 'Unknown error occurred',
      error.details,
      error.requestId,
    );
  }
}

// ── Safe call pattern ─────────────────────────────────────
// Wraps async calls to return { data, error } instead of throw/catch

type SafeCallResult<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

async function safeCall<T>(
  fn: () => Promise<T>,
  transformError?: (error: any) => ApiError
): Promise<SafeCallResult<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error: any) {
    const apiError = transformError
      ? transformError(error)
      : ApiError.fromResponse(error.response?.data || error);
    return { data: null, error: apiError };
  }
}

// ── React hook: useApiCall ────────────────────────────────
import { useState, useCallback } from 'react';

interface UseApiCallState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  call: () => Promise<void>;
  reset: () => void;
}

function useApiCall<T>(fn: () => Promise<T>): UseApiCallState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  const call = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
    } catch (err: any) {
      setError(ApiError.fromResponse(err.response?.data || err));
    } finally {
      setLoading(false);
    }
  }, [fn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, error, loading, call, reset };
}

// ── Usage in component ────────────────────────────────────
function UserProfile({ userId }: { userId: string }) {
  const { data: user, error, loading, call } = useApiCall(() =>
    userService.getById(userId)
  );

  useEffect(() => { call(); }, [call, userId]);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <p>User not found</p>;

  return <div>{user.name} ({user.email})</div>;
}
```

---

## 11.5.5 Cancel Request — AbortController pattern

```typescript
import axios from 'axios';

// ── Pattern 1: AbortController (modern, recommended) ─────
let abortController: AbortController | null = null;

async function searchUsers(query: string) {
  // Cancel previous request if still in flight
  if (abortController) {
    abortController.abort('Cancelled: new search started');
  }

  abortController = new AbortController();

  try {
    const { data } = await apiClient.get('/users/search', {
      params: { q: query },
      signal: abortController.signal,  // Pass abort signal
    });
    return data;
  } catch (error: any) {
    if (axios.isCancel(error)) {
      console.log('🔄 Request cancelled (user continued typing)');
      return null;  // Silently ignore cancellation
    }
    throw error;
  }
}

// Usage with debounce
import { useCallback } from 'react';

function SearchInput() {
  const search = useCallback(
    debounce(async (query: string) => {
      const results = await searchUsers(query);
      setResults(results);
    }, 300),
    []
  );
  // ...
}

// ── Pattern 2: Axios CancelToken (legacy, but still used) ─
// Note: axios.CancelToken is deprecated in favor of AbortController
let cancelSource: axios.CancelTokenSource | null = null;

async function searchUsersLegacy(query: string) {
  if (cancelSource) {
    cancelSource.cancel('Request cancelled');
  }
  cancelSource = axios.CancelToken.source();

  try {
    const { data } = await apiClient.get('/users/search', {
      params: { q: query },
      cancelToken: cancelSource.token,
    });
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('🔄 Request cancelled (user continued typing)');
      return null;
    }
    throw error;
  }
}
```

---

## 11.5.6 Request Interceptor Patterns — Beyond auth

```typescript
// ── Pattern: Request ID for distributed tracing ──────────
apiClient.interceptors.request.use((config) => {
  // Generate or reuse request ID from header
  const requestId = config.headers['X-Request-ID'] || `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  config.headers['X-Request-ID'] = requestId;

  // Also set on response for correlation
  const originalAdapter = config.adapter;
  config.adapter = (adapterConfig) => {
    return originalAdapter!(adapterConfig).then(response => {
      response.headers['x-request-id'] = requestId;
      return response;
    });
  };
  return config;
});

// ── Pattern: Request timing metrics ──────────────────────
apiClient.interceptors.request.use((config) => {
  (config as any)._startTime = Date.now();
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - ((response.config as any)._startTime || Date.now());
    console.log(`[${response.config.method?.toUpperCase()} ${response.config.url}] ${response.status} ${duration}ms`);

    // Report to monitoring
    reportMetric('api_request_duration', duration, {
      method: response.config.method,
      path: response.config.url,
      status: response.status,
    });

    return response;
  },
  (error) => {
    const duration = Date.now() - ((error.config as any)._startTime || Date.now());
    console.error(`[${error.config.method?.toUpperCase()} ${error.config.url}] ${error.response?.status ?? 'ERR'} ${duration}ms`);
    return Promise.reject(error);
  }
);

// ── Pattern: Quiet mode (suppress console output) ───────
apiClient.interceptors.request.use((config) => {
  if (config.headers['X-Quiet'] === 'true') {
    config.headers['X-Log-Level'] = 'silent';
  }
  return config;
});
```

---

## 11.5.7 React Query / SWR — Server state management

For complex applications, consider dedicated server-state libraries:

```typescript
// React Query — powerful data fetching library
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Automatic caching, background refetch, stale-while-revalidate
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => userService.list(),
  staleTime: 5 * 60 * 1000,  // Consider fresh for 5 minutes
  cacheTime: 10 * 60 * 1000,  // Keep in cache for 10 minutes
});

// Optimistic update for mutations
const createUserMutation = useMutation({
  mutationFn: (data: CreateUserDto) => userService.create(data),
  onMutate: async (newUser) => {
    await queryClient.cancelQueries({ queryKey: ['users'] });
    const previousUsers = queryClient.getQueryData(['users']);
    queryClient.setQueryData(['users'], (old: any) => [...old, newUser]);
    return { previousUsers };
  },
  onError: (err, newUser, context) => {
    queryClient.setQueryData(['users'], context.previousUsers);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

// SWR — lighter alternative (by Vercel)
import useSWR from 'swr';

const { data: user, error, isLoading, mutate } = useSWR(
  ['/api/users', userId],
  ([_, id]) => userService.getById(id),
  { revalidateOnFocus: true, dedupingInterval: 2000 }
);
```

---

## 🔗 Liên Quan

- **11.1 HTTP Basics** — Fetch API and HTTP fundamentals
- **11.6 Rate Limiting** — How to handle 429 responses with retry logic

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| Axios docs | https://axios-http.com/ |
| MDN — fetch API | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API |
| TanStack Query (React Query) | https://tanstack.com/query/latest |
| SWR by Vercel | https://swr.vercel.app/ |
| AbortController spec | https://developer.mozilla.org/en-US/docs/Web/API/AbortController |

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.5-rest-clients
npx tsx examples/index.ts
```

Demo bao gồm: typed API service, retry with exponential backoff, error handling patterns, request cancellation, và interceptor usage.

---

## ⏭️ Bài tiếp theo → [11.6 Rate Limiting](../11.6-rate-limiting/README.md)
