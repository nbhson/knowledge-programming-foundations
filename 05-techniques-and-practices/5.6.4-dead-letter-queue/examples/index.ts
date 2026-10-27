/**
 * 5.6.4 Dead Letter Queue (DLQ) — Message hỏng không thể xử lý Demo
 *
 * Message fail nhiều lần tới hết maxRetries → chuyển sang DLQ
 * để dev inspect / replay / drop mà không chặn main queue
 * (tránh head-of-line blocking) và không mất dữ liệu.
 */

interface QueueMessage {
  id: number;
  payload: string;
  attempts?: number;
}

class DemoDlqWorker {
  private readonly dlq: QueueMessage[] = [];

  constructor(
    private readonly maxRetries = 3,
    private readonly process: (msg: QueueMessage) => boolean,
  ) {}

  async handle(msg: QueueMessage): Promise<void> {
    msg.attempts = (msg.attempts ?? 0) + 1;

    if (this.process(msg)) {
      console.log(`   ✅ msg #${msg.id} xử lý thành công (attempt ${msg.attempts}) — ACK`);
      return;
    }

    if (msg.attempts < this.maxRetries) {
      console.log(`   🔁 msg #${msg.id} fail — requeue, retry attempt ${msg.attempts + 1}/${this.maxRetries}`);
      await new Promise((r) => setTimeout(r, 30));
      await this.handle({ ...msg });
      return;
    }

    this.dlq.push({ ...msg });
    console.log(`   ⚰️ msg #${msg.id} hết retry (${this.maxRetries}) → chuyển sang DLQ`);
  }

  inspectDlq(): void {
    for (const m of this.dlq) {
      console.log(`      DLQ: #${m.id} payload="${m.payload}" attempts=${m.attempts} → cần xử lý thủ công`);
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ────────────────────────────────── Demo ────────────────────────────────────
async function main(): Promise<void> {
console.log("=== 5.6.4 Dead Letter Queue Demo ===");
console.log("");

// Message #2 có payload "corrupt" → consumer luôn fail
const worker = new DemoDlqWorker(3, (msg) => msg.payload !== "corrupt");

await worker.handle({ id: 1, payload: "{ user: 42, amount: 100 }" }); // OK
await sleep(10);
await worker.handle({ id: 2, payload: "corrupt" }); // requeue 3 lần → DLQ
await sleep(10);
await worker.handle({ id: 3, payload: "{ user: 7, amount: 50 }" }); // OK
console.log("");

worker.inspectDlq();
console.log("");
console.log("   Main queue vẫn xử lý tiếp các message khác → không bị chặn (no head-of-line blocking)");
console.log("");
console.log("✅ DLQ giữ message hỏng để xử lý thủ công, bảo toàn dữ liệu và bảo vệ main queue");
}
void main();
export {};