/**
 * 13.3 CDN (Content Delivery Network) — Demo
 *
 * Mô phỏng:
 *   - Edge cache phân vùng (gần người dùng)
 *   - Cache HIT phục vụ từ edge (latency thấp) vs cache MISS phải lấy từ origin
 *   - TTL hết hạn → refetch từ origin
 *   - Purge thủ công + versioning (đổi tên file khi update)
 */

interface CDNCacheEntry {
  readonly value: string;
  readonly expiresAt: number;
}

class CDNOrigin {
  private assets = new Map<string, string>();
  private fetchCount = 0;

  constructor(seed: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(seed)) {
      this.assets.set(key, value);
    }
  }

  /** Mô phỏng fetch từ origin (cross-region, chậm) */
  getAsset(key: string): string {
    this.fetchCount++;
    const filename = key.split("/").pop() ?? key;
    console.log(`      🌐 origin fetch: /assets/${filename} (150ms — cross region)`);
    return this.assets.get(key) ?? `404:${key}`;
  }

  getFetchCount(): number {
    return this.fetchCount;
  }
}

class CDNEdge {
  readonly name: string;
  private store = new Map<string, CDNCacheEntry>();
  private readonly ttlMs: number;
  private requestCount = 0;
  hitCount = 0;
  missCount = 0;

  constructor(name: string, ttlMs: number) {
    this.name = name;
    this.ttlMs = ttlMs;
  }

  /** User request → nếu cache sống thì HIT từ edge; ngược lại fetch origin */
  request(assetKey: string, origin: CDNOrigin, now: number): string {
    this.requestCount++;
    const entry = this.store.get(assetKey);
    if (entry && now <= entry.expiresAt) {
      this.hitCount++;
      console.log(`    [${this.name}] 🎯 HIT  /assets/${assetKey} — trả từ edge (5ms)`);
      return entry.value;
    }
    this.missCount++;
    console.log(`    [${this.name}] 💥 MISS /assets/${assetKey} — phải fetch origin`);
    const value = origin.getAsset(assetKey);
    this.store.set(assetKey, { value, expiresAt: now + this.ttlMs });
    return value;
  }

  purge(assetKey: string): void {
    this.store.delete(assetKey);
    console.log(`    [${this.name}] 🧹 purge ${assetKey} — cache entry bị xóa`);
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  hitRatio(): number {
    return this.requestCount === 0 ? 0 : this.hitCount / this.requestCount;
  }
}

class CDNNetwork {
  private readonly edges: CDNEdge[];
  private readonly origin: CDNOrigin;
  private readonly ttlMs: number;

  constructor(edges: CDNEdge[], origin: CDNOrigin, ttlMs: number) {
    this.edges = edges;
    this.origin = origin;
    this.ttlMs = ttlMs;
  }

  getUser(edgeIndex: number): CDNEdge {
    return this.edges[edgeIndex];
  }

  getOrigin(): CDNOrigin {
    return this.origin;
  }

  getTtlMs(): number {
    return this.ttlMs;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== CDN Demo ===");
console.log("");

const origin = new CDNOrigin({
  "logo.png": "<logo-cũ>",
  "app.js": "console.log('v1')",
  "banner.jpg": "<banner>",
});

const hnEdge = new CDNEdge("Edge Hà Nội", 300);
const hcmEdge = new CDNEdge("Edge HCM", 300);
const cdn = new CDNNetwork([hnEdge, hcmEdge], origin, 300);
let now = 0;

console.log("1️⃣ Request đầu tiên từ 2 vùng — cả 2 đều MISS và lấy từ origin:");
console.log(`  → ${hnEdge.request("logo.png", origin, now)}`);
console.log(`  → ${hcmEdge.request("logo.png", origin, now)}`);
console.log(`  📊 Origin fetch count: ${origin.getFetchCount()}`);
console.log("");

console.log("2️⃣ Request lặp lại — lần này đều HIT từ edge (latency 5ms vs 150ms):");
console.log(`  → ${hnEdge.request("logo.png", origin, now)}`);
console.log(`  → ${hcmEdge.request("logo.png", origin, now)}`);
console.log(`  📊 Origin fetch count vẫn: ${origin.getFetchCount()}`);
console.log("");

console.log("3️⃣ TTL hết hạn (now=400ms > TTL 300ms) — edge phải refetch origin:");
now = 400;
console.log(`  → ${hnEdge.request("logo.png", origin, now)}`);
console.log("");

console.log("4️⃣ Purge thủ công — ngay cả khi TTL còn sống, cache bị xóa:");
now = 500;
hnEdge.purge("logo.png");
console.log(`  → ${hnEdge.request("logo.png", origin, now)}`);
console.log("");

console.log("5️⃣ Versioning — đổi tên file khi deploy mới để tránh cache cũ:");
now = 600;
console.log(`  → app.js  request (HIT vì file cũ còn cache): ${hnEdge.request("app.js", origin, now)}`);
console.log(`  → app.v2.js request (tên MỚI → buộc MISS): ${hnEdge.request("app.v2.js", origin, now)}`);
console.log(`  💬 Lưu ý: origin phải có bản app.v2.js mới — ở đây origin thiếu nên trả 404`);
console.log("");

console.log("6️⃣ Tổng kết hiệu năng từng edge:");
for (const edge of [hnEdge, hcmEdge]) {
  console.log(
    `  [${edge.name}] requests=${edge.getRequestCount()}, hits=${edge.hitCount}, misses=${edge.missCount}, hitRatio=${(edge.hitRatio() * 100).toFixed(0)}%`
  );
}
console.log("");
console.log("✅ CDN đưa nội dung về edge gần người dùng: HIT nhanh, TTL/purge/versioning để làm mới nội dung");

export {};