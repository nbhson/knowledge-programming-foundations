/**
 * 7.2 Integration Testing — Service + DB (in-memory)
 *
 * Minh họa Integration Test:
 * - Nhiều module hoạt động cùng nhau: memory DB + Repository + Service.
 * - Không mock hết (mock → giữ thật): dùng in-memory DB như "test database".
 * - Mô phỏng setup/teardown dữ liệu giữa các scenario.
 */

// ──────────────────── Mô hình dữ liệu ────────────────────
interface IntegrationProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface IntegrationOrderItem {
  productId: string;
  quantity: number;
}

interface IntegrationOrder {
  id: number;
  customerId: number;
  items: IntegrationOrderItem[];
  total: number;
  status: "pending" | "confirmed";
}

// ──────────────────── in-memory Database (test DB) ────────────────────
class IntegrationMemoryDb {
  private products = new Map<string, IntegrationProduct>();
  private orders = new Map<number, IntegrationOrder>();
  private nextOrderId = 1;

  seedProduct(product: IntegrationProduct): void {
    this.products.set(product.id, product);
  }

  getProduct(id: string): IntegrationProduct | undefined {
    return this.products.get(id);
  }

  saveOrder(order: IntegrationOrder): void {
    this.orders.set(order.id, order);
  }

  getOrder(id: number): IntegrationOrder | undefined {
    return this.orders.get(id);
  }

  getAllOrders(): IntegrationOrder[] {
    return Array.from(this.orders.values());
  }

  // Teardown: xóa sạch dữ liệu test sau mỗi scenario
  reset(): void {
    this.products.clear();
    this.orders.clear();
    this.nextOrderId = 1;
  }
}

// ──────────────────── Repository (data access layer) ────────────────────
class IntegrationOrderRepository {
  constructor(private db: IntegrationMemoryDb) {}

  findProduct(id: string): IntegrationProduct | undefined {
    return this.db.getProduct(id);
  }

  reduceStock(productId: string, quantity: number): void {
    const p = this.db.getProduct(productId);
    if (p) p.stock -= quantity;
  }

  insertOrder(order: IntegrationOrder): void {
    this.db.saveOrder(order);
  }
}

// ──────────────────── Service (business logic layer) ────────────────────
class IntegrationOrderService {
  constructor(private repo: IntegrationOrderRepository) {}

  async createOrder(customerId: number, items: IntegrationOrderItem[]): Promise<IntegrationOrder> {
    // Giả lập I/O chậm như query DB thật
    await new Promise((resolve) => setTimeout(resolve, 15));

    let total = 0;
    for (const item of items) {
      const product = this.repo.findProduct(item.productId);
      if (!product) throw new Error(`Sản phẩm ${item.productId} không tồn tại`);
      if (product.stock < item.quantity) {
        throw new Error(`Không đủ hàng cho ${product.name} (còn ${product.stock})`);
      }
      total += product.price * item.quantity;
    }

    const order: IntegrationOrder = {
      id: Date.now() % 100000,
      customerId,
      items,
      total,
      status: "pending",
    };
    this.repo.insertOrder(order);

    for (const item of items) {
      this.repo.reduceStock(item.productId, item.quantity);
    }
    return order;
  }
}

// ────────────────────── Helper in đậm kết quả test ──────────────────────
const IntegrationLogger = {
  scenario(name: string): void {
    console.log(`\n🧩 SCENARIO: ${name}`);
    console.log(`  (Arrange) seed dữ liệu test vào in-memory DB...`);
  },
  check(cond: boolean, label: string): void {
    console.log(cond ? `  ✅ PASS  ${label}` : `  ❌ FAIL  ${label}`);
  },
};

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== Integration Test Demo ===");
console.log("Service + Repository + Database (in-memory) chạy cùng nhau.\n");

async function runScenario1(): Promise<void> {
  // Arrange
  IntegrationLogger.scenario("Tạo đơn hàng → giảm stock đúng");
  const db = new IntegrationMemoryDb();
  db.seedProduct({ id: "p1", name: "Laptop", price: 1500, stock: 10 });
  db.seedProduct({ id: "p2", name: "Mouse", price: 25, stock: 100 });

  const repo = new IntegrationOrderRepository(db);
  const service = new IntegrationOrderService(repo);

  // Act
  const order = await service.createOrder(1, [{ productId: "p1", quantity: 3 }]);

  // Assert
  IntegrationLogger.check(order.status === "pending", "đơn hàng có status 'pending'");
  IntegrationLogger.check(order.total === 4500, `tổng tiền đúng 4500 (thực tế ${order.total})`);
  const laptop = db.getProduct("p1");
  IntegrationLogger.check(laptop !== undefined && laptop.stock === 7, `stock Laptop giảm 10 → 7 (thực tế ${laptop?.stock})`);
}

async function runScenario2(): Promise<void> {
  // Arrange
  IntegrationLogger.scenario("Từ chối khi không đủ stock → không ghi đơn");
  const db = new IntegrationMemoryDb();
  db.seedProduct({ id: "p9", name: "Keyboard", price: 50, stock: 1 });

  const repo = new IntegrationOrderRepository(db);
  const service = new IntegrationOrderService(repo);

  // Act — dự đoán throw
  let thrownMessage = "";
  try {
    await service.createOrder(1, [{ productId: "p9", quantity: 5 }]);
  } catch (err) {
    thrownMessage = err instanceof Error ? err.message : String(err);
  }

  // Assert
  IntegrationLogger.check(thrownMessage.includes("Không đủ hàng"), `throw đúng lỗi insufficient stock (\"${thrownMessage}\")`);
  IntegrationLogger.check(db.getAllOrders().length === 0, "KHÔNG có đơn hàng nào bị ghi");
}

async function runScenario3(): Promise<void> {
  // Arrange
  IntegrationLogger.scenario("Tích hợp nhiều module: Service + DB hoạt động end-to-end");
  const db = new IntegrationMemoryDb();
  db.seedProduct({ id: "p1", name: "Laptop", price: 1500, stock: 10 });

  const repo = new IntegrationOrderRepository(db);
  const service = new IntegrationOrderService(repo);

  // Act
  const order = await service.createOrder(7, [{ productId: "p1", quantity: 1 }]);

  // Assert — verify dữ liệu thật đã được lưu đúng chỗ (DB + Repository đồng bộ)
  IntegrationLogger.check(db.getOrder(order.id) !== undefined, "đơn hàng tồn tại trong DB");
  IntegrationLogger.check(order.customerId === 7, "customerId lưu đúng");
  const p = db.getProduct("p1");
  IntegrationLogger.check(p !== undefined && p.stock === 9, "stock cập nhật trong DB");
}

async function runAll(): Promise<void> {
  await runScenario1();
  await runScenario2();
  await runScenario3();
  console.log("\n✅ Integration test: Service + Repository + DB hoạt động đúng khi phối hợp");
}

runAll();

export {};