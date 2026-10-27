/**
 * 12.5 Race Conditions - Shared State Update Demo
 *
 * Minh họa race condition khi nhiều tác vụ cùng cập nhật shared state:
 * 1. ❌ Version lỗi: đọc rồi ghi (read-check-write) không đồng bộ → mất update
 * 2. ✅ Mutex (lock): chỉ 1 tác vụ vào critical section tại 1 thời điểm
 * 3. ✅ Optimistic locking (version): 2 tác vụ cùng đọc, 1 tác vụ thất bại khi ghi
 */

// ─────────────────────────── Mô phỏng chậm mạng ───────────────────────────

const networkDelay = () => new Promise<void>((resolve) => setTimeout(resolve, 10));

// ─────────────────────────── 1. Version LỖI (race condition) ───────────────────────────

class UnsafeWallet {
  constructor(private balance: number) {}

  getBalance(): number {
    return this.balance;
  }

  // ❌ read → await → write: 2 tác vụ có thể đọc cùng giá trị cũ
  async withdraw(amount: number): Promise<boolean> {
    const current = this.balance; // ĐỌC
    await networkDelay(); // chờ — trong lúc này tác vụ khác cũng đọc
    if (current >= amount) {
      this.balance = current - amount; // GHI đè — mất update của tác vụ kia
      return true;
    }
    return false;
  }
}

// ─────────────────────────── 2. Mutex (lock) ───────────────────────────

class Mutex {
  private locked = false;
  private waiters: Array<() => void> = [];

  // Trả về hàm release — nhớ gọi finally
  async acquire(): Promise<() => void> {
    await new Promise<void>((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.waiters.push(resolve);
      }
    });
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.waiters.shift();
      if (next) {
        next(); // trao lock cho tác vụ kế tiếp
      } else {
        this.locked = false;
      }
    };
  }
}

class LockedWallet {
  private readonly mutex = new Mutex();

  constructor(private balance: number) {}

  async withdraw(amount: number): Promise<boolean> {
    const release = await this.mutex.acquire(); // KHÓA
    try {
      const current = this.balance;
      await networkDelay();
      if (current >= amount) {
        this.balance = current - amount;
        return true;
      }
      return false;
    } finally {
      release(); // MỞ KHÓA
    }
  }

  getBalance(): number {
    return this.balance;
  }
}

// ─────────────────────────── 3. Optimistic locking (version) ───────────────────────────

class OptimisticWallet {
  private version = 0;

  constructor(private balance: number) {}

  // Ghi 1 cách "an toàn": chỉ thành công nếu version vẫn như lúc đọc
  private commit(expectedVersion: number, newBalance: number): boolean {
    if (this.version !== expectedVersion) {
      return false; // ai đó đã thay đổi từ lúc ta đọc → compare-and-swap thất bại
    }
    this.balance = newBalance;
    this.version++;
    return true;
  }

  async withdraw(amount: number): Promise<{ ok: boolean; reason?: string }> {
    const expectedVersion = this.version; // ĐỌC version + balance
    const current = this.balance;
    await networkDelay();
    if (current < amount) return { ok: false, reason: "số dư không đủ" };
    const committed = this.commit(expectedVersion, current - amount);
    return committed ? { ok: true } : { ok: false, reason: "cập nhật đã bị tác vụ khác phủ — thử lại" };
  }

  getBalance(): number {
    return this.balance;
  }
}

// ───────────────────────────────── Demo ───────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function run(): Promise<void> {
  console.log("=== Race Conditions Demo ===");
  console.log("");

  console.log("1️⃣ LỖI (không khóa) — 2 lệnh rút 600 từ tài khoản 1000:");
  const unsafe = new UnsafeWallet(1000);
  const [r1, r2] = await Promise.all([unsafe.withdraw(600), unsafe.withdraw(600)]);
  console.log(`   → rút #1 thành công: ${r1}, rút #2 thành công: ${r2}`);
  console.log(`   → SỐ DƯ: ${unsafe.getBalance()} — nhưng CẢ HAI đều báo thành công!`);
  console.log("   (2 giao dịch 600 đáng lẽ chỉ 1 cái được phép: cái #2 bị 'mất tích' mà vẫn báo true)");
  console.log("");

  console.log("2️⃣ CORRECT (mutex) — cùng tình huống nhưng có lock:");
  const safe = new LockedWallet(1000);
  const [s1, s2] = await Promise.all([safe.withdraw(600), safe.withdraw(600)]);
  console.log(`   → rút #1 thành công: ${s1}, rút #2 thành công: ${s2}`);
  console.log(`   → SỐ DƯ ĐÚNG: ${safe.getBalance()} (chỉ 1 lệnh được rút)`);
  console.log("");
  await sleep(5);

  console.log("3️⃣ CORRECT (optimistic locking / version) — không khóa nhưng kiểm tra version:");
  const opt = new OptimisticWallet(1000);
  const [o1, o2] = await Promise.all([opt.withdraw(600), opt.withdraw(600)]);
  console.log(`   → rút #1 thành công: ${o1.ok}${o1.reason ? ` (${o1.reason})` : ""}`);
  console.log(`   → rút #2 thành công: ${o2.ok}${o2.reason ? ` (${o2.reason})` : ""}`);
  console.log(`   → SỐ DƯ ĐÚNG: ${opt.getBalance()} (tác vụ thứ 2 phải thử lại)`);
  console.log("");

  console.log("✅ Kết luận: lock (seri hóa) hoặc kiểm tra version (CAS) để shared state không bị ghi đè sai");
}

run();
export {};