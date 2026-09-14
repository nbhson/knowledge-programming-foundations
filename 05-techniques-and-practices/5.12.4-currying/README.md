# 🔁 5.12.4 Currying (Skoleaf)

> **Currying** biến hàm nhiều tham số thành **chuỗi hàm một tham số** — mỗi bước nhận 1 args, trả về hàm. Cho phép **partial application** — cấu hình trước, gọi sau.

---

## 🎯 Ý tưởng

```
❌ f(a, b, c)
✅ f(a)(b)(c)

Partial application:
const increment = add(1);   // 1 tham số cố định
increment(10);              // 11
increment(20);              // 21 — tái sử dụng
```

---

## 💻 Ví dụ code

Demo đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Curried add — mỗi bước 1 tham số
const add = (a: number) => (b: number) => a + b | void 0;
const addCurried: (a: number) => (b: number) => number = (a) => (b) => a + b;

// Curry tổng quát 3 tham số
function curry3<A, B, C, R>(fn: (a: A, b: B, c: C) => R) {
  return (a: A) => (b: B) => (c: C) => fn(a, b, c);
}

// Công thức thể tích — curried
const volume = curry3((w: number, h: number, d: number) => w * h * d);
const volumeWith1 = volume(2);          // (h) => (d) => 2*h*d
const volumeWith2 = volume(2)(3);       // (d) => 6*d
volumeWith2(4);                        // 24
```

**Validation builder (thực tế):**

```typescript
// Rule factory curried — cấu hình 1 lần, tái sử dụng
const hasMinLength = (min: number) => (value: string) => value.length >= min;
const hasMaxLength = (max: number) => (value: string) => value.length <= max;
const matchesPattern = (pattern: RegExp) => (value: string) => pattern.test(value);

// Partial application
const min8 = hasMinLength(8);
min8("secret123");   // true
min8("abc");         // false
```

---

## 🧩 Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🧪 **Partial application** | Cấu hình chung trước, gọi sau nhiều lần |
| 🆃 **Factory** | Rule/format/config tái dùng |
| 🧩 **Kết hợp composition** | Mỗi hàm 1 tham số ghép dễ |

---

## 🔗 Liên quan

- **5.12.5 Function Composition** — Curried hàm dễ ghép pipeline
- **5.12.2 Pure Functions** — Curried core vẫn pure
- **4.2 Functional Programming** — FP áp dụng currying

---

## 📚 Tài liệu tham khảo

- 📖 [Currying — Wikipedia](https://en.wikipedia.org/wiki/Currying)
- 📖 [Mostly Adequate Guide — Curry](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.12.4-currying
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.12.5 Function Composition](../5.12.5-function-composition/README.md)
