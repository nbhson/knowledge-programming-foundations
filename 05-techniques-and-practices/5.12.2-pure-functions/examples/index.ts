/**
 * 5.12.2 Pure Functions — Pure vs Impure + Memoization Demo
 *
 * Pure function: cùng input → cùng output, không đọc/ghi state ngoài,
 * không gây side effect. Nhờ vậy có thể memoize & test dễ dàng.
 *
 * Impure: phụ thuộc Math.random(), Date.now(), console.log, biến ngoài...
 */

// ─────────────────────────── Pure vs Impure ───────────────────────────

// Impure: đọc biến ngoài → kết quả không xác định
let discountRate = 0.1;
function impurePrice(price: number): number {
  return price * (1 - discountRate);
}

// Pure: mọi input truyền vào → deterministic
function purePrice(price: number, discountRate: number): number {
  return price * (1 - discountRate);
}

// Impure: có side effect (log ra màn hình)
function impureLogAdd(a: number, b: number): number {
  console.log(`  [side effect] ${a} + ${b}`);
  return a + b;
}

// Pure: không log, chỉ tính
function pureAdd(a: number, b: number): number {
  return a + b;
}

// ─────────────────────────── Memoization ───────────────────────────

class MemoizedCalc {
  private cache = new Map<string, number>();
  private hits = 0;
  private misses = 0;

  // Fibonacci pure — đệ quy không state ngoài, cùng input → cùng output
  fibPure(n: number): number {
    if (n <= 1) return n;
    return this.fibPure(n - 1) + this.fibPure(n - 2);
  }

  // Phiên bản có memo — kết quả chỉ tính 1 lần cho mỗi input
  fibMemo(n: number): number {
    const cached = this.cache.get(String(n));
    if (cached !== undefined) {
      this.hits++;
      return cached;
    }
    this.misses++;
    const result = n <= 1 ? n : this.fibMemo(n - 1) + this.fibMemo(n - 2);
    this.cache.set(String(n), result);
    return result;
  }

  stats(): { hits: number; misses: number } {
    return { hits: this.hits, misses: this.misses };
  }
}

// ─────────────────────────── Determinism test ───────────────────────────

class Determinism {
  // Gọi lại với cùng input để xác minh pure
  static isConsistent<T extends unknown[], R>(fn: (...args: T) => R, ...args: T): boolean {
    const first = JSON.stringify(fn(...args));
    const second = JSON.stringify(fn(...args));
    return first === second;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== Pure Functions Demo ===");
  console.log("");

  console.log("1️⃣ PURE — cùng input, luôn cùng output:");
  console.log(`  purePrice(1000, 0.1) = ${purePrice(1000, 0.1)}, lần 2 = ${purePrice(1000, 0.1)}`);
  console.log(`  Determinism.isConsistent(purePrice, 1000, 0.1) = ${Determinism.isConsistent(purePrice, 1000, 0.1)}`);
  console.log("");

  console.log("2️⃣ IMPURE — phụ thuộc biến ngoài `discountRate`:");
  console.log(`  impurePrice(1000) = ${impurePrice(1000)} (rate=${discountRate})`);
  discountRate = 0.3;
  console.log(`  Thay đổi rate → impurePrice(1000) = ${impurePrice(1000)}  ❌ cùng input, khác output`);
  console.log(`  Determinism.isConsistent(impurePrice, 1000) = ${Determinism.isConsistent(impurePrice, 1000)}`);
  console.log("");

  console.log("3️⃣ SIDE EFFECT — console.log bên trong hàm:");
  impureLogAdd(2, 3);
  console.log(`  → có output phụ ngoài kết quả (gây khó test)`);
  console.log(`  pureAdd(2, 3) = ${pureAdd(2, 3)} — không log, chỉ trả số`);
  console.log("");

  console.log("4️⃣ IMPURE — Math.random() / Date.now():");
  console.log(`  Math.random() 2 lần có thể khác: ${Math.random()} vs ${Math.random()}`);
  console.log(`  Date.now() 2 lần có thể khác: ${Date.now()} vs ${Date.now()}`);
  console.log("");

  console.log("5️⃣ MEMOIZATION — pure function cho phép cache & tái sử dụng:");
  const calc = new MemoizedCalc();
  const fib30 = calc.fibMemo(30);
  const again = calc.fibMemo(30);
  const { hits, misses } = calc.stats();
  console.log(`  fibMemo(30) = ${fib30}, gọi lại = ${again}, hits=${hits}, misses=${misses}`);
  console.log(`  → lần 2 lấy từ cache (hits=${hits}) — chỉ impure function mới không dám cache`);
  console.log("");

  console.log("✅ Pure function: cùng input → cùng output, không side effect → dễ test, dễ memoize");
}

run();
export {};