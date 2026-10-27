/**
 * 8.9 Observability — metrics/logs/traces, RED/USE, structured log + trace context
 *
 * Minh họa:
 * - 1 request đi qua gateway → orders → db, cùng traceId.
 * - Structured JSON logs (mọi dòng đều có traceId).
 * - Tính RED (Rate/Errors/Duration) và phát hiện span chậm.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Types ───────────────────────────
interface Span {
  traceId: string;
  service: string;
  operation: string;
  durationMs: number;
  error?: string;
}

let seq = 0;
function newTraceId(): string {
  seq++;
  return `trace-${String(seq).padStart(3, "0")}`;
}

function log(span: Span, level: string, msg: string): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      traceId: span.traceId,
      service: span.service,
      op: span.operation,
      msg,
    }),
  );
}

// RED: Rate, Error rate, Duration p50/p99
function red(spans: Span[]): { rate: number; errorRate: number; p50: number; p99: number } {
  const durs = spans.map((s) => s.durationMs).sort((a, b) => a - b);
  const pct = (p: number): number => durs[Math.min(durs.length - 1, Math.floor(durs.length * p))];
  return {
    rate: spans.length,
    errorRate: spans.filter((s) => s.error).length / Math.max(1, spans.length),
    p50: pct(0.5),
    p99: pct(0.99),
  };
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== Observability Demo (trace + RED) ===\n");

  // 1 request checkout đi qua 3 services, cùng traceId
  const traceId = newTraceId();
  const spans: Span[] = [
    { traceId, service: "gateway", operation: "POST /checkout", durationMs: 420 },
    { traceId, service: "orders", operation: "createOrder", durationMs: 380 },
    { traceId, service: "db", operation: "INSERT orders", durationMs: 350, error: "slow query" },
  ];

  console.log("1️⃣ Structured logs (grep 1 traceId thấy cả hành trình):");
  log(spans[0], "info", "checkout bắt đầu");
  log(spans[1], "info", "tạo order ok");
  log(spans[2], "warn", "query chậm 350ms, thiếu index orders(user_id)");

  console.log("\n2️⃣ RED của gateway (20 request mẫu):");
  const sample: Span[] = Array.from({ length: 20 }, (_, i) => ({
    traceId: `trace-${100 + i}`,
    service: "gateway",
    operation: "POST /checkout",
    durationMs: i === 19 ? 2000 : 100 + i * 10, // 1 request chậm bất thường
    error: i >= 18 ? "timeout" : undefined,
  }));
  const m = red(sample);
  console.log(`   Rate=${m.rate} req/window, Errors=${(m.errorRate * 100).toFixed(0)}%, p50=${m.p50}ms, p99=${m.p99}ms`);
  console.log("   → p99 (2000ms) tố cáo outlier mà avg (185ms) che giấu!");

  console.log("\n3️⃣ RED vs USE:");
  console.log("   RED (service): Rate/Errors/Duration — 'user có đau không?'");
  console.log("   USE (tài nguyên): Utilization/Saturation/Errors — 'máy có quá tải không?'");

  console.log("\n✅ Bài học: traceId nối mọi mảnh ghép; p99 + error rate dẫn đường tới span lỗi.");
}

main();

export {};
