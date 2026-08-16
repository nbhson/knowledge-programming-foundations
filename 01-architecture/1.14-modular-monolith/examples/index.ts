/**
 * 🧱 Modular Monolith — Mini Shop Demo
 *
 * Một deployment unit, nhưng bên trong chia module biệt lập:
 * - Module Orders: quản lý đơn hàng
 * - Module Inventory: quản lý kho
 * - Module Users: quản lý người dùng
 *
 * Module giao tiếp qua interface (in-process), không gọi thẳng class nhau.
 * Dễ migrate dần sang microservices khi cần.
 */

// ============================================
// MODULE INTERFACES — hợp đồng giữa các module
// ============================================

interface InventoryPort {
  reserve(productId: string, quantity: number): boolean;
  getStock(productId: string): number;
}

interface UserPort {
  getEmail(userId: string): string | undefined;
}

// ============================================
// MODULE: INVENTORY — quản lý kho
// ============================================

class InventoryModule implements InventoryPort {
  private stock = new Map<string, number>();

  constructor() {
    this.stock.set("p1", 10); // Laptop
    this.stock.set("p2", 100); // Mouse
  }

  reserve(productId: string, quantity: number): boolean {
    const current = this.stock.get(productId) ?? 0;
    if (current < quantity) return false;
    this.stock.set(productId, current - quantity);
    console.log(`  📦 [Inventory] Reserved ${quantity}x ${productId}`);
    return true;
  }

  getStock(productId: string): number {
    return this.stock.get(productId) ?? 0;
  }
}

// ============================================
// MODULE: USERS — quản lý người dùng
// ============================================

class UsersModule implements UserPort {
  private users = new Map<string, string>();

  constructor() {
    this.users.set("u1", "alice@example.com");
    this.users.set("u2", "bob@example.com");
  }

  getEmail(userId: string): string | undefined {
    return this.users.get(userId);
  }
}

// ============================================
// MODULE: ORDERS — quản lý đơn hàng
// Chỉ biết interface (InventoryPort, UserPort), không biết class cụ thể
// ============================================

interface Order {
  id: string;
  userId: string;
  items: { productId: string; quantity: number }[];
  total: number;
  status: "confirmed" | "cancelled";
}

class OrdersModule {
  private orders = new Map<string, Order>();
  private idCounter = 0;

  constructor(
    private inventory: InventoryPort, // inject qua interface
    private users: UserPort
  ) {}

  createOrder(userId: string, items: { productId: string; quantity: number }[]): Order | null {
    // Gọi Inventory qua interface
    let total = 0;
    for (const item of items) {
      if (!this.inventory.reserve(item.productId, item.quantity)) {
        console.log(`  ❌ [Orders] Insufficient stock for ${item.productId}`);
        return null;
      }
      total += 100 * item.quantity; // đơn giản hóa giá
    }

    const order: Order = {
      id: `ord-${++this.idCounter}`,
      userId,
      items,
      total,
      status: "confirmed",
    };
    this.orders.set(order.id, order);

    // Gọi Users qua interface
    const email = this.users.getEmail(userId);
    console.log(`  ✅ [Orders] Order ${order.id} created, total: $${total}`);
    if (email) {
      console.log(`  📧 [Orders] Email sent to ${email}`);
    }
    return order;
  }

  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }
}

// ============================================
// MAIN — Composition Root (1 process duy nhất)
// ============================================

function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  🧱 MODULAR MONOLITH ARCHITECTURE DEMO       ║");
  console.log("║  1 deploy unit, nhiều module biệt lập        ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");

  // Khởi tạo các module (trong 1 process)
  const inventory = new InventoryModule();
  const users = new UsersModule();
  const orders = new OrdersModule(inventory, users);

  // Client request
  orders.createOrder("u1", [
    { productId: "p1", quantity: 1 },
    { productId: "p2", quantity: 2 },
  ]);
  console.log("");
  orders.createOrder("u2", [{ productId: "p1", quantity: 99 }]); // fail: thiếu stock

  console.log("");
  console.log("📝 KẾT LUẬN:");
  console.log("  ✅ 1 deploy unit — đơn giản như Monolith");
  console.log("  ✅ Module biệt lập qua interface — ranh giới rõ");
  console.log("  ✅ Dễ migrate dần sang microservices");
  console.log("  ❌ Vẫn single point of failure");
  console.log("  ❌ Cần kỷ luật để module không phụ thuộc lẫn nhau");
}

main();

// export {} để file này là module — tránh trùng tên class với các example khác
export {};