# 🌍 13.3 CDN (Content Delivery Network)

> **CDN** phân phối nội dung tĩnh đến server gần người dùng nhất — giảm latency, tăng tốc load, giảm tải cho origin server.

---

## 🎯 Kiến Trúc CDN

```
         User Request
              │
              ▼
      ┌───────────────┐
      │   CDN Edge    │  ← Server gần user nhất
      │   (Vietnam)   │     ✅ Fast response (5-20ms)
      └───────┬───────┘
              │ cache hit
              │
      ┌───────▼───────┐
      │   Origin      │  ← Server gốc
      │   (Singapore) │     ❌ Slow (cross-region 50-100ms)
      └───────────────┘
```

**Nguyên lý:** CDN có hàng trăm PoP (Point of Presence) khắp thế giới. User luôn được phục vụ từ edge server gần nhất về mặt network distance (AS path, RTT). Origin chỉ phản hồi khi **cache miss** hoặc khi CDN yêu cầu refresh.

**Con số tham chiếu:**
- Hanoi → Singapore: ~30–70 ms RTT
- Hanoi → US East Coast: ~200–300 ms RTT
- CDN edge tại Hanoi: ~5–15 ms RTT
- Giảm latency trung bình cho global user: **2–6×** (tuỳ vị trí origin)

---

## 13.3.1 CDN Cache Rules

```nginx
# Nginx + CDN cache configuration
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    # Cache tĩnh 1 năm — vì filename có hash nội dung
    expires 1y;
    add_header Cache-Control "public, immutable";

    # CDN proxy
    proxy_pass https://origin.example.com;
    proxy_cache cdn-cache;
    proxy_cache_valid 200 1y;
    proxy_cache_valid 404 1m;
}

# API không cache
location /api/ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    proxy_pass http://backend;
}
```

**Cache-Control semantics quan trọng:**

| Directive | Ý nghĩa | Use case |
|-----------|---------|----------|
| `public` | Cache được bởi bất kỳ ai (browser, CDN, proxy) | Static assets |
| `private` | Chỉ browser cache, không CDN/shared | User-specific content |
| `no-cache` | Cache được nhưng phải validate (ETag) trước khi dùng | Semi-dynamic |
| `no-store` | Không cache gì cả | Payment, session, PII |
| `max-age=N` | Valid trong N giây | Control TTL |
| `s-maxage=N` | Override `max-age` cho shared cache (CDN/CDN) | CDN-specific TTL |
| `immutable` | Không validate, cứ dùng cache | Assets với content-hash filename |

**Content nên cache vs không cache:**

| Nên cache | Không cache |
|-----------|-------------|
 | Image, CSS, JS static (có hash version) | API responses (user-specific, frequent update) |
| Font files | Session/auth data |
| HTML tĩnh (landing page, blog) | Real-time data (stock price, chat) |
| Video segments (HLS/DASH) | Websocket/SSE streams |

> 💡 **Mẹo:** versioned filename (`app.a3f2b1c4.js`) cho phép cache 1 năm tuyệt đối — đổi file = đổi hash = CDN coi như object mới. Không cần purge thủ công.

---

## 13.3.2 Cache Invalidation Strategies

| Strategy | Cách hoạt động | Khi nào dùng | Độ phức tạp |
|----------|---------------|-------------|------------|
| **TTL Expiry** | Tự expire sau thời gian | Content thay đổi định kỳ (daily report) | Thấp |
| **Cache Purge** | Xóa thủ công cache entry qua API | Content thay đổi đột ngột (breaking news, hot fix) | Trung bình |
| **Versioning** | Đổi filename khi update | Static assets (CSS, JS) | Thấp — build tool lo |
| **Stale-While-Revalidate** | Serve cached + refresh background | High availability ưu tiên | Trung bình |
| **Surrogate-Key purge** | Tag-based bulk purge (Cloudflare/Pusher) | Page có nhiều resource cần xoá cùng lúc | Trung bình |

**Purge qua API mẫu (Cloudflare):**

```typescript
async function invalidateCache(pattern: string): Promise<void> {
  await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: [`${pattern}*`]
    })
  });
}
```

> ⚠️ **Hiểu lầm:** "Purge là ngay lập tức toàn bộ edge". Thực tế propagation mất 1–10 giây tuỳ CDN và số PoP. Trong window đó, user tại một số PoP có thể vẫn nhận cached content cũ.

**Cost of cache miss:** mỗi purge không chỉ tốn API call — nó làm **thêm load cho origin** vì mọi PoP phải fetch lại. Flash sale, breaking news purge đồng loạt có thể làm sập origin nếu không chuẩn bị (CDN cache warming, origin shield).

---

## 13.3.3 Performance Metrics

