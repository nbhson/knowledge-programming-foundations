/**
 * 5.3.3 Memoization — Cache kết quả function cho pure functions
 *
 * TS thuần + Node built-in. So sánh Fibonacci naive O(2^n)
 * vs memoized O(n) bằng bộ đếm phép gọi, kèm generic memoize().
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────── ❌ BAD: Fibonacci naive ────────────────────

let naiveCalls = 0;
function fibonacciNaive(n: number): number {
  naiveCalls++;
  if (n <= 1) return n;
  return fibonacciNaive(n - 1) + fibonacciNaive(n - 2);
}

// ─────────────────── ✅ GOOD: generic memoize ────────────────────

function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  let hits = 0;

  const wrapped = (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached !== undefined) {
      hits++;
      return cached;
    }
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  };

  (wrapped as unknown as { cacheHits: () => number }).cacheHits = () => hits;
  return wrapped as T;
}

// Fibonacci đệ quy nhưng gọi qua bản memoized
let fastCalls = 0;
const fibonacciFast = memoize((n: number): number => {
  fastCalls++;
  if (n <= 1) return n;
  // Gọi lại chính bản memoized để tận dụng cache
  return (fibonacciFast as (x: number) => number)(n - 1) + (fibonacciFast as (x: number) => number)(n - 2);
});

// ────────────────────────── Demo chạy ─────────────────────────────────

function main(): void {
  console.log("=== 5.3.3 Memoization Demo (TS thuần) ===\n");

  const N = 25; // đủ lớn để thấy khác biệt, đủ nhỏ để naive chạy xong
  console.log(`❌ BAD — fibonacciNaive(${N}):`);
  naiveCalls = 0;
  const t0 = Date.now();
  const r1 = fibonacciNaive(N);
  const dt1 = Date.now() - t0;
  console.log(`   result=${r1}, function calls=${naiveCalls}, time=${dt1}ms`);

  console.log(`\n✅ GOOD — fibonacci memoized(${N}):`);
  fastCalls = 0;
  const t1 = Date.now();
  const r2 = (fibonacciFast as (x: number) => number)(N);
  const dt2 = Date.now() - t1;
  console.log(`   result=${r2}, function calls=${fastCalls}, time=${dt2}ms`);

  console.log("\n✅ Gọi lại lần 2 (cache hit hoàn toàn):");
  fastCalls = 0;
  const r3 = (fibonacciFast as (x: number) => number)(N);
  console.log(`   result=${r3}, function calls=${fastCalls} (≈0 tính toán mới)`);

  console.log("\n📊 So sánh:");
  console.log(`   • Calls: naive ${naiveCalls} vs memoized ${N + 1} (mỗi n tính đúng 1 lần)`);
  console.log("   • Chỉ memoize PURE function — impure (random/Date/fetch) sẽ sai.");
  console.log("   • Production: giới hạn cache bằng LRU/TTL để tránh memory leak.");
}

main();

export {};
