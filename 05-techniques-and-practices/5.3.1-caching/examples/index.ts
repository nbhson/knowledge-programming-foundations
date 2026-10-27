/**
 * 5.3.1 Caching — Cache-Aside + LRU Cache + TTL
 *
 * TS thuần + Node built-in. Mô phỏng DB chậm + cache nhanh,
 * đếm HIT/MISS để thấy latency và số query giảm ra sao.
 *
 * Chạy: npx ts-node examples/index.ts
 */

interface User {
  id: string;
  name: string;
}

// ─────────────────── Fake DB (chậm) ────────────────────

class FakeDatabase {
  private rows = new Map<string, User>([
    ["1", { id: "1", name: "John" }],
    ["2", { id: "2", name: "Jane" }],
  ]);
  queryCount = 0;

  findById(id: string): User {
    this.queryCount++;
    const user = this.rows.get(id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
  }
}

// ─────────────────── LRU Cache (theo README) ────────────────────

class LRUCache<K, V> {
  private map = new Map<K, { value: V; expiresAt: number }>();

  constructor(private capacity: number, private ttlMs: number = 60_000) {}

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key); // hết TTL → coi như miss
      return undefined;
    }
    // Move to end (most recently used)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  put(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const lruKey = this.map.keys().next().value as K;
      this.map.delete(lruKey);
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  size(): number {
    return this.map.size;
  }
}

// ─────────────────── Cache-Aside helper ────────────────────

function createCachedReader(db: FakeDatabase, cache: LRUCache<string, User>) {
  let hits = 0;
  let misses = 0;

  const getUser = (id: string): User => {
    const cached = cache.get(`user:${id}`);
    if (cached) {
      hits++;
      return cached;
    }
    misses++;
    const user = db.findById(id);
    cache.put(`user:${id}`, user);
    return user;
  };

  return { getUser, stats: () => ({ hits, misses }) };
}

// ────────────────────────── Demo chạy ─────────────────────────────────

function main(): void {
  console.log("=== 5.3.1 Caching Demo (Cache-Aside + LRU, TS thuần) ===\n");

  console.log("❌ CÁCH XẤU — mỗi request đều query DB:");
  const dbBad = new FakeDatabase();
  dbBad.findById("1");
  dbBad.findById("1");
  dbBad.findById("1");
  console.log(`   3 lần getUser(1) → ${dbBad.queryCount} DB queries\n`);

  console.log("✅ CÁCH TỐT — Cache-Aside (capacity=100, TTL=60s):");
  const db = new FakeDatabase();
  const cache = new LRUCache<string, User>(100);
  const reader = createCachedReader(db, cache);
  console.log(`   getUser(1) → ${JSON.stringify(reader.getUser("1"))} (MISS)`);
  console.log(`   getUser(1) → ${JSON.stringify(reader.getUser("1"))} (HIT)`);
  console.log(`   getUser(2) → ${JSON.stringify(reader.getUser("2"))} (MISS)`);
  console.log(`   getUser(1) → ${JSON.stringify(reader.getUser("1"))} (HIT)`);
  const { hits, misses } = reader.stats();
  console.log(`   → HIT=${hits}, MISS=${misses}, DB queries=${db.queryCount} (thay vì 4)`);

  console.log("\n✅ LRU eviction (capacity=2):");
  const small = new LRUCache<string, number>(2);
  small.put("a", 1);
  small.put("b", 2);
  small.get("a"); // a thành MRU, b thành LRU
  small.put("c", 3); // evict b
  console.log(`   get(b) = ${small.get("b")} (bị evict, undefined)`);
  console.log(`   get(a) = ${small.get("a")} (còn, vì vừa dùng)`);
  console.log(`   get(c) = ${small.get("c")} (mới thêm)`);
}

main();

export {};
