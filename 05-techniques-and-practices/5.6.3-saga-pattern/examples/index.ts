/**
 * 5.6.3 Saga Pattern — Distributed Transaction với Compensation Demo
 *
 * Một nghiệp vụ trải qua nhiều service (order → payment → inventory → shipping).
 * Mỗi bước có thao tác bù trừ (compensation). Nếu 1 bước fail,
 * chạy NGƯỢC các bước đã thành công để rollback trạng thái.
 */

class SagaStepFailure extends Error {}

interface CompensableStep {
  name: string;
  run: () => void;
  compensate: () => void;
}

function runSaga(steps: CompensableStep[]): void {
  const done: CompensableStep[] = [];

  for (const step of steps) {
    try {
      console.log(`      ▶ ${step.name}: bắt đầu`);
      step.run();
      done.push(step);
      console.log(`        ${step.name} ✓ thành công`);
    } catch (err) {
      console.log(`        ${step.name} ✗ FAIL — ${(err as Error).message}`);
      console.log(`   ↩️  Bắt đầu compensation ngược (${done.length} bước đã chạy):`);
      for (const d of [...done].reverse()) {
        console.log(`        ↺ compensate ${d.name}`);
        d.compensate();
      }
      return;
    }
  }
  console.log("   🎉 Toàn bộ saga thành công — không cần compensation");
}

// ────────────────────────────────── Demo ────────────────────────────────────
console.log("=== 5.6.3 Saga Pattern Demo ===");
console.log("");
console.log("   Saga đặt hàng: createOrder → debit → reserveStock → createShipment");
console.log("");

runSaga([
  {
    name: "createOrder",
    run: () => console.log("        + Tạo đơn hàng #1001"),
    compensate: () => console.log("        - Huỷ đơn hàng #1001"),
  },
  {
    name: "debit",
    run: () => console.log("        + Trừ tiền 500.000đ (paymentId P-88)"),
    compensate: () => console.log("        - Hoàn tiền 500.000đ (P-88)"),
  },
  {
    name: "reserveStock",
    run: () => console.log("        + Giảm kho: Book x 1"),
    compensate: () => console.log("        - Tăng lại kho: Book x 1"),
  },
  {
    name: "createShipment",
    run: () => {
      throw new SagaStepFailure("Shipper quá tải, không tạo được vận đơn");
    },
    compensate: () => console.log("        - (chưa có gì để bù)"),
  },
]);
console.log("");
console.log("   Kết quả: đơn thất bại nhưng hệ thống KHÔNG mất tiền/thiếu kho — mọi bước đã bù trừ");
console.log("");
console.log("   Trường hợp tất cả bước OK:");
runSaga([
  { name: "createOrder", run: () => {}, compensate: () => {} },
  { name: "debit", run: () => {}, compensate: () => {} },
  { name: "reserveStock", run: () => {}, compensate: () => {} },
  { name: "createShipment", run: () => {}, compensate: () => {} },
]);
console.log("");
console.log("✅ Saga đảm bảo nhất quán cuối cùng khi transaction trải nhiều service, không cần 2PC");
export {};