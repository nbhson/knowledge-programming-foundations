# 🧪 7.7 Mocking, Stubbing & Faking (Giả Lập Dependencies)

> **Mocking, Stubbing, Spying, Faking** là các kỹ thuật thay thế dependencies thật bằng versions giả lập — giúp test chạy nhanh, cô lập, và xác định được.

---

## 🎯 Tại Sao Cần Mocking?

Khi test một module, ta thường muốn **cô lập** nó khỏi các dependencies bên ngoài:

```
ModuleUnderTest cần:
├── Database thật  → ❌ Chậm, không deterministic
├── Email service  → ❌ Gửi mail thật cho test user?
├── Payment API    → ❌ Tính tiền thật khi test?
└── File system    → ❌ Ghi file thật vào ổ đĩa

→ Giải pháp: dùng Fake/Stub/Mock thay thế!
```

### Deep dive: Những gì xảy ra nếu KHÔNG mock?

| Scenario | Vấn đề nếu không mock |
|----------|----------------------|
| Test gọi `db.query()` | Test phụ thuộc DB availability, schema, data |
| Test gọi `email.send()` | Gửi email thật cho mỗi test run — spam test users |
| Test gọi `payment.process()` | Tính tiền thật, cần API keys, sandbox config |
| Test gọi `fs.writeFileSync()` | Ghi file thật, có thể overwrite production data |
| Test gọi `Date.now()` | Kết quả thay đổi theo thời gian → flaky test |

> 💡 **Nguyên tắc vàng:** Mock **external boundaries** (things outside your control), không mock **internal logic** (your own code).

---

## 📐 So Sánh Mock / Stub / Spy / Fake

```
┌────────────┬──────────────────────────┬─────────────────────────┐
│  Kỹ thuật  │      Mục đích            │       Khi nào dùng      │
├────────────┼──────────────────────────┼─────────────────────────┤
│  STUB      │ Trả về giá trị cố định   │ Cần data giả, không     │
│            │                          │ cần verify tương tác    │
├────────────┼──────────────────────────┼─────────────────────────┤
│  MOCK      │ Giả lập + verify         │ Cần kiểm tra method      │
│            │ tương tác (call count,   │ được gọi đúng args/không│
│            │ args, số lần gọi)               │ bị gọi                  │
├────────────┼──────────────────────────┼─────────────────────────┤
│  SPY       │ Wrap object thật         │ Giữ behavior thật,      │
│            │ + ghi lại calls          │ chỉ theo dõi call count │
├────────────┼──────────────────────────┼─────────────────────────┤
│  FAKE      │ Implementation đơn giản  │ Replace hoàn toàn,      │
│            │ thay thế class thật      │ có logic thật nhưng     │
│            │                          │ nhẹ hơn (in-memory)     │
└────────────┴──────────────────────────┴─────────────────────────┘
```

### ASCII Mind Map

```
                     Dependencies
                          │
         ┌────────────────┼────────────────┐
         │                │                │
      STUB            MOCK            SPY
    (data giả)     (verify call)    (wrap + log)
         │                │                │
         ▼                ▼                ▼
   return fixed     assert_called_with  still calls
   values           check_args           real impl
                          │
                          ▼
                       FAKE
               (simplified impl)
               e.g. InMemoryDb
```

---

## 💻 Jest/Vitest Examples

### 1. STUB — Trả về giá trị cố định

```typescript
// userService.ts
interface UserRepo {
  findById(id: number): { id: number; name: string; email: string } | null;
}

class UserService {
  constructor(private userRepo: UserRepo) {}

  getUserName(id: number): string {
    const user = this.userRepo.findById(id);
    return user?.name ?? "Unknown";
  }
}

// ─── TEST ────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "./userService";

describe("UserService", () => {
  let userRepo: UserRepo;
  let userService: UserService;

  beforeEach(() => {
    // STUB: findById luôn trả về user cố định
    userRepo = {
      findById: vi.fn().mockReturnValue({
        id: 1,
        name: "John Doe",
        email: "john@test.com",
      }),
    };
    userService = new UserService(userRepo);
  });

  it("stub - trả về tên user khi tìm thấy", () => {
    const name = userService.getUserName(1);
    expect(name).toBe("John Doe");
  });

  it("stub - trả về 'Unknown' khi không tìm thấy", () => {
    vi.mocked(userRepo.findById).mockReturnValue(null);
    expect(userService.getUserName(999)).toBe("Unknown");
  });
});
```

**Khi nào dùng Stub:**
- Bạn cần **data đầu vào cố định** cho function under test
- Không quan tâm **method có được gọi** hay không
- Chỉ muốn verify output dựa trên input

---

### 2. MOCK — Verify tương tác

