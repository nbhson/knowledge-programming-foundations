/**
 * 13.4 Sharding — Demo
 *
 * Mô phỏng:
 *   - Hash-based sharding: shard = hash(userId) % N, query theo shard
 *   - Range-based sharding: chia theo khoảng giá trị → cho thấy hotspot
 *   - Skew detection + rebalance: di chuyển data từ shard nóng sang shard lạnh
 */

class ShardDatabase {
  readonly name: string;
  private rows = new Map<string, string>();

  constructor(name: string) {
    this.name = name;
  }

  insert(userId: number, value: string): void {
    this.rows.set(String(userId), value);
  }

  get(userId: number): string | undefined {
    return this.rows.get(String(userId));
  }

  rowCount(): number {
    return this.rows.size;
  }

  keys(): number[] {
    return [...this.rows.keys()].map((k) => Number(k));
  }

  remove(userId: number): void {
    this.rows.delete(String(userId));
  }
}

class ShardHashRouter {
  readonly shards: ShardDatabase[];

  constructor(shardCount: number) {
    this.shards = Array.from(
      { length: shardCount },
      (_, i) => new ShardDatabase(`Shard ${i + 1}`)
    );
  }

  /** shard = hash(userId) % N — cùng userId luôn về cùng shard */
  shardFor(userId: number): ShardDatabase {
    return this.shards[userId % this.shards.length];
  }

  insertUser(userId: number, value: string): void {
    const shard = this.shardFor(userId);
    shard.insert(userId, value);
    console.log(`  📝 user ${userId} → ${shard.name} (hash=${userId % this.shards.length})`);
  }

  getUser(userId: number): string {
    const shard = this.shardFor(userId);
    const value = shard.get(userId);
    console.log(`  🔎 user ${userId} → ${shard.name}: ${value ?? "(không có)"}`);
    return value ?? "NOT_FOUND";
  }

  distribution(): number[] {
    return this.shards.map((s) => s.rowCount());
  }
}

class ShardRangeRouter {
  readonly shards: ShardDatabase[];
  private readonly bucketSize: number;

  constructor(shardCount: number, userIdMax: number) {
    this.bucketSize = Math.ceil(userIdMax / shardCount);
    this.shards = Array.from(
      { length: shardCount },
      (_, i) => new ShardDatabase(`Shard ${i + 1} (${i * this.bucketSize + 1}-${Math.min((i + 1) * this.bucketSize, userIdMax)})`)
    );
  }

  shardFor(userId: number): ShardDatabase {
    return this.shards[Math.floor((userId - 1) / this.bucketSize)];
  }

  insertUser(userId: number, value: string): void {
    this.shardFor(userId).insert(userId, value);
  }

  distribution(): number[] {
    return this.shards.map((s) => s.rowCount());
  }
}

/** Độ lệch tối đa so với giá trị trung bình (0 = cân bằng hoàn hảo) */
function shardMaxSkew(shards: ShardDatabase[]): number {
  const sizes = shards.map((s) => s.rowCount());
  const avg = sizes.reduce((a, b) => a + b, 0) / Math.max(sizes.length, 1);
  if (avg === 0) return 0;
  return Math.max(...sizes.map((size) => Math.abs(size - avg) / avg));
}

/** Di chuyển userId từ shard nóng nhất sang shard lạnh nhất */
function rebalance(moveCount: number, shards: ShardDatabase[]): void {
  const sortedHot = [...shards].sort((a, b) => b.rowCount() - a.rowCount());
  const sortedCold = [...shards].sort((a, b) => a.rowCount() - b.rowCount());
  let moved = 0;
  for (const hot of sortedHot) {
    for (const cold of sortedCold) {
      if (hot === cold) continue;
      while (hot.rowCount() > 0 && moved < moveCount && cold.rowCount() < hot.rowCount()) {
        const userId = hot.keys()[0];
        const value = hot.get(userId);
        if (value === undefined) break;
        cold.insert(userId, value);
        hot.remove(userId);
        moved++;
        console.log(`  🔄 migrate user ${userId}: ${hot.name} → ${cold.name}`);
      }
      if (moved >= moveCount) return;
    }
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Sharding Demo ===");
console.log("");

console.log("1️⃣ Hash-based sharding — 12 user phân bố qua 3 shard:");
const hashRouter = new ShardHashRouter(3);
for (let userId = 1; userId <= 12; userId++) {
  hashRouter.insertUser(userId, `user-${userId}`);
}
console.log(`  📊 Phân bố: [${hashRouter.distribution().join(", ")}] — đều nhờ hash % N`);
console.log("");

console.log("2️⃣ Query theo shard — router chỉ cần hỏi đúng 1 shard:");
hashRouter.getUser(12);
hashRouter.getUser(5);
console.log(`  📊 Không cần quét toàn bộ DB, chỉ 1 shard — O(1)`);
console.log("");

console.log("3️⃣ Range-based sharding — dữ liệu dồn về 1 khoảng → HOTSPOT:");
const rangeRouter = new ShardRangeRouter(3, 12);
for (let userId = 1; userId <= 12; userId++) {
  rangeRouter.insertUser(userId, `user-${userId}`);
}
console.log(`  📊 Phân bố: [${rangeRouter.distribution().join(", ")}] — đều (data may mắn) ...`);
console.log("  💬 Nhưng nếu thực tế user ID hay rơi vào 1 khoảng (vd đăng ký mới tuần này) thì shard cuối nghẽn.");
console.log("");

console.log("4️⃣ Skew detection + Rebalance — shard 1 bị 80% data:");
const skewed = Array.from(
  { length: 3 },
  (_, i) => new ShardDatabase(`Shard ${i + 1}`)
);
for (let userId = 1; userId <= 8; userId++) skewed[0].insert(userId, `user-${userId}`);
skewed[1].insert(20, "user-20");
skewed[1].insert(21, "user-21");
skewed[2].insert(30, "user-30");
for (const s of skewed) {
  console.log(`  📊 ${s.name}: ${s.rowCount()} rows`);
}
console.log(`  ⚠️  Max skew trước rebalance: ${(shardMaxSkew(skewed) * 100).toFixed(0)}%`);
rebalance(3, skewed);
for (const s of skewed) {
  console.log(`  📊 ${s.name} sau rebalance: ${s.rowCount()} rows`);
}
console.log(`  ✅ Max skew sau rebalance: ${(shardMaxSkew(skewed) * 100).toFixed(0)}%`);
console.log("");
console.log("✅ Sharding chia DB theo hash hoặc range; rebalance di chuyển data từ shard nóng sang lạnh");

export {};