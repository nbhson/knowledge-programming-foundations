# 🧠 Lớp 4: Paradigms (Học Thuyết Lập Trình)

> **Paradigms** là các **cách tư duy và tiếp cận vấn đề** khi viết code.
> Mỗi paradigm mang một triết lý riêng về cách tổ chức và thực thi chương trình.
>
> **Ví dụ:** Triết lý thiết kế — kiến trúc sư suy nghĩ theo cách nào.

---

## 📚 Mục lục

| # | Paradigm | Giải thích | Link |
|---|----------|------------|------|
| 4.1 | **Object-Oriented Programming (OOP)** | Tổ chức code theo đối tượng; 4 trụ cột: đóng gói, kế thừa, đa hình, trừu tượng hóa | [→ 4.1](4.1-oop/README.md) |
| 4.2 | **Functional Programming (FP)** | Hàm thuần túy, bất biến, HOF, currying, function composition | [→ 4.2](4.2-functional/README.md) |
| 4.3 | **Reactive Programming** | Luồng dữ liệu (stream) tự động push tới observer, không cần polling | [→ 4.3](4.3-reactive/README.md) |
| 4.4 | **Procedural Programming** | Chia bài toán thành các procedure, chạy tuần tự từng bước | [→ 4.4](4.4-procedural/README.md) |
| 4.5 | **Declarative vs Imperative** | Khai báo (WHAT) vs Thủ tục (HOW) — cùng bài toán, 2 cách viết | [→ 4.5](4.5-declarative-imperative/README.md) |
| 4.6 | **Concurrent & Parallel Programming** | Promise.all vs tuần tự; concurrency single-thread của JS/Node | [→ 4.6](4.6-concurrent-parallel/README.md) |

---

## Tổng Quan

| # | Paradigm | Triết Lý |
|---|----------|---------|
| 4.1 | **Object-Oriented Programming (OOP)** | Tổ chức code theo đối tượng |
| 4.2 | **Functional Programming (FP)** | Tổ chức theo hàm, tránh side effects |
| 4.3 | **Reactive Programming** | Tổ chức theo luồng dữ liệu và sự kiện |
| 4.4 | **Procedural Programming** | Tổ chức theo quy trình (procedures) |
| 4.5 | **Declarative vs Imperative** | Khai báo vs Thủ tục |
| 4.6 | **Concurrent & Parallel Programming** | Song song và bất đồng bộ |

---

## 4.1 Object-Oriented Programming (OOP)

**Triết lý:** Tổ chức code xung quanh **đối tượng (objects)** — các thực thể có trạng thái và hành vi.

### 4 Pillars of OOP

#### 1. Encapsulation (Đóng gói)

**Ý tưởng:** Bọc dữ liệu và hành vi liên quan trong 1 đối tượng, ẩn implementation detail.

```typescript
class BankAccount {
  private balance: number = 0; // Ẩn bên trong

  deposit(amount: number) {
    if (amount <= 0) throw new Error("Amount must be positive");
    this.balance += amount;
  }

  withdraw(amount: number) {
    if (amount > this.balance) throw new Error("Insufficient funds");
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount();
account.deposit(100);
account.withdraw(30);
console.log(account.getBalance()); // 70
// account.balance = 1000000; // ❌ Cannot access private property
```

#### 2. Inheritance (Kế thừa)

**Ý tưởng:** Class con **kế thừa** properties và methods từ class cha.

```typescript
class Animal {
  constructor(public name: string) {}

  eat() {
    console.log(`${this.name} is eating`);
  }

  sleep() {
    console.log(`${this.name} is sleeping`);
  }
}

class Dog extends Animal {
  bark() {
    console.log(`${this.name} says Woof!`);
  }
}

class Cat extends Animal {
  meow() {
    console.log(`${this.name} says Meow!`);
  }
}

const dog = new Dog("Buddy");
dog.eat();    // Buddy is eating (inherited)
dog.sleep();  // Buddy is sleeping (inherited)
dog.bark();   // Buddy says Woof! (own method)
```

#### 3. Polymorphism (Đa hình)

**Ý tưởng:** Nhiều classes khác nhau **cùng implement 1 interface** — client không cần biết chi tiết.

```typescript
abstract class Shape {
  abstract area(): number;
  abstract describe(): string;
}

class Circle extends Shape {
  constructor(private radius: number) { super(); }

  area(): number { return Math.PI * this.radius ** 2; }
  describe(): string { return `Circle with radius ${this.radius}`; }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) { super(); }

  area(): number { return this.width * this.height; }
  describe(): string { return `Rectangle ${this.width}x${this.height}`; }
}

class Triangle extends Shape {
  constructor(private base: number, private height: number) { super(); }

  area(): number { return 0.5 * this.base * this.height; }
  describe(): string { return `Triangle base=${this.base} h=${this.height}`; }
}

// Polymorphism in action
function printShapeInfo(shape: Shape) {
  console.log(shape.describe());
  console.log(`Area: ${shape.area()}`);
}

printShapeInfo(new Circle(5));
printShapeInfo(new Rectangle(4, 6));
printShapeInfo(new Triangle(3, 8));
```

