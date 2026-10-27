# 🏗️ Lớp 13: System Design (Thiết Kế Hệ Thống)

> **System Design** là nghệ thuật thiết kế kiến trúc hệ thống lớn — cân bằng giữa hiệu suất, độ sẵn sàng, khả năng mở rộng và chi phí.
> Không có giải pháp tối ưu duy nhất — chỉ có trade-off.

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Khi nào cần quan tâm |
|---|--------|----------|---------------------|
| 13.1 | [Load Balancer](13.1-load-balancer/README.md) | Cân bằng tải L4/L7 | Khi ≥1 server không đủ load; cần zero-downtime deploy |
| 13.2 | [Caching Strategies](13.2-caching-strategies/README.md) | Cache-aside, write-through | Khi DB latency trở thành bottleneck; read-heavy workload |
| 13.3 | [CDN](13.3-cdn/README.md) | Content Delivery Network | Traffic global hoặc static asset nặng (>50% băng thông) |
| 13.4 | [Sharding](13.4-sharding/README.md) | Chia nhỏ database | Khi DB single-node chạm ceiling write/read/QPS |
| 13.5 | [CAP Theorem](13.5-cap-theorem/README.md) | Consistency vs Availability | Khi thiết kế distributed system, chọn trade-off rõ ràng |
| 13.6 | [Scalable Architecture](13.6-scalable-arch/README.md) | Scale-up vs Scale-out | Tổng quan pattern để build hệ thống chịu load tăng |
| 13.7 | [Consistent Hashing](13.7-consistent-hashing/README.md) | Hash ring, virtual nodes | Khi thêm/bớt node mà không muốn remap gần hết keys |
| 13.8 | [Message Queues](13.8-message-queues/README.md) | Queue vs pub/sub, DLQ, delivery semantics | Khi cần async, buffering spike, fan-out event |
| 13.9 | [API Gateway & Discovery](13.9-api-gateway-discovery/README.md) | Gateway routing, service registry | Khi ≥3 microservices, cần auth/rate-limit tập trung |
| 13.10 | [Consensus & Raft](13.10-consensus-raft/README.md) | Election, quorum, log replication | Khi cần một sự thật duy nhất (leader, config, metadata) |
| 13.11 | [Case Studies](13.11-case-studies/README.md) | URL shortener, chat 1-1, Twitter feed | Khi luyện phỏng vấn system design end-to-end |

---

## 🎯 Core Principles

### 1. Horizontal vs Vertical Scaling

```
Vertical Scaling (Scale-Up):
┌─────────────────┐
│   CPU: 8 → 64   │
│   RAM: 32G→256G │
│   Rủi ro single-point │
└─────────────────┘

Horizontal Scaling (Scale-Out):
┌─────┐  ┌─────┐  ┌─────┐
│ App │←→│ App │←→│ App │  Load Balancer
└─────┘  └─────┘  └─────┘
```

**Cost curve thực tế:** doubling capacity thường không cost gấp đôi.
- Vertical: RAM 32GB → 256GB (8×) có thể đắt gấp 10–20× do rarity premium.
- Horizontal: thêm node commodity (cùng spec, rẻ) — cost gần tuyến tính.

**Trade-off:** vertical đơn giản, horizontal phức tạp (phải stateless, cần LB, cache replication).

**Con số:** single PostgreSQL instance ổn định ~10–30k QPS read, ~1–5k QPS write. Vượt ngưỡng này → cân nhắc sharding/replica.

### 2. Statelessness

```
✅ Stateless:
   - Không lưu session tại app instance
   - Bất kỳ instance nào xử lý được bất kỳ request nào
   - Dễ scale-out, zero-downtime deploy

❌ Stateful:
   - Session gắn instance cụ thể
   - Rollout phải draining → downtime hoặc sticky session
   - Scale-out khó (phải migrate state)
```

