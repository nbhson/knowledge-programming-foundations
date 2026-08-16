# 🧱 1.14 Modular Monolith

> Một deployment unit như Monolith, nhưng bên trong chia thành **module biệt lập** theo bounded context. Giao tiếp qua interface rõ ràng. Cầu nối giữa Monolith và Microservices.

---

## 🎯 Kiến trúc này là gì?

Modular Monolith giữ sự đơn giản của Monolith (1 codebase, 1 deploy) nhưng áp dụng **ranh giới module nghiêm ngặt** như Microservices. Mỗi module độc lập về code, có thể tách thành service riêng sau này.

```
┌─────────────────────────────────────────────────────────────┐
│              MODULAR MONOLITH APPLICATION                   │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │  MODULE:      │  │  MODULE:      │  │  MODULE:      │    │
│  │  Orders       │  │  Payment      │  │  Users        │    │
│  │               │  │               │  │               │    │
│  │  OrderService │  │ PaymentService│  │ UserService   │    │
│  │  OrderRepo    │  │ PaymentRepo   │  │ UserRepo      │    │
│  └──────┬────────┘  └──────┬────────┘  └──────┬────────┘    │
│         │                  │                  │             │
│         └─────── giao tiếp qua interface ─────┘             │
│                 (in-process, không network)                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           1 DATABASE (schema tách module)           │    │
│  │  orders.*  │  payments.*  │  users.*               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Deploy: 1 unit (như Monolith)                              │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Khác Monolith:** Module có ranh giới rõ, không gọi thẳng class của nhau. **Khác Microservices:** Giao tiếp in-process, 1 DB, 1 deploy.

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **1 deployment unit** | Deploy toàn bộ 1 lần |
| **Module độc lập** | Mỗi module có service, repo, schema riêng |
| **Giao tiếp qua interface** | Module A gọi Module B qua public interface, không đụng internal |
| **1 DB, nhiều schema** | Schema tách theo module, không share bảng |
| **Dễ migrate** | Tách module thành service riêng khi cần |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **Mini Shop**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │  OrdersModule    │   │  InventoryModule │                │
│  │  (tạo đơn hàng)  │──▶│  (reserve stock) │                │
│  └──────────────────┘   └──────────────────┘                │
│  ┌──────────────────┐                                       │
│  │  UsersModule     │                                       │
│  │  (lấy email)     │◀── OrdersModule gọi qua interface     │
│  └──────────────────┘                                       │
│                                                             │
│  OrdersModule chỉ biết interface (InventoryPort, UserPort)  │
│  — không import class internal của module khác              │
└─────────────────────────────────────────────────────────────┘
```

- **Module Orders:** `OrdersModule` (tạo đơn, gọi Inventory/Users qua interface)
- **Module Inventory:** `InventoryModule` (reserve stock, getStock)
- **Module Users:** `UsersModule` (getEmail)
- **Giao tiếp:** OrdersModule gọi InventoryModule/UsersModule qua interface công khai

> 💡 Muốn tách Inventory thành microservice? Chỉ cần thay interface call bằng HTTP/event call — phần còn lại giữ nguyên.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🚀 **Deploy đơn giản** | 1 unit, không cần orchestration |
| 🧩 **Ranh giới rõ** | Module tách biệt, ít conflict code |
| 🔄 **Dễ migrate sang microservices** | Ranh giới đã có sẵn |
| 🐛 **Debug dễ hơn microservices** | In-process, không network |
| 💰 **Chi phí vận hành thấp** | Không cần broker, service discovery |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 💥 **Single point of failure** | 1 lỗi ảnh hưởng toàn hệ thống |
| 🧠 **Cần kỷ luật** | Module dễ "thân nhau quá" nếu không kiểm soát |
| 📈 **Scale toàn bộ** | Không scale từng module riêng |
| 🏗️ **DB vẫn 1** | Khó scale DB độc lập theo module |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Team vừa, muốn ranh giới rõ nhưng deploy đơn giản | ✅ Rất phù hợp |
| Đang Monolith, muốn chuẩn bị tách microservices | ✅ Rất phù hợp |
| Chưa đủ hạ tầng vận hành microservices | ✅ Phù hợp |
| Hệ thống cực lớn, cần scale độc lập từng phần | ❌ Microservices phù hợp hơn |

---

## 🔗 Liên quan

- **1.1 Monolithic** — Tiền thân: không có ranh giới module
- **1.2 Microservices** — Đích đến: tách module thành service riêng
- **1.7 DDD** — Ranh giới module = Bounded Context

---

## 📁 Cấu trúc thư mục ví dụ

```
1.14-modular-monolith/
├── README.md           # File này
└── examples/
    └── index.ts        # Mini Shop demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.14-modular-monolith
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Modular Monolith - Martin Fowler](https://martinfowler.com/bliki/ModularMonolith.html)
- 📖 [Modular Monolith - microservices.io](https://microservices.io/patterns/monolithic/modular-monolith.html)

---

## ⏭️ Bài tiếp theo

→ [02-design-patterns](../02-design-patterns/README.md)