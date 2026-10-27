/**
 * 10.6 Redis — Mô phỏng cache GET/SET/EXPIRE + Cache-Aside pattern
 *
 * Minh họa:
 * - RedisCache: lưu cặp key→value trong Map kèm expiresAt (TTL)
 * - Lệnh mô phỏng: SET / GET / EXPIRE / TTL / DEL
 * - Lazy expiration: entry hết hạn bị coi là miss khi GET
 * - Cache-Aside: đọc cache → miss thì query "DB" → ghi cache → trả về
 *
 * ⚠️ Đây là mô phỏng Redis bằng TS thuần, không kết nối Redis thật.
 */

// ─────────────────────────────── Types ─────────────────────────────────────
interface RedisEntry {
  value: string;
  expired: number; // expiresAt (epoch ms)
}

// ──────────────────────── Redis (bộ nhớ) mô phỏng ──────────────────────────
class RedisCache {
  private store = new Map<string, RedisEntry>();
  private hit = 0;
  private miss = 0;

  // SET key value [EX seconds]
  set(key: string, value: string, ttlSeconds?: number): string {
    const expired =
      ttlSeconds === undefined ? Infinity : Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expired });
    return ttlSeconds ? `OK (TTL ${ttlSeconds}s)` : "OK";
  }

  // GET key — lazy expiration: entry quá hạn coi như không tồn tại
  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expired) {
      this.store.delete(key); // expire + xóa
      return null;
    }
    return entry.value;
  }

  // EXPIRE key seconds — cập nhật TTL cho key hiện có
  expire(key: string, ttlSeconds: number): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    entry.expired = Date.now() + ttlSeconds * 1000;
    return true;
  }

  // TTL key — còn bao nhiêu giây
  ttl(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return -2; // -2 = không tồn tại
    const remainMs = entry.expired - Date.now();
    if (remainMs <= 0) {
      this.store.delete(key);
      return -2;
    }
    return Math.floor(remainMs / 1000);
  }

  // DEL key
  del(key: string): number {
    return this.store.delete(key) ? 1 : 0;
  }

  // Thống kê
  stats(): { size: number; hit: number; miss: number } {
    return { size: this.store.size, hit: this.hit, miss: this.miss };
  }
}

// ────────────────────────── "Database" giả định ─────────────────────────────
interface CacheUser {
  id: number;
  email: string;
  name: string;
}

const DB_USERS: CacheUser[] = [
  { id: 1, email: "alice@example.com", name: "Alice" },
  { id: 2, email: "bob@example.com", name: "Bob" },
  { id: 3, email: "carol@example.com", name: "Carol" },
];

// Hàm query DB — luôn "đắt" (chậm) để thấy lợi ích của cache
function queryUserFromDb(userId: number): CacheUser | null {
  const delay = 200; // mô phỏng query mất 200ms
  const start = Date.now();
  while (Date.now() - start < delay) {
    // CPU loop giả lập chờ
  }
  return DB_USERS.find((u) => u.id === userId) ?? null;
}

// ──────────────── Cache-Aside (lazy loading) pattern ───────────────────────
class CacheAside {
  constructor(private cache: RedisCache) {}

  // Lấy user: cache trước, miss thì query DB rồi ghi cache (TTL 10s)
  getUserCached(userId: number): CacheUser | null {
    const key = `user:${userId}`;

    // 1. Thử cache (nhanh - khoảng thời gian gần như bằng 0)
    const cached = this.cache.get(key);
    if (cached !== null) {
      console.log(`   ⚡ CACHE HIT  : user:${userId} (lấy từ bộ nhớ, không chạm DB)`);
      return JSON.parse(cached) as CacheUser;
    }
    console.log(`   🐢 CACHE MISS : user:${userId} → phải query DB`);

    // 2. Cache miss → query DB
    const user = queryUserFromDb(userId);
    if (user) {
      // 3. Ghi vào cache kèm TTL (nếu giữ quá lâu → data stale)
      this.cache.set(key, JSON.stringify(user), 10);
      console.log(`   💾 Đã lưu user:${userId} vào cache với TTL 10s`);
    }
    return user;
  }

  // Khi DB thay đổi → invalidate (xóa) cache để tránh stale data
  updateUser(userId: number, patch: Partial<CacheUser>): void {
    const user = DB_USERS.find((u) => u.id === userId);
    if (user) Object.assign(user, patch);
    const removed = this.cache.del(`user:${userId}`);
    console.log(`   🧹 Cập nhật DB + invalidate cache (xóa ${removed} key)`);
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Redis Cache Demo ===");
console.log("");

const redis = new RedisCache();
const cacheAside = new CacheAside(redis);

console.log("1️⃣ Lệnh cơ bản SET / GET / EXPIRE / TTL:");
console.log(`   ▶ SET session:abc "payload" EX 30`);
redis.set("session:abc", "{ userId: 1 }", 30);
console.log(`   ▶ GET session:abc                → ${redis.get("session:abc")}`);
console.log(`   ▶ TTL session:abc                → ${redis.ttl("session:abc")}s còn lại`);
console.log(`   ▶ EXPIRE session:abc 5`);
redis.expire("session:abc", 5);
console.log(`   ▶ TTL session:abc sau EXPIRE     → ${redis.ttl("session:abc")}s còn lại`);
console.log(`   ▶ GET key không tồn tại           → ${redis.get("no-such-key")}`);
console.log("");

console.log("2️⃣ TTL hết hạn → GET trả null (lazy expiration):");
redis.set("flash-sale", "deal-số-1", 1);
console.log(`   TTL ban đầu: ${redis.ttl("flash-sale")}s`);
console.log("   Đợi 1.1s cho hết hạn...");
const end = Date.now();
while (Date.now() - end < 1100) {
  // chờ
}
console.log(`   ✓ GET flash-sale → ${redis.get("flash-sale")} (đã expire!)`);
console.log(`   ✓ TTL flash-sale → ${redis.ttl("flash-sale")} (-2 = không tồn tại)`);
console.log("");

console.log("3️⃣ Cache-Aside pattern — đọc user 3 lần liên tiếp:");
console.log("");
const t0 = Date.now();
cacheAside.getUserCached(1); // miss → query DB (~200ms)
const t1 = Date.now();
cacheAside.getUserCached(1); // hit → tức thì
const t2 = Date.now();
cacheAside.getUserCached(1); // hit → tức thì
const t3 = Date.now();

console.log("");
console.log(`   ⏱ Lần 1 (miss, query DB): ${t1 - t0}ms`);
console.log(`   ⏱ Lần 2 (hit, cache)    : ${t2 - t1}ms`);
console.log(`   ⏱ Lần 3 (hit, cache)    : ${t3 - t2}ms`);
console.log("");

console.log("4️⃣ Invalidate khi DB thay đổi (tránh stale data):");
cacheAside.updateUser(1, { name: "Alice Nguyen" });
console.log(`   → GET tiếp theo: ${cacheAside.getUserCached(1)?.name} (data mới từ DB)`);
console.log("");

console.log(`5️⃣ Trạng thái cache cuối: size=${redis.stats().size} keys | hit=${redis.stats().hit} miss=${redis.stats().miss} (hit tỷ lệ thuận với tốc độ)`);
console.log("");

console.log("✅ Redis = bộ nhớ key-value với TTL: SET/GET/EXPIRE đơn giản; kết hợp Cache-Aside (đọc cache → miss query DB → lưu cache + TTL) và invalidate khi update DB để vừa nhanh vừa không bị stale data.");
export {};