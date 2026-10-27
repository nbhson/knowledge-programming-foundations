/**
 * 3.2.2 OCP (Open/Closed Principle) - Demo
 *
 * Mở rộng được, đóng sửa đổi.
 * Thêm tính năng mới bằng code mới, không sửa code cũ.
 */

// --- ❌ BAD: thêm payment mới phải sửa if/else ---
class PaymentProcessorBad {
  process(type: string, amount: number) {
    if (type === "card") {
      console.log(`💳 Card: charged ${amount} VND`);
    } else if (type === "cash") {
      console.log(`💵 Cash: received ${amount} VND`);
    }
    // thêm "bank" → phải sửa class này → vi phạm OCP
  }
}

// --- ✅ GOOD: thêm payment mới = thêm class mới ---
interface PaymentMethod {
  pay(amount: number): void;
}

class CardPayment implements PaymentMethod {
  pay(amount: number): void {
    console.log(`💳 Card: charged ${amount} VND`);
  }
}

class CashPayment implements PaymentMethod {
  pay(amount: number): void {
    console.log(`💵 Cash: received ${amount} VND`);
  }
}

// Thêm mới: BankPayment — không sửa code cũ
class BankPayment implements PaymentMethod {
  pay(amount: number): void {
    console.log(`🏦 Bank: transferred ${amount} VND`);
  }
}

class PaymentProcessor {
  private method: PaymentMethod;

  constructor(method: PaymentMethod) {
    this.method = method;
  }

  process(amount: number) {
    this.method.pay(amount);
  }
}

// --- Demo ---
console.log("=== OCP Demo ===");
console.log("");

// GOOD: dùng class mới không sửa code cũ
const cardProcessor = new PaymentProcessor(new CardPayment());
cardProcessor.process(100000);
console.log("");

const cashProcessor = new PaymentProcessor(new CashPayment());
cashProcessor.process(50000);
console.log("");

// Thêm mới: BankPayment — chỉ cần thêm class, không sửa PaymentProcessor
const bankProcessor = new PaymentProcessor(new BankPayment());
bankProcessor.process(200000);
console.log("");

console.log("📊 So sánh:");
console.log("   BAD:  thêm 'bank' → sửa if/else trong PaymentProcessorBad");
console.log("   GOOD: thêm 'bank' → thêm class BankPayment, không sửa code cũ");
console.log("");

console.log("🔧 Lợi ích: code cũ an toàn, thêm tính năng không vỡ gì");
console.log("");

console.log("✅ OCP: mở rộng bằng code mới, đóng sửa đổi code cũ");

export {};