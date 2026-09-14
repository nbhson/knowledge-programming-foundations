# 🏗️ 5.9.3 Layered Organization

> Gom code theo **tầng (layer)**, gọi nhau đúng MỘT chiều: `Presentation → Service → Data`. Đổi DB hoặc đổi UI không lan ra cả hệ thống, trách nhiệm từng tầng rõ ràng.

---

## 🎯 Cấu trúc

```
src/
├── presentation/   → LyOrderController — nhận request, format phản hồi
├── services/       → LyOrderService   — business logic: đặt hàng, ship
└── data/           → LyOrderData      — storage: orders, stock
        ↑ MŨI TÊN GỌI XUÔI 1 CHIỀU
   Controller → Service → Data
   Data KHÔNG biết Service/Controller tồn tại
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// DATA LAYER — không import tầng trên
class LyOrderData {
  insertOrder(order: OrderRow): void { /* ... */ }
  getStock(id: string): number { /* ... */ }
}

// SERVICE LAYER — chỉ nói chuyện với Data
class LyOrderService {
  constructor(private readonly data: LyOrderData) {}
  ship(id: string): LyOrderResult {
    if (this.data.findOrder(id)?.status !== "pending") return { ok: false, ... };
    this.data.updateOrderStatus(id, "shipped");
    return { ok: true, ... };
  }
}

// PRESENTATION LAYER — ủy thác Service, format kết quả
class LyOrderController {
  constructor(private readonly service: LyOrderService) {}
  handleShip(id: string): string {
    return `[Presentation] ${this.service.ship(id).message}`;
  }
}
```

---

## ✅ Thuận / ⚠️ Phụ

| Thuận | Phụ |
|-------|-----|
| Cùng layer dễ tìm, dễ reuse | Một feature bị spread ra nhiều folder |
| Trách nhiệm tầng rõ ràng | Khó navigate khi project lớn |
| Phù hợp team nhỏ, dự án đơn giản | Đổi feature phải đụng cả 3 tầng |

> 💡 Nhiều dự án lớn kết hợp: **feature ở ngoài, layer ở trong** — xem 5.9.2.

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.9.3-layered-organization
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.10 API Design](../5.10-api-design/README.md)