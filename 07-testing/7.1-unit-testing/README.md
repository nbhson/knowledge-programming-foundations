# 🧪 7.1 Unit Testing (Kiểm Thử Đơn Vị)

> **Unit Test** là kiểm thử từng đơn vị nhỏ nhất của code (function, method, class) **độc lập**, **nhanh**, và **xác định** được kết quả.

---

## 🎯 Unit Testing Là Gì?

Unit test kiểm tra **từng phần tử riêng lẻ** của hệ thống — thường là một function hoặc method — mà không phụ thuộc vào các thành phần khác.

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                          │
│                                                             │
│                       ╱ E2E ╲          ← 10%               │
│                     ╱──────────╲                              │
│                    ╱ Integration╲     ← 20%                 │
│                   ╱──── Tests ────╲                           │
│                  ╱                  ╲                        │
│                 ╱   Unit Tests       ╲   ← 70%               │
│                ╱────────────────────────╲                    │
│                                                             │
│  Unit test: nhanh (ms), rẻ, cô lập, viết nhiều nhất         │
└─────────────────────────────────────────────────────────────┘
```

### Đặc trưng của Unit Test tốt

| Đặc tính | Giải thích | Ví dụ |
|----------|------------|-------|
| **Fast** | Chạy trong vài ms, không chậm hơn 10ms/test | 1000 tests chạy < 10 giây |
| **Isolated** | Không phụ thuộc test khác, không có side effects | Mỗi test tự setup/teardown |
| **Deterministic** | Cùng input → cùng output, không random | Không dùng Date.now(), Math.random() |
| **Self-checking** | Tự động pass/fail, không cần người đọc log | `expect(result).toBe(expected)` |
| **Focused** | Mỗi test kiểm tra MỘT behavior duy nhất | Không test 5 thứ trong 1 test |

> 💡 **Misconception:** "Unit test phải test function đơn giản nhất." — Không đúng. Unit test có thể test cả class phức tạp, miễn là **all dependencies are mocked/stubbed**. Giới hạn của unit test là **sự cô lập**, không phải độ phức tạp.

---

## 📐 AAA Pattern (Arrange - Act - Assert)

Đây là cấu trúc chuẩn cho mọi unit test:

```
┌─────────────────────────────────────────────────────────────┐
│  ARRANGE (Sắp xếp)  → Tạo đối tượng, thiết lập dữ liệu đầu vào    │
│       ↓                                                       │
│  ACT (Hành động)    → Gọi method/function cần test              │
│       ↓                                                       │
│  ASSERT (Kiểm tra)  → Xác nhận kết quả mong đợi                 │
└─────────────────────────────────────────────────────────────┘
```

**Tỷ lệ thời gian lý tưởng:** Arrange 60% : Act 10% : Assert 30%. Nếu Arrange quá dài (> 80%), test có thể đang test quá nhiều thứ hoặc có design smell.

---

## 💻 Ví Dụ TypeScript + Jest/Vitest

### ✅ Test đơn giản với mathUtils

```typescript
// ─── mathUtils.ts ──────────────────────────────────────────────
export function add(a: number, b: number): number {
  return a + b;
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

export function calculateDiscount(price: number, discount: number): number {
  if (discount < 0 || discount > 100) {
    throw new Error("Discount must be between 0 and 100");
  }
  return price * (1 - discount / 100);
}

// ─── mathUtils.test.ts ─────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { add, divide, calculateDiscount } from "./mathUtils";

describe("add()", () => {
  it("cộng hai số dương", () => {
    // Arrange
    const a = 5, b = 3;
    // Act
    const result = add(a, b);
    // Assert
    expect(result).toBe(8);
  });

  it("cộng với số âm", () => {
    expect(add(-1, 1)).toBe(0);
  });

  it("cộng hai số âm", () => {
    expect(add(-3, -4)).toBe(-7);
  });
});

describe("divide()", () => {
  it("chia hai số thông thường", () => {
    expect(divide(10, 2)).toBe(5);
  });

  it("chia cho 0 phải throw error", () => {
    expect(() => divide(10, 0)).toThrow("Division by zero");
  });
});

describe("calculateDiscount()", () => {
  it("giảm giá 10% từ giá 100", () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });

  it("giảm giá 0% giữ nguyên giá", () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  it("giảm giá 100% về 0", () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it("discount âm phải throw error", () => {
    expect(() => calculateDiscount(100, -10)).toThrow();
  });

  it("discount > 100 phải throw error", () => {
    expect(() => calculateDiscount(100, 150)).toThrow();
  });
});
```

### ✅ Test class phức tạp hơn — UserService

```typescript
// ─── userValidator.ts ──────────────────────────────────────────
export class UserValidator {
  static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static validatePassword(password: string): boolean {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  }

  static validate(username: string, email: string, password: string): string[] {
    const errors: string[] = [];
    if (username.length < 3) errors.push("Username must be at least 3 characters");
    if (!this.validateEmail(email)) errors.push("Invalid email format");
    if (!this.validatePassword(password)) errors.push("Password must be 8+ chars with uppercase and digit");
    return errors;
  }
}

// ─── userValidator.test.ts ─────────────────────────────────────
import { describe, it, expect } from "vitest";
import { UserValidator } from "./userValidator";

describe("UserValidator", () => {
  describe("validateEmail()", () => {
    it("email hợp lệ", () => {
      expect(UserValidator.validateEmail("user@example.com")).toBe(true);
    });

    it("thiếu @ sign", () => {
      expect(UserValidator.validateEmail("userexample.com")).toBe(false);
    });

    it("thiếu domain", () => {
      expect(UserValidator.validateEmail("user@")).toBe(false);
    });

    it("empty string", () => {
      expect(UserValidator.validateEmail("")).toBe(false);
    });
  });

  describe("validatePassword()", () => {
    it("password đủ điều kiện", () => {
      expect(UserValidator.validatePassword("Abc12345")).toBe(true);
    });

    it("quá ngắn", () => {
      expect(UserValidator.validatePassword("Ab1")).toBe(false);
    });

    it("thiếu uppercase", () => {
      expect(UserValidator.validatePassword("abc12345")).toBe(false);
    });

    it("thiếu digit", () => {
      expect(UserValidator.validatePassword("Abcdefgh")).toBe(false);
    });
  });

  describe("validate() — full validation", () => {
    it("valid inputs → no errors", () => {
      const errors = UserValidator.validate("john", "john@test.com", "Pass1234");
      expect(errors).toEqual([]);
    });

    it("invalid username → specific error", () => {
      const errors = UserValidator.validate("jo", "john@test.com", "Pass1234");
      expect(errors).toContain("Username must be at least 3 characters");
    });

    it("multiple errors returned together", () => {
      const errors = UserValidator.validate("jo", "invalid", "short");
      expect(errors).toHaveLength(3);
    });
  });
});
```

---

## 🔧 Mocking vs Stubbing vs Spying

| Kỹ thuật | Mục đích | Ví dụ | Giải thích sâu |
|----------|----------|-------|----------------|
| **Mock** | Giả lập object, verify tương tác | Kiểm tra service có gọi đúng method không | Mock **chứng minh** tương tác: số lần gọi, arguments, thứ tự |
| **Stub** | Trả về giá trị cố định | Cần data giả để test logic | Stub **cung cấp** data, không quan tâm call count |
| **Spy** | Wrap object thật + ghi lại calls | Giữ behavior thật, chỉ theo dõi | Spy **gần như thật** — chỉ thêm khả năng quan sát |
| **Fake** | Implementation đơn giản thay real | In-memory DB thay database thật | Fake **thay thế hoàn toàn** dependency bằng version nhẹ |

### Ví dụ chi tiết

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Service cần test ──────────────────────────────────────────
interface UserRepository {
  findById(id: number): { id: number; name: string; email: string } | null;
}

interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

class OrderService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService,
  ) {}

  async placeOrder(userId: number, productId: string): Promise<{ ok: boolean; message: string }> {
    const user = this.userRepo.findById(userId);
    if (!user) return { ok: false, message: "User not found" };

    await this.emailService.send(user.email, "Order Confirmed", `Hi ${user.name}, your order is placed!`);
    return { ok: true, message: `Order placed for ${user.name}` };
  }
}

// ─── TESTS ─────────────────────────────────────────────────────
describe("OrderService", () => {
  let userRepo: UserRepository;
  let emailService: EmailService;
  let orderService: OrderService;

  beforeEach(() => {
    userRepo = { findById: vi.fn() };
    emailService = { send: vi.fn().mockResolvedValue(undefined) };
    orderService = new OrderService(userRepo, emailService);
  });

  // Stub: trả về giá trị cố định
  it("stub - đặt hàng thành công", async () => {
    vi.mocked(userRepo.findById).mockReturnValue({ id: 1, name: "John", email: "john@test.com" });

    const result = await orderService.placeOrder(1, "p1");

    expect(result.ok).toBe(true);
    expect(result.message).toContain("John");
  });

  // Mock: verify tương tác với emailService
  it("mock - verify email được gửi đúng", async () => {
    vi.mocked(userRepo.findById).mockReturnValue({ id: 1, name: "John", email: "john@test.com" });

    await orderService.placeOrder(1, "p1");

    expect(emailService.send).toHaveBeenCalledTimes(1);
    expect(emailService.send).toHaveBeenCalledWith(
      "john@test.com",
      "Order Confirmed",
      expect.stringContaining("John"),
    );
  });

  // Spy: wrap function thật và theo dõi calls
  it("spy - theo dõi kết quả", async () => {
    const spy = vi.spyOn(orderService, "placeOrder");
    vi.mocked(userRepo.findById).mockReturnValue({ id: 1, name: "John", email: "john@test.com" });

    const result = await orderService.placeOrder(1, "p1");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(1, "p1");
    spy.mockRestore();
  });
});
```

### So sánh Mock / Stub / Spy / Fake

```
┌─────────────┬───────────────────────┬──────────────────────────┐
│ Kỹ thuật    │ Dùng khi nào           │ Ví dụ                    │
├─────────────┼───────────────────────┼──────────────────────────┤
│ STUB        │ Cần data giả cố định   │ mockReturnValue({id:1})  │
│ MOCK        │ Cần verify tương tác   │ assert_called_once_with()│
│ SPY         │ Muốn gọi thật + đếm   │ spyOn(obj, 'method')     │
│ FAKE        │ Replace toàn bộ impl   │ InMemoryDb thay Postgres │
└─────────────┴───────────────────────┴──────────────────────────┘
```

> 💡 **Quy tắc vàng:** Chỉ mock/stub những **external boundaries** (DB, API, file system, email service). Đừng mock pure functions hoặc logic nội bộ — test chúng trực tiếp.

---

## ✍️ Viết Unit Test Tốt

### Naming Convention

```
✅ test_<method>_<scenario>_<expectedResult>()
❌ test_1() / test_func() / testSomething()

Ví dụ:
✅ test_calculateDiscount_withValidPercent_returnsDiscountedPrice()
✅ test_divideByZero_throwsError()
✅ test_placeOrder_withInvalidUser_returnsFailure()
```

**Tại sao tên dài?** Vì tên test là **documentation** đầu tiên dev đọc khi test fail. "test_divideByZero_throwsError" nói ngay điều gì sai — không cần đào sâu vào code test.

### Nguyên Tắc F.I.R.S.T

| Chữ | Nguyên tắc | Giải thích |
|-----|-----------|------------|
| **F** | Fast | Test chạy trong vài ms. Nếu test chậm > 1s, có thể đang test quá nhiều hoặc access DB/network |
| **I** | Independent | Mỗi test độc lập, không phụ thuộc test khác. Test A fail không làm Test B fail |
| **R** | Repeatable | Chạy lại luôn cho ra cùng kết quả, mọi môi trường. Không phụ thuộc timezone, random, network |
| **S** | Self-validating | Tự động pass/fail, không cần người đọc log. Output rõ ràng: "Expected X but got Y" |
| **T** | Timely | Viết test kịp thời (trước hoặc cùng lúc với code — TDD). Test sau code thường thiếu coverage |

---

## ⚠️ Anti-Patterns Trong Unit Testing

| Anti-Pattern | Vấn đề | Cách khắc phục |
|--------------|--------|----------------|
| **Testing implementation** | Test chi tiết internal thay vì behavior | Test input/output, không private methods |
| **Fragile tests** | Break khi refactoring nội bộ | Chỉ test public interface |
| **God test** | 1 test quá lớn, check quá nhiều thứ | Tách thành nhiều test nhỏ, focused |
| **Flaky tests** | Lúc pass lúc fail ngẫu nhiên | Loại bỏ dependency time, network, random |
| **Hardcoded values** | Data test hardcode cứng nhắc | Dùng factory, fixture, parameterized |
| **No assertions** | Test không assert → luôn pass | Mỗi test phải có ít nhất 1 assert |
| **Complex setup** | Setup rườm rà, khó đọc | Dùng beforeEach, factory functions |
| **Assertion rot** | Tăng dần số assertions trong 1 test | Tách thành nhiều test nhỏ |

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ BAD: Test phụ thuộc thời gian                             │
│ it("gửi email sau 5 giây", () => {                          │
│   setTimeout(() => { ... }, 5000);                          │
│ });                                                          │
│                                                              │
│ ✅ GOOD: Mock time, kiểm tra deterministic                   │
│ it("gửi email với correct payload", () => {                  │
│   service.sendEmail("a@b.com", "Hi");                        │
│   expect(mockMail.send).toHaveBeenCalledWith("a@b.com");     │
│ });                                                          │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Parameterized tests** (viết 1 test, chạy nhiều data sets):
> ```typescript
> it.each([
>   [100, 10, 90],
>   [100, 0, 100],
>   [100, 100, 0],
>   [200, 25, 150],
> ])("discount %d%% of %d = %d", (price, discount, expected) => {
>   expect(calculateDiscount(price, discount)).toBe(expected);
> });
> ```

---

## ▶️ Chạy ví dụ

Chạy demo mini test runner tự viết (không cần cài vitest/jest):

```bash
cd 07-testing/7.1-unit-testing
npx ts-node examples/index.ts
```

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Tác giả |
|----------|---------|
| *The Art of Unit Testing* | Roy Osherove |
| *xUnit Test Patterns* | Gerard Meszaros |
| *Working Effectively with Legacy Code* | Michael Feathers |
| [Vitest Docs](https://vitest.dev/) | Vitest Team |
| [Jest Docs](https://jestjs.io/) | Meta |

---

## 🧪 Vitest — Chuẩn testing 2025-2026

Vitest đã vượt Jest về DX (được Vite, Remix, Nuxt, Solid, Astro — và từ cuối 2025 là Angular — dùng mặc định):

```bash
npm i -D vitest        # cài đặt
npx vitest             # chạy test watch mode
npx vitest run         # chạy 1 lần (CI)
npx vitest --coverage  # coverage
```

Ưu điểm so với Jest:
- Native ESM + TypeScript (không cần babel/ts-jest config)
- Tốc độ nhanh hơn đáng kể (Vite-based, HMR watch mode) — benchmark 2025-2026 cho thấy cold start nhanh hơn nhiều lần
- API tương thích Jest (vi.fn, vi.mock thay jest.fn) — migrate từ Jest thường là drop-in
- Hỗ trợ in-source testing
- Browser Mode stable từ Vitest 4.0 (test component trong browser thật)

> 📌 Khi nào vẫn chọn Jest? Project legacy đã có sẵn config Jest + plugin ecosystem lớn (Enzyme, snapshot cũ), hoặc Node-only monorepo không cần Vite pipeline.

### 📌 Cập nhật 28/10/2026 — Vitest 5.0 đã phát hành (3/9/2026)

Lịch sử phiên bản gần đây:

| Version | Ngày | Thay đổi chính |
|---------|------|-----------------|
| v3.0 | 1/2026 | Browser mode `instances`, filter test theo line number, redesign reporter API |
| v3.2 | 4/2026 | Annotation API, scoped fixtures, `sequence.groupOrder` |
| v4.0 | 6/2026 | **`workspace` → `projects`**, browser mode provider architecture, v8 coverage pipeline, xóa deprecated APIs |
| v4.1 | 3/2026 | `mockThrow` API, VS Code extension hỗ trợ Deno, "Run Related Tests" |
| **v5.0** | **3/9/2026** | Benchmarking API rewrite (`bench` là test-context fixture, không còn top-level import), `--repeats` CLI flag (hunt flaky tests), `injectCjsGlobals`, coverage tracking cho `node:child_process`/`worker_threads`, conditional mocking (`thenReturnOnce`, `toHaveBeenExhausted`) |

Breaking changes cần lưu ý khi upgrade:
- v4.0: `workspace` config → `projects`; v8 coverage pipeline mới; xóa `--segfault-retry`
- v5.0: benchmark API rewrite; `toHaveTextContent` strict equality (RegExp chuyển sang `toMatchTextContent`); worker/pool IDs bắt đầu từ `1` thay vì `0` (`VITEST_POOL_ID`, `VITEST_WORKER_ID`)

Ref: https://vitest.dev/blog/vitest-5.html | https://vitest.dev/guide/migration

> 📌 Khi nào vẫn chọn Jest? Project legacy đã có sẵn config Jest + plugin ecosystem lớn (Enzyme, snapshot cũ), hoặc Node-only monorepo không cần Vite pipeline.

Ref: https://vitest.dev/

---

## ⏭️ Bài tiếp theo → [7.2 Integration Testing](../7.2-integration-testing/README.md)