#### 4. Abstraction (Trừu tượng hóa)

**Ý tưởng:** Ẩn phức tạp, chỉ show interface cần thiết.

```typescript
// User doesn't need to know HOW the engine works
interface CarEngine {
  start(): void;
  stop(): void;
  getRPM(): number;
}

// Complex implementation hidden
class TurboEngine implements CarEngine {
  private rpm: number = 0;
  private turboBoost: boolean = false;

  start() {
    this.rpm = 800;
    console.log("Engine started");
  }

  stop() {
    this.rpm = 0;
    this.turboBoost = false;
    console.log("Engine stopped");
  }

  getRPM() { return this.rpm; }

  // Complex internal methods hidden from user
  private adjustFuelAirRatio() { /* ... */ }
  private calibrateTurbo() { /* ... */ }
}

// User only sees the simple interface
function driveCar(engine: CarEngine) {
  engine.start();
  console.log(`RPM: ${engine.getRPM()}`);
  engine.stop();
}
```

---

## 4.2 Functional Programming (FP)

**Triết lý:** Tổ chức code xung quanh **hàm (pure functions)**, tránh thay đổi trạng thái và side effects.

### Core Concepts

#### Pure Functions (Hàm thuần túy)

**Luôn cho ra cùng kết quả khi cùng input, không tạo side effect.**

```typescript
// ❌ Impure: depends on external state
let taxRate = 0.1;
function calculateTax(amount: number) {
  return amount * taxRate; // taxRate có thể thay đổi!
}

// ✅ Pure: deterministic, no side effects
function calculateTax(amount: number, taxRate: number): number {
  return amount * taxRate; // Always same result for same input
}

// ✅ Pure: no mutation
function addItem(cart: CartItem[], item: CartItem): CartItem[] {
  return [...cart, item]; // Returns NEW array, original unchanged
}

// ❌ Impure: mutates original array
function addItemMutate(cart: CartItem[], item: CartItem) {
  cart.push(item); // Modifies original!
}
```

#### Immutability (Bất biến)

**Dữ liệu không thay đổi sau khi tạo — tạo bản mới thay vì sửa bản cũ.**

```typescript
// ❌ Mutable
const user = { name: "John", age: 25 };
user.age = 26; // Changed!

// ✅ Immutable
const user = { name: "John", age: 25 };
const updatedUser = { ...user, age: 26 }; // New object

// Array immutability
const numbers = [1, 2, 3];
const newNumbers = [...numbers, 4]; // [1, 2, 3, 4] - original unchanged

// Using Object.freeze for shallow immutability
const config = Object.freeze({
  apiUrl: "https://api.example.com",
  timeout: 5000
});
config.apiUrl = "changed"; // Silently fails (or throws in strict mode)
```

#### Higher-Order Functions (Hàm bậc cao)

**Hàm nhận function làm argument hoặc trả về function.**

```typescript
// Functions as arguments
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map(n => n * 2);        // [2, 4, 6, 8, 10]
const evens = numbers.filter(n => n % 2 === 0); // [2, 4]
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15

// Function returns function (Closure)
function multiplier(factor: number) {
  return (number: number) => number * factor;
}

const double = multiplier(2);
const triple = multiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```

#### Function Composition (Kết hợp hàm)

**Kết hợp nhiều hàm nhỏ thành hàm lớn hơn.**

```typescript
// Simple composition
const trim = (s: string) => s.trim();
const toLowerCase = (s: string) => s.toLowerCase();
const split = (separator: string) => (s: string) => s.split(separator);

// Manual composition
const processName = (name: string) => {
  return split(" ")(toLowerCase(trim(name)));
};

console.log(processName("  John DOE  ")); // ["john", "doe"]

// Compose utility
function compose<A, B, C>(
  f: (b: B) => C,
  g: (a: A) => B
): (a: A) => C {
  return (a) => f(g(a));
}

const prepareEmail = compose(
  (name: string) => `Dear ${name},`,
  (email: string) => email.split("@")[0]
);

console.log(prepareEmail("john@example.com")); // "Dear john,"
```

#### Currying

**Chuyển function nhiều arguments thành chuỗi function 1 argument.**

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

// Practical: validation rules
const minLength = (min: number) => (value: string) => value.length >= min;
const hasPattern = (pattern: RegExp) => (value: string) => pattern.test(value);

