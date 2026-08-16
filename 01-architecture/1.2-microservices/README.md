# 🧩 1.2 Microservices Architecture

> Tách ứng dụng thành **nhiều service nhỏ, độc lập**, mỗi service có DB riêng, giao tiếp qua network (HTTP, message queue). Scale độc lập, team độc lập, nhưng vận hành phức tạp.

---

## 🎯 Kiến trúc này là gì?

Microservices chia hệ thống thành các service nhỏ theo **bounded context**. Mỗi service: codebase riêng, DB riêng, deploy riêng, team riêng. Giao tiếp qua network.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────┐                                               │
│  │  Client  │                                               │
│  └────┬─────┘                                               │
│       │ HTTP                                                │
│       ▼                                                     │
│  ┌────────────────┐                                         │
│  │  API Gateway   │  (route, auth, rate-limit)              │
│  └───┬────┬────┬──┘                                         │
│      │    │    │                                            │
│      ▼    ▼    ▼                                            │
│  ┌──────┐┌──────┐┌──────┐                                   │
│  │Order ││Payment││User  │   ← mỗi service độc lập          │
│  │Svc   ││Svc   ││Svc   │                                   │
│  └──┬───┘└──┬───┘└──┬───┘                                   │
│     │       │       │                                       │
│     ▼       ▼       ▼                                       │
│  ┌──────┐┌──────┐┌──────┐                                   │
│  │ DB A ││ DB B ││ DB C │   ← mỗi service 1 DB riêng        │
│  └──────┘└──────┘└──────┘                                   │
│                                                             │
│  Giao tiếp: HTTP/REST, gRPC, Message Queue (Kafka...)       │
└─────────────────────────────────────────────────────────────┘
```

> 📌 **Nguyên tắc:** Service không share DB. Muốn dữ liệu của service khác → gọi API của nó.

---

## 📐 Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Service nhỏ, độc lập** | Mỗi service 1 bounded context |
| **DB riêng** | Không share DB giữa service |
| **Giao tiếp qua network** | HTTP, gRPC, message queue |
| **Deploy độc lập** | Deploy service riêng, không ảnh hưởng nhau |
| **Team độc lập** | Mỗi team sở hữu 1+ service |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô tả **E-commerce Microservices**:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────┐   HTTP   ┌──────────────────┐         │
│  │  OrderService    │ ───────▶ │  PaymentService  │         │
│  │  (port 3001)     │          │  (port 3002)     │         │
│  └──────────────────┘          └──────────────────┘         │
│                                                             │
│  Mỗi service: codebase riêng, DB riêng, deploy riêng        │
│  Giao tiếp qua HTTP (network)                               │
└─────────────────────────────────────────────────────────────┘
```

- **OrderService:** gọi PaymentService qua HTTP
- **PaymentService:** xử lý thanh toán độc lập
- **Giao tiếp:** HTTP request/response (network call)

> 💡 Trong demo dùng HTTP trực tiếp. Thực tế thường qua API Gateway + service discovery.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 📈 **Scale độc lập** | Scale service tải cao, không scale toàn bộ |
| 👥 **Team độc lập** | Team tự chọn công nghệ, deploy riêng |
| 🛡️ **Cô lập lỗi** | 1 service lỗi không sập toàn hệ thống |
| 🔄 **Deploy nhanh** | Deploy service nhỏ, ít rủi ro |
| 🧩 **Công nghệ đa dạng** | Service dùng ngôn ngữ phù hợp riêng |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🌐 **Phức tạp network** | Latency, timeout, retry, circuit breaker |
| 🔀 **Distributed transaction** | Khó đảm bảo consistency giữa service |
| 🐛 **Debug khó** | Trace qua nhiều service, log phân tán |
| 🏗️ **Hạ tầng phức tạp** | Service discovery, load balancer, monitoring |
| 💰 **Chi phí cao** | Nhiều service = nhiều tài nguyên vận hành |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Hệ thống lớn, nhiều team, scale độc lập | ✅ Phù hợp |
| Cần deploy độc lập từng phần | ✅ Phù hợp |
| Công nghệ khác nhau cho từng phần | ✅ Phù hợp |
| Dự án nhỏ, team ít | ❌ Overkill, Monolith tốt hơn |
| Chưa có hạ tầng vận hành (CI/CD, monitoring) | ❌ Chưa nên |

---

## 🔗 Liên quan

- **1.1 Monolithic** — Đối lập: 1 codebase, 1 deploy
- **1.14 Modular Monolith** — Bước đệm: ranh giới module, deploy 1 unit
- **1.10 Event-Driven** — Cách giao tiếp bất đồng bộ giữa service
- **1.8 CQRS** — Tách read/write model trong service

---

## 📁 Cấu trúc thư mục ví dụ

```
1.2-microservices/
├── README.md           # File này
└── examples/
    └── index.ts        # E-commerce demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 01-architecture/1.2-microservices
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Microservices - Martin Fowler](https://martinfowler.com/articles/microservices.html)
- 📖 [Microservices - microservices.io](https://microservices.io/)
- 📖 [Microservices - AWS](https://aws.amazon.com/microservices/)

---

## ⏭️ Bài tiếp theo

→ [1.3 Clean Architecture](../1.3-clean-architecture/README.md)