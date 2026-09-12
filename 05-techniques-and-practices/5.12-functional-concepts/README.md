# 🧠 5.12 Functional Concepts (Khái Niệm Functional Programming)

> **Functional Concepts** là các nguyên tắc cốt lõi của FP — immutability, pure functions, side effects — áp dụng được cả trong code OOP thông thường.

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

**Dữ liệu không thay đổi sau khi tạo — luôn tạo bản sao mới.**

```typescript
// ❌ MUTABLE — thay đổi object gốc
const user = { name: 'John', age: 25 };
user.age = 26; // Mutation!
console.log(user); // { name: 'John', age: 26 }

// ✅ IMMUTABLE — tạo object mới
const user = { name: 'John', age: 25 };
const updatedUser = { ...user, age: 26 }; // New object
console.log(user);           // { name: 'John', age: 26 } ← unchanged
console.log(updatedUser);    // { name: 'John', age: 26 }

// Array immutability
const numbers = [1, 2, 3];
const newNumbers = [...numbers, 4];     // push
const filtered = numbers.filter(n => n > 1);  // filter
const mapped = numbers.map(n => n * 2);   // map
// numbers vẫn giữ nguyên [1, 2, 3]
```

**React + Immutability:**
```typescript
// ❌ Bad — mutating state directly
setState({ ...state, count: state.count + 1 }); // OK
// nhưng:
state.items.push(newItem); // ❌ mutation!

// ✅ Good — always create new reference
setState(prev => ({
  ...prev,
  items: [...prev.items, newItem]
}));
```

✅ **Ưu điểm:** Predictable, debuggable, thread-safe
❌ **Nhược điểm:** Memory overhead (nhưng GC hiện đại xử lý tốt)

---

## 5.12.2 Pure Functions

**Pure function:** Cùng input → cùng output, KHÔNG có side effects.

```typescript
// ✅ PURE — cùng input → cùng output
function add(a: number, b: number): number {
  return a + b;
}

// ❌ IMPURE — phụ thuộc external state
let multiplier = 2;
function multiply(a: number): number {
  return a * multiplier; // Kết quả thay đổi nếu multiplier đổi
}

// ❌ IMPURE — có side effect
function logAndAdd(a: number, b: number): number {
  console.log(`Adding ${a} + ${b}`); // Side effect!
  return a + b;
}

// So sánh
add(2, 3); // Luôn = 5 ✅
multiply(2); // Có thể = 4 hoặc = 6 ❌
```

**Benefits:**
- Dễ test (không cần mock)
- Dễ parallelize
- Memoization-friendly

---

## 5.12.3 Side Effects

**Side effect:** Thao động ra ngoài function scope — API call, DB write, DOM change, console.log.

```
Pure Function          vs          Impure Function
─────────────────                 ─────────────────
Input → [box] → Output            Input → [box] → Output
                               ↓
                         (also changes DB)
                         (also logs to console)
                         (also updates UI)
```

**Cách quản lý side effects:**

```typescript
// 1. cô lập side effects vào 1 nơi
async function fetchUserData(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`); // Side effect
  return response.json();
}

// 2. Dùng functional architecture (Effect/T)
type Effect<A> = () => A;

// 3. React: dùng useEffect cho side effects
useEffect(() => {
  fetchData(); // side effect — chạy sau render
}, [userId]);
```

**Side effects cần kiểm soát:**
- Network requests
- Database writes
- File I/O
- DOM mutations
- Random values (Math.random())
- Date/time (Date.now())

---

## 5.12.4 Currying

**Chuyển multi-argument function thành chain of single-argument functions.**

```typescript
// Normal function
function multiply(a: number, b: number, c: number): number {
  return a * b * c;
}

// Curried version
function multiplyCurried(a: number) {
  return (b: number) => {
    return (c: number) => a * b * c;
  };
}

// Usage
const double = multiplyCurried(2);
const triple = multiplyCurried(3);
const result = double(5)(4); // 2 * 5 * 4 = 40

// Thực tế hơn — tạo reusable functions
const add = (a: number) => (b: number) => a + b;
const increment = add(1);
const addTo5 = add(5);

console.log(increment(10)); // 11
console.log(addTo5(10));    // 15
```

**React + Currying:**
```typescript
const createUser = (name: string) => (email: string) => ({
  name,
  email,
  createdAt: new Date()
});

const createAdmin = createUser('Admin');
const admin = createAdmin('admin@example.com');
```

---

## 5.12.5 Function Composition

**Ghép nhiều function nhỏ thành function lớn.**

```typescript
// compose(f, g, h)(x) = f(g(h(x)))
function compose<T, U, V, W>(
  f: (v: V) => W,
  g: (u: U) => V,
  h: (t: T) => U
): (t: T) => W {
  return (x) => f(g(h(x)));
}

// Hoặc đơn giản hơn
const compose = (...fns: Function[]) => 
  (x) => fns.reduceRight((v, f) => f(v), x);

// Ứng dụng thực tế
const uppercase = (s: string) => s.toUpperCase();
const removePunctuation = (s: string) => s.replace(/[.,!?]/g, '');
const trim = (s: string) => s.trim();

const cleanAndUppercase = compose(
  uppercase,
  removePunctuation,
  trim
);

console.log(cleanAndUppercase("  hello, world!  ")); 
// "HELLO WORLD"
```

**Pipeline operator ( proposal):**
```typescript
// Tương tự nhưng dễ đọc hơn
const result = "  hello, world!  "
  |> trim
  |> removePunctuation
  |> uppercase;
```

---

## 🎯 Tổng kết: Functional vs Imperative

| Aspect | Imperative | Functional |
|--------|-----------|-------------|
| State | Mutable | Immutable |
| Loops | for, while | map, filter, reduce |
| Side effects | Accept freely | Isolate & control |
| Functions | Procedural | Pure, composable |
| Error handling | try-catch | Either, Option types |

---

## 🔗 Liên quan

- **4.2 Functional Programming** — Paradigm đầy đủ hơn
- **3.1.1 DRY** — Pure functions giúpDRY
- **5.5 State Management** — Redux dùng immutable state

---

## 📚 Tài liệu tham khảo

- 📖 [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS)
- 📖 [You Don't Know JS — this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS)
- 📖 [ fp-ts Documentation](https://gcanti.github.io/fp-ts/)

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
