# 🛡️ 14.3 Error Handling

> Error handling không phải là bắt `try-catch` ở khắp nơi — nó là **thiết kế cách hệ thống phản hồi khi điều gì đó sai**.

---

## 🎯 Nguyên tắc cơ bản

Xử lý lỗi là **part của thiết kế hệ thống**, không phải "sửa sau khi có bug". 3 nguyên tắc then chốt:

1. **Catch at the right level** — catch ở layer biết cách xử lý, không phải layer gần nhất gặp lỗi.
2. **Don't swallow errors** — mỗi catch phải log, rethrow, hoặc recover rõ ràng.
3. **Preserve context** — khi wrap error, giữ nguyên stack trace và thêm context mới.

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

Sử dụng custom error classes thay vì `throw new Error("some string")` cho 3 lý do:
- **Pattern matching:** `instanceof` check cho biết chính xác loại lỗi
- **Typed properties:** `error.code`, `error.statusCode`, `error.fieldErrors`
- **Debuggable stack:** giữ nguyên chain nguyên gốc

```typescript
// ✅ Tạo hierarchy riêng — mỗi lỗi là 1 class có properties riêng
class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);  // giữ stack sạch
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

class BusinessRuleError extends AppError {
  constructor(public rule: string, public reason: string) {
    super(`Business rule violated: ${rule} — ${reason}`, 'BUSINESS_RULE', 400);
    this.name = 'BusinessRuleError';
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
    return response.json() as User;
  }
  catch (error) {
    // Chỉ bắt những lỗi chúng ta biết cách xử lý
    if (error instanceof NotFoundError || error instanceof AppError) {
      logger.warn(error.message);
      throw error; // propagate — tầng trên knows how to handle
    }
    // Lỗi không mong đợi → wrap và throw
    throw new AppError(
      `Unexpected error fetching user: ${(error as Error).message}`,
      'UNKNOWN_ERROR',
      500,
      { originalStack: (error as Error).stack }
    );
  }
}

// ❌ Nạp lỗi — mất thông tin quan trọng
try {
  // ...
} catch (e: any) {
  throw new Error('Failed'); // mất stack trace, error type
}
```

**Nguyên tắc wrap error:**

| Thao tác | Đúng | Sai |
|----------|------|-----|
| Giữ stack trace | `Error.captureStackTrace(this, this.constructor)` hoặc spread `...e` | `throw new Error('msg')` mất nguyên gốc |
| Thêm context | `{ originalError: e, context: { userId: id } }` | `throw new Error('User not found')` (mất id) |
| Rethrow | `throw error` (giữ nguyên object) | `throw new Error(error.message)` (mất type) |

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

**Layer responsibility:**
- **Repository:** translate DB error → domain error (e.g., `query timeout` → `RepositoryError`)
- **Service:** translate domain error → application error (e.g., `RepositoryError` → `NotFoundError` or `BusinessRuleError`)
- **Controller:** translate application error → HTTP response (e.g., `NotFoundError` → 404 JSON)

> 💡 **Mẹo:** Service layer nên **không bao giờ** trả về HTTP status code — để Controller quyết định. Điều này giữ service testable độc lập.

---

## 🎯 TypeScript patterns

### Result type (functional style)

Result type phù hợp khi failure là **expected** — caller phải xử lý cả success và failure path một cách explicit.

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

// Usage — bắt buộc xử lý cả 2 case (compiler giúp enforce)
const result = parseConfig(input);
if (result.ok) {
  useConfig(result.value);
} else {
  reportError(result.error);  // phải handle, không bỏ qua được
}
```

**Result vs Throw — khi nào dùng cái nào?**

| Tình huống | Dùng | Lý do |
|-----------|------|-------|
| Error hiếm, unexpected | Throw | Clearer control flow, không verbose |
| Error thường xuyên, expected | Result | Caller bắt buộc handle, không drop |
| Performance-critical path | Throw | Result có overhead (object allocation) |
| Functional style codebase | Result | Consistent với pattern |

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

| ❌ Tránh | ✅ Thay thế | Giải thích |
|----------|-------------|-----------|
| `catch (e) {}` — nuốt lỗi | Log + re-throw hoặc return default | Im lặng error = mất visibility |
| `catch (e: any)` rồi `throw new Error()` | Giữ nguyên error type, chỉ add context | Mất stack, type info |
| Dùng error code string thay class | Define custom Error subclasses | Không type-safe, không instanceof |
| Throw lỗi trong constructor | Dùng factory function hoặc init() | Constructor không async, init có thể throw controlled |
| Nested try-catch quá sâu (>2 lớp) | Gom logic thành hàm nhỏ hơn | Khó trace, khó maintain |
| Return null thay vì throw | Return `null \| T` hoặc Result type | Null là silent failure |

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Try-catch làm chậm code" | Only when exception is thrown. Normal path has zero overhead in V8/Node.js |
| "Result type = over-engineering" | Kết quả là prevent silent failure — đáng giá khi error path quan trọng |
| "Global error handler đủ" | Global handler là safety net, không thay thế xử lý có context tại từng layer |
| "Throw everywhere = safe" | Throw không kiểm soát gây unhandled rejection — cần boundary rõ |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Define custom error classes cho từng loại lỗi | Catch `any` rồi swallow |
| Catch ở layer biết cách xử lý | Throw string thay vì object |
| Dùng Result type cho expected failures | Nested try-catch > 2 lớp |
| Giữ stack trace khi wrap lỗi | Dùng error code string |

---

## 📚 Tài liệu

- 📖 [Error Handling in TypeScript — Microsoft Docs](https://www.typescriptlang.org/docs/handbook/errors.html)
- 📖 [Functional Error Handling — Option/Result](https://medium.com/@davidmferguson/result-type-in-typescript-a77a58c3b2e3)
- 📖 [Clean Code: Error Handling — Robert C. Martin, Chapter 9]

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 14-clean-code/14.3-error-handling
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [14.4 Code Structure](../14.4-code-structure/README.md)
