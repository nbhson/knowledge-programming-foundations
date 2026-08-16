/**
 * 🎀 Decorator Pattern — Notification Demo
 * Bọc EmailNotifier thêm SMS, Slack mà không sửa class gốc.
 */

interface Notifier {
  send(message: string): void;
}

class EmailNotifier implements Notifier {
  send(message: string): void {
    console.log(`📧 Email: ${message}`);
  }
}

class NotifierDecorator implements Notifier {
  constructor(protected wrapped: Notifier) {}
  send(message: string): void {
    this.wrapped.send(message);
  }
}

class SMSDecorator extends NotifierDecorator {
  send(message: string): void {
    super.send(message);
    console.log(`📱 SMS: ${message}`);
  }
}

class SlackDecorator extends NotifierDecorator {
  send(message: string): void {
    super.send(message);
    console.log(`💬 Slack: ${message}`);
  }
}

class FacebookDecorator extends NotifierDecorator {
  send(message: string): void {
    super.send(message);
    console.log(`👤 Facebook: ${message}`);
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🎀 DECORATOR PATTERN DEMO              ║');
  console.log('╚══════════════════════════════════════════╝');

  // Chỉ Email
  console.log('\n1️⃣ Email only:');
  new EmailNotifier().send('Order shipped!');

  // Email + SMS
  console.log('\n2️⃣ Email + SMS:');
  let notifier: Notifier = new EmailNotifier();
  notifier = new SMSDecorator(notifier);
  notifier.send('Order shipped!');

  // Email + SMS + Slack + Facebook
  console.log('\n3️⃣ Email + SMS + Slack + Facebook:');
  notifier = new EmailNotifier();
  notifier = new SMSDecorator(notifier);
  notifier = new SlackDecorator(notifier);
  notifier = new FacebookDecorator(notifier);
  notifier.send('Order shipped!');

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Class gốc không đổi');
  console.log('  ✅ Kết hợp kênh tùy ý — bọc thêm decorator');
  console.log('  ✅ Thứ tự bọc quyết định thứ tự gửi');
}

main();

export {};