/**
 * 🎯 Strategy Pattern — Shipping Cost Demo
 * Nhiều cách tính phí ship, chọn lúc runtime, không if/else.
 */

interface ShippingStrategy {
  calculate(weightKg: number): number;
}

class NormalShipping implements ShippingStrategy {
  calculate(weightKg: number): number {
    return weightKg * 10_000; // 10k/kg
  }
}

class ExpressShipping implements ShippingStrategy {
  calculate(weightKg: number): number {
    return weightKg * 20_000 + 30_000; // nhanh hơn, phụ phí
  }
}

class FreeShipping implements ShippingStrategy {
  calculate(_weightKg: number): number {
    return 0; // miễn phí cho VIP — param không dùng nhưng phải khớp interface
  }
}

class Order {
  constructor(
    private weightKg: number,
    private shipping: ShippingStrategy,
  ) {}

  setShipping(strategy: ShippingStrategy): void {
    this.shipping = strategy; // ✅ đổi strategy lúc runtime
  }

  checkout(): void {
    const cost = this.shipping.calculate(this.weightKg);
    console.log(`📦 ${this.weightKg}kg → Phí ship: ${cost.toLocaleString('vi-VN')}đ`);
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🎯 STRATEGY PATTERN DEMO               ║');
  console.log('╚══════════════════════════════════════════╝');

  const order = new Order(2, new NormalShipping());

  console.log('\n1️⃣ Mặc định — Normal:');
  order.checkout();

  console.log('\n2️⃣ Khách chọn Express:');
  order.setShipping(new ExpressShipping());
  order.checkout();

  console.log('\n3️⃣ VIP — Free:');
  order.setShipping(new FreeShipping());
  order.checkout();

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Đổi thuật toán lúc runtime — không sửa class Order');
  console.log('  ✅ Thêm cách tính mới → thêm class, không đụng code cũ');
  console.log('  ✅ Hết if/else chồng chất');
}

main();

export {};