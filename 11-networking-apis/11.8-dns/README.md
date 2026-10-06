# 🌍 11.8 DNS (Resolution Chain, Cache & TTL)

> **DNS** dịch hostname thành IP qua chuỗi: browser cache → OS → recursive resolver → root → TLD → authoritative. **TTL** quyết định cache bao lâu: thấp thì đổi nhanh nhưng query nhiều, cao thì nhanh nhưng đổi chậm.

---

## 🎯 Vấn đề

Đổi server mà user 2 ngày vẫn vào IP cũ (TTL 86400 chưa hết), hoặc đặt TTL 5s "cho linh hoạt" rồi latency DNS tăng vọt + hóa đơn resolver phình:

```
TTL 86400: đổi IP → 50% user kẹt IP cũ 1 ngày 💥
TTL 5:     mỗi request 1 query DNS → +50ms + tốn tiền 💥
```

---

## 💻 Code ví dụ

Mô phỏng resolver có cache + TTL: hit/miss, expire, và so sánh TTL thấp/cao.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

interface Record { ip: string; expiresAt: number }

class Resolver {
  private cache = new Map<string, Record>();
  queries = 0; // số lần phải hỏi authoritative (tốn kém)

  resolve(host: string, ttlSec: number, authoritativeIp: () => string, now: number): { ip: string; hit: boolean } {
    const hit = this.cache.get(host);
    if (hit && hit.expiresAt > now) return { ip: hit.ip, hit: true };
    this.queries++; // miss → đi hết chain root→TLD→auth
    const ip = authoritativeIp();
    this.cache.set(host, { ip, expiresAt: now + ttlSec * 1000 });
    return { ip, hit: false };
  }
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Hiểu chain | Biết hỏng ở tầng nào: browser/OS/resolver/auth — debug thay vì "mạng lag" |
| TTL đúng | 300s cho web thường; 60s trước migration; cao cho infra ổn định |
| Nhanh + rẻ | Cache hit = 0ms + 0 tiền; prefetch/warm cho domain quan trọng |

---

## ⚠️ Lưu Ý

- Các record hay dùng: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (verify/SPF), NS/SRV/PTR.
- Khi đổi DNS: hạ TTL xuống 60s trước 48h, đổi IP, xác nhận, rồi nâng lại — không đổi ngang TTL cao.
- DNS không mã hóa mặc định: dùng DoH/DoT khi cần riêng tư; DNSSEC chống giả mạo.
- Negative caching: domain không tồn tại cũng bị cache (SOA TTL) — đừng spam query domain sai.

---

## 🎯 Khi nào dùng

- Mọi production domain: TTL 300s mặc định; 60s trước migration; CNAME cho alias, A cho apex.
- Không dùng TTL 0–5s thường trực trừ khi có Global Server Load Balancing chuyên dụng.

---

## 🔗 Liên quan

- **11.1 HTTP Basics** — request bắt đầu sau khi DNS resolve xong.
- **11.9 TLS Handshake** — cert verify hostname sau khi có IP từ DNS.
- **10.6 Redis** — cache DNS tư duy giống cache-aside + TTL.

---

## 📚 Tài liệu

- DNS Illustrated — https://howdns.works/
- Cloudflare DNS docs — https://developers.cloudflare.com/dns/

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.8-dns
npx ts-node examples/index.ts
```

Demo: resolution chain → cache hit/miss theo TTL → đổi IP với TTL cao (kẹt) vs hạ TTL trước (mượt).

---

## ⏭️ Bài tiếp theo

→ [11.9 TLS Handshake](../11.9-tls-handshake/README.md)