```typescript
// notificationService.ts
interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

class OrderService {
  constructor(private emailService: EmailService) {}

  async placeOrder(userId: number): Promise<void> {
    // ... validation logic ...
    await this.emailService.send(
      "user@test.com",
      "Order Confirmed",
      "Your order has been placed!"
    );
  }
}

// ─── TEST ────────────────────────────────────────────────────
describe("OrderService", () => {
  it("mock - verify email được gọi đúng 1 lần với đúng args", async () => {
    const emailService = {
      send: vi.fn().mockResolvedValue(undefined),
    };
    const service = new OrderService(emailService);

    await service.placeOrder(1);

    // MOCK: verify interaction
    expect(emailService.send).toHaveBeenCalledTimes(1);
    expect(emailService.send).toHaveBeenCalledWith(
      "user@test.com",
      "Order Confirmed",
      "Your order has been placed!"
    );
  });

  it("mock - không gọi email khi order thất bại", async () => {
    const emailService = { send: vi.fn() };
    const service = new OrderService(emailService);

    // Giả sử placeOrder throw error
    vi.spyOn(service, "placeOrder").mockRejectedValue(
      new Error("Insufficient stock")
    );

    await expect(service.placeOrder(1)).rejects.toThrow();
    expect(emailService.send).not.toHaveBeenCalled();
  });
});
```

**Khi nào dùng Mock:**
- Bạn cần **verify method được gọi** với đúng arguments
- Bạn cần **verify call count** (bao nhiêu lần, lần nào)
- Bạn cần **verify order** (gọi trước/sau method khác)

---

### 3. SPY — Wrap và ghi lại calls

```typescript
// calculator.ts
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
  multiply(a: number, b: number): number {
    return a * b;
  }
}

// ─── TEST ────────────────────────────────────────────────────
describe("Calculator spy", () => {
  it("spy - gọi multiply đúng 2 lần", () => {
    const calc = new Calculator();
    const spy = vi.spyOn(calc, "multiply");

    calc.multiply(2, 3);
    calc.multiply(4, 5);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, 2, 3);
    expect(spy).toHaveBeenNthCalledWith(2, 4, 5);

    spy.mockRestore(); // always restore!
  });

  it("spy - gọi add và giữ nguyên behavior", () => {
    const calc = new Calculator();
    const spy = vi.spyOn(calc, "add").mockReturnValue(999); // override result

    const result = calc.add(1, 2);

    expect(result).toBe(999); // mock value
    expect(spy).toHaveBeenCalledWith(1, 2); // original args
    spy.mockRestore();
  });
});
```

**Khi nào dùng Spy:**
- Bạn muốn **giữ nguyên behavior thật** nhưng cũng muốn **theo dõi calls**
- Bạn muốn **override kết quả** của method thật tạm thời
- Bạn test **deprecated method** vẫn được gọi (migration tracking)

> ⚠️ **Luôn `mockRestore()`** trong `afterEach` để tránh spy ảnh hưởng test khác.

---

### 4. FAKE — Implementation đơn giản thay thế

```typescript
// realDb.ts — production code
interface UserRepository {
  findById(id: number): Promise<{ id: number; name: string } | null>;
  save(user: { id: number; name: string }): Promise<void>;
  findAll(): Promise<{ id: number; name: string }[]>;
}

// fakeDb.ts — test double
class FakeUserRepository implements UserRepository {
  private users: Map<number, { id: number; name: string }> = new Map([
    [1, { id: 1, name: "Alice" }],
    [2, { id: 2, name: "Bob" }],
  ]);
  private nextId = 3;

  async findById(id: number) {
    return this.users.get(id) ?? null;
  }

  async save(user: { id: number; name: string }) {
    this.users.set(user.id, user);
  }

  async findAll() {
    return Array.from(this.users.values());
  }
}

// ─── TEST ────────────────────────────────────────────────────
describe("UserService with Fake", () => {
  it("fake - lưu và đọc từ in-memory DB", async () => {
    const fakeRepo = new FakeUserRepository();
    const service = new UserService(fakeRepo);

    await service.createUser({ name: "Charlie" });
    const all = await service.findAllUsers();

    expect(all).toHaveLength(3);
    expect(all.find((u) => u.name === "Charlie")).toBeDefined();
  });
});
```

**Khi nào dùng Fake:**
- Bạn cần **behavior thật** (không phải hardcode return value)
- Dependency quá phức tạp để mock toàn bộ (database, file system)
- Bạn muốn test **nhiều operations** trên cùng data (CRUD đầy đủ)
- Integration test giữa service và repository

> 💡 **Fake vs Stub:** Fake là **working implementation** (có logic thật), Stub là **hardcoded return value** (không có logic). Fake gần với production code hơn, dùng cho integration tests.

---

## 🎯 Khi Nào Dùng Gì?

```
Bạn cần test gì?                    → Dùng gì?
────────────────────────────────────────────────────
Chỉ cần data giả                   → STUB
Kiểm tra method có gọi đúng        → MOCK
Giữ behavior thật, đếm calls       → SPY
Thay thế toàn bộ dependency        → FAKE
  (DB, cache, file system)
```

