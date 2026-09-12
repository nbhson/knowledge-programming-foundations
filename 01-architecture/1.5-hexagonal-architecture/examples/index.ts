/**
 * ⬡ Hexagonal Architecture (Ports & Adapters) — Order Demo
 *
 * Core (Domain) ở trung tâm, giao tiếp qua Ports (interfaces).
 * Adapters implement Ports: Driving (input) và Driven (output).
 * Core không biết công nghệ cụ thể.
 */

// ============================================
// PORTS (driven) — interfaces mà Core định nghĩa
// ============================================

interface Order { id: string; items: string[]; total: number; }

interface OrderRepositoryPort {
  save(order: Order): void;
  findById(id: string): Order | undefined;
  findAll(): Order[];
}

interface NotificationPort {
  send(to: string, message: string): void;
}

// ============================================
// DOMAIN CORE — chỉ biết Ports
// ============================================

class OrderService {
  private seq = 0;
  constructor(private repo: OrderRepositoryPort, private notifier: NotificationPort) {}
  createOrder(items: string[], total: number, ownerEmail: string): Order {
    const order: Order = { id: `ord-${++this.seq}`, items, total };
    this.repo.save(order);
    this.notifier.send(ownerEmail, `Order ${order.id} created: $${total}`);
    console.log(`  ✅ [Core] Order ${order.id} created`);
    return order;
  }
  getOrder(id: string): Order | undefined { return this.repo.findById(id); }
  listOrders(): Order[] { return this.repo.findAll(); }
}

// ============================================
// ADAPTERS (driven) — implement Ports
// ============================================

class InMemoryOrderRepository implements OrderRepositoryPort {
  private store = new Map<string, Order>();
  save(order: Order): void { this.store.set(order.id, order); }
  findById(id: string): Order | undefined { return this.store.get(id); }
  findAll(): Order[] { return Array.from(this.store.values()); }
}

class ConsoleNotificationAdapter implements NotificationPort {
  send(to: string, message: string): void { console.log(`  📧 [Notification] to ${to}: ${message}`); }
}

// Có thể thay bằng PostgresOrderRepository / EmailNotificationAdapter mà không đổi Core
class PostgresOrderRepository implements OrderRepositoryPort {
  // giả lập — vẫn in-memory nhưng đại diện cho adapter khác
  private store = new Map<string, Order>();
  save(order: Order): void { this.store.set(order.id, order); console.log(`  🐘 [Postgres] saved ${order.id}`); }
  findById(id: string): Order | undefined { return this.store.get(id); }
  findAll(): Order[] { return Array.from(this.store.values()); }
}

// ============================================
// DRIVING ADAPTER — HTTP/CLI gọi vào Core qua Port
// ============================================

class OrderController {
  constructor(private service: OrderService) {}
  handleCreate(items: string[], total: number, email: string): void {
    console.log(`\n📥 [Driving:HTTP] POST /orders {items:${items.length}, total:${total}}`);
    this.service.createOrder(items, total, email);
  }
}

// ============================================
// MAIN
// ============================================

function main(): void {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  ⬡ HEXAGONAL ARCHITECTURE DEMO           ║");
  console.log("║  Core → Ports ← Adapters                ║");
  console.log("╚══════════════════════════════════════════╝");

  // Wiring với InMemory adapter
  const repo = new InMemoryOrderRepository();
  const notifier = new ConsoleNotificationAdapter();
  const service = new OrderService(repo, notifier);
  const controller = new OrderController(service);

  controller.handleCreate(["Laptop", "Mouse"], 1525, "alice@example.com");
  controller.handleCreate(["Keyboard"], 75, "bob@example.com");

  console.log("\n📋 Orders via Core:");
  service.listOrders().forEach(o => console.log(`  📦 ${o.id} | ${o.items.join(", ")} | $${o.total}`));

  console.log("\n🔄 Swap adapter demo (InMemory → Postgres):");
  const pgRepo = new PostgresOrderRepository();
  const pgService = new OrderService(pgRepo, notifier);
  const pgController = new OrderController(pgService);
  pgController.handleCreate(["Monitor"], 200, "carol@example.com");
  console.log(`  Core không đổi dòng nào, chỉ thay adapter.`);

  console.log("\n📝 KẾT LUẬN:");
  console.log("  ✅ Core chỉ phụ thuộc Port (interface)");
  console.log("  ✅ Đổi DB/Notifier chỉ cần adapter mới");
  console.log("  ✅ Test Core với mock Port dễ dàng");
}

main();
export {};
