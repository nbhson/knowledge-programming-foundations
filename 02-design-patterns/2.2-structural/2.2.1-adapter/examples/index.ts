/**
 * 🔌 Adapter Pattern — Payment Gateway Demo
 * Client chỉ biết PaymentProcessor (VND). Legacy API chỉ nhận USD/cents.
 */

interface PaymentProcessor {
  pay(amount: number): void; // VND
}

class LegacyPayPalAPI {
  sendPayment(amountInUSD: number): void {
    console.log(`💸 PayPal: charged $${amountInUSD.toFixed(2)}`);
  }
}

class LegacyStripeAPI {
  charge(amountInCents: number): void {
    console.log(`💳 Stripe: charged ${amountInCents} cents`);
  }
}

const USD_TO_VND = 25000;

class PayPalAdapter implements PaymentProcessor {
  constructor(private legacyAPI: LegacyPayPalAPI) {}
  pay(amount: number): void {
    this.legacyAPI.sendPayment(amount / USD_TO_VND);
  }
}

class StripeAdapter implements PaymentProcessor {
  constructor(private legacyAPI: LegacyStripeAPI) {}
  pay(amount: number): void {
    this.legacyAPI.charge(Math.round((amount / USD_TO_VND) * 100));
  }
}

class CheckoutService {
  constructor(private processor: PaymentProcessor) {}
  checkout(amountVND: number): void {
    console.log(`\n🧾 Checkout: ${amountVND.toLocaleString('vi-VN')} VND`);
    this.processor.pay(amountVND);
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🔌 ADAPTER PATTERN DEMO                ║');
  console.log('╚══════════════════════════════════════════╝');

  new CheckoutService(new PayPalAdapter(new LegacyPayPalAPI())).checkout(50000);
  new CheckoutService(new StripeAdapter(new LegacyStripeAPI())).checkout(50000);

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Client không đổi — chỉ thêm Adapter');
  console.log('  ✅ Legacy API tái sử dụng, không sửa');
  console.log('  ✅ Thêm gateway mới = thêm 1 Adapter');
}

main();

export {};