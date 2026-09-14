/**
 * 13.2 Caching Strategies — Demo
 *
 * Mô phỏng các chiến lược cache với Mock Database + in-memory cache:
 *   - Cache-Aside: đọc cache trước, miss mới vào DB, rồi lưu lại cache
 *   - Write-Through: ghi DB và cache đồng bộ
 *   - Write-Back (Write-Behind): ghi cache trước, async flush xuống DB
 *   - TTL: entry tự hết hạn sau thời gian chỉ định
 */

interface CASCacheEntry {
  readonly value: string;
  readonly expiresAt: number;
}

class CASCache {
  private store = new Map<string, CASCacheEntry>();
  private readonly defaultTtlMs: number;
  hits = 0;
  misses = 0;

  constructor(defaultTtlMs: number) {
    this.defaultTtlMs = defaultTtlMs;
  }

  /** Lấy value nếu còn sống; nếu hết TTL thì coi như miss và xóa entry */
  getOrNull(key: string, now: number): string | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (now > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.value;
  }

  set(key: string, value: string, now: number, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    this.store.set(key, { value, expiresAt: now + ttl });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }
}

class CASMockDatabase {
  private rows = new Map<string, string>();

  constructor(seed: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(seed)) {
      this.rows.set(key, value);
    }
  }

  read(key: string): string {
    process.stdout.write("DB ");
    return this.rows.get(key) ?? `(mặc định: ${key})`;
  }

  write(key: string, value: string): void {
    process.stdout.write("DB ");
    this.rows.set(key, value);
  }

  get(key: string): string | undefined {
    return this.rows.get(key);
  }
}

class CASCacheAside {
  constructor(
    private readonly cache: CASCache,
    private readonly db: CASMockDatabase,
    private readonly ttlMs: number
  ) {}

  read(key: string, now: number): string {
    const cached = this.cache.getOrNull(key, now);
    if (cached !== null) {
      console.log(`  ✅ HIT : ${key} → ${cached} (từ cache)`);
      return cached;
    }
    console.log(`  ❌ MISS: ${key} → phải đọc DB`);
    const value = this.db.read(key);
    this.cache.set(key, value, now, this.ttlMs);
    console.log(`  📩     → lưu ${key} vào cache cho ${this.ttlMs}ms`);
    return value;
  }

  write(key: string, value: string, now: number): void {
    this.db.write(key, value);
    this.cache.invalidate(key);
    console.log(`  ✍️  Ghi DB + invalidate cache để lần đọc sau luôn mới`);
  }
}

class CASWriteThrough {
  constructor(
    private readonly cache: CASCache,
    private readonly db: CASMockDatabase,
    private readonly ttlMs: number
  ) {}

  read(key: string, now: number): string {
    const cached = this.cache.getOrNull(key, now);
    if (cached !== null) return cached;
    const value = this.db.read(key);
    this.cache.set(key, value, now, this.ttlMs);
    return value;
  }

  write(key: string, value: string, now: number): void {
    console.log(`  ✍️  write-through: ghi DB...`);
    this.db.write(key, value);
    this.cache.set(key, value, now, this.ttlMs);
    console.log(`  ✍️  ...và set cache ${key} → ${value} (luôn đồng bộ)`);
  }
}

class CASWriteBack {
  private pending = new Map<string, string>();

  constructor(
    private readonly cache: CASCache,
    private readonly db: CASMockDatabase,
    private readonly ttlMs: number
  ) {}

  write(key: string, value: string, now: number): void {
    this.cache.set(key, value, now, this.ttlMs);
    this.pending.set(key, value);
    console.log(`  ⚡ write-back: chỉ ghi cache ${key} → ${value} (chưa đụng DB)`);
  }

  /** Job nền định kỳ đẩy các entry pending xuống DB */
  flush(): void {
    for (const [key, value] of this.pending) {
      console.log(`  🔄 background flush: ${key} → DB`);
      this.db.write(key, value);
    }
    this.pending.clear();
  }

  pendingCount(): number {
    return this.pending.size;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Caching Strategies Demo ===");
console.log("");

const cacheAsideCache = new CASCache(200);
const cacheAsideDb = new CASMockDatabase({ "user:1": "Alice", "user:2": "Bob" });
const cacheAside = new CASCacheAside(cacheAsideCache, cacheAsideDb, 200);
let now = 0;

console.log("1️⃣ Cache-Aside — đọc lần 1 (MISS), lần 2 (HIT):");
console.log(`  → ${cacheAside.read("user:1", now)}`);
console.log(`  → ${cacheAside.read("user:1", now)}`);
console.log(`  → ${cacheAside.read("user:2", now)}`);
console.log(`  📊 Hits=${cacheAsideCache.hits}, Misses=${cacheAsideCache.misses}`);
console.log("");

console.log("2️⃣ Cache-Aside + invalidate — ghi thay đổi rồi đọc lại (luôn mới):");
cacheAside.write("user:1", "Alice (Cập nhật)", now);
console.log(`  → ${cacheAside.read("user:1", now)}`);
console.log("");

console.log("3️⃣ TTL — sau 250ms, entry user:1 hết hạn nên phải vào DB lại:");
now = 250;
console.log(`  → ${cacheAside.read("user:1", now)}`);
console.log(`  📊 Hits=${cacheAsideCache.hits}, Misses=${cacheAsideCache.misses}`);
console.log("");

console.log("4️⃣ Write-Through — ghi đồng bộ cả DB + cache:");
const wtCache = new CASCache(200);
const wtDb = new CASMockDatabase({ "product:9": "Cổ phiếu X" });
const writeThrough = new CASWriteThrough(wtCache, wtDb, 200);
writeThrough.write("product:9", "Cổ phiếu X (đã tăng giá)", 400);
console.log(`  → đọc ngay sau ghi (HIT): ${writeThrough.read("product:9", 400)}`);
console.log(`  ✅ DB cũng đã có giá trị mới: ${wtDb.get("product:9")}`);
console.log("");

console.log("5️⃣ Write-Back — ghi cache nhanh, DB chưa được ghi cho tới khi flush:");
const wbCache = new CASCache(500);
const wbDb = new CASMockDatabase({ "log:1": "log-cũ" });
const writeBack = new CASWriteBack(wbCache, wbDb, 500);
writeBack.write("log:1", "log-mới", 500);
console.log(`  ⏳ Ngay sau khi ghi: pending=${writeBack.pendingCount()}, DB vẫn là "${wbDb.get("log:1")}"`);
writeBack.flush();
console.log(`  ✅ Sau flush      : pending=${writeBack.pendingCount()}, DB giờ là "${wbDb.get("log:1")}"`);
console.log("");

console.log("✅ Các chiến lược cache: cache-aside (đọc), write-through (an toàn), write-back (nhanh) kèm TTL");

export {};