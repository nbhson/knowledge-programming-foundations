/**
 * 10.9 N+1 Query — vấn đề + batching/DataLoader + mô phỏng query counter
 *
 * Minh họa đếm số query DB:
 * - Lazy (N+1): 1 + N queries.
 * - Batch IN (...): 2 queries.
 * - DataLoader: 2 queries + cache hit khi hỏi lại.
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────── DB giả lập ───────────────────────
interface Order { id: number; userId: number; total: number }

const ORDERS: Order[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  userId: (i % 10) + 1, // 10 users, mỗi user 10 orders
  total: (i + 1) * 10,
}));

let queryCount = 0;

function queryOrdersByUser(userId: number): Order[] {
  queryCount++;
  return ORDERS.filter((o) => o.userId === userId);
}

function queryOrdersByUsers(ids: number[]): Map<number, Order[]> {
  queryCount++; // 1 query duy nhất với WHERE IN
  const out = new Map<number, Order[]>();
  for (const id of ids) out.set(id, []);
  for (const o of ORDERS) {
    if (out.has(o.userId)) out.get(o.userId)?.push(o);
  }
  return out;
}

// DataLoader tối giản: gom keys trong cùng tick + cache per-request
class MiniLoader {
  private cache = new Map<number, Order[]>();
  private pending = new Map<number, ((v: Order[]) => void)[]>();
  private scheduled = false;

  load(userId: number): Promise<Order[]> {
    const hit = this.cache.get(userId);
    if (hit) return Promise.resolve(hit); // cache hit: 0 query
    return new Promise((resolve) => {
      const list = this.pending.get(userId) ?? [];
      list.push(resolve);
      this.pending.set(userId, list);
      if (!this.scheduled) {
        this.scheduled = true;
        setTimeout(() => this.dispatch(), 0); // gom hết load() trong tick
      }
    });
  }

  private dispatch(): void {
    const ids = [...this.pending.keys()];
    const grouped = queryOrdersByUsers(ids); // 1 query cho tất cả
    for (const id of ids) {
      const rows = grouped.get(id) ?? [];
      this.cache.set(id, rows);
      for (const r of this.pending.get(id) ?? []) r(rows);
    }
    this.pending.clear();
    this.scheduled = false;
  }
}

// ─────────────────────────────── Demo ───────────────────────────────
async function main(): Promise<void> {
  console.log("=== N+1 Query Demo (query counter) ===\n");
  const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  queryCount = 0;
  for (const id of userIds) queryOrdersByUser(id);
  console.log(`1️⃣ Lazy (N+1): 1 query users + ${queryCount} queries orders = ${queryCount + 1} round-trips 💥`);

  queryCount = 0;
  queryOrdersByUsers(userIds);
  console.log(`2️⃣ Batch IN: 1 + ${queryCount} = ${queryCount + 1} round-trips ✅`);

  queryCount = 0;
  const loader = new MiniLoader();
  await Promise.all(userIds.map((id) => loader.load(id)));
  const first = queryCount;
  await Promise.all(userIds.map((id) => loader.load(id))); // hỏi lại
  console.log(`3️⃣ DataLoader: lần 1 = ${first} query, lần 2 (cache) = ${queryCount - first} query ✅`);

  console.log("\n✅ Bài học: list + quan hệ → batch; GraphQL resolver → DataLoader per-request.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export {};
