/**
 * 🧱 Monolithic Architecture — Mini Shop Demo
 *
 * Minh họa đặc điểm "tất cả trong một": UI, business logic, data access
 * đều nằm trong một process duy nhất.
 *
 * Đặc điểm chính:
 * - Single deployable unit (single JAR/WAR/EXE/Docker image)
 * - Shared memory, in-process calls
 * - Single database (thường)
 * - Dễ develop/test/deploy ban đầu
 * - Khó scale, khó maintain khi codebase lớn
 */

// ============================================
// DOMAIN MODELS
// ============================================

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  createdAt: Date;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number; // snapshot at order time
}

// ============================================
// DATA ACCESS LAYER (Repository)
// ============================================

class ProductRepository {
  private products: Map<string, Product> = new Map();

  constructor() {
    // Seed data
    this.products.set('p1', { id: 'p1', name: 'Laptop', price: 1500, stock: 10 });
    this.products.set('p2', { id: 'p2', name: 'Mouse', price: 25, stock: 100 });
    this.products.set('p3', { id: 'p3', name: 'Keyboard', price: 75, stock: 50 });
  }

  findAll(): Product[] {
    return Array.from(this.products.values());
  }

  findById(id: string): Product | undefined {
    return this.products.get(id);
  }

  updateStock(id: string, quantity: number): boolean {
    const product = this.products.get(id);
    if (!product || product.stock < quantity) return false;
    product.stock -= quantity;
    return true;
  }
}

class OrderRepository {
  private orders: Map<string, Order> = new Map();
  private idCounter = 0;

  save(order: Omit<Order, 'id'>): Order {
    const newOrder: Order = {
      ...order,
      id: `ord-${++this.idCounter}`,
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  findById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  findAll(): Order[] {
    return Array.from(this.orders.values());
  }
}

// ============================================
// BUSINESS LOGIC LAYER (Services)
// ============================================

class ProductService {
  constructor(private productRepo: ProductRepository) {}

  getAllProducts(): Product[] {
    return this.productRepo.findAll();
  }

  getProduct(id: string): Product | undefined {
    return this.productRepo.findById(id);
  }
}

class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private productRepo: ProductRepository
  ) {}

  createOrder(items: { productId: string; quantity: number }[]): Order | null {
    // Validate stock & calculate total
    const orderItems: OrderItem[] = [];
    let total = 0;

    for (const item of items) {
      const product = this.productRepo.findById(item.productId);
      if (!product) {
        console.log(`❌ Product ${item.productId} not found`);
        return null;
      }
      if (product.stock < item.quantity) {
        console.log(`❌ Insufficient stock for ${product.name}`);
        return null;
      }
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
      total += product.price * item.quantity;
    }

    // Reserve stock
    for (const item of items) {
      this.productRepo.updateStock(item.productId, item.quantity);
    }

    // Create order
    const order = this.orderRepo.save({
      items: orderItems,
      total,
      status: 'pending',
      createdAt: new Date(),
    });

    console.log(`✅ Order ${order.id} created, total: $${total}`);
    return order;
  }

  payOrder(orderId: string): boolean {
    const order = this.orderRepo.findById(orderId);
    if (!order || order.status !== 'pending') return false;
    order.status = 'paid';
    console.log(`💰 Order ${orderId} paid`);
    return true;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orderRepo.findById(orderId);
  }

  getAllOrders(): Order[] {
    return this.orderRepo.findAll();
  }
}

// ============================================
// PRESENTATION LAYER (Console UI)
// ============================================

class ConsoleUI {
  constructor(
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  showProducts(): void {
    console.log('\n📦 PRODUCTS:');
    console.log('─'.repeat(50));
    const products = this.productService.getAllProducts();
    products.forEach(p => {
      console.log(`${p.id} | ${p.name.padEnd(15)} | $${p.price.toFixed(2).padStart(7)} | Stock: ${p.stock}`);
    });
  }

  createOrderDemo(): void {
    console.log('\n🛒 CREATING ORDER...');
    const order = this.orderService.createOrder([
      { productId: 'p1', quantity: 1 }, // Laptop
      { productId: 'p2', quantity: 2 }, // 2 Mice
    ]);
    if (order) {
      console.log(`Order created: ${order.id}`);
      this.orderService.payOrder(order.id);
    }
  }

  showOrders(): void {
    console.log('\n📋 ALL ORDERS:');
    console.log('─'.repeat(60));
    const orders = this.orderService.getAllOrders();
    orders.forEach(o => {
      console.log(`${o.id} | $${o.total.toFixed(2).padStart(8)} | ${o.status.padEnd(8)} | ${o.items.length} items`);
    });
  }

  run(): void {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   🧱 MONOLITHIC ARCHITECTURE DEMO        ║');
    console.log('║   Mini Shop - All in One Process         ║');
    console.log('╚══════════════════════════════════════════╝');

    this.showProducts();
    this.createOrderDemo();
    this.showOrders();

    console.log('\n📝 KẾT LUẬN:');
    console.log('  ✅ Đơn giản: 1 process, 1 DB, deploy dễ');
    console.log('  ✅ Dễ test: mọi thứ trong 1 process');
    console.log('  ❌ Khó scale: phải scale cả app');
    console.log('  ❌ Khó maintain khi team/code lớn');
    console.log('  ❌ Technology lock-in');
  }
}

// ============================================
// MAIN - Composition Root
// ============================================

function main() {
  // Dependency injection (manual)
  const productRepo = new ProductRepository();
  const orderRepo = new OrderRepository();

  const productService = new ProductService(productRepo);
  const orderService = new OrderService(orderRepo, productRepo);

  const ui = new ConsoleUI(productService, orderService);
  ui.run();
}

main();

// export {} để file này là module — tránh trùng tên class với các example khác
export {};
