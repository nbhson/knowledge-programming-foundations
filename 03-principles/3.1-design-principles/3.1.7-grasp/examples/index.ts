/**
 * 3.1.7 GRASP - Information Expert vs Fat Controller Demo
 *
 * Ai có đủ thông tin thì làm việc đó (Information Expert).
 * Controller chỉ điều phối request, không tự tính toán hết.
 */

export {};

// --- ❌ BAD: Fat Controller moi dữ liệu, tự tính hết ---
interface RawLine {
  price: number;
  quantity: number;
}

class FatOrderController {
  calculateTotal(lines: RawLine[]): number {
    let total = 0;
    for (const line of lines) {
      total += line.price * line.quantity; // Controller biết chi tiết nội bộ của line
    }
    return total;
  }

  calculateDiscountedTotal(lines: RawLine[], discountRate: number): number {
    return this.calculateTotal(lines) * (1 - discountRate); // logic phình dần ở Controller
  }
}

// --- ✅ GOOD: Information Expert + Lean Controller ---
class OrderLine {
  constructor(
    readonly price: number,
    readonly quantity: number,
  ) {}

  subtotal(): number {
    return this.price * this.quantity; // Expert: có dữ liệu → tự tính
  }
}

class Order {
  private lines: OrderLine[] = [];

  addLine(price: number, quantity: number): void {
    this.lines.push(new OrderLine(price, quantity)); // Creator: Order chứa Line → Order tạo Line
  }

  total(): number {
    return this.lines.reduce((sum, line) => sum + line.subtotal(), 0);
  }

  discountedTotal(discountRate: number): number {
    return this.total() * (1 - discountRate);
  }
}

class OrderController {
  constructor(private readonly order: Order) {}

  checkout(discountRate: number): number {
    return this.order.discountedTotal(discountRate); // chỉ điều phối, không tự tính
  }
}

// --- ✅ GOOD: Polymorphism thay vì if/else kiểm tra loại (1 trong 9 GRASP) ---
interface DiscountPolicy {
  apply(total: number): number;
}

class NoDiscount implements DiscountPolicy {
  apply(total: number): number {
    return total;
  }
}

class StudentDiscount implements DiscountPolicy {
  apply(total: number): number {
    return total * 0.9;
  }
}

// --- Demo ---
function main(): void {
  console.log("=== GRASP Demo ===");
  console.log("");

  // ❌ BAD: Fat Controller
  const rawLines: RawLine[] = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 3 },
  ];
  const fat = new FatOrderController();
  console.log(`❌ BAD Fat Controller total: ${fat.calculateTotal(rawLines)}`);
  console.log("   → Controller moi price/quantity, OrderLine chỉ là dữ liệu chết");
  console.log("");

  // ✅ GOOD: Information Expert + Controller gầy
  const order = new Order();
  order.addLine(100, 2);
  order.addLine(50, 3);
  const controller = new OrderController(order);
  console.log(`✅ GOOD Expert total: ${order.total()}`);
  console.log(`✅ GOOD Controller checkout (-10%): ${controller.checkout(0.1)}`);
  console.log("   → OrderLine tự tính subtotal, Order tự tính total, Controller chỉ điều phối");
  console.log("");

  // ✅ GOOD: Polymorphism — thêm loại discount không sửa code cũ
  const policies: DiscountPolicy[] = [new NoDiscount(), new StudentDiscount()];
  for (const policy of policies) {
    console.log(`✅ Polymorphism ${policy.constructor.name}: ${policy.apply(order.total())}`);
  }
  console.log("");
  console.log("✅ GRASP: đúng người đúng việc — Expert làm, Controller điều phối");
}

main();
