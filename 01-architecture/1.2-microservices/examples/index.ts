/**
 * 🧩 Microservices Architecture — Mini Shop (3 services) Demo
 *
 * Mô phỏng 3 microservice độc lập: Catalog, Ordering, User
 * Mỗi service: Domain + Application + Infrastructure + API
 * Giao tiếp: HTTP/REST (sync) + Event Bus (async)
 * Shared: EventBus, CorrelationId
 *
 * Đặc điểm chính:
 * - Mỗi service deploy độc lập, scale độc lập
 * - Mỗi service có DB riêng (database per service)
 * - Giao tiếp qua network (HTTP/Message Queue)
 * - Lỗi 1 service không sập toàn hệ thống
 */

// ============================================
// SHARED KERNEL (dùng chung giữa các service)
// ============================================

type EventHandler = (event: MicroEvent) => void;

interface MicroEvent {
  type: string;
  payload: Record<string, unknown>;
  correlationId: string;
}

class MicroEventBus {
  private handlers = new Map<string, EventHandler[]>();

  subscribe(eventType: string, handler: EventHandler): void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  publish(event: MicroEvent): void {
    console.log(`  📢 [EventBus] ${event.type} (corr: ${event.correlationId})`);
    const list = this.handlers.get(event.type) ?? [];
    for (const handler of list) {
      handler(event);
    }
  }
}

// ============================================
// SERVICE 1: CATALOG SERVICE
// ============================================
// Quản lý sản phẩm. DB riêng: catalog-db

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

class CatalogService {
  private products = new Map<string, Product>();

  constructor() {
    this.products.set("p1", { id: "p1", name: "Laptop", price: 1500, stock: 10 });
    this.products.set("p2", { id: "p2", name: "Mouse", price: 25, stock: 100 });
  }

  // API: GET /products
  listProducts(): Product[] {
    return Array.from(this.products.values());
  }

  // API: GET /products/:id
  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  // API: POST /products/:id/reserve (gọi từ Ordering qua HTTP)
  reserveStock(id: string, quantity: number): boolean {
    const product = this.products.get(id);
    if (!product || product.stock < quantity) return false;
    product.stock -= quantity;
    console.log(`  📦 [Catalog] Reserved ${quantity}x ${product.name}`);
    return true;
  }
}

// ============================================
// SERVICE 2: ORDERING SERVICE
// ============================================
// Quản lý đơn hàng. DB riêng: ordering-db
// Gọi Catalog qua HTTP (sync), publish event (async)

interface Order {
  id: string;
  userId: string;
  items: { productId: string; quantity: number }[];
  total: number;
  status: "pending" | "confirmed" | "cancelled";
}

class OrderingService {
  private orders = new Map<string, Order>();
  private idCounter = 0;

  constructor(
    private catalog: CatalogService, // HTTP client tới Catalog
    private bus: MicroEventBus
  ) {}

  // API: POST /orders
  createOrder(userId: string, items: { productId: string; quantity: number }[]): Order | null {
    // Gọi Catalog qua HTTP (sync) để kiểm tra & reserve stock
    let total = 0;
    for (const item of items) {
      const product = this.catalog.getProduct(item.productId);
      if (!product) {
        console.log(`  ❌ [Ordering] Product ${item.productId} not found`);
        return null;
      }
      if (!this.catalog.reserveStock(item.productId, item.quantity)) {
        console.log(`  ❌ [Ordering] Insufficient stock for ${product.name}`);
        return null;
      }
      total += product.price * item.quantity;
    }

    const order: Order = {
      id: `ord-${++this.idCounter}`,
      userId,
      items,
      total,
      status: "confirmed",
    };
    this.orders.set(order.id, order);

    // Publish event (async) — các service khác lắng nghe
    this.bus.publish({
      type: "OrderCreated",
      payload: { orderId: order.id, userId, total },
      correlationId: `corr-${order.id}`,
    });

    console.log(`  ✅ [Ordering] Order ${order.id} created, total: $${total}`);
    return order;
  }

  // API: GET /orders/:id
  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }
}

// ============================================
// SERVICE 3: USER SERVICE
// ============================================
// Quản lý người dùng. DB riêng: user-db
// Lắng nghe OrderCreated để gửi email

interface User {
  id: string;
  email: string;
  name: string;
}

class UserService {
  private users = new Map<string, User>();

  constructor(bus: MicroEventBus) {
    this.users.set("u1", { id: "u1", email: "alice@example.com", name: "Alice" });
    this.users.set("u2", { id: "u2", email: "bob@example.com", name: "Bob" });

    // Subscribe event từ Ordering (async)
    bus.subscribe("OrderCreated", (e) => this.onOrderCreated(e));
  }

  // API: GET /users/:id
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  private onOrderCreated(event: MicroEvent): void {
    const { userId, orderId, total } = event.payload as {
      userId: string;
      orderId: string;
      total: number;
    };
    const user = this.users.get(userId);
    if (user) {
      console.log(`  📧 [User] Email to ${user.email}: Order ${orderId} confirmed, total $${total}`);
    }
  }
}

// ============================================
// API GATEWAY (entry point duy nhất cho client)
// ============================================

class ApiGateway {
  constructor(
    private catalog: CatalogService,
    private ordering: OrderingService,
    private user: UserService
  ) {}

  // GET /products
  listProducts(): void {
    console.log("\n📦 [Gateway] GET /products");
    this.catalog.listProducts().forEach((p) => {
      console.log(`  ${p.id} | ${p.name} | $${p.price} | stock: ${p.stock}`);
    });
  }

  // POST /orders
  createOrder(userId: string, items: { productId: string; quantity: number }[]): void {
    console.log("\n🛒 [Gateway] POST /orders");
    this.ordering.createOrder(userId, items);
  }

  // GET /users/:id
  getUser(id: string): void {
    console.log("\n👤 [Gateway] GET /users/" + id);
    const user = this.user.getUser(id);
    if (user) {
      console.log(`  ${user.id} | ${user.name} | ${user.email}`);
    }
  }
}

// ============================================
// MAIN - Khởi động 3 service độc lập
// ============================================

function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  🧩 MICROSERVICES ARCHITECTURE DEMO          ║");
  console.log("║  Catalog + Ordering + User (3 services)      ║");
  console.log("╚══════════════════════════════════════════════╝");

  // Khởi động từng service (mỗi service 1 process riêng trong thực tế)
  const bus = new MicroEventBus();
  const catalogService = new CatalogService();
  const userService = new UserService(bus);
  const orderingService = new OrderingService(catalogService, bus);

  // API Gateway nhận request từ client
  const gateway = new ApiGateway(catalogService, orderingService, userService);

  // Client request
  gateway.listProducts();
  gateway.createOrder("u1", [
    { productId: "p1", quantity: 1 },
    { productId: "p2", quantity: 2 },
  ]);
  gateway.getUser("u1");

  console.log("\n📝 KẾT LUẬN:");
  console.log("  ✅ Mỗi service độc lập: deploy, scale, công nghệ riêng");
  console.log("  ✅ Lỗi 1 service không sập toàn hệ thống");
  console.log("  ✅ Giao tiếp sync (HTTP) + async (Event Bus)");
  console.log("  ❌ Phức tạp: network, distributed transaction, debug khó");
  console.log("  ❌ Chi phí vận hành cao (nhiều service, nhiều DB)");
}

main();

// export {} để file này là module — tránh trùng tên class với các example khác
export {};