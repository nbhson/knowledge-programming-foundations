/**
 * ⛓️ Chain of Responsibility — Approval Flow Demo
 * Request đi qua chuỗi handler, mỗi handler xử lý hoặc chuyền tiếp.
 */

interface Handler {
  setNext(handler: Handler): Handler;
  handle(amount: number): void;
}

abstract class BaseHandler implements Handler {
  private next: Handler | null = null;

  setNext(handler: Handler): Handler {
    this.next = handler;
    return handler;
  }

  protected passToNext(amount: number): void {
    if (this.next) {
      this.next.handle(amount);
    }
  }

  abstract handle(amount: number): void;
}

class Manager extends BaseHandler {
  handle(amount: number): void {
    if (amount <= 500) {
      console.log(`   ✅ Manager duyệt $${amount}`);
    } else {
      console.log(`   ⏩ Manager: quá $500 → chuyền lên...`);
      this.passToNext(amount);
    }
  }
}

class Director extends BaseHandler {
  handle(amount: number): void {
    if (amount <= 5000) {
      console.log(`   ✅ Director duyệt $${amount}`);
    } else {
      console.log(`   ⏩ Director: quá $5000 → chuyền lên...`);
      this.passToNext(amount);
    }
  }
}

class CEO extends BaseHandler {
  handle(amount: number): void {
    console.log(`   ✅ CEO duyệt $${amount} (cuối chuỗi)`);
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   ⛓️ CHAIN OF RESPONSIBILITY DEMO        ║');
  console.log('╚══════════════════════════════════════════╝');

  // Xây chuỗi: Manager → Director → CEO
  const manager = new Manager();
  const director = new Director();
  const ceo = new CEO();
  manager.setNext(director).setNext(ceo);

  console.log('\n1️⃣ Chi $300:');
  manager.handle(300);

  console.log('\n2️⃣ Chi $2000:');
  manager.handle(2000);

  console.log('\n3️⃣ Chi $20000:');
  manager.handle(20000);

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Người gửi không cần biết ai xử lý — chỉ biết đầu chuỗi');
  console.log('  ✅ Thêm/đổi chuỗi dễ (reorder, thêm VP...)');
  console.log('  ✅ Mỗi handler tự quyết: xử lý hay chuyền tiếp');
}

main();

export {};