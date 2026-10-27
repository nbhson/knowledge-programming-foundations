# 🧠 4.2 Functional Programming (FP)

> **FP** là cách tổ chức code xung quanh **hàm thuần túy (pure functions)**, tránh thay đổi trạng thái và side effects. Code FP dễ test, dễ parallelize, và tránh nhiều bug ẩn.

---

## Tư duy cốt lõi của FP

FP không phải là "dùng map/filter/reduce" — đó là hiểu lầm. FP là **cách nhìn nhận computation**: chương trình là **evaluation của functions**, state là **giả dối**, mutation là **tai nạn**.

**3 nguyên tắc nền tảng:**
1. **Pure functions** — cùng input → cùng output, không side effect
2. **Immutability** — data không đổi, tạo bản mới khi cần thay đổi
3. **First-class functions** — function là giá trị, truyền vào/tra về được

```
❌ Impure — side effect, mutation
let taxRate = 0.1;
function calculatePrice(price: number): number {
  return price * (1 + taxRate); // phụ thuộc global mutable
}

✅ Pure — deterministic, no side effect
function calculatePricePure(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}
```

**Phân biệt FP với "functional-style" trong JS:**
- `map/filter/reduce` ≠ FP — đó là **function iteration** (chỉ là công cụ)
- FP thực sự = **pure + immutable + composition** — mindset, không phải syntax

---

## Nguyên Tắc Cốt Lõi

### Pure Functions (Hàm Thuần Túy)

**Luôn cho cùng kết quả với cùng input, không có side effect.**

```typescript
// ❌ Impure — phụ thuộc biến ngoài, có side effect
let taxRate = 0.1;
function calculatePrice(price: number): number {
  return price * (1 + taxRate); // thay đổi nếu taxRate đổi
}

// ✅ Pure — deterministic, no side effect
function calculatePricePure(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}

// ❌ Có side effect — mutate array
function addTodo(todos: string[], todo: string): void {
  todos.push(todo); // đổi array gốc
}

// ✅ Pure — trả về array mới
function addTodoPure(todos: string[], todo: string): string[] {
  return [...todos, todo];
}
```

**Kiểm tra pure function:**
1. Cùng input → cùng output? ✅
2. Có mutation bên ngoài? ❌
3. Có gọi DB/network/io? ❌
4. Có phụ thuộc global state? ❌

Nếu bất kỳ câu nào = ❌ → impure.

---

### Immutability (Bất Biến)

**Dữ liệu không thay đổi sau khi tạo — luôn tạo bản sao mới.**

```typescript
// ❌ Mutable
const user = { name: "John", age: 25 };
user.age = 26; // mutation!

// ✅ Immutable — spread operator
const updatedUser = { ...user, age: 26 };

// ✅ Freeze object (shallow)
const config = Object.freeze({ apiUrl: "https://api.example.com" });
// config.apiUrl = "changed"; // throws in strict mode

// Array immutability
const nums = [1, 2, 3];
const newNums = nums.map(n => n * 2); // [2, 4, 6], nums vẫn [1, 2, 3]
```

**tại sao immutability quan trọng?**
- **Predictability:** data không đổi = dễ trace, debug.
- **Concurrency safe:** multiple threads đọc cùng data → không race condition.
- **Time-travel debugging:** Redux devtools lưu history của immutable state.
- **Reference equality fast:** `a === b` check O(1), không cần deep compare.

---

### Higher-Order Functions (Hàm Bậc Cao)

**Hàm nhận function làm argument hoặc trả về function.**

```typescript
// Function as argument
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map(n => n * 2);        // [2, 4, 6, 8, 10]
const evens = numbers.filter(n => n % 2 === 0); // [2, 4]
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15

// Function returning function (Closure)
function multiplier(factor: number) {
  return (number: number) => number * factor;
}

const double = multiplier(2);
const triple = multiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

**Closure** là "function nhớ environment khi nó được tạo" — nền tảng của currying, partial application.

---

### Function Composition (Kết Hợp Hàm)

**Ghép nhiều hàm nhỏ thành hàm lớn hơn.**

```typescript
function compose<T, U, V>(f: (u: U) => V, g: (t: T) => U): (t: T) => V {
  return (x) => f(g(x));
}

