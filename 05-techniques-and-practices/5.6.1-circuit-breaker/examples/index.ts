/**
 * 5.6.1 Circuit Breaker Pattern — Closed / Open / Half-Open Demo
 *
 * Bảo vệ hệ thống khỏi cascade failure: nếu service gọi ra liên tục fail,
 * mạch "ngắt" (OPEN) để không gọi tiếp, trả lỗi nhanh (fast fail).
 * Sau resetTimeout, mạch mở thử nghiệm (HALF_OPEN): thử 1 request,
 * OK → CLOSED, fail → OPEN.
 *
 * State transitions:
 *   CLOSED --failures >= threshold--> OPEN --resetTimeout--> HALF_OPEN
 *   HALF_OPEN --request OK--> CLOSED
 *   HALF_OPEN --request fail--> OPEN
 */

class BreakerStateError extends Error {}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class DemoCircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failures = 0;
  private readonly threshold = 3;
  private readonly resetTimeout = 1500;

  async call(fn: () => Promise<string>): Promise<string> {
    if (this.state === "OPEN") {
      console.log("      ⛔ Mạch OPEN → trả lỗi ngay (fast fail)");
      throw new BreakerStateError("Circuit is OPEN");
    }

    try {
      const result = await fn();
      this.failures = 0;
      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        console.log("      ✅ Thử nghiệm thành công → đóng mạch (CLOSED)");
      }
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold || this.state === "HALF_OPEN") {
        this.state = "OPEN";
        console.log(`      🔓 Fail ${this.failures} lần → chuyển OPEN, chờ ${this.resetTimeout}ms`);
        void sleep(this.resetTimeout).then(() => {
          this.state = "HALF_OPEN";
          console.log("      ⏳ Hết timeout → mở thử nghiệm (HALF_OPEN)");
        });
      }
      throw err;
    }
  }
}

// Service target: fail 4 lần liên tiếp rồi hồi phục
function flakyService(flakyRun: () => number): () => Promise<string> {
  return async () => {
    if (flakyRun() < 4) throw new Error("Service temporarily unavailable");
    return "OK: orders data";
  };
}

// ────────────────────────────────── Demo ────────────────────────────────────
async function main(): Promise<void> {
let fails = 0;
const breaker = new DemoCircuitBreaker();
const callRemote = async (label: string): Promise<void> => {
  try {
    const data = await breaker.call(flakyService(() => fails++));
    console.log(`   ${label} → ${data}`);
  } catch {
    console.log(`   ${label} → ❌ throw (circuit breaker)`);
  }
};

console.log("=== 5.6.1 Circuit Breaker Demo ===");
console.log("");
await callRemote("Req 1"); // fail #1
await callRemote("Req 2"); // fail #2
await callRemote("Req 3"); // fail #3 → OPEN
console.log("");

// Mạch đã OPEN — các request sau không gọi target nữa
await callRemote("Req 4"); // fast fail
await callRemote("Req 5"); // fast fail
console.log("");

// Đợi resetTimeout → HALF_OPEN → service lúc này đã hồi phục
console.log("   ⏸️  Chờ resetTimeout để mạch sang HALF_OPEN...");
await sleep(1600);
await callRemote("Req 6"); // HALF_OPEN thử → OK → CLOSED
await callRemote("Req 7"); // CLOSED lại bình thường
console.log("");
console.log("✅ Circuit Breaker chặn cascade failure, cho phép hệ thống tự phục hồi qua HALF_OPEN");
}
void main();
export {};