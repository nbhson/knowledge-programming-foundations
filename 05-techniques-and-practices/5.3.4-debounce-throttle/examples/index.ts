/**
 * 5.3.4 Debounce & Throttle — Kiểm soát tần suất gọi function
 *
 * TS thuần + Node built-in, KHÔNG cần DOM.
 * Mô phỏng gõ search-box (debounce) và scroll (throttle)
 * bằng event giả lập theo timeline.
 *
 * Chạy: npx ts-node examples/index.ts
 */

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>): void => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

function throttle<T extends (...args: any[]) => void>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>): void => {
    const now = Date.now();
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      fn(...args);
    }
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log("=== 5.3.4 Debounce & Throttle Demo (TS thuần) ===\n");

  // ── Debounce: user gõ "hello" mỗi 50ms, delay 200ms ──
  console.log("✅ Debounce — gõ 5 ký tự liên tục, chỉ call API 1 lần cuối:");
  let apiCalls = 0;
  const searchApi = (query: string): void => {
    apiCalls++;
    console.log(`   [API] search("${query}") — call #${apiCalls}`);
  };
  const debouncedSearch = debounce(searchApi, 200);
  const word = "hello";
  for (let i = 1; i <= word.length; i++) {
    debouncedSearch(word.slice(0, i));
    await sleep(50); // gõ nhanh hơn delay → reset timer
  }
  await sleep(300); // đợi yên 300ms → debounce bắn 1 lần
  console.log(`   → Tổng API calls: ${apiCalls} (không debounce sẽ là 5)\n`);

  // ── Throttle: scroll 10 events trong 500ms, interval 200ms ──
  console.log("✅ Throttle — 10 scroll events dồn dập, tối đa 1 call/200ms:");
  let renders = 0;
  const render = (): void => {
    renders++;
    console.log(`   [RENDER] update indicator #${renders} at ${Date.now() % 100000}ms`);
  };
  const throttledRender = throttle(render, 200);
  for (let i = 0; i < 10; i++) {
    throttledRender();
    await sleep(50);
  }
  console.log(`   → Tổng renders: ${renders} (không throttle sẽ là 10)\n`);

  console.log("📊 Khi nào dùng gì:");
  console.log("   • Debounce: search-box, resize, validate form (đợi user DỪNG mới chạy)");
  console.log("   • Throttle: scroll, mousemove, game loop (chạy ĐỀU ĐẶN trong lúc thao tác)");
}

void main();

export {};
