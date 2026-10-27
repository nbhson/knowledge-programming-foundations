/**
 * 📡 Observer Pattern — Stock Price Demo
 * 1 thay đổi giá → nhiều subscriber tự cập nhật, không phụ thuộc lẫn nhau.
 */

interface Observer {
  update(price: number): void;
}

class Stock {
  private observers: Observer[] = [];
  private price = 0;

  subscribe(obs: Observer): void {
    this.observers.push(obs);
  }

  unsubscribe(obs: Observer): void {
    this.observers = this.observers.filter((o) => o !== obs);
  }

  setPrice(price: number): void {
    this.price = price;
    this.notifyAll();
  }

  private notifyAll(): void {
    for (const obs of this.observers) {
      obs.update(this.price);
    }
  }
}

class EmailAlert implements Observer {
  update(price: number): void {
    console.log(`📧 Email: Giá AAPL = $${price}`);
  }
}

class MobileApp implements Observer {
  update(price: number): void {
    console.log(`📱 App: Giá AAPL = $${price}`);
  }
}

class TradingBot implements Observer {
  update(price: number): void {
    if (price < 150) {
      console.log(`🤖 Bot: Giá $${price} < $150 → MUA!`);
    }
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   📡 OBSERVER PATTERN DEMO               ║');
  console.log('╚══════════════════════════════════════════╝');

  const aapl = new Stock();
  const email = new EmailAlert();
  const app = new MobileApp();
  const bot = new TradingBot();

  aapl.subscribe(email);
  aapl.subscribe(app);
  aapl.subscribe(bot);

  console.log('\n1️⃣ Giá $160:');
  aapl.setPrice(160);

  console.log('\n2️⃣ Giá $145 (bot mua):');
  aapl.setPrice(145);

  console.log('\n3️⃣ Email hủy đăng ký, giá $140:');
  aapl.unsubscribe(email);
  aapl.setPrice(140);

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ 1 thay đổi → nhiều nơi cập nhật tự động');
  console.log('  ✅ Subscriber không phụ thuộc lẫn nhau');
  console.log('  ✅ Thêm/hủy subscriber lúc runtime');
}

main();

export {};