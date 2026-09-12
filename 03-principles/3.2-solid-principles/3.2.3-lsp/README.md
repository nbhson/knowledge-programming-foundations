# 🔄 3.2.3 LSP — Liskov Substitution Principle

> **Class con thay thế được class cha mà không vỡ.**
> Nếu code dùng class cha, đổi sang class con phải chạy đúng. Đây là nguyên tắc đảm bảo tính an toàn của inheritance.

---

## 🎯 Vấn đề

Class con override làm thay đổi hành vi class cha:

- **Code vỡ âm thầm** — chạy được nhưng sai kết quả
- **Khó debug** — lỗi không rõ nguồn, khó reproduce
- **Vi phạm hợp đồng** — class con không giữ lời hứa của class cha
- **Kiểm tra kiểu thiếu** — `instanceof` check cho từng subclass
- **TypeError khi runtime** — casting sai loại object

```
❌ VI PHẠM LSP                              ✅ TUÂN THỦ LSP
┌─────────────────────┐                    ┌─────────────────────┐
│ Rectangle           │                    │ Shape (interface)   │
│  setWidth()         │   ──LSP──▶        │  ├─ Rectangle       │
│  setHeight()        │                    │  └─ Square          │
│  └─ Square          │                    │  // mỗi class tự lo  │
│     setWidth()      │                    │  // diện tích riêng  │
│     setHeight()     │                    └─────────────────────┘
└─────────────────────┘
```

> 📌 **Quy tắc kiểm tra:** "Thay class cha bằng class con, code có chạy đúng không?" Nếu có → tuân thủ LSP.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Square extends Rectangle — setWidth làm đổi height
class Rectangle {
  width: number = 0;
  height: number = 0;
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
}
class Square extends Rectangle {
  setWidth(w: number) { 
    this.width = w; 
    this.height = w; // ⚠️ thay đổi behavior của parent!
  }
  setHeight(h: number) {
    this.width = h;
    this.height = h; // ⚠️ thay đổi behavior của parent!
  }
}

// ✅ GOOD: dùng interface chung, mỗi class tự lo
interface Shape { area(): number; }
class Rectangle implements Shape { 
  constructor(private width: number, private height: number) {}
  area() { return this.width * this.height; }
}
class Square implements Shape {
  constructor(private side: number) {}
  area() { return this.side * this.side; }
}
```

---

## 🔍 Phân tích chi tiết

### Các dạng vi phạm LSP phổ biến

| Dạng vi phạm | Ví dụ | Hậu quả |
|-------------|-------|---------|
| **Precondition yếu hơn** | Child yêu cầu input ít hơn parent | Client không kiểm tra được input |
| **Postcondition yếu hơn** | Child trả về kết quả sai | Logic tính toán bị lỗi |
| **Invariant bị phá vỡ** | Child thay đổi state không thể đoán | State inconsistency |
| **Exception mới** | Child throw exception parent không throw | Client không handle đúng |

### Ví dụ: Violation - Preconditions

```typescript
// ❌ BAD: Bird extends Animal nhưng cannotFly violates LSP
class Animal {
  move() { /* any movement */ }
}
class Bird extends Animal {
  move() { this.fly(); } //鸟类只能飞，违反Animal的移动约定
}
class Penguin extends Bird {
  move() { this.swim(); } //企鹅不能飞，违反了Bird的move契约
}

