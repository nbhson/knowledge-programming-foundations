/**
 * 2.1.2 Factory Method Pattern - Notification Demo
 *
 * Factory Method cho phép subclass quyết định loại Notification nào được tạo.
 * Client chỉ dùng interface Notification, không biết class cụ thể.
 */

// --- Product interface ---
interface NotificationMessage {
  send(message: string): void;
}

// --- Concrete Products ---
class EmailNotification implements NotificationMessage {
  send(message: string): void {
    console.log(`📧 [Email] ${message}`);
  }
}

class SMSNotification implements NotificationMessage {
  send(message: string): void {
    console.log(`📱 [SMS] ${message}`);
  }
}

class PushNotification implements NotificationMessage {
  send(message: string): void {
    console.log(`🔔 [Push] ${message}`);
  }
}

// --- Creator (abstract) ---
abstract class NotificationFactory {
  // Factory Method — subclass quyết định loại
  abstract createNotification(): NotificationMessage;

  // Operation dùng factory method
  notify(message: string): void {
    const notification = this.createNotification();
    notification.send(message);
  }
}

// --- Concrete Creators ---
class EmailFactory extends NotificationFactory {
  createNotification(): NotificationMessage {
    return new EmailNotification();
  }
}

class SMSFactory extends NotificationFactory {
  createNotification(): NotificationMessage {
    return new SMSNotification();
  }
}

class PushFactory extends NotificationFactory {
  createNotification(): NotificationMessage {
    return new PushNotification();
  }
}

// --- Demo ---
console.log("=== Factory Method Demo ===");
console.log("");

// Client chỉ biết NotificationFactory, không biết class cụ thể
const factories: NotificationFactory[] = [
  new EmailFactory(),
  new SMSFactory(),
  new PushFactory(),
];

factories.forEach((factory, index) => {
  console.log(`Factory ${index + 1}:`);
  factory.notify("Order #123 has been shipped!");
  console.log("");
});

// Thêm loại mới: chỉ cần thêm class + factory, không sửa code cũ
// (Open/Closed Principle)
console.log("✅ Thêm loại mới không cần sửa code cũ (Open/Closed)");