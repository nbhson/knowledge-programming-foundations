# 🧠 4.4 Procedural Programming (Lập Trình Thủ Tục)

> **Procedural Programming** là cách tổ chức code thành các **hàm/procedure** thực hiện tuần tự các bước. Đây là paradigm cổ điển nhất, dễ hiểu và phù hợp cho các tác vụ đơn giản.

---

## Đặc Điểm Cốt Lõi

### Cấu Trúc Chương Trình

```typescript
// Procedure (thủ tục) — không trả về giá trị
function printGreeting(name: string): void {
  console.log(`Hello, ${name}!`);
}

// Function — trả về giá trị
function calculateTotal(items: number[]): number {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i];
  }
  return total;
}
```

### Step-by-Step Execution

```typescript
function processOrder(items: OrderItem[], discount: number): string {
  // Bước 1: Tính tổng
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  
  // Bước 2: Áp dụng giảm giá
  const discountedTotal = total * (1 - discount / 100);
  
  // Bước 3: Định dạng kết quả
  const formatted = `$${discountedTotal.toFixed(2)}`;
  
  // Bước 4: In kết quả
  console.log(`Total: ${formatted}`);
  
  return formatted;
}
```

---

## Procedural vs OOP

```typescript
// Procedural approach
function calculateArea(shape: Shape): number {
  if (shape.type === 'circle') {
    return Math.PI * shape.radius ** 2;
  } else if (shape.type === 'rectangle') {
    return shape.width * shape.height;
  }
  return 0;
}

// OOP approach
interface Shape {
  area(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  area() { return Math.PI * this.radius ** 2; }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area() { return this.width * this.height; }
}
```

---

## Ưu và Nhược Điểm

| Ưu Điểm | Nhược Điểm |
|---------|------------|
| Dễ hiểu, dễ học | Khó maintain khi code lớn |
| Hiệu suất cao | Hard to reuse code |
| Không cần overhead | State khó quản lý |
| Phù hợp script nhỏ | Khó parallelize |

---

## Khi Nào Dùng Procedural?

| Scenario | Khuyến Nghị |
|----------|-------------|
| Script nhỏ, one-off | ✅ Procedural đủ |
| Data processing pipeline | ✅ Procedural đơn giản |
| Utility functions | ✅ Procedural |
| Large enterprise app | ❌ Dùng OOP/FP |
| Complex state management | ❌ Dùng OOP/FP |

---

## Thực Hành Tốt

```typescript
// ✅ Mỗi function nên có 1 mục đích
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

// ❌ Tránh function quá dài
function doEverything(data: any): any {
  // 50+ dòng code...
}
```

---

## 🔗 Liên Quan

- **4.1 OOP** — Procedural đơn giản hơn OOP
- **4.2 FP** — Procedural có thể kết hợp với FP

---

## 📚 Tài Liệu Tham Khảo

- 📖 [Procedural Programming - Wikipedia](https://en.wikipedia.org/wiki/Procedural_programming)
- 📖 [Structure and Interpretation of Computer Programs](https://sarabander.github.io/sicp/)

---

## ⏭️ Bài Tiếp Theo

→ [4.5 Declarative vs Imperative](../4.5-declarative-imperative/README.md)
