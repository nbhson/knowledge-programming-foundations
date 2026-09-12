# 🛡️ 14.3 Error Handling

> Error handling không phải là bắt `try-catch` ở khắp nơi — nó là **thiết kế cách hệ thống phản hồi khi điều gì đó sai**.

---

## 🎯 Nguyên tắc cơ bản

```
✅ Luôn xử lý lỗi ở cấp độ thích hợp          ❌ Đừng nuốt lỗi
try { await fetchAPI(); }                     try { await fetchAPI(); }
  catch (e) {                                  catch (e) {
    logError(e);                                   // swallow - im lặng!
    throw reformat(e);                           }
  }                                            next(); // tiếp tục như không có gì
```

---

## 📐 Custom Error Classes

```typescript
// ✅ Tạo hierarchy riêng — mỗi lỗi là 1 class
class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(
      `${resource} not found: ${id}`,
      'NOT_FOUND',
      404,
      { resource, id }
    );
    this.name = 'NotFoundError';
  }
}

class ValidationError extends AppError {
  constructor(public fieldErrors: Record<string, string[]>) {
    super('Validation failed', 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

class ExternalServiceError extends AppError {
  constructor(
    public service: string,
    public originalError: unknown
  ) {
    super(`Service ${service} failed`, 'EXTERNAL_ERROR', 503, { service });
    this.name = 'ExternalServiceError';
  }
}
```

---

## 🔧 Try-Catch best practices

```typescript
// ✅ Catch cụ thể — không bắt chung chung
async function getUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError('User', id);
      }
      throw new ExternalServiceError('users-api', response.statusText);
    }
    return response.json();
  }
  catch (error) {
    // Chỉ bắt những lỗi chúng ta biết cách xử lý
    if (error instanceof NotFoundError || error instanceof AppError) {
      logger.warn(error.message);
      throw error; // propagate
    }
    // Lỗi không mong đợi → wrap và throw
    throw new AppError('Unexpected error fetching user', 'UNKNOWN_ERROR', 500);
  }
}

// ❌ Nạp lỗi — mất thông tin quan trọng
try {
  // ...
} catch (e: any) {
  throw new Error('Failed'); // mất stack trace, error type
}
```

---

## ⚡ Error propagation patterns

```
┌─────────────────────────────────────────────────────────────┐
│                      CALL STACK                             │
│                                                             │
│   Controller ──▶ Service ──▶ Repository ──▶ Database        │
│      │           │             │              │              │
│      ▼           ▼             ▼              ▼              │
│   catch &      catch &      catch &      connection error   │
│   return 4xx   wrap +       translate to  → NotFoundError   │
│               re-throw      AppError      (specific)        │
│                                                             │
│   Rule: catch at the layer that knows HOW to handle         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 TypeScript patterns

### Result type (functional style)

```typescript
type Result<T, E = AppError> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

function parseConfig(raw: string): Result<Config> {
  try {
    const config = JSON.parse(raw) as Config;
    return { ok: true, value: config };
  } catch (e) {
    return { ok: false, error: new ValidationError(['Invalid JSON']) };
  }
}

// Usage — bắt buộc xử lý cả 2 case
const result = parseConfig(input);
if (result.ok) {
  useConfig(result.value);
} else {
  reportError(result.error);
}
```

### Discriminated union for error types

```typescript
type ApiError =
  | { type: 'not_found'; resource: string; id: string }
  | { type: 'validation'; fields: string[] }
  | { type: 'conflict'; message: string }
  | { type: 'unknown'; message: string };

function mapToHTTP(status: ApiError): Response {
  switch (status.type) {
    case 'not_found': return new Response('Not found', { status: 404 });
    case 'validation': return new Response('Bad input', { status: 422 });
    case 'conflict':   return new Response('Conflict',  { status: 409 });
    case 'unknown':    return new Response('Server error', { status: 500 });
  }
}
```

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế |
|----------|-------------|
| `catch (e) {}` —吞 lỗi | Log + re-throw hoặc return default |
| `catch (e: any)` rồi `throw new Error()` | Giữ nguyên error type, chỉ add context |
| Dùng error code string thay class | Define custom Error subclasses |
| Throw lỗi trong constructor | Dùng factory function hoặc init() |
| Nested try-catch quá sâu (>2 lớp) | Gom logic thành hàm nhỏ hơn |
| Return null thay vì throw | Return `null | T` hoặc Result type |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Defne custom error classes cho từng loại lỗi | Catch `any` rồi swallow |
| Catch ở layer biết cách xử lý | Throw string thay vì object |
| Dùng Result type cho expected failures | Nested try-catch > 2 lớp |
| Giữ stack trace khi wrap lỗi | Dùng error code string |

---

## 📚 Tài liệu

- 📖 [Error Handling in TypeScript — Microsoft Docs](https://www.typescriptlang.org/docs/handbook/errors.html)
- 📖 [Functional Error Handling — Option/Result](https://medium.com/@davidmferguson/result-type-in-typescript-a77a58c3b2e3)

---

## ⏭️ Bài tiếp theo

→ [14.4 Code Structure](../14.4-code-structure/README.md)
