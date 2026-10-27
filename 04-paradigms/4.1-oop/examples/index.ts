/**
 * 4.1 OOP (Object-Oriented Programming) — 4 Pillars Demo
 *
 * Minh họa 4 trụ cột của OOP:
 * 1. Encapsulation (Đóng gói)   — ẩn trạng thái, chỉ truy cập qua method
 * 2. Inheritance (Kế thừa)      — class con thừa hưởng class cha
 * 3. Polymorphism (Đa hình)     — nhiều class cùng 1 interface
 * 4. Abstraction (Trừu tượng)   — ẩn chi tiết, chỉ expose interface cần thiết
 */

// ───────────────────────────── 1. Encapsulation ─────────────────────────────
class BankAccount {
  private balance: number = 0;

  deposit(amount: number): void {
    if (amount <= 0) throw new Error("Số tiền phải dương");
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount > this.balance) throw new Error("Không đủ số dư");
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

// ───────────────────────────── 2. Inheritance ───────────────────────────────
class Animal {
  constructor(protected name: string) {}

  eat(): void {
    console.log(`  ${this.name} đang ăn`);
  }

  sleep(): void {
    console.log(`  ${this.name} đang ngủ`);
  }
}

class Dog extends Animal {
  bark(): void {
    console.log(`  ${this.name} sủa: Gâu gâu!`);
  }
}

class Cat extends Animal {
  meow(): void {
    console.log(`  ${this.name} kêu: Meo meo!`);
  }
}

// ──────────────────────────── 3. Polymorphism ───────────────────────────────
abstract class Shape {
  abstract area(): number;
  abstract describe(): string;
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }
  area(): number {
    return Math.PI * this.radius ** 2;
  }
  describe(): string {
    return `Hình tròn bán kính ${this.radius}`;
  }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super();
  }
  area(): number {
    return this.width * this.height;
  }
  describe(): string {
    return `Hình chữ nhật ${this.width}x${this.height}`;
  }
}

function printShapeInfo(shape: Shape): void {
  console.log(`  ${shape.describe()} → diện tích ${shape.area().toFixed(2)}`);
}

// ─────────────────────────── 4. Abstraction ─────────────────────────────────
interface Engine {
  start(): void;
  stop(): void;
  getRPM(): number;
}

class TurboEngine implements Engine {
  private rpm: number = 0;

  start(): void {
    this.rpm = 800;
    console.log("  Động cơ khởi động (bên trong điều chỉnh nhiên liệu...)");
  }

  stop(): void {
    this.rpm = 0;
    console.log("  Động cơ dừng");
  }

  getRPM(): number {
    return this.rpm;
  }
}

// User chỉ cần biết interface Engine, không cần biết chi tiết bên trong
function driveCar(engine: Engine): void {
  engine.start();
  console.log(`  RPM hiện tại: ${engine.getRPM()}`);
  engine.stop();
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== OOP Demo ===");
console.log("");

console.log("1️⃣ Encapsulation (Đóng gói):");
const account = new BankAccount();
account.deposit(100);
account.withdraw(30);
console.log(`  Số dư: ${account.getBalance()}`);
// account.balance = 999999; // ❌ Lỗi strict: property 'balance' is private
console.log("");

console.log("2️⃣ Inheritance (Kế thừa):");
const dog = new Dog("Buddy");
const cat = new Cat("Miu");
dog.eat(); // kế thừa từ Animal
dog.bark(); // method riêng của Dog
cat.sleep(); // kế thừa từ Animal
cat.meow(); // method riêng của Cat
console.log("");

console.log("3️⃣ Polymorphism (Đa hình):");
printShapeInfo(new Circle(5));
printShapeInfo(new Rectangle(4, 6));
console.log("");

console.log("4️⃣ Abstraction (Trừu tượng hóa):");
driveCar(new TurboEngine());
console.log("");

console.log("✅ OOP tổ chức code theo đối tượng với 4 trụ cột: đóng gói, kế thừa, đa hình, trừu tượng hóa");
export {};
