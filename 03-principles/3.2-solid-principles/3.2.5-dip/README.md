# 🔀 3.2.5 DIP — Dependency Inversion Principle

> **Phụ thuộc abstraction, không phụ thuộc cụ thể.**
> Module cấp cao không nên phụ thuộc module cấp thấp — cả hai phụ thuộc abstraction.

---

## 🎯 Vấn đề

Class cấp cao tạo trực tiếp class cấp thấp:

- **Khó đổi** — đổi database phải sửa class service
- **Khó test** — không mock được database thật
- **Ràng buộc cứng** — service gắn chặt với implementation

```
❌ VI PHẠM DIP                      ✅ TUÂN THỦ DIP
┌─────────────────────┐            ┌─────────────────────┐
│ UserService         │            │ UserService         │
│  └─ new MySQL()     │  ──DIP──▶  │  └─ UserRepository  │
│       (cụ thể)      │            │       (abstraction) │
│                     │            │  ├─ MySQLRepo       │
│  đổi PostgreSQL     │            │  └─ PostgresRepo    │
│  → sửa UserService  │            │  // đổi = đổi class  │
└─────────────────────┘            │  // không sửa service│
                                   └─────────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: UserService tạo trực tiếp MySQLDatabase
class UserService {
  private db = new MySQLDatabase(); // cụ thể, khó đổi
}

// ✅ GOOD: phụ thuộc interface UserRepository
class UserService {
  constructor(private db: UserRepository) {} // abstraction
}
// đổi database → truyền class khác, không sửa UserService
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🔀 **Linh hoạt** | Đổi implementation không sửa code cấp cao |
| 🧪 **Dễ test** | Mock abstraction dễ dàng |
| 🔧 **Dễ mở rộng** | Thêm implementation mới không vỡ code cũ |
| 📖 **Rõ ràng** | Phụ thuộc được khai báo qua constructor |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Service tạo trực tiếp database/API | ✅ Inject qua constructor |
| Cần mock khi test | ✅ Dùng interface |
| Nhiều implementation cho 1 chức năng | ✅ Dùng interface |
| Class nhỏ, không cần đổi | ⚠️ Đừng over-engineer |

> 💡 **Kiểm tra:** "Class cấp cao có tạo trực tiếp class cấp thấp không?"

---

## 🔗 Liên quan

- **2.2.1 Adapter** — Pattern chuyển interface, hỗ trợ DIP
- **2.2.4 Proxy** — Pattern kiểm soát truy cập qua abstraction
- **3.2.2 OCP** — DIP giúp mở rộng không sửa code cũ
- **1.5 Hexagonal Architecture** — Kiến trúc dựa trên DIP

---

## 📁 Cấu trúc thư mục

```
3.2.5-dip/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.2-solid-principles/3.2.5-dip
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Dependency Inversion Principle - Wikipedia](https://en.wikipedia.org/wiki/Dependency_inversion_principle)

---

## ⏭️ Tiếp theo

→ [04-paradigms](../../04-paradigms/README.md)