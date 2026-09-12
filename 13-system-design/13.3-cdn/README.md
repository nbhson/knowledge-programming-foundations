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
      │   (Vietnam)   │     ✅ Fast response
      └───────┬───────┘
              │ cache hit
              │
      ┌───────▼───────┐
      │   Origin      │  ← Server gốc
      │   (Singapore) │     ❌ Slow (cross-region)
      └───────────────┘
```

> 📌 **Nguyên lý:** CDN có hàng trăm PoP (Point of Presence) khắp thế giới. User luôn được phục vụ từ edge server gần nhất.

---

## 13.3.1 CDN Cache Rules

```nginx
# Nginx + CDN cache configuration
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    # Cache tĩnh 1 năm
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

### Content nên cache vs không cache

| Nên cache | Không cache |
|-----------|-------------|
| Image, CSS, JS static | API responses |
| Font files | User-specific data |
| HTML tĩnh | Session data |
| Asset có version/hash | Real-time data |

---

## 13.3.2 Cache Invalidation Strategies

| Strategy | Cách hoạt động | Khi nào dùng |
|----------|---------------|-------------|
| **TTL Expiry** | Tự expire sau thời gian | Content thay đổi định kỳ |
| **Cache Purge** | Xóa thủ công cache entry | Content thay đổi đột ngột |
| **Versioning** | Đổi filename khi update | Static assets (CSS, JS) |
| **Stale-While-Revalidate** | Serve cached + refresh background | High availability |

```typescript
// Cache invalidation trên API
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

// Versioning static assets
// index.a3f2b1c4.js  ← hash từ nội dung file
// style.d8e9f0a1.css
```

---

## 13.3.3 Performance Metrics

```
┌──────────────────────────────────────────────────────┐
│  CDN Performance Comparison                          │
├──────────────────┬───────────┬───────────┬───────────┤
│  Metric          │  No CDN   │  CDN      │  Improvement│
├──────────────────┼───────────┼───────────┼───────────┤
│  TTFB            │  800ms    │  120ms    │  6.7x ⬆   │
│  First Paint     │  2.1s     │  0.8s     │  2.6x ⬆   │
│  Bandwidth       │  100%     │  15%      │  85% ⬇    │
│  Availability    │  99.5%    │  99.99%   │  ⬆        │
└──────────────────┴───────────┴───────────┴───────────┘
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| ⚡ **Giảm latency** | Content từ server gần user nhất |
| 📉 **Giảm bandwidth** | Cache repetitive requests |
| 🛡️ **DDoS protection** | CDN absorb traffic spike |
| 🌍 **Global reach** | PoP khắp thế giới |
| 🔒 **SSL/TLS** | CDN handle HTTPS termination |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 💰 **Chi phí** | Pay per request/bandwidth |
| 🔄 **Cache delay** | Content mới cần time propagate |
| 📋 **Vendor lock-in** | Chuyển CDN phức tạp |
| 🌐 **Privacy** | Data đi qua third-party servers |

---

## 🎯 Khi nào dùng CDN?

| Scenario | Khuyến nghị |
|----------|-------------|
| Website có traffic global | ✅ Rất phù hợp |
| Static assets nặng (images, video) | ✅ Phù hợp |
| API endpoint động | ❌ Không cần |
| Nội dung real-time | ❌ Không phù hợp |
| App nội bộ ( LAN ) | ⚠️ Không cần |

---

## 🏢 Provider phổ biến

| Provider | Điểm mạnh |
|----------|-----------|
| **Cloudflare** | Free tier tốt, DDoS protection |
| **AWS CloudFront** | Tích hợp AWS ecosystem |
| **Fastly** | Real-time purge, edge compute |
| **Akamai** | Enterprise, global coverage |
| **Azure CDN** | Tích hợp Microsoft Azure |

---

## 🔗 Liên quan

- **13.1 Load Balancer** — LB + CDN kết hợp
- **13.2 Caching Strategies** — Multi-layer caching
- **5.3 Performance Optimization** — Frontend caching patterns

---

## 📚 Tài liệu tham khảo

- 📖 [Cloudflare CDN Guide](https://developers.cloudflare.com/cache/)
- 📖 [AWS CloudFront Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)
- 📖 [CDN vs Cache - Smashing Magazine](https://www.smashingmagazine.com/2021/01/cdn-vs-cache/)

---

## ⏭️ Bài Tiếp Theo

→ [13.4 Sharding](../13.4-sharding/README.md)
