/**
 * 11.8 DNS — resolution chain, caching/TTL + mô phỏng resolver cache
 *
 * Minh họa:
 * - Chain: browser → OS → recursive → root → TLD → authoritative.
 * - Cache + TTL: hit tiết kiệm query, expire phải hỏi lại.
 * - Đổi IP với TTL cao (kẹt) vs hạ TTL trước (mượt).
 *
 * Chạy: npx ts-node examples/index.ts
 */

// ─────────────────────────── Resolver ───────────────────────────
interface DnsRecord {
  ip: string;
  expiresAt: number;
}

class Resolver {
  private cache = new Map<string, DnsRecord>();
  queries = 0; // số lần phải đi hết chain (tốn thời gian/tiền)

  resolve(
    host: string,
    ttlSec: number,
    authoritative: () => string,
    now: number,
  ): { ip: string; hit: boolean } {
    const cached = this.cache.get(host);
    if (cached && cached.expiresAt > now) return { ip: cached.ip, hit: true };
    this.queries++; // miss → root → TLD → authoritative
    const ip = authoritative();
    this.cache.set(host, { ip, expiresAt: now + ttlSec * 1000 });
    return { ip, hit: false };
  }
}

// ─────────────────────────────── Demo ───────────────────────────────
function main(): void {
  console.log("=== DNS Resolution Demo ===\n");

  console.log("Chain: browser cache → OS → recursive → root(.) → TLD(.com) → auth(example.com) → IP");
  console.log("Types: A (IPv4) · AAAA (IPv6) · CNAME (alias) · MX (mail) · TXT (verify) · NS/SRV/PTR\n");

  const resolver = new Resolver();
  let currentIp = "93.184.216.34";
  const t0 = 0;

  console.log("1️⃣ TTL 300s, resolve 3 lần trong 60s:");
  for (let i = 0; i < 3; i++) {
    const r = resolver.resolve("api.example.com", 300, () => currentIp, t0 + i * 20_000);
    console.log(`   lần ${i + 1}: ${r.ip} (${r.hit ? "cache HIT 0ms" : "MISS đi hết chain"})`);
  }
  console.log(`   tổng queries ra ngoài: ${resolver.queries} (1 thay vì 3) ✅`);

  console.log("\n2️⃣ Đổi IP khi TTL còn hiệu lực (kẹt cache):");
  currentIp = "203.0.113.10";
  const stuck = resolver.resolve("api.example.com", 300, () => currentIp, t0 + 60_000);
  console.log(`   resolve → ${stuck.ip} (${stuck.hit ? "HIT IP CŨ — user kẹt tới khi TTL hết 💥" : "mới"})`);

  console.log("\n3️⃣ Quy trình đúng: hạ TTL 60s trước 48h → đổi IP → ai cũng thấy mới trong 1 phút:");
  const r2 = new Resolver();
  r2.resolve("api.example.com", 60, () => currentIp, t0);
  const fresh = r2.resolve("api.example.com", 60, () => "198.51.100.7", t0 + 61_000);
  console.log(`   sau 61s (hết TTL 60s): ${fresh.ip} (${fresh.hit ? "cũ" : "MỚI ✅"})`);

  console.log("\n✅ Bài học: TTL 300s mặc định; 60s trước migration; cao cho infra ổn định.");
}

main();

export {};