// Client code không know Penguin không fly được
function makeAnimalMove(animal: Animal) {
  animal.move(); // Penguin.move() throws!
}
```

### Ví dụ: Violation - Postconditions

```typescript
// ❌ BAD: Square.area() không tuân theo Rectangle.area()
class Rectangle {
  width: number;
  height: number;
  area(): number { return this.width * this.height; }
}
class Square extends Rectangle {
  setSide(side: number) {
    this.width = side;
    this.height = side;
  }
  // ⚠️ Khi width != height (qua Rectangle setters), area() vẫn đúng
  // Nhưng nếu client expect width và height độc lập → break
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích | Ví dụ |
|---------|------------|-------|
| 🔧 **An toàn** | Đổi class con không vỡ code | Test một lần cho cả cây class |
| 🧪 **Dễ test** | Test abstraction, không test từng concrete | Mock Shape → test tất cả shape |
| 📖 **Đúng hợp đồng** | Class con giữ lời hứa class cha | Interface contract rõ ràng |
| 🔄 **Linh hoạt** | Polymorphism hoạt động đúng | Array<Shape> chứa Rectangle + Square |
| 🏗️ **Clean Architecture** | Dependency trên abstraction | Domain layer không biết concrete |

---

## 🧠 LSP và Interface Segregation

| Nguyên tắc | Vai trò |
|-----------|---------|
| **LSP** | Đảm bảo subclass thay thế được superclass |
| **ISP** | Đảm bảo interface nhỏ, chỉ có method con cần |
| **Kết hợp** | LSP + ISP = strong type safety |

```typescript
// Kết hợp LSP + ISP
interface CanFly { fly(): void; }
interface CanSwim { swim(): void; }
interface CanRun { run(): void; }

class Bird implements CanFly { fly() { /* ... */ } }
class Fish implements CanSwim { swim() { /* ... */ } }
class Dog implements CanRun { run() { /* ... */ } }

// ✅ Mỗi class chỉ implement interface nó thực sự support
```

---

## ⚠️ Khi nào KHÔNG nên dùng LSP?

| Tình huống | Khuyến nghị | Lý do |
|------------|-------------|-------|
| Class hierarchy đã đúng LSP | ❌ Không sửa | Giữ nguyên design |
| Cần special case behavior | ⚠️ Dùng Strategy pattern | Thay vì inheritance |
| Performance critical | ⚠️ Cân nhắc | Interface overhead small nhưng có |
| Simple enum thay vì hierarchy | ✅ Dùng enum | Đơn giản hơn inheritance |

---

## 🔗 Mối quan hệ với các nguyên tắc khác

| Nguyên tắc | Mối quan hệ |
|-----------|-------------|
| **3.1.6 Composition over Inheritance** | Tránh inheritance sai, hỗ trợ LSP |
| **3.2.2 OCP** | LSP giúp mở rộng an toàn |
| **3.2.4 ISP** | Interface nhỏ giúp enforce hợp đồng đúng |
| **2.2.6 Bridge** | Tách abstraction khỏi implementation |

---

## 🏭 Real-world Example

```typescript
// Video Player System

// ❌ VI PHẠM LSP
abstract class VideoPlayer {
  play(url: string): void { /* ... */ }
  pause(): void { /* ... */ }
}
class FreeVideoPlayer extends VideoPlayer {
  play(url: string): void {
    if (this.hasSubscription()) {
      super.play(url);
    } else {
      throw new Error("Need subscription"); // ⚠️ parent không throw, child throw!
    }
  }
}

// ✅ TUÂN THỦ LSP
abstract class VideoPlayer {
  play(url: string): Promise<void>;
  pause(): void;
}
class FreeVideoPlayer extends VideoPlayer {
  async play(url: string): Promise<void> { /* ... */ }
  pause(): void { /* ... */ }
}
class PremiumVideoPlayer extends VideoPlayer {
  async play(url: string): Promise<void> { /* ... */ }
  pause(): void { /* ... */ }
}
// Cả hai đều遵循同样的 contract，可以互相替换
```

---

## 📁 Cấu trúc thư mục

```
3.2.3-lsp/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.2-solid-principles/3.2.3-lsp
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Liskov Substitution Principle - Wikipedia](https://en.wikipedia.org/wiki/Liskov_substitution_principle)
- 📖 [Refactoring.Guru — LSP](https://refactoring.guru/design-principles/liskov-substitution-principle)
- 📘 *Clean Code* — Robert C. Martin
- 📖 [The Liskov Substitution Principle - Susan Eggers et al.](https://dl.acm.org/doi/10.1145/155136.155145)

---

## ⏭️ Bài tiếp theo

→ [3.2.4 ISP — Interface Segregation Principle](../3.2.4-isp/README.md)
