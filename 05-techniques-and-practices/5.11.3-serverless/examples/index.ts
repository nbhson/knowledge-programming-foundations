/**
 * 5.11.3 Serverless — Handler + Cold Start + Billing Demo
 *
 * Mô phỏng nền tảng serverless (kiểu AWS Lambda) bằng TS thuần:
 *   - Handler               : hàm nhận event object, trả HTTP response
 *   - Runtime               : giữ/warm container, đếm cold start vs warm
 *   - Cold start            : lần gọi đầu mất thêm thời gian khởi tạo
 *   - Billing               : tính tiền theo duration × memory
 *
 * KHÔNG gọi fetch/cloud thật — chỉ mô phỏng.
 */

// ─────────────────────────── Config ───────────────────────────

interface ServerlessEvent {
  httpMethod: string;
  path: string;
  pathParameters: Record<string, string>;
}

interface ServerlessResponse {
  statusCode: number;
  body: string;
}

// ─────────────────────────── Business logic (pure) ───────────────────────────

interface ServerlessOrder {
  orderId: string;
  items: number;
  total: number;
}

const serverlessOrders: ServerlessOrder[] = [
  { orderId: "o-1", items: 2, total: 120 },
  { orderId: "o-2", items: 1, total: 45 },
];

// Handler như deploy trên AWS Lambda — pure về input/output
function serverlessHandler(event: ServerlessEvent): ServerlessResponse {
  const id = event.pathParameters["orderId"] ?? "";
  const order = serverlessOrders.find((o) => o.orderId === id);
  if (!order) {
    return { statusCode: 404, body: JSON.stringify({ error: `Order ${id} không tồn tại` }) };
  }
  return { statusCode: 200, body: JSON.stringify(order) };
}

// ─────────────────────────── Mini Lambda Runtime ───────────────────────────

type ServerlessHandlerFn = (event: ServerlessEvent) => ServerlessResponse;

class MiniLambdaRuntime {
  warm = false;
  coldStartMs = 350; // lần đầu phải khởi tạo runtime
  dryRunMs = 25; // mỗi lần gọi thực thi business logic

  invoke(handler: ServerlessHandlerFn, event: ServerlessEvent): { durationMs: number; response: ServerlessResponse; wasCold: boolean } {
    const wasCold = !this.warm;
    const durationMs = (wasCold ? this.coldStartMs : 0) + this.dryRunMs;
    const response = handler(event);
    this.warm = true; // container được tái sử dụng cho lần sau
    return { durationMs, response, wasCold };
  }

  reset(): void {
    this.warm = false;
  }
}

// ─────────────────────────── Billing ───────────────────────────

interface ServerlessBillInput {
  durationMs: number;
  memoryMb: number;
  invocations: number;
}

class ServerlessBilling {
  // Giá tham chiếu AWS Lambda x86: ~0.0000166667$ / GB-second
  private static readonly GB_SECOND_PRICE = 0.0000166667;

  gbSeconds(durationMs: number, memoryMb: number): number {
    return (durationMs / 1000) * (memoryMb / 1024);
  }

  costPerInvocation(durationMs: number, memoryMb: number): number {
    return this.gbSeconds(durationMs, memoryMb) * ServerlessBilling.GB_SECOND_PRICE;
  }

  monthlyBatch(input: ServerlessBillInput): string {
    const per = this.costPerInvocation(input.durationMs, input.memoryMb);
    const total = per * input.invocations;
    return `${total.toFixed(6)}$`;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function showInvocation(runtime: MiniLambdaRuntime, event: ServerlessEvent): void {
  const { durationMs, response, wasCold } = runtime.invoke(serverlessHandler, event);
  console.log(`  📨 ${event.httpMethod} ${event.path} → ${response.statusCode} ${response.body}`);
  console.log(`     duration=${durationMs}ms (${wasCold ? "❄️ COLD START" : "🔥 warm"}); body=${response.body}`);
}

function run(): void {
  console.log("=== MiniLambdaRuntime Demo ===");
  console.log("");

  console.log("1️⃣ Handler — hàm thuần nhận event, trả response:");
  console.log(`  Handler: getOrder(orderId) → statusCode + body JSON`);
  console.log(`  Event  : { httpMethod: \"GET\", path: \"/orders/o-1\", pathParameters: { orderId: \"o-1\" } }`);
  console.log("");

  const runtime = new MiniLambdaRuntime();
  console.log("2️⃣ Lần gọi đầu — COLD START (khởi tạo runtime):");
  showInvocation(runtime, { httpMethod: "GET", path: "/orders/o-1", pathParameters: { orderId: "o-1" } });
  console.log("");

  console.log("3️⃣ Các lần sau — container warm, tái sử dụng:");
  showInvocation(runtime, { httpMethod: "GET", path: "/orders/o-1", pathParameters: { orderId: "o-1" } });
  showInvocation(runtime, { httpMethod: "GET", path: "/orders/o-2", pathParameters: { orderId: "o-2" } });
  console.log("");

  console.log("4️⃣ Handler trả 404 khi không tìm thấy:");
  showInvocation(runtime, { httpMethod: "GET", path: "/orders/o-999", pathParameters: { orderId: "o-999" } });
  console.log("");

  console.log("5️⃣ Billing — pay-per-use theo memory × duration:");
  const billing = new ServerlessBilling();
  const mem = 128;
  const coldCost = billing.costPerInvocation(runtime.coldStartMs + runtime.dryRunMs, mem);
  const warmCost = billing.costPerInvocation(runtime.dryRunMs, mem);
  console.log(`  memory=128MB, cold invocation có duration=${runtime.coldStartMs + runtime.dryRunMs}ms → ${coldCost.toFixed(6)}$`);
  console.log(`  memory=128MB, warm invocation có duration=${runtime.dryRunMs}ms          → ${warmCost.toFixed(6)}$`);
  console.log(`  1 triệu warm invocations/tháng            → ${billing.monthlyBatch({ durationMs: runtime.dryRunMs, memoryMb: mem, invocations: 1_000_000 })}`);
  console.log("");

  console.log("✅ Serverless: handler + event → runtime xử lý cold/warm → tính tiền theo GB-second");
}

run();
export {};