| Tình huống | Chọn | Ví dụ |
|------------|------|-------|
| Test tính toán pure function | Không cần mock | `add(1,2)` |
| Service gọi repo | Stub repo | `repo.findById().mockReturnValue(user)` |
| Service gửi email | Mock email service | `email.send.assert_called_once_with(...)` |
| Kiểm tra third-party SDK | Spy SDK | `spyOn(client, 'fetch')` |
| Test repository pattern | Fake in-memory | `FakePostgresRepository` |
| Test với Redis | Fake Redis | `ioredis-mock` hoặc `fakeredis` |
| Test với HTTP API | Mock fetch | `vi.stubGlobal('fetch', mockFetch)` |

---

## ⚠️ Anti-Patterns

| Anti-Pattern | Vấn đề | Cách sửa |
|--------------|--------|----------|
| **Over-mocking** | Mock mọi thứ → test không có giá trị | Chỉ mock boundary (external deps) |
| **Test implementation** | Verify mock calls chi tiết quá | Chỉ verify behavior quan trọng |
| **Không restore spy** | Spy tồn tại qua nhiều test | Luôn `mockRestore()` trong `afterEach` |
| **Fake quá phức tạp** | Fake gần bằng production code | Giữ fake đơn giản, chỉ đủ cho test |
| **Mock internal methods** | Test implementation chi tiết | Test public interface, không private |
| **False positive mocks** | Mock trả về đúng value nhưng không gọi method thật | Dùng `mockRejectedValue` khi expect throw |

```typescript
// ❌ BAD: mocking everything including pure logic
vi.spyOn(Math, 'random').mockReturnValue(0.5); // không cần thiết

// ✅ GOOD: only mock external boundaries
vi.spyOn(emailService, 'send'); // external dependency
```

---

## 🔧 Cheat Sheet: Vitest Mocking API

| Need | Code |
|------|------|
| Create mock function | `vi.fn()` |
| Mock return value | `vi.fn().mockReturnValue(value)` |
| Mock resolved promise | `vi.fn().mockResolvedValue(value)` |
| Mock rejected promise | `vi.fn().mockRejectedValue(error)` |
| Mock implementation | `vi.fn().mockImplementation(fn)` |
| Spy on method | `vi.spyOn(obj, 'method')` |
| Restore spy | `spy.mockRestore()` |
| Clear all mocks | `vi.clearAllMocks()` |
| Reset all mocks | `vi.resetAllMocks()` |
| Restore all mocks | `vi.restoreAllMocks()` |
| Mock module | `vi.mock('./module', () => ({ ... }))` |

> 📌 **Clear vs Reset vs Restore:**
> - `clearAllMocks()` — reset call history (calls = 0), giữ mock implementation
> - `resetAllMocks()` — reset call history + mock implementation về `vi.fn()`
> - `restoreAllMocks()` — restore original implementation (_undo mock_)

---

## ▶️ Chạy ví dụ

Chạy demo Stub/Mock/Spy/Fake viết tay (không cần vi.fn/vi.spyOn):

```bash
cd 07-testing/7.7-mocking-stubbing
npx tsx examples/index.ts
```

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|----------|
| Jest Mock Functions | https://jestjs.io/docs/mock-function-api |
| Vitest Mocking | https://vitest.dev/api/vi.html#vi-mock |
| xUnit Test Patterns (Meszaros) | Sách gốc về test doubles |
| Mocking vs Stubbing | https://www.machtype.com/blog/mock-vs-stub |

---

## 🎉 Kết Luận

Bạn đã hoàn thành **Lớp 7: Testing**!

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING ROADMAP                           │
│                                                             │
│  7.1 Unit Test     → Cô lập từng function/class            │
│  7.2 Integration   → Kiểm tra nhiều component cùng nhau    │
│  7.3 E2E Test      → Test user flow từ UI đến DB           │
│  7.4 TDD           → Viết test TRƯỚC code (Red-Green-Ref)  │
│  7.5 BDD           → Test bằng ngôn ngữ business (Gherkin) │
│  7.6 Perf Test     → Đo load, stress, latency              │
│  7.7 Mock/Stub     → Kỹ thuật test double cho unit test    │
│                                                             │
│  ✅ Bạn đã nắm toàn bộ khái niệm testing cơ bản!            │
└─────────────────────────────────────────────────────────────┘
```

**Tổng kết:**

| Số | Chủ đề | Công cụ chính |
|----|--------|---------------|
| 7.1 | Unit Testing | Vitest, Jest |
| 7.2 | Integration Testing | Testcontainers, Supertest |
| 7.3 | E2E Testing | Playwright, Cypress |
| 7.4 | TDD | Red-Green-Refactor cycle |
| 7.5 | BDD | Cucumber, Gherkin |
| 7.6 | Performance Testing | k6, Artillery |
| 7.7 | Mocking/Stubbing | vi.fn(), vi.spyOn() |

> **"Any fool can write code that a computer can understand. Good programmers write code that humans can understand."** — Martin Fowler
>
> **"Testing leads to failure, and failure leads to understanding."** — Burt Bell

Chúc mừng bạn đã hoàn thành Lớp 7! 🎊
