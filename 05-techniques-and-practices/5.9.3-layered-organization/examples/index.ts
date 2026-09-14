/**
 * 5.9.3 Layered Organization — Demo
 *
 * Gom code theo TẦNG (layer), gọi nhau đúng MỘT chiều:
 *     Presentation → Service → Data
 *   - Data layer        : truy cập storage, không biết tầng trên
 *   - Service layer     : business logic, nói chuyện với Data layer
 *   - Presentation layer: nhận request, ủy thác Service, định dạng phản hồi
 * Giữ nguyên chiều gọi → đổi DB hoặc đổi UI không lan ra cả hệ thống.
 */

// ─── DATA LAYER: nắm storage — KHÔNG biết Service/Presentation tồn tại ───
type LyOrderRow = { id: string; customerId: string; total: number; status: "pending" | "shipped" };
type LyProductStockRow = { id: string; qty: number };

class LyOrderData {
  private orders = new Map<string, LyOrderRow>();
  private stock = new Map<string, LyProductStockRow>();

  seedStock(id: string, qty: number): void {
    this.stock.set(id, { id, qty });
  }

  insertOrder(order: LyOrderRow): void {
    this.orders.set(order.id, order);
  }

  findOrder(id: string): LyOrderRow | undefined {
    return this.orders.get(id);
  }

  updateOrderStatus(id: string, status: LyOrderRow["status"]): void {
    const order = this.orders.get(id);
    if (order) this.orders.set(id, { ...order, status });
  }

  getStock(id: string): number {
    return this.stock.get(id)?.qty ?? 0;
  }

  decreaseStock(id: string, amount: number): void {
    const current = this.stock.get(id);
    if (current) this.stock.set(id, { ...current, qty: current.qty - amount });
  }
}

// ─── SERVICE LAYER: business logic — chỉ nói chuyện với Data layer ───
interface LyOrderResult {
  ok: boolean;
  message: string;
  order?: LyOrderRow;
}

class LyOrderService {
  constructor(private readonly data: LyOrderData) {}

  placeOrder(id: string, customerId: string, productId: string, total: number): LyOrderResult {
    const stock = this.data.getStock(productId);
    if (stock <= 0) {
      return { ok: false, message: "Hết hàng, không đặt được" };
    }
    this.data.decreaseStock(productId, 1);
    this.data.insertOrder({ id, customerId, total, status: "pending" });
    return { ok: true, message: "Đã đặt hàng và trừ kho" };
  }

  ship(id: string): LyOrderResult {
    const order = this.data.findOrder(id);
    if (!order) return { ok: false, message: "Không tồn tại đơn hàng" };
    if (order.status !== "pending") return { ok: false, message: `Đơn đã ${order.status}` };
    this.data.updateOrderStatus(id, "shipped");
    return { ok: true, message: "Đơn hàng đã giao" };
  }

  get(id: string): LyOrderResult {
    const order = this.data.findOrder(id);
    return order ? { ok: true, message: "Tìm thấy đơn", order } : { ok: false, message: "Không tồn tại" };
  }
}

// ─── PRESENTATION LAYER: nhận request → ủy thác Service → định dạng kết quả ───
class LyOrderController {
  constructor(private readonly service: LyOrderService) {}

  handlePlaceOrder(id: string, customerId: string, productId: string, total: number): string {
    return `[Presentation] ${this.service.placeOrder(id, customerId, productId, total).message}`;
  }

  handleShip(id: string): string {
    return `[Presentation] ${this.service.ship(id).message}`;
  }

  handleGet(id: string): string {
    const result = this.service.get(id);
    return result.order
      ? `[Presentation] đơn ${result.order.id}: total=${result.order.total}, status=${result.order.status}`
      : `[Presentation] ${result.message}`;
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Layered Organization Demo ===");
console.log("");

console.log("📁 Cấu trúc theo layer:");
console.log("  presentation/ → LyOrderController (nhận request, format phản hồi)");
console.log("  services/     → LyOrderService  (business logic: đặt hàng, ship)");
console.log("  data/         → LyOrderData     (storage: orders, stock)");
console.log("");

const lyData = new LyOrderData();
lyData.seedStock("p1", 5);
const lyService = new LyOrderService(lyData);
const lyController = new LyOrderController(lyService);

console.log("✅ Chiều gọi: Controller → Service → Data (đọc xuôi, không đi ngược lên):");
console.log(`  ${lyController.handlePlaceOrder("ord-1", "cust-7", "p1", 1500000)}`);
console.log(`  ${lyController.handleGet("ord-1")}`);
console.log(`  ${lyController.handleShip("ord-1")}`);
console.log(`  ${lyController.handleGet("ord-1")}`);
console.log("");

console.log("🔀 Thử ngược chiều (Data tìm 'order' mà không biết ai đặt) → chỉ có thể qua service:");
const lyDataAgain = lyData.findOrder("ord-1");
console.log(`  → Data layer chỉ trả raw row: ${lyDataAgain ? `${lyDataAgain.id} / ${lyDataAgain.status}` : "không có"} — không in message 'đẹp' kiểu Presentation`);
console.log("  💬 Data KHÔNG import Service/Controller → thay PostgreSQL bằng Redis chỉ sửa 1 tầng");
console.log("");

console.log("⚖️ SO SÁNH 5.9.2 vs 5.9.3:");
console.log("  Feature-based: mỗi feature 1 folder (auth/, users/, products/) — xem 5.9.2");
console.log("  Layered:       mỗi tầng 1 folder (presentation/, services/, data/) — bài này");
console.log("  → Dự án lớn nhiều team thường kết hợp: feature ở ngoài, layer ở trong.");
console.log("");
console.log("✅ Layered: gom theo tầng, gọi đúng 1 chiều → đổi DB/UI không vỡ nhau, trách nhiệm từng tầng rõ ràng");
console.log("");

export {};