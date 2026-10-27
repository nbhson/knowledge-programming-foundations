/**
 * 📡 Event-Driven Architecture — Order Processing Demo
 *
 * Event Bus: SimpleEventBus (publish/subscribe)
 * Producers: OrderService (OrderCreated, OrderPaid)
 * Consumers: NotificationService, InventoryService
 *
 * Các service không gọi trực tiếp nhau — chỉ publish/subscribe event.
 * Loose coupling: thêm consumer mới không sửa producer.
 */

// --- Event Bus ---
type EventHandler = (event: DomainEvent) => void;

interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
}

class SimpleEventBus {
  private handlers = new Map<string, EventHandler[]>();

  subscribe(eventType: string, handler: EventHandler): void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  publish(event: DomainEvent): void {
    console.log(`📢 [EventBus] Publish: ${event.type}`);
    const list = this.handlers.get(event.type) ?? [];
    for (const handler of list) {
      handler(event);
    }
  }
}

// --- Producer: OrderService ---
class OrderService {
  constructor(private bus: SimpleEventBus) {}

  createOrder(orderId: string, customerEmail: string): void {
    console.log(`🧾 [OrderService] Order ${orderId} created`);
    this.bus.publish({
      type: "OrderCreated",
      payload: { orderId, customerEmail },
    });
  }

  payOrder(orderId: string): void {
    console.log(`💳 [OrderService] Order ${orderId} paid`);
    this.bus.publish({
      type: "OrderPaid",
      payload: { orderId },
    });
  }
}

// --- Consumer: NotificationService ---
class NotificationService {
  constructor(private bus: SimpleEventBus) {
    bus.subscribe("OrderCreated", (e) => this.onOrderCreated(e));
    bus.subscribe("OrderPaid", (e) => this.onOrderPaid(e));
  }

  private onOrderCreated(event: DomainEvent): void {
    const { orderId, customerEmail } = event.payload as {
      orderId: string;
      customerEmail: string;
    };
    console.log(`📧 [Notification] Email "${orderId} created" → ${customerEmail}`);
  }

  private onOrderPaid(event: DomainEvent): void {
    const { orderId } = event.payload as { orderId: string };
    console.log(`📧 [Notification] Email "payment confirmed" for ${orderId}`);
  }
}

// --- Consumer: InventoryService ---
class InventoryService {
  constructor(private bus: SimpleEventBus) {
    bus.subscribe("OrderCreated", (e) => this.onOrderCreated(e));
  }

  private onOrderCreated(event: DomainEvent): void {
    const { orderId } = event.payload as { orderId: string };
    console.log(`📦 [Inventory] Reserve stock for order ${orderId}`);
  }
}

// --- Demo ---
console.log("=== Event-Driven Architecture Demo ===");
console.log("");

const bus = new SimpleEventBus();

// Đăng ký consumers trước
new NotificationService(bus);
new InventoryService(bus);

// Producer publish event — không biết ai đang lắng nghe
const orderService = new OrderService(bus);
orderService.createOrder("ORD-001", "alice@example.com");
console.log("");
orderService.payOrder("ORD-001");
console.log("");

// Thêm consumer mới không cần sửa OrderService
class AuditService {
  constructor(bus: SimpleEventBus) {
    bus.subscribe("OrderCreated", (e) => {
      console.log(`📝 [Audit] Log event: ${e.type} at ${new Date().toISOString()}`);
    });
  }
}
new AuditService(bus);

orderService.createOrder("ORD-002", "bob@example.com");
console.log("");

console.log("✅ Producer không biết consumer — loose coupling, dễ mở rộng");

// export {} để file này là module — tránh trùng tên class với các example khác
export {};
