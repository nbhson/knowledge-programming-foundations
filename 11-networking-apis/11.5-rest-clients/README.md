# 📡 11.5 REST Clients (Client Libraries & Patterns)

> **REST Clients** giúp gọi API dễ dàng hơn với interceptors, type safety, retry logic, và error handling.

---

## 🎯 fetch vs Axios so sánh

```
┌─────────────────────────────────────────────────────────────┐
│                    fetch vs Axios                          │
├──────────────────┬──────────────┬──────────────────────────┤
│ Feature          │   fetch      │       Axios              │
├──────────────────┼──────────────┼──────────────────────────┤
│ Bundle size      │ 0 KB (native)│ ~13 KB                   │
│ Auto JSON parse  │ ❌ res.json() │ ✅ data = response.data  │
│ Request interceptor│ ❌         │ ✅ addTokenInterceptor() │
│ Response interceptor│ ❌        │ ✅ logResponse()         │
│ Timeout          │ AbortSignal  │ timeout: 3000           │
│ CSRF token       │ Manual       │ Tự động XSRF-TOKEN      │
│ Cancel request   │ AbortController│ axios.CancelToken     │
│ Type safety      │ Manual       │ Generic <T>            │
└──────────────────┴──────────────┴──────────────────────────┘
```

---

## 11.5.1 Axios Typed Client

```typescript
// api/client.ts — Axios instance với TypeScript generics
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — tự động thêm token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — xử lý lỗi global
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 11.5.2 Typed API Service

```typescript
// api/users.ts — Service typed cho users
import apiClient from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: { page: number; limit: number; total: number };
  error?: { code: string; message: string };
}

class UserService {
  // GET /api/users
  async list(params?: { page?: number; limit?: number }): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users', { params });
    return response.data;
  }

  // GET /api/users/:id
  async getById(id: string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  }

  // POST /api/users
  async create(data: CreateUserDto): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/users', data);
    return response.data;
  }

  // PATCH /api/users/:id
  async update(id: string, data: Partial<CreateUserDto>): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  }

  // DELETE /api/users/:id
  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  }
}

export const userService = new UserService();
```

---

## 11.5.3 Retry Logic

```typescript
// utils/retry.ts — Retry với exponential backoff
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = baseDelay * Math.pow(2, attempt);

      if (attempt < maxRetries) {
        console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Usage
const user = await retry(() => userService.getById('123'), 3, 500);
```

---

## 11.5.4 Error Handling Patterns

```typescript
// errors/ApiError.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Usage pattern
async function safeCall<T>(fn: () => Promise<T>): Promise<{ data?: T; error?: ApiError }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error };
    }
    return { error: new ApiError(500, 'UNKNOWN_ERROR', String(error)) };
  }
}

// React example
const { data, error } = await safeCall(() => userService.list({ page: 1 }));
if (error) {
  console.error(`Lỗi ${error.code}: ${error.message}`);
}
```

---

## 11.5.5 Cancel Request

```typescript
import axios from 'axios';

// Hủy request cũ khi user gõ nhanh
let cancelSource: axios.CancelTokenSource;

async function searchUsers(query: string) {
  // Cancel request trước đó
  if (cancelSource) {
    cancelSource.cancel('Request cancelled');
  }

  cancelSource = axios.CancelToken.source();

  try {
    const { data } = await apiClient.get('/users/search', {
      params: { q: query },
      cancelToken: cancelSource.token
    });
    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('🔄 Request cancelled (user continued typing)');
    } else {
      throw error;
    }
  }
}
```

---

## 🔗 Liên Quan

- **11.1 HTTP Basics** — Fetch API
- **11.6 Rate Limiting** — Giới hạn API calls

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| Axios docs | https://axios-http.com/ |
| MDN — fetch API | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API |

---

## ⏭️ Bài tiếp theo → [11.6 Rate Limiting](../11.6-rate-limiting/README.md)