const trim = (s: string) => s.trim();
const toLower = (s: string) => s.toLowerCase();
const addPrefix = (prefix: string) => (s: string) => prefix + s;

const processName = compose(
  addPrefix("Dear "),
  toLower,
  trim
);

console.log(processName("  JOHN DOE  ")); // "Dear john doe"
```

**Pipeline (RxJS style):**
```typescript
import { fromEvent, map, debounceTime, distinctUntilChanged } from 'rxjs';

fromEvent(input, 'input')
  .pipe(
    map(e => e.target.value),
    debounceTime(300),
    distinctUntilChanged()
  )
  .subscribe(query => fetchResults(query));
```

---

### Currying (Currying)

**Chuyển hàm nhiều tham số thành chuỗi hàm một tham số.**

```typescript
// Uncurried
function add(a: number, b: number): number {
  return a + b;
}

// Curried
function curriedAdd(a: number) {
  return (b: number) => a + b;
}

const add5 = curriedAdd(5);
console.log(add5(3));   // 8
console.log(add5(10));  // 15

// Thực tế: validation pipeline
const minLength = (min: number) => (value: string) => value.length >= min;
const hasPattern = (pattern: RegExp) => (value: string) => pattern.test(value);

const isValidUsername = (value: string) =>
  minLength(3)(value) && hasPattern(/^[a-zA-Z0-9_]+$/)(value);
```

---

## FP vs OOP So Sánh

| Khía Cạnh | OOP | FP |
|-----------|-----|----|
| Đơn vị | Object | Function |
| Trạng thái | Mutable, ẩn trong object | Immutability, stateless |
| Xử lý data | Method trên object | Function độc lập |
| Test | Cần mock object | Dễ test, deterministic |
| Parallel | Cần sync, phức tạp | Safe, immutable data |
| Debug | State thay đổi khó trace | Pure function dễ trace |
| Học curve | Thấp (tự nhiên) | Cao (tư duy khác) |
| Best for | Domain modeling, UI | Data pipeline, concurrent |

**Thực tế:** most production codebase là **hybrid** — OOP cho domain, FP cho data transformation. TypeScript Hỗ trợ cả hai.

---

## Khi Nào Dùng FP?

| Scenario | Khuyến Nghị |
|----------|-------------|
| Data transformation pipeline | ✅ FP |
| Concurrent/parallel processing | ✅ FP (immutability) |
| UI state management | ✅ FP (Redux, immer) |
| Real-time event streams | ✅ FP + Reactive |
| Simple script, quick task | ⚠️ OOP/Procedural đủ |
| GUI application với nhiều state | ⚠️ OOP + FP kết hợp |

---

## Common FP Patterns

```typescript
// 1. Option/Maybe — handle null safely
type Maybe<T> = {
  some: (fn: (v: T) => Maybe<R>) => Maybe<R>;
  none: () => Maybe<R>;
};

const some = <T>(v: T): Maybe<T> => ({
  some: fn => some(fn(v)),
  none: () => none()
});
const none = <T>(): Maybe<T> => ({
  some: () => none(),
  none: () => none()
});

// 2. Either — error handling
type Result<T, E> = {
  isOk: boolean;
  value: T;
  error: E;
};

const ok = <T>(v: T): Result<T, never> => ({ isOk: true, value: v, error: null });
const err = <E>(e: E): Result<never, E> => ({ isOk: false, value: null, error: e });

// 3. Memoization
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  }) as T;
}
```

---

## 🔗 Liên Quan

- **4.1 OOP** — Đối trọng của FP
- **4.3 Reactive** — RxJS dùng FP principles
- **5.5 State Management** — Redux là FP-inspired
- **2.1.5 Prototype** — FP style shallow/deep copy

---

## 📚 Tài Liệu Tham Khảo

- 📖 [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS)
- 📖 [FP in TypeScript](https://typelearn.github.io/typescript-book/chapter11/)
- 📖 [fp-ts Library](https://gcanti.github.io/fp-ts/)
- 📖 [Introduction to Functional Programming with TypeScript](https://leanpub.com/functional-typescript)

---

## ▶️ Chạy ví dụ

```bash
cd 04-paradigms/4.2-functional
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [4.3 Reactive Programming](../4.3-reactive/README.md)
