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

## ❌ BAD — thêm 1 case: nhảy tầng + rò rỉ tầng dưới

```typescript
// ❌ BAD — controller chọc thẳng Data (nhảy qua Service) + trả row DB thô ra ngoài
class LyOrderController {
  constructor(private readonly data: LyOrderData) {} // nhảy tầng!
  handleShip(id: string): unknown {
    return this.data.findOrderRow(id); // 💥 lộ schema DB + bypass business rule "pending mới ship được"
  }
}

// ✅ GOOD — đi đúng 1 chiều, mỗi tầng dịch sang ngôn ngữ của mình
class LyOrderController {
  constructor(private readonly service: LyOrderService) {}
  handleShip(id: string): string {
    return `[Presentation] ${this.service.ship(id).message}`; // rule + format đúng chỗ
  }
}
```

> 2 luật tầng: **chỉ gọi tầng ngay dưới** (không nhảy cóc) và **không để kiểu của tầng dưới lọt lên trên** (DB row không ra tới HTTP).

---

## ⚖️ Trade-off: layered vs feature-based (5.9.2)

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| Dự án nhỏ, luồng CRUD chuẩn | ✅ Layered | Ít folder, ai cũng tìm được code |
| Mỗi feature có rule đặc thù, team song song | ⚖️ Feature-based | Layered spread 1 feature ra 3 folder, conflict nhiều |
| Cần đổi DB/UI mà giữ business | ✅ Layered đúng chuẩn | Tầng giữa là điểm tựa thay thế 2 đầu |
| 1 tính năng đụng cả 3 tầng mỗi lần sửa | ⚠️ Dấu hiệu layered đang cản | Cân nhắc feature-slice, hoặc gom thành module dọc |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Nhảy tầng (controller → data) | Business rule bị bypass, test phải mock DB ở controller | Lint/arch-test cấm import ngược tầng (dependency-cruiser) |
| Layer rò rỉ (DB row/ORM entity lên tới response) | Đổi schema vỡ API (xem 5.8.3 DTO) | Mỗi biên tầng có kiểu riêng; biên ngoài cùng dùng DTO |
| Service phình thành "god layer" | Mọi logic dồn vào service, data chỉ CRUD câm | Đẩy rule về domain/entity, service chỉ điều phối |
| Thêm tầng cho có (facade/pass-through) | 5 lớp chuyển tiếp, debug nhảy 5 file | Tầng phải có lý do (đổi được 1 đầu); không thì gộp |

---

## ✅ Checklist khi review

- [ ] Luồng gọi đúng 1 chiều (không nhảy tầng, không gọi ngược)?
- [ ] Không có kiểu DB/ORM lọt lên response (DTO ở biên)?
- [ ] Business rule nằm đúng tầng (không bypass khi đi đường khác)?
- [ ] Không có tầng pass-through vô nghĩa?
- [ ] Arch-test/lint cấm import sai tầng còn xanh?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.9.3-layered-organization
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.10 API Design](../5.10-api-design/README.md)