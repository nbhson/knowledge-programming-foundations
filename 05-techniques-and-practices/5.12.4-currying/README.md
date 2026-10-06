# 🔁 5.12.4 Currying (Hàm Từng Bước Một Tham Số)

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
const add = (a: number) => (b: number) => a + b;
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

## ❌ BAD — thêm 1 case: curry mọi thứ kể cả hàm chỉ gọi 1 lần

```typescript
// ❌ BAD — curry hàm 4 tham số chỉ gọi đúng 1 nơi: đọc phải bóc 4 lớp mới hiểu đang truyền gì
const createUserRaw = (name: string) => (email: string) => (age: number) => (role: string) => ({ name, email, age, role });
const admin = createUserRaw("An")("an@example.com")(30)("admin"); // 💥 khó đọc hơn gọi thường

// ✅ GOOD — gọi thường cho hàm 1 lần; curry cho RULE/FACTORY tái dùng nhiều lần
function createUser(name: string, email: string, age: number, role: string): User {
  return { name, email, age, role };
}
const hasMinLength = (min: number) => (value: string) => value.length >= min; // factory tái dùng ✅
```

> Curry vì **tái dùng partial** (rule, config, bước pipeline), không phải vì "FP cho oai". Hàm gọi 1 lần với đủ tham số → gọi thường.

---

## ⚖️ Trade-off: curried vs gọi thường vs options object

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| Rule/config dùng lại (validator, formatter) | ✅ Curry | `min8` cấu hình 1 lần, gọi n lần |
| Bước trong pipe/compose | ✅ Curry 1 tham số | Ghép pipeline tự nhiên (5.12.5) |
| Hàm gọi 1–2 nơi, đủ tham số | 🚫 Gọi thường | Curry thêm lớp bóc không lợi gì |
| Hàm ≥ 3 tham số, thứ tự dễ nhầm | ⚖️ Options object `{ name, email }` | Rõ hơn cả curry lẫn positional |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Thứ tự tham số sai (data trước, config sau) | Partial application vướng — phải truyền data mới tới được config | Quy ước: **config trước, data sau** (`hasMinLength(min)(value)`) |
| Type inference TS gãy ở curry sâu | `any` lén vào, mất type-safe | Annotate rõ từng bước hoặc dùng overload có sẵn của lib |
| Curry hàm có side effect | Partial giữ reference effect, gọi lúc nào effect lúc đó — khó trace | Chỉ curry hàm pure; effect để ở bước cuối không curry |
| Lạm dụng point-free (không còn thấy tham số) | `const f = pipe(a, b, c)` — debug không biết data hình gì ở giữa | Đặt tên bước rõ + giữ type trung gian hiển thị |

---

## ✅ Checklist khi review

- [ ] Hàm curry có ≥ 2 nơi dùng partial (không curry cho vui)?
- [ ] Thứ tự tham số config-trước-data-sau?
- [ ] Type từng bước curry còn đầy đủ (không `any`)?
- [ ] Chỉ curry hàm pure (effect ở bước cuối)?
- [ ] Pipeline point-free vẫn đọc được (tên bước rõ nghĩa)?

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
