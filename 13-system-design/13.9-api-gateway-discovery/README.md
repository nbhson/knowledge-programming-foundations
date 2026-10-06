# 🚪 13.9 API Gateway & Service Discovery (Cổng API & Khám Phá Service)

> **API Gateway** là cửa ngõ duy nhất vào hệ microservices (auth, rate-limit, routing, aggregation) — còn **Service Discovery** là danh bạ sống giúp gateway tìm được instance đang khỏe.

---

## 🎯 Vấn Đề

Microservices có 10 service × 5 instance = 50 endpoint động (scale, deploy, crash liên tục). Không thể bắt client nhớ hết:

```
Không gateway:                     Có gateway + discovery:

Mobile ──▶ svc A,B,C (3 calls)      Mobile ─▶ [Gateway] ─┬─▶ svc A
Web ──▶ svc A,B,C (lặp auth,        (1 call, auth 1 lần)  ├─▶ svc B (via registry)
  rate-limit mỗi nơi)                                     └─▶ svc C
❌ auth phân tán ❌ N+1 calls         ✅ cross-cutting tập trung ✅ client gọn
❌ client biết topology nội bộ       ✅ topology thay đổi không ảnh hưởng client
```

**Trade-off:** gateway là single entry point — giảm N+1 problem và phân tán logic, đổi lấy một hop latency thêm và một component phải làm HA.

---

## 13.9.1 API Gateway: 4 Trách Nhiệm

| Trách nhiệm | Làm gì | Ví dụ |
|-------------|--------|-------|
| **Auth** | Xác thực 1 lần ở cửa, truyền identity downstream (JWT/mTLS) | `Authorization: Bearer` → verify → forward `X-User-Id` |
| **Rate limit** | Chặn abuse/DDoS theo IP/user/API key (token bucket, sliding window) | 100 req/min/user; burst cho flash sale |
| **Routing** | Path/host/header-based route tới service đúng (+ versioning `/v1`, `/v2`) | `/users/*` → user-svc, `/orders/*` → order-svc |
| **Aggregation** | Gộp N downstream calls thành 1 response (BFF pattern) | `/dashboard` = user + orders + notif |

```
Client ─▶ [Auth] ─▶ [Rate Limit] ─▶ [Router] ─┬─▶ user-svc (registry lookup)
                                              ├─▶ order-svc (registry lookup)
                                              └─▶ ◀ gộp ◀ /dashboard
```

> 💡 **BFF (Backend-for-Frontend):** mobile cần payload gọn, web cần payload đầy — mỗi client một gateway/aggregation layer riêng thay vì 1 response "vừa cho tất cả".

## 13.9.2 Service Discovery: Client-Side vs Server-Side

Instance lên/xuống liên tục — cần **registry** (Consul, etcd, K8s CoreDNS) + health check + deregister khi chết.

| Kiểu | Luồng | Ưu | Nhược | Ví dụ |
|------|-------|----|-------|-------|
| **Client-side** | Client query registry → chọn instance → gọi trực tiếp | Bớt 1 hop, client control load-balance | Mỗi ngôn ngữ cần lib discovery; client biết topology | Eureka + Ribbon, gRPC xDS |
| **Server-side** | Client → router/LB → LB query registry → forward | Client đơn giản (chỉ biết 1 địa chỉ) | Thêm hop, router là SPOF (phải HA) | AWS ALB + Target Group, K8s Service |

```
Client-side:                          Server-side:

Client ─▶ [Registry]                 Client ─▶ [LB/Router] ─▶ [Registry]
   └─▶ svc instance (trực tiếp)                   └─▶ svc instance
```

**Health check 2 lớp:** registry probe (`/health`, interval 5–10s, fail 2–3 lần mới loại — chống flapping) + gateway circuit breaker (fail fast khi downstream lỗi hàng loạt, tránh cascading failure — xem 13.6).

---

## 💻 Code/Khái Niệm Ví Dụ

Demo trong `examples/index.ts`: `ServiceRegistry` (register/deregister/health) + `RoundRobinRouter` + `FixedWindowLimiter` + `ApiGateway` (auth → rate-limit → routing → forward) + aggregation `/dashboard`.

