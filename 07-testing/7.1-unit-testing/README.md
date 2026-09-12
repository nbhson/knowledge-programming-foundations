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

---

## 🔧 Mocking vs Stubbing vs Spying

| Kỹ thuật | Mục đích | Ví dụ |
|----------|----------|-------|
| **Mock** | Giả lập object, verify tương tác | Kiểm tra service có gọi đúng method không |
| **Stub** | Trả về giá trị cố định | Cần data giả để test logic |
| **Spy** | Wrap object thật + ghi lại calls | Giữ behavior thật, chỉ theo dõi |
| **Fake** | Implementation đơn giản thay real | In-memory DB thay database thật |

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

### Nguyên Tắc F.I.R.S.T

| Chữ | Nguyên tắc | Giải thích |
|-----|-----------|------------|
| **F** | Fast | Test chạy trong vài ms |
| **I** | Independent | Mỗi test độc lập, không phụ thuộc |
| **R** | Repeatable | Kết quả luôn giống nhau, mọi môi trường |
| **S** | Self-validating | Tự động pass/fail, không đọc log |
| **T** | Timely | Viết trước hoặc cùng lúc với code (TDD) |

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

---

## ▶️ Chạy ví dụ

```bash
cd 07-testing/7.1-unit-testing
npx vitest run
# hoặc với Jest
npx jest
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

## ⏭️ Bài tiếp theo → [7.2 Integration Testing](../7.2-integration-testing/README.md)
