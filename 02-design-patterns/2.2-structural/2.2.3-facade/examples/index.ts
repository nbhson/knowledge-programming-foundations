/**
 * 🏛️ Facade Pattern — Order Demo
 * Client chỉ gọi 1 method, Facade phối hợp nhiều subsystem.
 */

class InventoryService {
  checkStock(id: string): boolean {
    console.log(`📦 Check stock: ${id}`);
    return true;
  }
  reserve(id: string): void {
    console.log(`📦 Reserved: ${id}`);
  }
}

class PaymentService {
  charge(amount: number): void {
    console.log(`💳 Charged $${amount}`);
  }
}

class ShippingService {
  ship(orderId: string): void {
    console.log(`🚚 Shipped: ${orderId}`);
  }
}

class NotificationService {
  sendEmail(email: string): void {
    console.log(`📧 Email sent to: ${email}`);
  }
}

class OrderFacade {
  private inventory = new InventoryService();
  private payment = new PaymentService();
  private shipping = new ShippingService();
  private notification = new NotificationService();

  placeOrder(productId: string, amount: number, email: string): void {
    console.log('\n🛒 Placing order...');
    if (!this.inventory.checkStock(productId)) {
      console.log('❌ Out of stock');
      return;
    }
    this.inventory.reserve(productId);
    this.payment.charge(amount);
    this.shipping.ship(productId);
    this.notification.sendEmail(email);
    console.log('✅ Order placed!');
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🏛️ FACADE PATTERN DEMO                 ║');
  console.log('╚══════════════════════════════════════════╝');

  const facade = new OrderFacade();
  facade.placeOrder('P001', 99, 'user@example.com');

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Client chỉ gọi 1 method');
  console.log('  ✅ Facade phối hợp 4 subsystem');
  console.log('  ✅ Đổi subsystem không ảnh hưởng client');
}

main();

export {};