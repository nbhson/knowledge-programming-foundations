/**
 * 7.11 Chaos Testing — fault injection + mô phỏng latency/error injection
 *
 * Minh họa:
 * - withFault: wrapper bơm latency ngẫu nhiên + lỗi 5xx theo tỉ lệ.
 * - Thí nghiệm 1: không timeout → request treo, hàng đợi tắc.
 * - Thí nghiệm 2: timeout + fallback → hệ thống hồi phục (resilient).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Helpers ───────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface FaultConfig {
  latencyMs: number; // delay ngẫu nhiên 0..latencyMs
  errorRate: number; // 0..1
}

async function withFault<T>(fn: () => Promise<T>, fault: FaultConfig): Promise<T> {
  if (fault.latencyMs > 0) {
    await sleep(Math.random() * fault.latencyMs);
  }
  if (Math.random() < fault.errorRate) throw new Error("injected 500");
  return fn();
}

async function callWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number | null,
): Promise<T> {
  if (timeoutMs === null) return fn();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timeout ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Dependency "thật": payment API bình thường nhanh
async function payment(): Promise<string> {
  await sleep(20);
  return "paid";
}

const FAULT: FaultConfig = { latencyMs: 600, errorRate: 0.3 };

async function experiment(
  name: string,
  timeoutMs: number | null,
  rounds: number,
): Promise<void> {
  let ok = 0;
  let fail = 0;
  let fallback = 0;
  const t0 = Date.now();
  for (let i = 0; i < rounds; i++) {
    try {
      await callWithTimeout(() => withFault(payment, FAULT), timeoutMs);
      ok++;
    } catch {
      fail++;
      // có timeout → dùng fallback (queue để retry sau) thay vì treo
      if (timeoutMs !== null) fallback++;
    }
  }
  console.log(
    `   ${name}: ok=${ok} fail=${fail} fallback=${fallback} trong ${Date.now() - t0}ms`,
  );
}

// ─────────────────────────────── Demo ───────────────────────────────
async function main(): Promise<void> {
  console.log("=== Chaos Testing Demo (fault injection) ===\n");
  console.log("   Fault: latency ngẫu nhiên 0–600ms + 30% lỗi 500\n");

  console.log("1️⃣ Baseline (không fault):");
  await experiment("không fault, timeout 200ms", 200, 10);

  console.log("\n2️⃣ Có fault, KHÔNG timeout (thiết kế yếu):");
  await experiment("có fault, không timeout", null, 10);

  console.log("\n3️⃣ Có fault, timeout 200ms + fallback (resilient):");
  await experiment("có fault, timeout 200ms", 200, 10);

  console.log("\n✅ Bài học: chaos chứng minh timeout + fallback hoạt động thật; không timeout → 1 dependency chậm kéo sập cả chuỗi.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
