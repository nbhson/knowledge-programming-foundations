# 🧪 7.4 Test-Driven Development (TDD)

> **TDD** là quy trình viết **test TRƯỚC code**: Red → Green → Refactor. Code được xây dựng từ test, không phải ngược lại.

---

## 🎯 TDD Là Gì?

Kent Beck (người sáng lập TDD) mô tả:

```
"Make it work. Make it right. Make it fast."
          ↓              ↓              ↓
        Write test   Write minimal   Refactor code
        that fails    code to pass     safely
```

**TDD không phải là "test nhiều hơn" — nó là "thiết kế từ test".**

### TDD khác gì với "write tests after coding"?

| Aspect | Post-test (Traditional) | TDD |
|--------|------------------------|-----|
| Thứ tự | Code → Test | Test → Code |
| Coverage | Thấp, thường chỉ test happy path | Cao, test mọi edge case từ đầu |
| Design | Code quyết định trước, test theo sau | Interface quyết định trước, implementation theo sau |
| Refactor | Sợ đổi vì không có test bao phủ | Tự tin refactor vì có test bảo vệ |
| Confidence | "Code chạy được" | "Code chạy được + mọi edge case đã được verify" |
| Time (ngắn hạn) | Nhanh hơn | Chậm hơn 10-20% |
| Time (dài hạn) | Chậm hơn (debug nhiều, fear of change) | Nhanh hơn ( Regression ít, velocity ổn định) |

> 💡 **Misconception:** "TDD làm tôi coding chậm hơn." — Đúng trong 2-4 tuần đầu (learning curve), nhưng sau đó **velocity tăng** vì: (1) không cần debug lâu, (2) không sợ refactor, (3) test docs tự động. Nhiều nghiên cứu công nghiệp cho thấy TDD giảm defect density 40-80%.

---

## 🔄 Chu Trình Red-Green-Refactor

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD CYCLE                                 │
│                                                             │
│   🔴 RED        🟢 GREEN         🔵 REFACTOR                 │
│   ──────       ────────          ───────────                │
│   Viết test    Chạy test         Cải thiện code              │
│   cho tính     PASS lần đầu      Giữ nguyên behavior        │
│   năng MỚI     → code tối thiểu  → type, DRY, clear         │
│                                                             │
│        └──────────────────→ LẶP LẠI ↑                        │
└─────────────────────────────────────────────────────────────┘
```

| Giai đoạn | Hành động | Thời gian | Quy tắc |
|-----------|-----------|-----------|---------|
| 🔴 **Red** | Viết test mô tả behavior chưa có | 1-2 phút | Test PHẢI fail (không được cheat) |
| 🟢 **Green** | Viết code tối thiểu để test pass | 1-5 phút | **Chỉ đủ** để pass, không thêm tính năng |
| 🔵 **Refactor** | Dọn code, không đổi behavior | 1-3 phút | Chạy lại test sau mỗi refactor để đảm bảo không break |

---

## 💻 Complete Example: Stack với TDD

### Bước 1: 🔴 RED — Viết test trước

```typescript
// stack.test.ts — lúc này Stack CHƯA tồn tại
import { describe, it, expect } from "vitest";
import { Stack } from "./stack";  // ❌ Error: Module not found

describe("Stack", () => {
  it("push và pop đúng thứ tự LIFO", () => {
    const stack = new Stack<number>();
    stack.push(10);
    stack.push(20);
    expect(stack.pop()).toBe(20);
    expect(stack.pop()).toBe(10);
  });

  it("pop từ stack rỗng throw error", () => {
    const stack = new Stack<number>();
    expect(() => stack.pop()).toThrow("Stack is empty");
  });
});
```

Chạy test → **đỏ**: `ReferenceError: Stack is not defined`

### Bước 2: 🟢 GREEN — Viết code tối thiểu

```typescript
// stack.ts — chỉ đủ để test pass
export class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T {
    if (this.items.length === 0) {
      throw new Error("Stack is empty");
    }
    return this.items.pop()!;
  }
}
```

Chạy test → **xanh**: 2/2 tests pass ✅

### Bước 3: 🔵 REFACTOR — Cải thiện code

```typescript
// stack.ts — sau refactor
export class Stack<T> {
  private readonly items: T[] = [];
  private readonly maxSize?: number;

  constructor(maxSize?: number) {
    this.maxSize = maxSize;
  }

  push(item: T): void {
    if (this.maxSize !== undefined && this.items.length >= this.maxSize) {
      throw new Error("Stack overflow");
    }
    this.items.push(item);
  }

  pop(): T {
    if (this.isEmpty()) {
      throw new Error("Stack is empty");
    }
    return this.items.pop()!;
  }

