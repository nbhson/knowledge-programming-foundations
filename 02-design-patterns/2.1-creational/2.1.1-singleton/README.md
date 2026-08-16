# 🧊 2.1.1 Singleton Pattern

> Đảm bảo một class **chỉ có duy nhất 1 instance** và cung cấp **điểm truy cập toàn cục** đến instance đó.

---

## 🎯 Vấn đề

Một số tài nguyên chỉ nên có **1 instance** trong toàn ứng dụng:

- **Database connection** — mở nhiều connection lãng phí
- **Logger** — cần ghi log tập trung
- **Configuration** — config toàn cục, đọc 1 lần
- **Thread pool** — quản lý tài nguyên tập trung

```
❌ VẤN ĐỀ: Nhiều instance
┌─────────┐  ┌─────────┐  ┌─────────┐
│ DB Conn │  │ DB Conn │  │ DB Conn │  ← 3 connection, lãng phí
└─────────┘  └─────────┘  └─────────┘

✅ GIẢI PHÁP: Singleton
┌─────────┐
│ DB Conn │  ← chỉ 1 instance, mọi nơi dùng chung
└─────────┘
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────┐
│              Singleton                      │
│─────────────────────────────────────────────│
│  - instance: Singleton                      │
│─────────────────────────────────────────────│
│  + getInstance(): Singleton                 │
│  + businessMethod(): void                   │
│  - constructor()                            │
│─────────────────────────────────────────────│
│  • static instance = null                   │
│  • getInstance(): nếu null → tạo mới        │
│  • constructor private → không new ngoài    │
└─────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Client A ──getInstance()──▶ ┌────────────┐
                            │ instance = │
Client B ──getInstance()──▶ │   null?    │
                            └─────┬──────┘
                                  │ null → tạo mới
                                  │ có sẵn → trả về
                                  ▼
                            ┌────────────┐
                            │ 1 instance │
                            │  duy nhất  │
                            └────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private connected = false;

  // Constructor private → không thể `new` từ bên ngoài
  private constructor() {}

  // Điểm truy cập toàn cục
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  connect() {
    if (!this.connected) {
      console.log("Connecting to database...");
      this.connected = true;
    }
  }
}

// Sử dụng
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true — cùng 1 instance
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **1 instance duy nhất** | Kiểm soát chặt tài nguyên |
| 🌍 **Truy cập toàn cục** | Mọi nơi đều lấy được instance |
| 💾 **Lazy initialization** | Chỉ tạo khi thực sự cần |
| 🚀 **Hiệu quả** | Không tạo lại object tốn kém |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🌐 **Global state** | Khó test (state dùng chung giữa test) |
| 🔗 **Tight coupling** | Class gọi trực tiếp Singleton, khó thay thế |
| 🧵 **Thread safety** | Cần xử lý nếu multi-thread |
| 🐛 **Ẩn dependency** | Khó thấy class nào phụ thuộc gì |

> 💡 **Lưu ý:** Nhiều người coi Singleton là **anti-pattern** vì global state. Cân nhắc dùng **Dependency Injection** thay thế khi có thể.

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Logger toàn cục | ✅ Phù hợp |
| Config toàn cục | ✅ Phù hợp |
| DB connection pool | ✅ Phù hợp |
| Cần testable, inject dependency | ⚠️ Dùng DI thay thế |
| Multi-thread, cần thread-safe | ⚠️ Cân nhắc kỹ |

---

## 🔗 Liên quan

- **2.1.2 Factory Method** — Singleton thường được tạo qua Factory
- **2.2.4 Proxy** — Proxy có thể dùng Singleton để quản lý instance
- **2.3.1 Observer** — Event bus thường là Singleton

---

## 📁 Cấu trúc thư mục

```
2.1.1-singleton/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.1-creational/2.1.1-singleton
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Singleton - Refactoring Guru](https://refactoring.guru/design-patterns/singleton)
- 📖 [Singleton - Source Making](https://sourcemaking.com/design_patterns/singleton)

---

## ⏭️ Bài tiếp theo

→ [2.1.2 Factory Method](../2.1.2-factory-method/README.md)