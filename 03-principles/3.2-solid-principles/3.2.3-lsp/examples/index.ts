/**
 * 3.2.3 LSP (Liskov Substitution Principle) - Demo
 *
 * Class con thay thế được class cha mà không vỡ.
 * Nếu code dùng class cha, đổi sang class con phải chạy đúng.
 */

// --- ❌ BAD: Square extends Rectangle — vỡ hợp đồng ---
class Rectangle {
  protected width: number = 0;
  protected height: number = 0;

  setWidth(w: number) {
    this.width = w;
  }

  setHeight(h: number) {
    this.height = h;
  }

  area(): number {
    return this.width * this.height;
  }
}

class SquareBad extends Rectangle {
  setWidth(w: number) {
    this.width = w;
    this.height = w; // vỡ hợp đồng: setWidth làm đổi height
  }

  setHeight(h: number) {
    this.height = h;
    this.width = h; // vỡ hợp đồng: setHeight làm đổi width
  }
}

// Hàm này đúng với Rectangle nhưng sai với Square
function resizeAndGetArea(rect: Rectangle): number {
  rect.setWidth(5);
  rect.setHeight(10);
  return rect.area(); // Rectangle: 50, SquareBad: 100 → SAI
}

// --- ✅ GOOD: dùng interface chung, mỗi class tự lo ---
interface Shape {
  area(): number;
}

class RectangleGood implements Shape {
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  area(): number {
    return this.width * this.height;
  }
}

class SquareGood implements Shape {
  private side: number;

  constructor(side: number) {
    this.side = side;
  }

  area(): number {
    return this.side * this.side;
  }
}

// --- Demo ---
console.log("=== LSP Demo ===");
console.log("");

// BAD: Square thay Rectangle → kết quả sai
const rect = new Rectangle();
const squareBad = new SquareBad();
console.log(`❌ Rectangle area (5x10) = ${resizeAndGetArea(rect)}`);
console.log(`❌ SquareBad area (5x10) = ${resizeAndGetArea(squareBad)} ← SAI, phải là 25`);
console.log("");

// GOOD: mỗi class tự lo diện tích riêng
const shapes: Shape[] = [
  new RectangleGood(5, 10),
  new SquareGood(5),
];
shapes.forEach((shape) => {
  console.log(`✅ ${shape.constructor.name} area = ${shape.area()}`);
});
console.log("");

console.log("📊 So sánh:");
console.log("   BAD:  SquareBad thay Rectangle → area sai (100 thay vì 50)");
console.log("   GOOD: mỗi class tự lo area → thay thế an toàn");
console.log("");

console.log("🔧 Lợi ích: đổi class con không vỡ code, polymorphism đúng");
console.log("");

console.log("✅ LSP: class con giữ lời hứa class cha, thay thế an toàn");

export {};