  peek(): T {
    if (this.isEmpty()) {
      throw new Error("Stack is empty");
    }
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  get size(): number {
    return this.items.length;
  }
}
```

Chạy test → **xanh**: vẫn 2/2 pass ✅ (behavior không đổi)

### Bước 4: Lặp lại — Thêm test mới

```typescript
// Quay lại bước 1 với tính năng MỚI
describe("Stack (tiếp)", () => {
  it("peek không làm thay đổi stack", () => {
    const stack = new Stack<number>();
    stack.push(42);
    expect(stack.peek()).toBe(42);
    expect(stack.pop()).toBe(42); // stack vẫn còn phần tử
  });

  it("lớn lên đến maxSize", () => {
    const stack = new Stack<number>(2);
    stack.push(1);
    stack.push(2);
    expect(() => stack.push(3)).toThrow("Stack overflow");
  });
});
```

---

## 📋 TDD vs Traditional Development

```
Traditional:                              TDD:
────────────                             ─────────
┌─────────┐    ┌─────────┐    ┌────────┐  ┌────────┐   ┌────────┐   ┌────────┐
│ Viết    │───▶│ Chạy    │───▶│ Sửa    │  │ Viết   │──▶│ Chạy   │──▶│ Sửa    │
│ code    │   │ test    │    │ bug    │  │ test   │   │ test   │   │ code   │
└─────────┘    └─────────┘    └────────┘  └──▲─────┘   └────────┘   └──▲─────┘
                                              │                        │
                                      Kiểm soát chất lượng          Debug khó
```

| Khía cạnh | Traditional | TDD |
|-----------|-------------|-----|
| Thứ tự | Code trước → test sau | Test trước → code sau |
| Coverage | Thấp, test thiếu | Cao, test đầy đủ |
| Design | Thường yếu | Thiết kế tốt hơn (interface rõ) |
| Refactor | Sợ đổi vì không có test | Tự tin refactor |
| Thời gian đầu | Nhanh hơn | Chậm hơn 10-20% |
| Thời gian dài hạn | Chậm hơn (debug nhiều) | Nhanh hơn (ít bug) |
| Regression bugs | Thường gặp | Hiếm gặp |

---

## ✅ Lợi Ích TDD

| Lợi ích | Giải thích | Lập luận |
|---------|------------|----------|
| 🎯 **Design tốt hơn** | Phải nghĩ đến interface trước khi implement | Interface-first design → code modular, dễ test, dễ maintain |
| 📖 **Documentation sống** | Test là tài liệu về behavior | Đọc test file = đọc spec. Spec luôn update vì test phải pass |
| 🛡️ **Refactor an toàn** | Test suite bảo vệ khỏi regression | Bạn có thể đổi implementation thoải mái, test sẽ catch nếu break behavior |
| 🐛 **Giảm bug** | Phát hiện lỗi ngay khi viết | Bug phát hiện trong vài phút (red phase) thay vì vài ngày (production incident) |
| 💪 **Tự tin deploy** | Suite test chạy qua = hệ thống ổn định | Deploy decision dựa trên data (test pass rate) thay vì gut feeling |
| 🧠 **Focus better** | Mỗi cycle chỉ làm 1 thing nhỏ | Chia nhỏ problem → giảm cognitive load, tăng quality per feature |

---

## ⚠️ Thách Thức TDD

| Thách thức | Cách vượt qua |
|------------|---------------|
| Chậm ban đầu | Coi như đầu tư dài hạn — ROI rõ sau 2-3 tháng |
| Khó test legacy code | Dùng wrapper / dependency injection để tách logic khỏi framework |
| Không biết viết test nào trước | Bắt đầu từ case đơn giản nhất, thêm edge cases sau |
| Pressure deadline | Ưu tiên TDD cho core logic (payment, auth, data processing), không phải cho CRUD boilerplate |
| Khó với UI code | Kết hợp TDD với BDD — viết scenario Gherkin trước, implement sau |
| Test too brittle | Test behavior, không test implementation — dùng stable abstractions |

> 📌 **Pragmatic TDD:** Không phải mọi code cần TDD. Ưu tiên TDD cho:
> - Core business logic ( Pricing, calculation, state machine)
> - Complex algorithms
> - Code dễ break khi refactor
> Bỏ qua TDD cho:
> - Simple CRUD getters/setters
> - One-off scripts
> - UI wiring (dùng BDD/E2E thay thế)

---

## 🎯 Quy Tắc Vàng Của TDD

```
1. KHÔNG viết production code nếu chưa có test FAIL
2. ONLY viết test vừa đủ để FAIL (compiler error = fail)
3. ONLY viết production code vừa đủ để test PASS
```

> — **Kent Beck**, *Test-Driven Development: By Example*

> 💡 **Thực tế:** Rule 1 là rule quan trọng nhất. Khi bạn viết code TRƯỚC test, bạn đang viết code không có contract — và contract đó thường không đủ chặt. Khi test viết trước, bạn đã **design** interface trước khi **implement** — đây là khác biệt then chốt.

---

## ▶️ Chạy ví dụ

Chạy demo vòng lặp Red → Green → Refactor:

```bash
cd 07-testing/7.4-tdd
npx ts-node examples/index.ts
```

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Tác giả |
|----------|---------|
| *Test-Driven Development: By Example* | Kent Beck |
| *Growing Object-Oriented Software, Guided by Tests* | Steve Freeman, Nat Pryce |
| TDD là gì? — Martin Fowler | https://martinfowler.com/articles/testDrivenDevelopment.html |

---

## ⏭️ Bài tiếp theo → [7.5 BDD](../7.5-bdd/README.md)