```typescript
// Minh họa pipeline gateway (rút gọn từ demo)
gateway.handle({ path: "/users", apiKey: "secret-key-123", userId: "alice" });
// → 200 OK ← user-service/u1 (round-robin trên instance khỏe)
// sai key → 401 | vượt quota → 429 | u1 chết → traffic dồn về u2 (failover)
```

**Back-of-envelope — sizing gateway:**

| Tham số | Ví dụ | Suy ra |
|---------|-------|--------|
| Edge QPS | 5k req/s, mỗi req gateway tốn ~2ms CPU | ~10 CPU cores chỉ cho gateway |
| Aggregation fan-out | `/dashboard` gọi 3 svc × 50ms p99 | p99 dashboard ≥ 50ms + overhead (gọi song song, timeout 200ms) |
| Rate-limit store | 1M users × sliding window Redis (~100B/user) | ~100MB Redis — dùng Redis, không lưu local (multi-instance) |
| HA | Gateway SPOF | ≥ 2 AZ + anycast/HA pair; stateless để scale ngang |

Quy tắc: **gateway phải stateless** (rate-limit state ra Redis, session ra store chung) thì mới scale-out và rolling deploy được.

---

## ✅ Lợi Ích

- **Single entry point:** auth, SSL termination, logging, metrics tập trung một chỗ — audit dễ.
- **Client gọn:** mobile/web gọi 1 API gộp thay vì N+1 calls (tiết kiệm radio/battery, giảm latency tail).
- **Thay đổi nội bộ tự do:** refactor/split service không vỡ client, miễn gateway contract giữ nguyên.
- **Resilience tập trung:** rate-limit + circuit breaker + failover ở cửa bảo vệ toàn bộ backend.

## ⚠️ Lưu Ý

- **Gateway phình to (fat gateway):** nhồi business logic vào gateway → distributed monolith khó deploy — gateway chỉ làm cross-cutting, logic ở service.
- **SPOF nếu không HA:** gateway sập = tất cả sập — bắt buộc multi-AZ, stateless, autoscale.
- **Latency cộng dồn:** mỗi lớp gateway/LB thêm ~1–5ms — aggregation gọi tuần tự N service sẽ nổ p99; luôn gọi song song + timeout + fallback.
- **Versioning:** `/v1` → `/v2` phải song song một thời gian (deprecation window), không breaking change đột ngột.

## 🎯 Khi Nào Dùng

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| ≥ 3 microservices, nhiều client (web/mobile/partner) | ✅ Bắt buộc | Tập trung auth/rate-limit, che topology |
| Cần rate-limit global / chống abuse | ✅ Phù hợp | Enforce ở cửa dễ hơn mỗi service |
| Mobile cần payload gộp (N+1 problem) | ✅ BFF aggregation | 1 call thay N calls qua mạng chậm |
| 1 monolith nội bộ, < 100 req/s | ⚠️ Tùy chọn | Nginx reverse proxy đủ, gateway full là thừa |
| Ultra-low-latency (trading, realtime game) | ⚠️ Cân nhắc | Mỗi hop tốn ms — đo trước khi thêm gateway |

---

## 🔗 Liên Quan

- **13.1 Load Balancer** — Gateway thường đứng trước LB nội bộ (L7 edge → L4 internal)
- **13.6 Scalable Architecture** — API Gateway + Service Discovery là pattern lõi của microservices
- **13.8 Message Queues** — Gateway nhận spike → buffer bằng queue worker phía sau
- **13.10 Consensus & Raft** — Registry HA (etcd/Consul) dùng consensus để đồng thuận membership

---

## 📚 Tài Liệu

- 📖 [Kong — API Gateway Pattern](https://docs.konghq.com/gateway/latest/)
- 📖 [Consul Service Discovery](https://developer.hashicorp.com/consul/docs/discovery/services)
- 📖 [Kubernetes Service & CoreDNS](https://kubernetes.io/docs/concepts/services-networking/service/) — server-side discovery thực tế

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.9-api-gateway-discovery
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [13.10 Consensus & Raft](../13.10-consensus-raft/README.md)
