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

| Giai đoạn | Hành động | Thời gian |
|-----------|-----------|-----------|
| 🔴 **Red** | Viết test mô tả behavior chưa có | 1-2 phút |
| 🟢 **Green** | Viết code tối thiểu để test pass | 1-5 phút |
| 🔵 **Refactor** | Dọn code, không đổi behavior | 1-3 phút |

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
─────────────                             ─────────
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

---

## ✅ Lợi Ích TDD

| Lợi ích | Giải thích |
|---------|------------|
| 🎯 **Design tốt hơn** | Phải nghĩ đến interface trước khi implement |
| 📖 **Documentation sống** | Test là tài liệu về behavior |
| 🛡️ **Refactor an toàn** | Test suite bảo vệ khỏi regression |
| 🐛 **Giảm bug** | Phát hiện lỗi ngay khi viết |
| 💪 **Tự tin deploy** | Suite test chạy qua = hệ thống ổn định |

## ⚠️ Thách Thức TDD

| Thách thức | Cách vượt qua |
|------------|---------------|
| Chậm ban đầu | Coi như đầu tư dài hạn |
| Khó test legacy code | Dùng wrapper / dependency injection |
| Không biết viết test nào trước | Bắt đầu từ case đơn giản nhất |
| Pressure deadline | Ưu tiên TDD cho core logic |

---

## 🎯 Quy Tắc Vàng Của TDD

```
1. KHÔNG viết production code nếu chưa có test FAIL
2. ONLY viết test vừa đủ để FAIL (compiler error = fail)
3. ONLY viết production code vừa đủ để test PASS
```

> — **Kent Beck**, *Test-Driven Development by Example*

---

## ▶️ Chạy ví dụ

```bash
cd 07-testing/7.4-tdd
npx vitest run --reporter=verbose
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
