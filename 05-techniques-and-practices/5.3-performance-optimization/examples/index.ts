/**
 * 5.3 Performance Optimization — Tổng quan 5 kỹ thuật tối ưu hiệu năng
 *
 * TS thuần, KHÔNG có DOM/UI framework. Mini demo tuần tự:
 *   1. Caching        — bộ nhớ tạm, cache-hit/miss
 *   2. Lazy Loading   — tải module theo nhu cầu (Promise)
 *   3. Memoization    — cache kết quả function (fibonacci)
 *   4. Debounce       — chờ "dừng thao tác" mới chạy (virtual clock)
 *   5. Throttle       — giới hạn tần suất (virtual clock)
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ───────────────────────────── 1. Caching ─────────────────────────────

class SimpleCache {
  private store = new Map<string, number>();

  has(key: string): boolean {
    return this.store.has(key);
  }
  set(key: string, value: number): void {
    this.store.set(key, value);
  }
  get(key: string): number {
    return this.store.get(key) ?? -1;
  }
}

function fetchFromDb(key: string): number {
  console.log(`      [DB] SELECT score WHERE id=${key} ...`);
  return key.length * 7;
}

function getUserScoreWithCache(key: string, cache: SimpleCache): number {
  if (cache.has(key)) {
    console.log(`      ✅ CACHE HIT ${key} → ${cache.get(key)} (không gọi DB)`);
    return cache.get(key);
  }
  console.log(`      ➕ CACHE MISS ${key} → fetch DB`);
  const value = fetchFromDb(key);
  cache.set(key, value);
  return value;
}

// ─────────────────────────── 2. Lazy Loading ─────────────────────────

interface LazyModule {
  name: string;
}

function createLazyLoader(name: string, sizeKb: number): {
  load(): Promise<LazyModule>;
  isLoaded(): boolean;
} {
  let loaded = false;
  return {
    load(): Promise<LazyModule> {
      if (loaded) {
        console.log(`      [2️⃣] "${name}" đã tải rồi (cache) — không tải lại`);
      } else {
        console.log(`      [2️⃣] dynamic import "${name}" lần đầu → tải ${sizeKb}KB NOW`);
        loaded = true;
      }
      return Promise.resolve({ name });
    },
    isLoaded(): boolean {
      return loaded;
    },
  };
}

// ─────────────────────────── 3. Memoization ──────────────────────────

/** Memoize không ghi log — dùng counter bên ngoài để đo "số phép tính thật" */
function memoize<T extends (...args: number[]) => number>(fn: T): T {
  const cache = new Map<string, number>();
  const memo = ((...args: number[]) => {
    const key = JSON.stringify(args);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
  return memo;
}

// ─────────────────────── 4/5. Debounce & Throttle ────────────────────

interface VirtualTimer {
  id: number;
  fireAt: number;
  fn: () => void;
}

/** VirtualClock mô phỏng đồng hồ — demo debounce/throttle nhanh, deterministic */
class VirtualClock {
  private current = 0;
  private timers: VirtualTimer[] = [];
  private nextId = 1;

  get time(): number {
    return this.current;
  }

  setTimeout(fn: () => void, delay: number): number {
    const id = this.nextId++;
    this.timers.push({ id, fireAt: this.current + delay, fn });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers = this.timers.filter((t) => t.id !== id);
  }

  advance(ms: number): void {
    this.current += ms;
    const due = this.timers
      .filter((t) => t.fireAt <= this.current)
      .sort((a, b) => a.fireAt - b.fireAt);
    this.timers = this.timers.filter((t) => t.fireAt > this.current);
    for (const t of due) t.fn();
  }
}

type VoidFn = (...args: unknown[]) => void;

/** Debounce: chỉ chạy lần cuối sau khi "dừng" delay ms (trailing edge) */
function createDebounced(clock: VirtualClock, delay: number): (fn: VoidFn) => VoidFn {
  return (fn) => {
    let timerId: number | null = null;
    return (...args) => {
      if (timerId !== null) clock.clearTimeout(timerId);
      timerId = clock.setTimeout(() => fn(...args), delay);
    };
  };
}

/** Throttle: tối đa 1 lần gọi / interval ms */
function createThrottled(clock: VirtualClock, interval: number): (fn: VoidFn) => VoidFn {
  return (fn) => {
    let lastCall = Number.NEGATIVE_INFINITY;
    return (...args) => {
      if (clock.time - lastCall >= interval) {
        lastCall = clock.time;
        fn(...args);
      }
    };
  };
}

// ────────────────────────── Demo chạy ─────────────────────────────────

async function main(): Promise<void> {
  console.log("=== 5.3 Performance Optimization — Overview Demo ===\n");

  // 1️⃣ Caching
  console.log("1️⃣ CACHING — lưu kết quả để truy xuất nhanh:");
  const cache = new SimpleCache();
  getUserScoreWithCache("user1", cache);
  getUserScoreWithCache("user2", cache);
  getUserScoreWithCache("user1", cache); // hit
  console.log("");

  // 2️⃣ Lazy Loading
  console.log("2️⃣ LAZY LOADING — chỉ tải khi cần:");
  const chart = createLazyLoader("HeavyChart", 1024);
  const admin = createLazyLoader("AdminPanel", 2048);
  console.log("      Trang chủ khởi động, KHÔNG tải chart/admin:");
  console.log(`      loaded? chart=${chart.isLoaded()}, admin=${admin.isLoaded()}`);
  console.log("      User mở biểu đồ trước:");
  await chart.load();
  console.log("      User later vào trang admin:");
  await admin.load();
  await chart.load(); // lần 2 — cached
  console.log("");

  // 3️⃣ Memoization
  console.log("3️⃣ MEMOIZATION — tính lại cùng input thì thôi:");
  let rawComputes = 0;
  const fibRaw = (n: number): number => {
    rawComputes++;
    if (n <= 1) return n;
    return fibRaw(n - 1) + fibRaw(n - 2);
  };
  const before = rawComputes;
  fibRaw(20);
  const rawWork = rawComputes - before;

  let memoComputes = 0;
  const fibMemo = memoize((n: number): number => {
    memoComputes++;
    if (n <= 1) return n;
    return fibMemo(n - 1) + fibMemo(n - 2);
  });
  const beforeMemo = memoComputes;
  fibMemo(20);
  const memoWork = memoComputes - beforeMemo;
  console.log(`      fib(20) không memoize: ${rawWork} phép tính`);
  console.log(`      fib(20) có memoize:   ${memoWork} phép tính (mỗi input chỉ tính 1 lần)`);
  fibMemo(20); // gọi lại → cache trả ngay, 0 phép tính mới
  console.log(`      gọi lại fib(20) lần 2: ${memoComputes - beforeMemo - memoWork} phép tính (0 nhờ cache)`);
  console.log("");

  // 4️⃣ Debounce
  console.log("4️⃣ DEBOUNCE — search chờ user ngưng gõ 250ms:");
  const clock = new VirtualClock();
  const debouncedSearch = createDebounced(clock, 250)((q) => {
    console.log(`      🔎 debounced search fires! q="${String(q)}"`);
  });
  for (const t of [0, 100, 200, 300]) {
    clock.advance(t === 0 ? 0 : t - lastAdvance);
    debouncedSearch(`gõ-lần-${t}`);
    lastAdvance = t;
  }
  clock.advance(250); // sau lần gõ cuối 250ms → chỉ 1 call
  console.log("      (4 lần gõ nhưng chỉ 1 lần gọi API — chờ dừng)");
  console.log("");

  // 5️⃣ Throttle
  console.log("5️⃣ THROTTLE — scroll tối đa 1 lần/100ms:");
  const clock2 = new VirtualClock();
  const throttledScroll = createThrottled(clock2, 100)(() => {
    console.log(`      🖱️  scroll handler chạy (fires) @t=${clock2.time}`);
  });
  for (const t of [0, 50, 100, 150, 200, 250]) {
    clock2.advance(constAdvance);
    throttledScroll();
    constAdvance = 50;
  }
  console.log("      (6 sự kiện scroll nhưng chỉ 3 lần chạy — giới hạn tần suất)");

  console.log("\n✅ So sánh nhanh:");
  console.log("   Caching   → tránh lặp công việc tốn kém (DB/API)");
  console.log("   Lazy      → giảm initial load, tiết kiệm bandwidth");
  console.log("   Memoize   → tránh tính toán lặp cùng input");
  console.log("   Debounce  → chờ user DỪNG mới chạy (search, resize)");
  console.log("   Throttle  → giới hạn TẦN SUẤT (scroll, mousemove)");
}

let lastAdvance = 0;
let constAdvance = 0;

void main();

export {};