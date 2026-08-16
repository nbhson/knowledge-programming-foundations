# 🔄 3.2.3 LSP — Liskov Substitution Principle

> **Class con thay thế được class cha mà không vỡ.**
> Nếu code dùng class cha, đổi sang class con phải chạy đúng.

---

## 🎯 Vấn đề

Class con override làm thay đổi hành vi class cha:

- **Code vỡ âm thầm** — chạy được nhưng sai kết quả
- **Khó debug** — lỗi không rõ nguồn
- **Vi phạm hợp đồng** — class con không giữ lời hứa của class cha

```
❌ VI PHẠM LSP                      ✅ TUÂN THỦ LSP
┌─────────────────────┐            ┌─────────────────────┐
│ Rectangle           │            │ Shape (interface)   │
│  setWidth()         │  ──LSP──▶  │  ├─ Rectangle       │
│  setHeight()        │            │  └─ Square          │
│  └─ Square          │            │  // mỗi class tự lo  │
│     setWidth()      │            │  // diện tích riêng  │
│     setHeight()     │            └─────────────────────┘
└─────────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Square extends Rectangle — setWidth làm đổi height
class Rectangle {
  setWidth(w: number) { this.width = w; }
  setHeight(h: number) { this.height = h; }
}
class Square extends Rectangle {
  setWidth(w: number) { this.width = w; this.height = w; } // vỡ hợp đồng
}

// ✅ GOOD: dùng interface chung, mỗi class tự lo
interface Shape { area(): number; }
class Rectangle implements Shape { area() { return this.width * this.height; } }
class Square implements Shape { area() { return this.side * this.side; } }
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🔧 **An toàn** | Đổi class con không vỡ code |
| 🧪 **Dễ test** | Test 1 lần cho cả cây class |
| 📖 **Đúng hợp đồng** | Class con giữ lời hứa class cha |
| 🔄 **Linh hoạt** | Polymorphism hoạt động đúng |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Class con override thay đổi hành vi cha | ✅ Sửa thiết kế |
| Class con ném exception mới | ✅ Sửa thiết kế |
| Class con trả kết quả khác kiểu | ✅ Sửa thiết kế |
| Class con giữ nguyên hành vi cha | ❌ Không cần sửa |

> 💡 **Kiểm tra:** "Thay class cha bằng class con, code có chạy đúng không?"

---

## 🔗 Liên quan

- **3.1.6 Composition over Inheritance** — Tránh kế thừa sai, hỗ trợ LSP
- **2.2.6 Bridge** — Tách abstraction khỏi implementation
- **3.2.2 OCP** — LSP giúp mở rộng an toàn

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

## ⏭️ Bài tiếp theo

→ [3.2.4 ISP — Interface Segregation Principle](../3.2.4-isp/README.md)