**Biến app stateless:**
- Session → Redis/Memcached (shared store)
- File upload → object storage (S3)
- Computed state → persistent DB

### 3. Asynchronous Communication

```
Synchronous (RPC/HTTP):
  Client ──▶ Server ──▶ Client
  (chờ, synchronous blocking)

Asynchronous (Message Queue):
  Client ──▶ Queue ──▶ Server ──▶ Response
  (non-blocking, decoupled, scalable)
```

**Số liệu:** RabbitMQ/Kafka ingest ~tens of thousands msg/s per node. latency thêm ~1–10ms so với direct call. Trade-off: throughput cao hơn, kiến trúc phức tạp hơn.

---

## 📊 Design Decision Framework

```
                        Hệ thống của bạn?
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          Đọc nhiều        Mạnh consistency  Real-time scale
              │             │             │
              ▼             ▼             ▼
        Read Cache      SQL + Replica   Redis + MQ
        (Cache-Aside)   (Strong)        (Eventual)
```

**Framework 6 bước thiết kế:**
1. **Requirements** — QPS, storage, latency goal, consistency level
2. **Capacity estimation** — 10M users × 10 req/day ÷ 86400s ≈ 1.2k avg QPS; peak 5–10×
3. **API design** — endpoints, payload, auth
4. **Data model** — schema, indexing strategy, read/write paths
5. **High-level architecture** — components, data flow, failure domains
6. **Deep dive** — caching, sharding, consistency, back-of-envelope numbers

---

## 🔗 Liên Quan

- **13.1 Load Balancer** — Phân phối traffic, health check, failover
- **13.2 Caching Strategies** — Giảm DB pressure, latency giảm từ 30ms xuống 0.5ms
- **13.3 CDN** — Latency giảm 2–6× cho global users
- **13.4 Sharding** — Write throughput tăng N lần theo số shard
- **13.5 CAP Theorem** — Trade-off bắt buộc khi partition xảy ra
- **13.6 Scalable Architecture** — Tổng hợp các pattern trên
- **13.7 Consistent Hashing** — Thêm/bớt node chỉ di chuyển ~K/N keys
- **13.8 Message Queues** — Async, buffering spike, retry + DLQ, fan-out
- **13.9 API Gateway & Discovery** — Cửa ngõ duy nhất + danh bạ service sống
- **13.10 Consensus & Raft** — Đồng thuận majority, chịu lỗi minority
- **13.11 Case Studies** — Ráp mọi pattern thành hệ thống hoàn chỉnh

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| System Design Primer (GitHub) | https://github.com/donnemartin/system-design-primer |
| Designing Data-Intensive Applications | https://dataintensive.net/ |
| AWS Well-Architected Framework | https://aws.amazon.com/architecture/well-architected/ |

---

## ▶️ Chạy ví dụ

Mỗi chủ đề đều có ví dụ TypeScript chạy được (`npx ts-node examples/index.ts`):

```bash
cd 13-system-design/13.1-load-balancer && npx ts-node examples/index.ts
cd 13-system-design/13.2-caching-strategies && npx ts-node examples/index.ts
cd 13-system-design/13.3-cdn && npx ts-node examples/index.ts
cd 13-system-design/13.4-sharding && npx ts-node examples/index.ts
cd 13-system-design/13.5-cap-theorem && npx ts-node examples/index.ts
cd 13-system-design/13.6-scalable-arch && npx ts-node examples/index.ts
cd 13-system-design/13.7-consistent-hashing && npx ts-node examples/index.ts
cd 13-system-design/13.8-message-queues && npx ts-node examples/index.ts
cd 13-system-design/13.9-api-gateway-discovery && npx ts-node examples/index.ts
cd 13-system-design/13.10-consensus-raft && npx ts-node examples/index.ts
cd 13-system-design/13.11-case-studies && npx ts-node examples/index.ts
```

---

## ▶️ Học tiếp theo

→ [13.1 Load Balancer](13.1-load-balancer/README.md)
