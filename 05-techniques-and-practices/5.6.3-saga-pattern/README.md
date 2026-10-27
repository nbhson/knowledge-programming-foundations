# 🧵 5.6.3 Saga Pattern

> **Saga Pattern** quản lý **distributed transaction** trong kiến trúc microservice: một nghiệp vụ trải qua nhiều service, mỗi bước có **hành động bù trừ (compensation)** — nếu bước nào fail, chạy ngược các bước đã xong để **rollback**.

---

## 🎯 Vấn đề

Transaction trong 1 database (ACID) không áp dụng được khi dữ liệu nằm rải rác ở **nhiều microservice, nhiều DB**. Ví dụ đặt hàng:

1. **Order Service** — tạo đơn hàng
2. **Payment Service** — trừ tiền
3. **Inventory Service** — giảm kho
4. **Shipping Service** — tạo vận đơn

Nếu bước 4 fail, ta không thể "rollback" bằng `BEGIN...COMMIT` toàn cục — phải chạy **bù trừ**: huỷ vận đơn → tăng lại kho → hoàn tiền → huỷ đơn.

```
✅ Choreography (phân tán, qua event)          ✅ Orchestration (tập trung, 1 coordinator)
Order ─▶ event ─▶ Payment ─▶ event ─▶ Inv      SagaCoordinator
  ▲                 │                ▲           │ step1(Order)   ──▶ fail ─┐
  │                 ▼                │           │ step2(Payment) ──▶ ok   ┐│
  └──── event ◀─ Shipping ◀─ event ──┘           │ step3(Inv)     ──▶ fail ┐││
   mỗi service tự biết bù trừ                    │ step4(Shipping)         ┐│││
                                                 └── compensation ngược ◀─┘│││
```

---

## 🧩 2 cách triển khai

| Cách | Mô tả | Ưu | Nhược |
|------|-------|----|-------|
| **Choreography** | Mỗi service lắng nghe event & tự phát transaction tiếp theo; khi fail tự bù trừ | Đơn giản, ít dependency giữa service | Khó theo dõi toàn cục, logic phân tán |
| **Orchestration** | 1 **Saga Coordinator** điều khiển từng bước, theo dõi trạng thái, quyết định compensation | Rõ ràng, tập trung, dễ test | Coordinator là single point / bottleneck |

### Bảng bù trừ (compensation table)

| Bước | Hành động | Bù trừ (nếu fail sau đó) |
|------|-----------|---------------------------|
| 1. Tạo order | `createOrder()` | `cancelOrder()` |
| 2. Trừ tiền | `debit() -> paymentId` | `refund(paymentId)` |
| 3. Giảm kho | `reserveStock()` | `releaseStock()` |
| 4. Tạo vận đơn | `createShipment()` | `cancelShipment()` |

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
type CompensableStep = {
  name: string;
  run: () => void;        // thao tác chính
  compensate: () => void; // thao tác bù trừ
};

function runSaga(steps: CompensableStep[]): void {
  const done: CompensableStep[] = [];

  for (const step of steps) {
    try {
      step.run();
      done.push(step);
    } catch (err) {
      console.log(`❌ ${step.name} fail — bắt đầu compensation ngược`);
      for (const d of done.reverse()) d.compensate();
      return;
    }
  }
  console.log("🎉 Saga hoàn tất — tất cả bước thành công");
}

runSaga([
  { name: "createOrder",    run: () => log("Tạo đơn ✓"),        compensate: () => log("Huỷ đơn ↺") },
  { name: "debit",          run: () => log("Trừ tiền ✓"),       compensate: () => log("Hoàn tiền ↺") },
  { name: "reserveStock",   run: () => log("Giảm kho ✓"),       compensate: () => log("Tăng lại kho ↺") },
  { name: "createShipment", run: () => { throw new Error("Shipper quá tải"); }, compensate: () => log("Huỷ vận đơn ↺") },
]);
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🧱 **Không cần 2PC** | Tránh lock toàn cục tốn kém (two-phase commit) |
| 🎯 **Nhất quán cuối cùng** | Cuối cùng dữ liệu đúng qua bù trừ |
| 🔌 **Phù hợp microservice** | Mỗi service tự sở hữu transaction của mình |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🌀 **Phức tạp** | Phải viết compensation cho mọi bước, logic khó |
| 👀 **Khó debug** | Lỗi nằm dàn trải nhiều service |
| ⏳ **Nhất quán tạm thời** | Giữa các bước có "lỗ hổng" dữ liệu chưa khớp |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Nghiệp vụ trải qua nhiều microservice, nhiều DB | ✅ Chuẩn |
| Cần ACID tuyệt đối trong phạm vi nhỏ | ⚠️ Gom về 1 service dùng transaction thường |
| Flow chỉ 1-2 bước, rủi ro thấp | ⚠️ Saga quá nặng — cân nhắc |

---

## 🔗 Liên quan

- **5.6.1 Circuit Breaker + 5.6.2 Retry** — dùng cho từng bước internal call trong saga
- **5.6.4 Dead Letter Queue** — bước fail cuối cùng có thể đẩy thông báo sang DLQ để xử lý thủ công
- **1.9 Event Sourcing** — khi dùng thêm event log để tái tạo trạng thái saga

---

## 📁 Cấu trúc thư mục

```
5.6.3-saga-pattern/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.6-error-handling-techniques/5.6.3-saga-pattern
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Saga Pattern - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
- 📖 [Caitie McCaffrey - Lessons from Building Sagas](https://www.youtube.com/watch?v=xDuwrtwYHu8)

---

## ⏭️ Bài tiếp theo

→ [5.6.4 Dead Letter Queue](../5.6.4-dead-letter-queue/README.md)