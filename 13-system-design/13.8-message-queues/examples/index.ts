/**
 * 13.8 Message Queues — Demo
 *
 * Mô phỏng:
 *   - Point-to-point queue: producer → queue → consumer, retry + DLQ (poison message)
 *   - Pub/Sub fan-out: 1 event → nhiều consumer độc lập (notification, inventory, analytics)
 *   - Chú thích delivery semantics: at-most-once / at-least-once / exactly-once
 * Chạy: npx ts-node examples/index.ts (từ thư mục 13.8-message-queues)
 */

interface MQMessage {
  readonly id: number;
  readonly payload: string;
  attempts: number;
}

type AckResult = "ack" | "nack";

/** Hàng đợi point-to-point với retry giới hạn + Dead Letter Queue. */
class SimpleQueue {
  private readonly pending: MQMessage[] = [];
  private readonly dlq: MQMessage[] = [];
  private nextId = 1;
  private processed = 0;

  constructor(private readonly maxRetries: number = 3) {}

  produce(payload: string): void {
    this.pending.push({ id: this.nextId++, payload, attempts: 0 });
    console.log(`    📤 produce #${this.nextId - 1}: "${payload}"`);
  }

  /** Xử lý toàn bộ hàng đợi; handler trả về ack (xong) hoặc nack (thử lại). */
  drain(handler: (msg: MQMessage) => AckResult): void {
    while (this.pending.length > 0) {
      const msg = this.pending.shift() as MQMessage;
      msg.attempts++;
      const result = handler(msg);
      if (result === "ack") {
        this.processed++;
        console.log(`    ✅ ack #${msg.id} (attempt ${msg.attempts})`);
      } else if (msg.attempts >= this.maxRetries) {
        this.dlq.push(msg);
        console.log(`    ☠️  #${msg.id} fail ${msg.attempts} lần → DLQ (dead letter)`);
      } else {
        this.pending.push(msg);
        console.log(`    🔁 nack #${msg.id} (attempt ${msg.attempts}) → requeue, thử lại sau`);
      }
    }
  }

  stats(): string {
    return `processed=${this.processed}, dlq=${this.dlq.length}, pending=${this.pending.length}`;
  }
}

type Subscriber = (payload: string) => void;

/** Pub/Sub: 1 topic → N subscriber, mỗi subscriber nhận bản copy riêng. */
class PubSub {
  private readonly subs = new Map<string, Subscriber[]>();

  subscribe(topic: string, name: string, fn: Subscriber): void {
    if (!this.subs.has(topic)) this.subs.set(topic, []);
    (this.subs.get(topic) as Subscriber[]).push((payload) => {
      console.log(`    📬 [${name}] nhận "${payload}"`);
      fn(payload);
    });
  }

  publish(topic: string, payload: string): void {
    const list = this.subs.get(topic) ?? [];
    console.log(`    📢 publish "${topic}": "${payload}" → ${list.length} subscriber(s)`);
    for (const fn of list) fn(payload);
  }
}

function main(): void {
  console.log("=== Message Queues Demo ===");
  console.log("");

  // 1️⃣ Queue + retry + DLQ (at-least-once: consumer phải idempotent vì có redelivery)
  console.log("1️⃣ Point-to-point queue — flaky message retry rồi ack, poison message vào DLQ:");
  const queue = new SimpleQueue(3);
  queue.produce("order:1001");
  queue.produce("order:flaky-1002");
  queue.produce("order:poison-1003");
  queue.drain((msg) => {
    if (msg.payload.includes("poison")) return "nack"; // lỗi vĩnh viễn → DLQ sau 3 lần
    if (msg.payload.includes("flaky") && msg.attempts < 2) return "nack"; // lỗi tạm thời
    return "ack";
  });
  console.log(`   Stats: ${queue.stats()}`);
  console.log("");

  // 2️⃣ Pub/Sub fan-out
  console.log("2️⃣ Pub/Sub — 1 event order.created fan-out cho 3 consumer độc lập:");
  const bus = new PubSub();
  bus.subscribe("order.created", "notification", () => {});
  bus.subscribe("order.created", "inventory", () => {});
  bus.subscribe("order.created", "analytics", () => {});
  bus.publish("order.created", "order:2001 paid $50");
  console.log("");

  // 3️⃣ Delivery semantics
  console.log("3️⃣ Delivery semantics (chọn 1, không có bữa trưa miễn phí):");
  console.log("   at-most-once  : fire-and-forget, nhanh nhất, có thể MẤT message (metrics, logs)");
  console.log("   at-least-once : retry tới khi ack, có thể TRÙNG message → consumer cần idempotent key (default)");
  console.log("   exactly-once  : transactional producer + offset commit, mạnh nhất & phức tạp nhất (thanh toán)");
  console.log("");
  console.log("✅ Queue tách producer/consumer (async, buffering, retry+DLQ); pub/sub tách 1-N (fan-out độc lập)");
}

main();

export {};