const isValidUsername = (value: string) =>
  minLength(3)(value) && hasPattern(/^[a-zA-Z]+$/)(value);
```

---

## 4.3 Reactive Programming

**Triết lý:** Tổ chức code theo **luồng dữ liệu và sự kiện** — khi data thay đổi, hệ thống tự động propagate.

```typescript
// RxJS Example
import { fromEvent, map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

// Search input reactive stream
const searchInput = document.getElementById('search');

fromEvent(searchInput, 'input')
  .pipe(
    debounceTime(300),               // Chờ 300ms sau keystroke cuối
    map((e) => e.target.value),      // Extract value
    distinctUntilChanged(),          // Chỉ emit nếu khác trước
    switchMap(query => fetch(`/api/search?q=${query}`))  // Cancel request cũ
  )
  .subscribe(results => {
    displayResults(results);         // Auto-update UI
  });
```

**Khi nào dùng:** Real-time data, event handling, UI updates, WebSocket streams.

---

## 4.4 Procedural Programming

**Triết lý:** Tổ chức code theo **quy trình (procedures/functions)**, chạy tuần tự từ trên xuống.

```typescript
// Procedural style
function calculateOrderTotal(items: OrderItem[]): number {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total;
}

function applyDiscount(total: number, discountPercent: number): number {
  return total * (1 - discountPercent / 100);
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Main procedure
function processOrder(items: OrderItem[], discountPercent: number) {
  const total = calculateOrderTotal(items);
  const discounted = applyDiscount(total, discountPercent);
  const formatted = formatCurrency(discounted);
  console.log(`Total: ${formatted}`);
}
```

**Ưu điểm:** Đơn giản, dễ hiểu cho chương trình nhỏ.

---

## 4.5 Declarative vs Imperative

### Imperative (Thủ tục)
**Chỉ CÁCH làm** — telling the computer step by step.

```typescript
// Imperative: HOW to do it
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const result = [];

for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    result.push(numbers[i] * 2);
  }
}
// result = [4, 8, 12, 16, 20]
```

### Declarative (Khai báo)
**Mô tả CÁI GÌ cần** — letting the computer figure out how.

```typescript
// Declarative: WHAT to do
const result = numbers
  .filter(n => n % 2 === 0)
  .map(n => n * 2);
// result = [4, 8, 12, 16, 20]
```

**So sánh:**
| Aspect | Imperative | Declarative |
|--------|-----------|-------------|
| Focus | HOW (cách làm) | WHAT (kết quả) |
| Readability | Longer, more steps | Concise, expressive |
| Mutability | Often mutates state | Avoids mutation |
| Examples | for loops, while | map, filter, reduce, SQL, HTML |

---

## 4.6 Concurrent & Parallel Programming

### Concurrent (Song song)

Nhiều task **xen kẽ**执行 trên cùng 1 core — context switching tạo cảm giác đồng thời.

```typescript
// JavaScript Event Loop — Concurrent
async function fetchUsers() {
  const response = await fetch('/api/users');   // Task 1 starts
  return response.json();
}

async function fetchPosts() {
  const response = await fetch('/api/posts');   // Task 2 starts
  return response.json();
}

// Both run concurrently (not sequentially)
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);
```

### Parallel (Song song thực sự)

Nhiều task chạy **đồng thời** trên nhiều cores.

```typescript
// Web Workers — True Parallelism
const worker1 = new Worker('worker.js');
const worker2 = new Worker('worker.js');

worker1.postMessage({ data: largeDataset1 });
worker2.postMessage({ data: largeDataset2 });

// Each worker runs on a separate thread/core
```

### Async/Await Pattern

```typescript
// Sequential — slower
async function sequential() {
  const user = await fetchUser();      // 1s
  const posts = await fetchPosts();    // 1s
  return { user, posts };              // Total: 2s
}

// Concurrent — faster
async function concurrent() {
  const [user, posts] = await Promise.all([
    fetchUser(),    // 1s
    fetchPosts()    // 1s (runs in parallel)
  ]);
  return { user, posts }; // Total: ~1s
}
```

---

## Bảng So Sánh Các Paradigms

| Paradigm | Cốt Lõi | Best For |
|----------|---------|----------|
| **OOP** | Objects, classes, inheritance |大型 projects, UI frameworks |
| **FP** | Pure functions, immutability | Data transformation, concurrent |
| **Reactive** | Streams, async data | Real-time apps, UI events |
| **Procedural** | Step-by-step instructions | Simple scripts, utilities |
| **Imperative** | HOW to do it | Low-level operations |
| **Declarative** | WHAT to achieve | SQL, HTML, build configs |