/**
 * 3.2.4 ISP (Interface Segregation Principle) - Demo
 *
 * Nhiều interface nhỏ, chuyên biệt hơn 1 interface to.
 * Client không nên phụ thuộc method nó không dùng.
 */

// --- ❌ BAD: 1 interface to, Robot phải implement method "câm" ---
interface WorkerBad {
  work(): void;
  eat(): void;
  sleep(): void;
}

class RobotBad implements WorkerBad {
  work(): void {
    console.log("🤖 Robot working");
  }
  eat(): void {
    throw new Error("Robot doesn't eat 🤷");
  }
  sleep(): void {
    throw new Error("Robot doesn't sleep 🤷");
  }
}

// --- ✅ GOOD: interface nhỏ, chuyên biệt ---
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

class Robot implements Workable {
  work(): void {
    console.log("🤖 Robot working");
  }
}

class Human implements Workable, Eatable, Sleepable {
  work(): void {
    console.log("👨 Human working");
  }
  eat(): void {
    console.log("🍽️ Human eating");
  }
  sleep(): void {
    console.log("😴 Human sleeping");
  }
}

// --- Demo ---
console.log("=== ISP Demo ===");
console.log("");

// GOOD: Robot chỉ implement Workable — không có method "câm"
const robot = new Robot();
robot.work();
console.log("");

const human = new Human();
human.work();
human.eat();
human.sleep();
console.log("");

console.log("📊 So sánh:");
console.log("   BAD:  RobotBad phải implement eat(), sleep() → ném exception");
console.log("   GOOD: Robot chỉ implement Workable → không method thừa");
console.log("");

console.log("🔧 Lợi ích: class gọn, không method 'câm', dễ mở rộng");
console.log("");

console.log("✅ ISP: interface nhỏ, chuyên biệt — client chỉ dùng cái cần");

export {};