```
┌──────────────────────────────────────────────────────────────┐
│  CDN Performance Comparison                                  │
├──────────────────┬───────────┬───────────┬───────────────────┤
│  Metric          │  No CDN   │  CDN      │  Improvement       │
├──────────────────┼───────────┼───────────┼───────────────────┤
│  TTFB            │  800ms    │  120ms    │  6.7x ⬆           │
│  First Paint     │  2.1s     │  0.8s     │  2.6x ⬆           │
│  Bandwidth (origin) │ 100%  │  15%      │  85% ⬇            │
│  Availability    │  99.5%    │  99.99%   │  ⬆ (multi-PoP)    │
└──────────────────┴───────────┴───────────┴───────────────────┘
```

**Ý nghĩa số liệu:**
- **TTFB (Time To First Byte):** bao lâu từ request đến khi nhận byte đầu. CDN edge gần → TCP + TLS handshake nhanh → TTFB giảm.
- **First Paint:** cảm nhận user về tốc độ. Giảm >500ms là noticeable.
- **Bandwidth origin:** CDN absorb repetitive requests → origin trả tiền ít bandwidth hơn (hoặc free tier).
- **Availability:** CDN có nhiều PoP → 1 PoP down vẫn còn các PoP khác phục vụ.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| ⚡ **Giảm latency** | Content từ server gần user nhất | Giảm RTT là yếu tố lớn nhất; mỗi continent có PoP → TTFB giảm 50–80% cho global user |
| 📉 **Giảm bandwidth origin** | Cache repetitive requests | 90% traffic có thể serve từ edge → origin chỉ lo cache miss + API dynamic |
| 🛡️ **DDoS protection** | CDN absorb traffic spike | Anycast + huge edge bandwidth (Tbps) + built-in WAF; origin không bao giờ nhìn thấy traffic spike |
| 🌍 **Global reach** | PoP khắp thế giới | Không cần xây datacenter khắp nơi; thuê CDN là có mặt tại 200+ city |
| 🔒 **SSL/TLS** | CDN handle HTTPS termination | Giảm burden origin; cert auto-renew; hỗ trợ modern TLS (1.3, HSTS, OCSP stapling) |
| 🎛️ **Edge compute** | Cloudflare Workers, Fastly VCL | Chạy logic close-to-user (A/B test, geo-routing, auth check) không cần về origin |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu |
|------------|------------|----------------|
| 💰 **Chi phí** | Pay per request/bandwidth | Free tier thường giới hạn; enterprise pricing ~$0.04–0.10 per 1M requests + $0.05–0.10/GB egress |
| 🔄 **Cache delay** | Content mới cần time propagate | TTL hoặc purge mới生效 — không instantaneous, cần chiến lược versioning |
| 📋 **Vendor lock-in** | Chuyển CDN phức tạp | Config, rules, custom headers khác nhau giữa provider; exit cost không nhỏ |
| 🌐 **Privacy** | Data đi qua third-party servers | Cookie, user-agent, IP log qua CDN; cần DPA (Data Processing Agreement) với enterprise customer |

---

## 🎯 Khi nào dùng CDN?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Website có traffic global (đa quốc gia) | ✅ Rất phù hợp | Giảm latency cho user xa origin, tăng conversion rate rõ rệt |
| Static assets nặng (images, video, font) | ✅ Phù hợp | Bandwidth cost giảm,Origin load giảm đáng kể |
| API endpoint động (user-specific, frequent update) | ❌ Không cần | Cache hit rate thấp, TTL ngắn overhead > benefit; nên dùng API gateway + origin scaling |
| Nội dung real-time (chat, live score) | ❌ Không phù hợp | Latency goal <100ms; CDN thêm hop không giúp; WebSocket direct tới origin/server cluster tốt hơn |
| App nội bộ (LAN) | ⚠️ Không cần | Nội bộ latency đã thấp; CDN thêm chi phí & complexity không xứng |
| Static marketing/landing page | ✅ Rất phù hợp | TTL dài, traffic burst (campaign) CDN absorb được; origin几乎不 cần |

---

## 🏢 Provider phổ biến

| Provider | Điểm mạnh | Giá |
|----------|-----------|-----|
| **Cloudflare** | Free tier tốt, DDoS protection, Workers edge | Free tier generous, Pro $20/mo |
| **AWS CloudFront** | Tích hợp AWS ecosystem, Lambda@Edge | Pay per request + GB egress |
| **Fastly** | Real-time purge, Varnish-based, edge compute | Enterprise-focused |
| **Akamai** | Enterprise, global coverage, legacy enterprise contracts | Expensive, enterprise negotiation |
| **Azure CDN** | Tích hợp Microsoft Azure | Azure pricing model |

---

## 🔗 Liên quan

- **13.1 Load Balancer** — LB + CDN kết hợp (edge LB trước CDN)
- **13.2 Caching Strategies** — Multi-layer caching (browser → CDN → app cache → DB)
- **5.3 Performance Optimization** — Frontend caching patterns

---

## 📚 Tài liệu tham khảo

- 📖 [Cloudflare CDN Guide](https://developers.cloudflare.com/cache/)
- 📖 [AWS CloudFront Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
- 📖 [CDN vs Cache - Smashing Magazine](https://www.smashingmagazine.com/2021/01/cdn-vs-cache/)

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.3-cdn
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [13.4 Sharding](../13.4-sharding/README.md)
