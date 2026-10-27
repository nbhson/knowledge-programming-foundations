# 🧠 4.4 Procedural Programming (Lập Trình Thủ Tục)

> **Procedural Programming** là cách tổ chức code thành các **hàm/procedure** thực hiện tuần tự các bước. Đây là paradigm cổ điển nhất, dễ hiểu và phù hợp cho các tác vụ đơn giản.

---

## Tư duy cốt lõi

Procedural programming chia chương trình thành **các procedure (hàm)** thực hiện một nhiệm vụ cụ thể. Mỗi procedure nhận input, xử lý, và trả về output (hoặc mutate state).

**Khác với OOP:** Không có object, không có encapsulation — chỉ có function và global/local state.
**Khác với FP:** Không yêu cầu pure functions, có thể có side effects.

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

---

## Đặc Điểm Cốt Lõi

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

**Ưu điểm procedural:**
- **Dễ hiểu** — đọc từ trên xuống, như hướng dẫn từng bước
- **Dễ debug** — breakpoint ở bất kỳ dòng nào
- **Hiệu suất cao** — không có overhead của class/object

**Nhược điểm procedural:**
- **State lan tỏa** — global variables dễ gây bug
- **Khó reuse** — function phụ thuộc nhiều vào context
- **Khó test** — side effects khó isolate

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

**Khi nào chọn procedural vs OOP:**
- **Procedural** khi: logic đơn giản, ít state, script nhỏ
- **OOP** khi: có nhiều đối tượng có quan hệ, cần encapsulation, mô hình hóa domain

---

## Ưu và Nhược Điểm

| Ưu Điểm | Nhược Điểm |
|---------|------------|
| Dễ hiểu, dễ học | Khó maintain khi code lớn |
| Hiệu suất cao | Hard to reuse code |
| Không cần overhead | State khó quản lý |
| Phù hợp script nhỏ | Khó parallelize |
| Fast prototyping | Không enforce best practices |

---

## Khi Nào Dùng Procedural?

| Scenario | Khuyến Nghị |
|----------|-------------|
| Script nhỏ, one-off | ✅ Procedural đủ |
| Data processing pipeline | ✅ Procedural đơn giản |
| Utility functions | ✅ Procedural |
| Large enterprise app | ❌ Dùng OOP/FP |
| Complex state management | ❌ Dùng OOP/FP |
| Performance-critical path | ✅ Procedural (tối ưu hơn) |

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

**Quy tắc gold:**
- Function ≤ 20 dòng, ≤ 3 levels indentation
- Mỗi function làm 1 việc, đặt tên rõ intent
- Tránh global state — truyền qua parameter

---

## 🔗 Liên Quan

- **4.1 OOP** — Procedural đơn giản hơn OOP
- **4.2 FP** — Procedural có thể kết hợp với FP
- **4.5 Declarative vs Imperative** — Procedural thường imperative

---

## 📚 Tài Liệu Tham Khảo

- 📖 [Procedural Programming - Wikipedia](https://en.wikipedia.org/wiki/Procedural_programming)
- 📖 [Structure and Interpretation of Computer Programs](https://sarabander.github.io/sicp/)
- 📖 [Clean Code - Robert C. Martin (chương functions)](https://www.oreilly.com/library/view/clean-code/9780132350884/)

---

## ▶️ Chạy ví dụ

```bash
cd 04-paradigms/4.4-procedural
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [4.5 Declarative vs Imperative](../4.5-declarative-imperative/README.md)
