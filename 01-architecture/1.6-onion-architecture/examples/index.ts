/**
 * 🧅 Onion Architecture — Order Management Demo
 *
 * Layers: Domain Model (center) → Domain Services → Application Services → Infrastructure/UI (outer)
 * Dependency hướng vào trong. Domain Model không phụ thuộc gì.
 */

// ============================================
// 🧅 DOMAIN MODEL — trung tâm, không phụ thuộc ai
// ============================================

class Customer {
  constructor(public readonly id: string, public readonly name: string, public readonly isVip: boolean = false) {}
}

class Order {
  constructor(public readonly id: string, public readonly customer: Customer, public readonly items: { name: string; price: number; qty: number }[], public readonly total: number) {}
}

// ============================================
// 🧅 DOMAIN SERVICES — business rules phức tạp, chỉ phụ thuộc Domain Model
// ============================================

class PricingService {
  calculate(items: { name: string; price: number; qty: number }[], customer: Customer): number {
    let total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    if (customer.isVip) total *= 0.9; // VIP giảm 10%
    if (total > 500) total *= 0.95; // đơn >500 giảm thêm 5%
    return Math.round(total);
  }
}

// ============================================
// 🧅 APPLICATION SERVICES — use cases, orchestration, phụ thuộc Domain
// ============================================

interface OrderRepository { save(order: Order): void; findAll(): Order[]; }

class OrderService {
  private seq = 0;
  constructor(private pricing: PricingService, private repo: OrderRepository) {}
  placeOrder(customer: Customer, items: { name: string; price: number; qty: number }[]): Order {
    const total = this.pricing.calculate(items, customer);
    const order = new Order(`ord-${++this.seq}`, customer, items, total);
    this.repo.save(order);
    console.log(`  ✅ [Application] Order ${order.id} for ${customer.name}, total: $${total}${customer.isVip ? " (VIP)" : ""}`);
    return order;
  }
  listOrders(): Order[] { return this.repo.findAll(); }
}

// ============================================
// 🧅 INFRASTRUCTURE / UI — ngoài cùng, phụ thuộc Application
// ============================================

class InMemoryOrderRepository implements OrderRepository {
  private store: Order[] = [];
  save(order: Order): void { this.store.push(order); }
  findAll(): Order[] { return [...this.store]; }
}

class ConsoleUI {
  constructor(private orderService: OrderService) {}
  runDemo(): void {
    const alice = new Customer("c1", "Alice", true);
    const bob = new Customer("c2", "Bob", false);
    this.orderService.placeOrder(alice, [{ name: "Laptop", price: 1000, qty: 1 }, { name: "Mouse", price: 25, qty: 2 }]);
    this.orderService.placeOrder(bob, [{ name: "Keyboard", price: 75, qty: 1 }]);
    console.log("\n📋 All orders:");
    this.orderService.listOrders().forEach(o => console.log(`  📦 ${o.id} | ${o.customer.name} | $${o.total} | ${o.items.length} items`));
  }
}

// ============================================
// MAIN — Composition Root
// ============================================

function main(): void {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  🧅 ONION ARCHITECTURE DEMO              ║");
  console.log("║  Domain Model → Services → Infra         ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const pricing = new PricingService();               // Domain Service
  const repo = new InMemoryOrderRepository();         // Infrastructure
  const orderService = new OrderService(pricing, repo); // Application Service
  const ui = new ConsoleUI(orderService);             // Infrastructure/UI

  ui.runDemo();

  console.log("\n📝 KẾT LUẬN:");
  console.log("  ✅ Domain Model cô lập, không import infra");
  console.log("  ✅ Dependency chỉ hướng vào trong");
  console.log("  ✅ PricingService test độc lập, OrderService mock repo dễ");
}

main();
export {};
