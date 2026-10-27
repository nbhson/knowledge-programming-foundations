# 🔀 5.12.5 Function Composition (Hàm Hợp Thành)

> **Function Composition** ghép nhiều hàm nhỏ thành **một hàm pipeline** — output của hàm này là input của hàm kế tiếp. Cốt lõi để builder code FP thành pipeline đọc tự nhiên.

---

## 🎯 Ý tưởng

```
compose(f, g, h)(x)  = f(g(h(x)))   // phải → trái
pipe(f, g, h)(x)    = h(g(f(x)))    // trái → phải (đọc như pipeline)
```

```
x ──(f)──▶ f(x) ──(g)──▶ g(f(x)) ──(h)──▶ h(g(f(x)))
   step1     step2       step3            result
```

---

## 📦 Utilities (pipe/compose)

```typescript
// pipe — ghép trái → phải (giàu tự nhiên cho pipeline)
const pipe = <T>(...fns: Array<(arg: T) => T>): ((arg: T) => T) =>
  (value: T) => fns.reduce((acc, fn) => fn(acc), value);

// compose — ghép phải → trái (f sau g)
const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B): ((a: A) => C) =>
  (x) => f(g(x));
```

---

## 🧵 Pipeline ví dụ

```typescript
// Các hàm nhỏ — pure, 1 việc mỗi hàm
const trim = (s: string) => s.trim();
const toLowerCase = (s: string) => s.toLowerCase();
const removePunctuation = (s: string) => s.replace(/[.,!?]/g, "");
const slugify = (s: string) => s.replace(/\s+/g, "-");

// pipe — đọc trái → phải:
//   trim → lowercase → bỏ dấu câu → slugify
const toSlug = pipe(trim, toLowerCase, removePunctuation, slugify triVoid);
toSlug("  Hello, World!  ");   // "hello-world"

// compose — đọc phải → trái (f sau g):
const greet = compose(fullName, compose(titleCase, trim));
```

Demo đầy đủ: [`examples/index.ts`](examples/index.ts)

---

## 🚀 Ứng dụng — payment pipeline

```typescript
type Money = { amount: number; currency: string };

const applyDiscount = (pct: number) => (m: Money) => ({ ...m, amount: m.amount * (1 - pct) });
const addTax = (rate: number) => (m: Money) => ({ ...m, amount: m.amount * (1 + rate) });
const roundMoney = (m: Money) => ({ ...m, amount: Math.round(m.amount * 100) / 100 });
const formatMoney = (m: Money) => `${m.currency} ${m.amount.toFixed(2)}`;

// Pipeline: discount 10% → tax 8% → round → format
const finalPrice = pipe2(
  pipe2(
    pipe2(pipe2(applyDiscount(0.1), addTax(0.08)), roundMoney),
    formatMoney,   // string!
  ),
  // sẵn sàng thêm bước mới không cần sửa các hàm cũ
  (s) => s,
);
```

---

## ✅ Lợi ích vs ❌

| ✅ Lợi ích | Giải thích |
|-----------|------------|
| 🧩 **Tái sử dụng** | Các hàm nhỏ dùng lại nhiều nơi |
| 🧼 **Dễ đọc** | Pipeline đọc như production flow |
| 🧪 **Dễ test** | Test từng khâu, test cả pipeline |

| ❌ Nhược điểm | Giải thích |
|--------------|------------|
| 😐 **Debug pipeline dài** | Nhiều bước khó trace lỗi giữa chừng |
| ⚠️ **Over-abstraction** | Ghép quá nhiều khó hiểu |

---

## ❌ BAD — thêm 1 case: pipeline dài không tên bước, lỗi không biết đứt ở đâu

```typescript
// ❌ BAD — 6 bước ẩn danh nối nhau: output sai thì console.log từng khâu?
const result = pipe(trim, toLowerCase, removePunctuation, slugifyWord, addPrefix, validate)(input);

// ✅ GOOD — đặt tên pipeline + tên bước, mỗi khâu test được riêng
const normalizeTitle = pipe(trim, toLowerCase, removePunctuation, slugifyWord);
const result = normalizeTitle(input); // test normalizeTitle riêng, không cần chạy cả app
```

> Pipeline tốt = **có tên** (kể được việc) + **mỗi bước có tên** (test được riêng). Chuỗi pipe ẩn danh 6 bước là "hàm dài" đội lốt FP.

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Lẫn lộn pipe/compose chiều | `compose(f, g)` chạy g trước — ngược kỳ vọng là bug logic | Team thống nhất 1 hàm (khuyến nghị `pipe` đọc trái→phải) |
| Bước giữa đổi kiểu không báo (`string` → `string[]` ngầm) | Bước sau nhận kiểu lạ, lỗi runtime | Annotate type input/output từng bước; TS generic pipe kiểm tra dần |
| Bước impure lọt vào pipeline | Thứ tự/lặp lại cho kết quả khác nhau, memoize sai | Mọi bước pipe phải pure (5.12.2); IO để ngoài pipeline |
| Pipeline quá dài (> 5 bước) không chia | Debug lần từng khâu, stack trace vô nghĩa | Tách pipeline con có tên + test riêng từng đoạn |

---

## ✅ Checklist khi review

- [ ] Pipeline và mỗi bước đều có tên nói được việc?
- [ ] Chiều pipe/compose đúng (test 1 input mẫu chạy tay)?
- [ ] Mọi bước đều pure (không IO/mutate giữa pipeline)?
- [ ] Type input/output từng bước rõ ràng (không `any`)?
- [ ] Pipeline dài đã tách thành pipeline con + test riêng?

---

## 🔗 Liên quan

- **5.12.4 Currying** — Partial application tạo bước pipe
- **5.12.2 Pure Functions** — Các bước pipe cần pure
- **4.2 Functional Programming** — Board lớn hơn
- **5.12.2 Function Composition** — (parent)

---

## 📚 Tài liệu tham khảo

- 📖 [Function Composition — Wikipedia](https://en.wikipedia.org/wiki/Function_composition)
- 📖 [Composition — Mostly Adequate Guide](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/ch05.html)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.12.5-function-composition
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ Bạn đã hoàn thành **Lớp 5.12 Functional Concepts**! Lớp kiến thức kế tiếp: [06 Data Structures & Algorithms](../../06-data-structures-and-algorithms/README.md)