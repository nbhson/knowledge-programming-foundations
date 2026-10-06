/**
 * 10.10 Connection Pooling — pool sizing formula + mô phỏng pool queue
 *
 * Minh họa:
 * - Pool size 3 + 6 jobs: 3 chạy ngay, 3 xếp hàng; release đánh thức queue.
 * - Pool timeout khi DB treo (acquire chờ quá lâu → lỗi có kiểm soát).
 * - Công thức sizing Postgres.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Pool ───────────────────────────
interface Conn { id: number }

let connSeq = 0;

class Pool {
  private free: Conn[] = [];
  private queue: ((c: Conn) => void)[] = [];

  constructor(readonly size: number) {
    for (let i = 0; i < size; i++) this.free.push({ id: ++connSeq });
  }

  activeCount(): number {
    return this.size - this.free.length;
  }

  queueLength(): number {
    return this.queue.length;
  }

  async acquire(timeoutMs: number): Promise<Conn> {
    const c = this.free.pop();
    if (c) return c;
    return new Promise<Conn>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.indexOf(onGrant);
        if (idx >= 0) this.queue.splice(idx, 1);
        reject(new Error(`pool timeout sau ${timeoutMs}ms (hết connection + chờ lâu)`));
      }, timeoutMs);
      const onGrant = (conn: Conn): void => {
        clearTimeout(timer);
        resolve(conn);
      };
      this.queue.push(onGrant);
    });
  }

  release(c: Conn): void {
    const waiter = this.queue.shift();
    if (waiter) waiter(c);
    else this.free.push(c);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────────────────────────── Demo ───────────────────────────────
async function main(): Promise<void> {
  console.log("=== Connection Pool Demo ===\n");
  console.log("Công thức Postgres: connections ≈ (cores × 2) + disk_spindles (trừ slot admin/replica)");
  console.log("Ví dụ: 4 cores + 1 disk → ~9 connections/DB — chia cho mọi app instance!\n");

  const pool = new Pool(3);
  console.log(`1️⃣ Pool size 3, tung 6 jobs (mỗi job giữ connection 100ms):`);

  const job = async (n: number): Promise<void> => {
    console.log(`   job ${n}: chờ mượn... (active=${pool.activeCount()}, queue=${pool.queueLength()})`);
    const c = await pool.acquire(1000);
    console.log(`   job ${n}: mượn conn #${c.id}`);
    await sleep(100);
    pool.release(c);
    console.log(`   job ${n}: trả conn #${c.id} ✅`);
  };
  await Promise.all([1, 2, 3, 4, 5, 6].map(job));

  console.log("\n2️⃣ Pool timeout (DB treo, acquire 200ms):");
  const stuck = new Pool(1);
  const held = await stuck.acquire(500); // chiếm duy nhất 1 connection, không trả
  try {
    await stuck.acquire(200);
  } catch (e) {
    console.log(`   ⛔ ${(e as Error).message}`);
  }
  stuck.release(held);

  console.log("\n✅ Bài học: pool giới hạn tải lên DB; transaction ngắn; luôn set acquire + statement timeout.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
