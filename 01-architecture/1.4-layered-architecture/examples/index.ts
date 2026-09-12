/**
 * 🍰 Layered Architecture — Order Processing Demo
 *
 * 4 layers: Presentation → Business Logic → Persistence → Database
 * Demo giản lược: Business Logic (OrderService) + Persistence (OrderRepository)
 * Quy tắc: lớp trên chỉ gọi lớp dưới, không nhảy tầng.
 */

// ============================================
// ④ DATABASE LAYER — In-memory store (giả lập DB)
// ============================================

interface OrderRow { id: string; items: { productId: string; qty: number; price: number }[]; total: number; status: string; }

class InMemoryDatabase {
  private table = new Map<string, OrderRow>();
  private seq = 0;
  insert(row: Omit<OrderRow, "id">): OrderRow {
    const id = `ord-${++this.seq}`;
    const saved = { ...row, id };
    this.table.set(id, saved);
    return saved;
  }
  findById(id: string): OrderRow | undefined { return this.table.get(id); }
  findAll(): OrderRow[] { return Array.from(this.table.values()); }
}

// ============================================
// ③ PERSISTENCE LAYER — Repository / DAO
// Chỉ biết Database, không biết Business hay Presentation
// ============================================

class OrderRepository {
  constructor(private db: InMemoryDatabase) {}
  save(order: Omit<OrderRow, "id">): OrderRow { return this.db.insert(order); }
  findById(id: string): OrderRow | undefined { return this.db.findById(id); }
  findAll(): OrderRow[] { return this.db.findAll(); }
}

// ============================================
// ② BUSINESS LOGIC LAYER — Services
// Chỉ gọi Persistence, chứa business rules
// ============================================

class OrderService {
  constructor(private repo: OrderRepository) {}
  createOrder(items: { productId: string; qty: number; price: number }[]): OrderRow | null {
    if (items.length === 0) { console.log("  ❌ Order must have at least 1 item"); return null; }
    let total = 0;
    for (const it of items) {
      if (it.qty <= 0 || it.price < 0) { console.log("  ❌ Invalid item"); return null; }
      total += it.qty * it.price;
    }
    const saved = this.repo.save({ items, total, status: "pending" });
    console.log(`  ✅ Created ${saved.id}, total: $${total}`);
    return saved;
  }
  payOrder(id: string): boolean {
    const o = this.repo.findById(id);
    if (!o || o.status !== "pending") { console.log(`  ❌ Cannot pay ${id}`); return false; }
    o.status = "paid";
    console.log(`  💰 Paid ${id}`);
    return true;
  }
  listOrders(): OrderRow[] { return this.repo.findAll(); }
}

// ============================================
// ① PRESENTATION LAYER — Console UI (giả lập Controller/View)
// Chỉ gọi Business Logic
// ============================================

class OrderController {
  constructor(private service: OrderService) {}
  handleCreate(items: { productId: string; qty: number; price: number }[]): void {
    console.log("\n📥 [Presentation] POST /orders");
    this.service.createOrder(items);
  }
  handlePay(id: string): void {
    console.log(`\n📥 [Presentation] POST /orders/${id}/pay`);
    this.service.payOrder(id);
  }
  handleList(): void {
    console.log("\n📥 [Presentation] GET /orders");
    const orders = this.service.listOrders();
    orders.forEach(o => console.log(`  📦 ${o.id} | $${o.total} | ${o.status} | ${o.items.length} items`));
  }
}

// ============================================
// MAIN — Wiring layers
// ============================================

function main(): void {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  🍰 LAYERED ARCHITECTURE DEMO            ║");
  console.log("║  Presentation → Business → Persistence → DB ║");
  console.log("╚══════════════════════════════════════════╝");

  const db = new InMemoryDatabase();
  const repo = new OrderRepository(db);         // Persistence → Database
  const service = new OrderService(repo);       // Business → Persistence
  const controller = new OrderController(service); // Presentation → Business

  controller.handleCreate([{ productId: "p1", qty: 1, price: 100 }, { productId: "p2", qty: 2, price: 25 }]);
  controller.handleCreate([{ productId: "p3", qty: 1, price: 75 }]);
  controller.handleList();
  controller.handlePay("ord-1");
  controller.handleList();

  console.log("\n📝 KẾT LUẬN:");
  console.log("  ✅ Mỗi lớp 1 trách nhiệm, luồng rõ ①→②→③→④");
  console.log("  ✅ Đổi DB (persistence) không đụng business");
  console.log("  ⚠️ Nghiêm ngặt → đôi khi phải đi qua lớp trung gian (overhead)");
  console.log("  ℹ️ Relaxed layering cho phép nhảy tầng khi cần tối ưu");
}

main();
export {};
