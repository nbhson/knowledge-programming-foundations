# 🧠 5.12 Functional Concepts (Khái Niệm Functional Programming)

> **Functional Concepts** là các nguyên tắc cốt lõi của FP — immutability, pure functions, side effects — áp dụng được cả trong code OOP thông thường. Đây không phải "phải chuyển sang Haskell" mà là **công cụ tư duy** giúp code predictable, testable, và composável.

---

## 📚 Mục Lục

| # | Khái Niệm | Mô Tả |
|---|-----------|-------|
| 5.12.1 | [Immutability](#5121-immutability) | Dữ liệu không thay đổi sau khi tạo |
| 5.12.2 | [Pure Functions](#5122-pure-functions) | Function cùng input → cùng output, không side effect |
| 5.12.3 | [Side Effects](#5123-side-effects) | Thao tác ra ngoài function scope |
| 5.12.4 | [Currying](#5124-currying) | Chuyển multi-arg function thành chain of single-arg |
| 5.12.5 | [Function Composition](#5125-function-composition) | Ghép nhiều function thành một |

---

## 5.12.1 Immutability

**Dữ liệu không thay đổi sau khi tạo — luôn tạo bản sao mới.** Immutability là nền tảng của functional programming: thay vì "sửa đổi" object, ta "tạo object mới với giá trị mới". Kết quả: code predictable vì state không ẩn biến đổi.

```typescript
// ❌ MUTABLE — thay đổi object gốc (dangerous in shared state)
const user = { name: 'John', age: 25 };
user.age = 26; // Mutation! — ai cũng có thể đọc user.age và thấy 26
console.log(user); // { name: 'John', age: 26 }

// ✅ IMMUTABLE — tạo object mới, giữ nguyên bản cũ
const user = { name: 'John', age: 25 };
const updatedUser = { ...user, age: 26 }; // New object with new ref
console.log(user);           // { name: 'John', age: 25 } ← unchanged!
console.log(updatedUser);    // { name: 'John', age: 26 }
```

### Array Immutability

```typescript
const numbers = [1, 2, 3];

// ❌ Mutation — thay đổi array gốc
numbers.push(4);           // [1, 2, 3, 4] — numbers đã đổi!
numbers.splice(1, 1);      // [1, 3, 4] — dangerous if shared

// ✅ Immutable — luôn tạo array mới
const withFour = [...numbers, 4];            // [1, 2, 3, 4]
const filtered = numbers.filter(n => n > 1); // [2, 3]
const doubled = numbers.map(n => n * 2);     // [2, 4, 6]
// numbers vẫn giữ nguyên [1, 2, 3]
```

### React + Immutability (state management)

```typescript
// ❌ Bad — mutating state directly (React won't re-render)
function handleClick() {
  state.items.push(newItem);
  setState(state);  // same ref → React bỏ qua
}

// ✅ Good — always create new reference (React detects change)
function handleClick() {
  setState(prev => ({
    ...prev,
    items: [...prev.items, newItem]  // new array ref
  }));
}

// ✅ Good — nested update with immer (simplified)
import { produce } from 'immer';

setState(produce(prev => {
  prev.items[0].price += 10;  // Viết như mutable, immer tạo immutable copy
}));
```

### Object.freeze (deep immutability — advisory)

```typescript
const config = Object.freeze({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retry: { maxAttempts: 3, backoff: 'exponential' }
});

// config.apiUrl = 'new' → TypeError in strict mode
// Tuy nhiên: Object.freeze chỉ freeze 1 level (shallow)
// deep freeze cần thư viện như immutability-helper hoặc immer
```

> 📌 **Lưu ý:** `Object.freeze` là shallow — nested objects vẫn mutable. Dùng `immer` hoặc `deep-freeze` cho deep immutability.

✅ **Ưu điểm:** Predictable state (debuggable bằng time-travel), thread-safe (không cần lock), React re-render detection đơn giản (reference equality), memoization-friendly.
❌ **Nhược điểm:** Memory overhead (tạo object mới thay vì sửa) — nhưng GC hiện đại (V8) xử lý rất hiệu quả; shallow copy có thể chậm với object lớn (> 10KB).

---

## 5.12.2 Pure Functions

**Pure function:** Cùng input → cùng output, KHÔNG có side effects. Đây là khái niệm quan trọng nhất trong FP — nếu hàm là pure, nó **đơn vị testable, parallelizable, và memoizable**.

### Định nghĩa chính thức

```
Pure Function f thỏa mãn:
1. Deterministic: f(x) = f(x) — cùng input → cùng output luôn
2. No side effects: không đọc/ghi global state, không I/O, không network
```

```typescript
// ✅ PURE — deterministic, no side effects
function add(a: number, b: number): number {
  return a + b;
}

// ✅ PURE — luôn trả về cùng result cho cùng input
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// ❌ IMPURE — phụ thuộc external state (non-deterministic)
let multiplier = 2;
function multiply(a: number): number {
  return a * multiplier;  // Kết quả thay đổi nếu multiplier đổi bên ngoài
}

// ❌ IMPURE — có side effect (ghi console)
function logAndAdd(a: number, b: number): number {
  console.log(`Adding ${a} + ${b}`);  // Side effect!
  return a + b;
}

// ❌ IMPURE — gọi Date.now() (result thay đổi theo thời gian)
function getCurrentTimestamp(): number {
  return Date.now();
}
```

### Benefits của Pure Functions

| Benefit | Giải thích |
|---------|------------|
| **Dễ test** | Không cần mock DB, mock network, mock global state. `assert.strictEqual(add(2,3), 5)` là test đầy đủ. |
| **Dễ parallelize** | Không share mutable state → chạy song song không conflict. |
| **Memoization** | Result có thể cache theo input: `const memoizedAdd = memoize(add)` — gọi lại cùng args = return cache, không tính lại. |
| **Reasoning** | Đọc function body = hiểu hết behavior — không cần đọc code xung quanh. |

### Memoization Example

```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

const expensiveComputation = memoize((n: number): number => {
  // Giả sử đây là tính toán nặng
  let result = 0;
  for (let i = 0; i < 1000000; i++) result += n;
  return result;
});

expensiveComputation(5);  // Tính 1 triệu lần
expensiveComputation(5);  // Return cache instantly — không tính lại
```

---

## 5.12.3 Side Effects

**Side effect:** Thao tác ra ngoài function scope — API call, DB write, DOM change, console.log, random value, file I/O. Side effects là **không tránh được** (bạn không thể làm app mà không giao tiếp với thế giới), nhưng phải **kiểm soát được**.

### Phân loại Side Effects

```
Pure Function                     Impure Function
Input ──► [ box ] ──► Output    Input ──► [ box ] ──► Output
                                     │
                              (also writes to DB)
                              (also mutates global state)
                              (also makes network call)
                              (also logs to console)
                              (also updates DOM)
```

### Cách quản lý Side Effects trong FP

```typescript
// Pattern 1: Cô lập side effects vào 1 nơi (IO Monad style)
interface IO<A> {
  readonly value: A;
  run: () => A;
}

function createUserIO(name: string, email: string): IO<User> {
  return {
    value: { name, email, id: generateId(), createdAt: new Date() },
    run: () => {
      const user = { name, email, id: generateId(), createdAt: new Date() };
      db.users.create(user);       // side effect here
      return user;
    }
  };
}

// Pattern 2: React useEffect — side effects after render
useEffect(() => {
  fetchData();   // side effect: network request
}, [userId]);   // chạy lại khi userId thay đổi

// Pattern 3: Task/Either pattern — encode failure in type
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function fetchUser(id: string): Promise<Result<User, Error>> {
  return fetch(`/api/users/${id}`)
    .then(r => r.ok ? { ok: true, value: r.json() } : { ok: false, error: r.status });
}
```

### Những hành vi gây Side Effect cần kiểm soát

| Side Effect | Risk | Quản lý bằng |
|-------------|------|--------------|
| Network requests | Fail, slow, inconsistent | Retry policy, timeout, error boundaries |
| Database writes | Data loss, corruption | Transactions, idempotency keys |
| File I/O | Permission errors, disk full | Try-catch, graceful degradation |
| DOM mutations | React re-render loops | useState, useRef, memo |
| Random values | Non-deterministic | Seed-based PRNG, pass random as input |
| Date/time | Different results at different times | Inject `Date.now` as parameter |

> 💡 **Mẹo thực tế:** Biến `Date.now()` thành dependency injectable:
> ```typescript
> function calculateExpiry(createdAt: Date, now: () => Date): Date {
>   return new Date(now().getTime() + 24 * 60 * 60 * 1000);
> }
> // Test: calculateExpiry(d1, () => fixedDate) — deterministic
> // Prod: calculateExpiry(d1, Date.now)
> ```

---

## 5.12.4 Currying

**Chuyển multi-argument function thành chain of single-argument functions.** Currying cho phép **partial application** — fix một số args, tạo function mới chuyên biệt.

### Từ uncurried sang curried

```typescript
// Uncurried — phải cung cấp tất cả args cùng lúc
function multiply(a: number, b: number, c: number): number {
  return a * b * c;
}

// Curried — each arg returned as function
function multiplyCurried(a: number) {
  return (b: number) => {
    return (c: number) => a * b * c;
  };
}

// Usage — partial application!
const double = multiplyCurried(2);        // (b) => (c) => 2 * b * c
const triple = multiplyCurried(3);        // (b) => (c) => 3 * b * c
const result1 = double(5)(4);             // 2 * 5 * 4 = 40
const result2 = triple(5)(4);             // 3 * 5 * 4 = 60
```

### Real-world: Builder pattern với currying

```typescript
// Tạo reusable builders
const add = (a: number) => (b: number) => a + b;
const increment = add(1);
const addTo5 = add(5);

console.log(increment(10)); // 11
console.log(addTo5(10));    // 15

// Trong React: memoized event handler factory
const createUser = (role: string) => (name: string) => ({
  name,
  role,
  createdAt: new Date().toISOString(),
});

const createAdmin = createUser('admin');
const createUserAccount = createUser('user');

const admin = createAdmin('Alice');       // { name: 'Alice', role: 'admin', ... }
const user = createUserAccount('Bob');    // { name: 'Bob', role: 'user', ... }
```

### Currying + Composition (powerful combo)

```typescript
// curry helper — tự động curri 2-arg function
function curry<F extends (...args: any[]) => any>(fn: F): (...args: Parameters<F>) => any {
  return function curried(...args: any[]) {
    return args.length >= fn.length
      ? fn(...args)
      : (...more: any[]) => curried(...args, ...more);
  };
}

const addCurried = curry((a: number, b: number) => a + b);
const increment = addCurried(1);     // (b) => 1 + b
const fivePlus = addCurried(5);      // (b) => 5 + b
```

---

## 5.12.5 Function Composition

**Ghép nhiều function nhỏ thành function lớn.** `compose(f, g, h)(x) = f(g(h(x)))` — data flow đi từ trong ra ngoài (right to left). `pipe(f, g, h)(x) = h(g(f(x)))` — data flow đi từ trái sang phải (dễ đọc hơn với người Việt).

### Compose (phải → trái)

```typescript
// compose: apply rightmost function first
function compose<T, U, V, W>(
  f: (v: V) => W,
  g: (u: U) => V,
  h: (t: T) => U
): (t: T) => W {
  return (x) => f(g(h(x)));
}

const uppercase = (s: string) => s.toUpperCase();
const removePunctuation = (s: string) => s.replace(/[.,!?]/g, '');
const trim = (s: string) => s.trim();

const cleanAndUppercase = compose(
  uppercase,          // last applied
  removePunctuation,
  trim                // first applied
);

console.log(cleanAndUppercase("  hello, world!  "));
// trim → "hello, world!"
// removePunctuation → "hello world"
// uppercase → "HELLO WORLD"
// Output: "HELLO WORLD" ✅
```

### Pipe (trái → phải — preferred trong TypeScript hiện đại)

```typescript
// pipe: apply leftmost function first (more readable for Vietnamese speakers)
function pipe<T, U, V, W>(
  f: (t: T) => U,
  g: (u: U) => V,
  h: (v: V) => W
): (t: T) => W {
  return (x) => h(g(f(x)));
}

// Same logic, more natural reading order
const cleanAndUppercasePipe = pipe(
  trim,                    // step 1: trim
  removePunctuation,        // step 2: remove punctuation
  uppercase                 // step 3: uppercase
);

console.log(cleanAndUppercasePipe("  hello, world!  "));
// Output: "HELLO WORLD"
```

### Point-free style (không cần khai báo parameter)

```typescript
// Pointful — explicit parameter
const normalize = (name: string) => trim(name).toUpperCase();

// Point-free — implicit parameter (functional style)
const normalize = pipe(trim, toUpperCase);

// Point-free + map (array transformation)
const normalizeAll = (names: string[]) => names.map(normalize);

// Kết quả: [normalizeAll("  alice  ", "  BOB  ", "  charlie  ")]
// → ["ALICE", "BOB", "CHARLIE"]
```

### Composition với Error Handling (Either pattern)

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function eitherMap<T, U, E>(fn: (t: T) => U): (r: Result<T, E>) => Result<U, E> {
  return (r) => r.ok ? { ok: true, value: fn(r.value) } : r;
}

// Compose safe transformations
const parseJSON = (s: string): Result<any, Error> => {
  try { return { ok: true, value: JSON.parse(s) }; }
  catch (e) { return { ok: false, error: e as Error }; }
};

const getUserFromJson = (data: any): Result<string, Error> =>
  typeof data.name === 'string' ? { ok: true, value: data.name } : { ok: false, error: new Error('Invalid user') };

// Compose: string → JSON → name
const extractUserName = pipe(
  parseJSON,
  eitherMap(getUserFromJson)
);

extractUserName('{"name":"Alice"}');  // { ok: true, value: "Alice" }
extractUserName('not-json');          // { ok: false, error: SyntaxError }
```

---

## 🎯 Tổng kết: Functional vs Imperative

| Aspect | Imperative | Functional |
|--------|-----------|-------------|
| **State** | Mutable (thay đổi được) | Immutable (tạo bản sao mới) |
| **Loops** | `for`, `while`, `forEach` với mutation | `map`, `filter`, `reduce` — không mutation |
| **Side effects** | Accept freely | Isolate & control at boundaries |
| **Functions** | Procedural (thủ tục) | Pure, composable, curriable |
| **Error handling** | `try-catch` blocks | `Either`, `Option`, `Result` types |
| **Testing** | Cần mock toàn bộ context | Unit test đơn giản — chỉ test function |
| **Reasoning** | Theo dõi state biến đổi theo thời gian | Theo dõi data flow qua pipeline |

---

## 🧭 Khi nào áp dụng Functional Concepts?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Frontend React/Vue state management | **Immutability + Pure components** | Predictable UI re-renders, time-travel debugging |
| Business logic (pricing, tax, validation) | **Pure functions** | Dễ unit test, dễ verify correctness |
| Data transformation pipelines | **Composition + map/filter/reduce** | declarative, readable, chainable |
| Async operations (API calls) | **Task/Either pattern** | Encode success/failure in type system |
| Simple CRUD UI | **Hỗn hợp (imperative + functional)** | Không cần FP everywhere — dùng pure function cho logic, imperative cho UI |
| Large enterprise codebase | **Partial FP (pure core, impure shell)** | Bảo vệ business logic bằng pure functions; side effects ở rìa |

> 💡 **Misconception:** "FP đòi hỏi pure function cho TẤT CẢ code." Sai. Pure function là **lý tưởng cho business logic**. Side effects (I/O, network) không thể eliminate — chúng ta chỉ cần **cách ly** chúng vào boundary. Pattern "Pure core, Impure shell" là cách thực tế nhất.

---

## 🔗 Liên quan

- **4.2 Functional Programming** — Paradigm đầy đủ hơn (monads, functors, algebras)
- **3.1.1 DRY** — Pure functions giúp DRY: test 1 lần, dùng ở mọi nơi
- **5.5 State Management** — Redux dùng immutable state + pure reducers
- **1.3 Clean Architecture** — Use cases là pure functions, adapters là impure shell

---

## 📚 Tài liệu tham khảo

- 📖 [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS)
- 📖 [You Don't Know JS — this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS)
- 📖 [fp-ts Documentation](https://gcanti.github.io/fp-ts/)
- 📖 [Immutable.js Docs](https://immutable-js.com/)
- 📖 [Ramda.js — Functional Programming Utility Library](https://ramdajs.com/)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.12-functional-concepts
npx ts-node examples/index.ts
```

---

## ⏭️ Bạn đã hoàn thành Lớp 5: Techniques & Practices!

🎉 **Congratulations!** Bạn đã học xong tất cả 12 kỹ thuật trong lớp Techniques & Practices.

### Tóm tắt Lộ trình

```
Lớp 1: Architecture      → Tổ chức hệ thống
Lớp 2: Design Patterns   → Giải quyết vấn đề cụ thể
Lớp 3: Principles        → Nguyên tắc viết code tốt
Lớp 4: Paradigms         → Tư duy lập trình
Lớp 5: Techniques        → Làm việc thực tế (đang học)
Lớp 6: DSA               → Nền tảng toán học
```

**Bước tiếp theo:**
- → [🏛️ Architecture](../../01-architecture/README.md)
- → [🧠 Paradigms](../../04-paradigms/README.md)
- → [📐 DSA](../../06-data-structures-and-algorithms/README.md)
