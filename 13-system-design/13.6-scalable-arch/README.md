# 🚀 13.6 Scalable Architecture (Kiến Trúc Có Thể Mở Rộng)

> **Scalable Architecture** thiết kế hệ thống có thể mở rộng khi demand tăng — horizontal scaling, microservices, event-driven patterns.

---

## 🎯 Horizontal vs Vertical Scaling

```
Vertical Scaling (Scale-Up)         Horizontal Scaling (Scale-Out)
   ┌─────────────────┐                ┌─────────┐  ┌─────────┐  ┌─────────┐
   │    CPU ↑        │                │ Server 1│  │ Server 2│  │ Server 3│
   │    RAM ↑        │                │  (app)  │  │  (app)  │  │  (app)  │
   │    Disk ↑       │                └────┬────┘  └────┬────┘  └────┬────┘
   │    ...          │                     │            │            │
   │  Giới hạn vật lý│                     └─────┬──────┴─────┬─────┘
   └─────────────────┘                           │             │
        ❌ Đắt, giới hạn                      Load Balancer
        ✅ Đơn giản                          ✅ Vô hạn scale
```

**Cost curve thực tế:**

| Scale-up (vertical) | Scale-out (horizontal) |
|---------------------|------------------------|
| 2× capacity ≈ 2.5× price (premium hardware) | 2× capacity ≈ 2× price (commodity) |
| Hard ceiling (machine max spec) | Soft ceiling (add more nodes) |
| Single point of failure | Built-in redundancy |
| Downtime for upgrade | Zero-downtime rolling deploy |

**Amdahl's Law reminder:** parallelism gain bị giới hạn bởi fraction sequential. Nếu 10% code không parallelizable, 100 core chỉ được ~9× speedup thực tế.

---

## 13.6.1 Microservices Patterns

```
                    ┌─────────────┐
  Client ──────────▶│  API Gateway │──────────┐
                    └──────┬──────┘          │
                           │                 ▼
             ┌────────────┼────────────┬────────────┐
             ▼            ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ User Svc │ │ Order Svc│ │ Payment  │ │ Notif Svc│
       │ :3000    │ │ :3001    │ │  :3002   │ │  :3003   │
       └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
            │            │            │            │
       ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
       │  Users DB│ │ Order DB │ │  Pay DB  │ │  MQ / K8 │
       └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Patterns cơ bản:**

| Pattern | Mô Tả | Khi Dùng | Giải thích sâu |
|---------|-------|----------|----------------|
| **API Gateway** | Single entry point, routing, auth, rate limit | Multiple services | Ẩn cấu trúc internal; centralize cross-cutting concern (auth, logging, metrics) |
| **Circuit Breaker** | Stop calling failing service after threshold | Inter-service call resilience | 3 state: CLOSED (normal) → OPEN (fail fast) → HALF-OPEN (probe). Tránh cascading failure |
| **Service Discovery** | Tự động tìm service instance | Cloud-native, dynamic scaling | Etcd, Consul, K8s CoreDNS. Register on start, deregister on stop |
| **Event Sourcing** | Store state changes (events) not current state | Auditable, replayable systems | Event log là source of truth; state rebuild từ events. Complexity cao |
| **CQRS** | Separate read/write models | High-performance reads | Write model optimize for integrity; read model optimize for query. eventual consistency giữa 2 |
| **Backpressure** | Signal producer to slow down | Queue overload prevention | Reactive Streams chuẩn; prevent OOM khi consumer chậm hơn producer |
| **Bulkhead** | Isolate failure domains | Multi-tenant, critical paths | Partition resources (thread pool, connection pool) per function — 1 failure không lan |

```typescript
// API Gateway (Express + Routing)
const gateway = express();

gateway.use('/api/users', userRouter);
gateway.use('/api/orders', orderRouter);
gateway.use('/api/payments', paymentRouter);

// Circuit Breaker Pattern — implementation thực tế
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private readonly threshold = 5;
  private readonly resetTimeout = 30_000;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker OPEN — service unavailable');
    }
    try {
      const result = await fn();
      this.failures = 0;
      if (this.state === 'half-open') this.state = 'closed';
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.state = 'open';
        setTimeout(() => { this.state = 'half-open'; }, this.resetTimeout);
      }
      throw err;
    }
  }
}
```

**Circuit breaker state machine:**

```
         failures >= threshold
Closed ─────────────────────▶ Open ──(timeout)──▶ Half-open
 ▲                              │                    │
 │         success              │ probe call          │ probe call
 └──────────────────────────────┴ (success)───────────┘
                                      │
                                   (failure)
                                      ▼
                                    Open (reset timer)
```

> 💡 **Thực tiễn:** half-open chỉ cho 1 probe request qua. Nếu probe thành công → close (resume normal); nếu fail → open thêm 1 timeout cycle. Không cho phép nhiều request đồng thời trong half-open (trừ khi designed).

---

## 13.6.2 Event-Driven Architecture (EDA)

```
Producer ──▶ [Event Bus / Kafka] ──▶ Consumer 1
                                      ├──▶ Consumer 2
                                      └──▶ Consumer 3

Advantages: Decoupled, async, scalable consumers
```

**So sánh synchronous vs asynchronous:**

| Aspect | Synchronous (HTTP/RPC) | Asynchronous (MQ) |
|--------|------------------------|-------------------|
| Latency | Low (direct call) | +1–10ms (queue hop) |
| Throughput | Giới hạn caller | High (backpressure built-in) |
| Coupling | Tight (caller knows service) | Loose (producer không biết consumer) |
| Failure handling | Retry + timeout | Persistent queue + DLQ (dead letter) |
| Ordering | Per-request | Can guarantee per-key ordering |
| Scale | Vertical + horizontal | Horizontal (consumer group parallelism) |

```typescript
import { EventEmitter } from 'events';

const emitter = new EventEmitter();

// Producer
async function publishOrder(order: Order): Promise<void> {
  emitter.emit('order.created', {
    orderId: order.id,
    userId: order.userId,
    total: order.total,
    timestamp: Date.now()
  });
}

// Consumers (multiple, independent)
emitter.on('order.created', async (data) => {
  await sendNotification(data.userId, `Đơn hàng ${data.data.orderId} đã xác nhận`);
});

emitter.on('order.created', async (data) => {
  await updateInventory(data.orderId);
});

emitter.on('order.created', async (data) => {
  await logAnalytics(data);
});
```

**Production-ready EDA với Kafka (giả định):**

```typescript
// Producer — idempotent write với transactional ID
const producer = kafka.producer({ transactionalId: 'order-service-1' });
await producer.connect();
await producer.send('orders', {
  key: orderId,           // partition key — đảm bảo ordering per order
  value: orderPayload,
  headers: { 'trace-id': traceId }
});

// Consumer group — parallelism theo số partition
const consumer = kafka.consumer({ groupId: 'notification-service' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const order = JSON.parse(message.value.toString());
    await sendNotification(order.userId, `Đơn ${order.orderId}`);
    await consumer.commitOffsets([{ topic, partition, offset: message.offset }]);
  }
});
```

**Delivery semantics:**
- **At-most-once:** send và forget — có thể mất message
- **At-least-once:** retry until ack — có thể duplicate (cần idempotency)
- **Exactly-once:** transactional producer + consumer commit — mạnh nhất, phức tạp nhất

> 💡 **Hầu hết system dùng at-least-once + idempotent key.** Exactly-once là optimisation, không phải requirement.

---

## 13.6.3 Case Studies

### Case 1: E-Commerce Platform (Tiki/Shopee scale)

```
┌────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend  │───▶│   API Gateway │───▶│   Microservs  │
│  (Next.js)  │    │  (Kong/Traefik)│   │  (Node/Go)   │
└────────────┘    └──────────────┘    └──────────────┘
                                             ┌──────┬──────┬──────┐
                                             ▼      ▼      ▼      ▼
                                           Users  Orders  Payment Cache
                                          (MySQL) (Mongo) (Stripe) (Redis)
```

**Capacity estimation:**
- 10M users, DAU 2M, avg 10 req/user/day → 20M req/day ≈ 231 avg QPS
- Peak 5–10× avg → 1.2k–2.3k QPS
- 1 app instance handle ~200 QPS (Node.js) → need ~10–12 instances
- 2× redundancy + headroom → **20–24 instances** + LB

| Component | Technology | Reason |
|-----------|-----------|--------|
| API Gateway | Kong/Traefik | Rate limiting, auth, routing, SSL termination |
| Services | Node.js / Go | Fast I/O, microservice-friendly, small footprint |
| Cache | Redis Cluster | Session, product catalog, hot keys; cluster cho horizontal scale |
| Queue | RabbitMQ/Kafka | Async order processing, notification fan-out |
| DB | PostgreSQL + MongoDB | Relational (orders, payments) + flexible docs (product catalog) |
| Search | Elasticsearch | Product search, autocomplete, faceting |

### Case 2: Real-Time Chat (Zalo/Viber scale)

```
Client ──▶ WebSocket Server Cluster ──▶ Message Queue ──▶ Chat DB
    │              │                          │
    │              ▼                          ▼
    │         Presence Service            Analytics
    │         (Redis Pub/Sub)
    └◀── Ack ────┘
```

| Challenge | Solution | Số liệu tham chiếu |
|-----------|----------|-------------------|
| Scalable connections | WebSocket cluster + sticky sessions | 1 instance ~10k concurrent WS; 1M users → ~100 instances |
| Message delivery | Persistent queue + ack pattern | Kafka replication factor 3; at-least-once delivery |
| Presence tracking | Redis pub/sub với TTL | 100k presence update/s (ước tính cho mục đích minh họa); Redis single ~100k ops/s → gần bão hòa, cần cluster/shard khi vượt |
| Geo-distribution | CDN edge + regional gateways | Latency <100ms intra-region; inter-region fallback |
| Offline messages | Message store + poll/notify | TTL 7 days; push notification when client reconnects |

---

## 📊 Scaling Decision Framework

```
         Demand grows?
              │
     ┌────────┴────────┐
     ▼                 ▼
  Vertical           Horizontal
   Scale Up           Scale Out
     │                 │
     ▼                 ▼
  Single node    Multiple nodes
  limits reached  + Load balancer
     │                 │
     ▼                 ▼
  Add resources    Microservices
                   + Event bus
                   + Auto-scaling
```

**Stages of scale (từ nhỏ đến lớn):**

| Stage | Signals | Action |
|-------|---------|--------|
| **1. Single server** | < 100 QPS, < 10 GB data | Simple stack, vertical scale |
| **2. Read replica** | DB read latency tăng, CPU idle | Add read replica; app routing read vs write |
| **3. Cache layer** | DB query repetitive, same data | Redis/Memcached; cache-aside pattern |
| **4. Horizontal app** | App CPU/memory ceiling | Stateless app + LB + auto-scaling |
| **5. Queue/worker** | Sync processing too slow | Async workers (Kafka, Bull, Sidekiq) |
| **6. Shard DB** | Write QPS ceiling, storage ceiling | Sharding theo shard key |
| **7. Microservices** | Team scale, different scaling needs | Service decomposition + API gateway |
| **8. Multi-region** | Global latency, disaster recovery | Active-active hoặc active-passive DC |

> 💡 **Mỗi stage có chi phí complexity tăng ~2–5×.** Đừng nhảy stage khi chưa có signal rõ ràng. Premature optimization là root của mọi architectural failure.

### Serverless Containers — tầng scaling giữa VM và full K8s

Giữa "VM tự quản" và "Kubernetes cluster" còn một tầng trung gian: **serverless containers** — bạn deploy container, nền tảng tự scale và quản lý node:

| Dịch vụ | Nhà cung cấp | Đặc điểm |
|---------|-------------|----------|
| **AWS Fargate** | AWS | Chạy ECS/EKS task không cần quản lý node; pay per vCPU/GB-giây |
| **Cloud Run** | GCP | Autoscale theo request, scale-to-zero, chạy container bất kỳ |
| **Azure Container Apps** | Azure | KEDA-based scaling, K8s-compatible API, tích hợp Dapr |

**Khi nào dùng:** team nhỏ không muốn vận hành control plane, workload spiky (scale-to-zero tiết kiệm chi phí). Tránh khi cần GPU node tùy chỉnh, kernel/network control sâu, hoặc cold start nhạy cảm.

**Cell-based architecture / bulkhead isolation:** ở scale rất lớn, chia fleet thành các **cell** độc lập (mỗi cell tự có LB + app + DB) — một cell lỗi chỉ ảnh hưởng 1 phần user, blast radius bị khoanh vùng. Đây là bulkhead isolation ở tầng kiến trúc; chi phí là nhân bản hạ tầng và routing giữa các cell.

---

## 🎯 Khi nào scale component nào?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|-----------|
| App CPU/memory ceiling (compute-bound) | ✅ Horizontal app scaling | Stateless instances + LB; auto-scale based on CPU |
| DB read bottleneck | ✅ Read replica + cache | Replica gánh read; cache giảm repeat query |
| DB write bottleneck | ✅ Shard write + connection pool | Write chỉ về primary; shard chia write load |
| Sync processing slow (email, report) | ✅ Async worker queue | Decouple heavy job from request path |
| Static asset latency global | ✅ CDN | Edge PoP giảm RTT, origin load |
| Single point of failure risk | ✅ Multi-AZ/region + HA LB | Fault isolation; failover tự động |
| Team coordination bottleneck | ✅ Microservices + Bounded Context | Mỗi team owning 1–2 service; deploy độc lập |
| Storage ceiling | ✅ Sharding + archive tier | Hot data SSD, cold data HDD/S3 glacier |

---

## 🔗 Liên Quan

- **13.1 Load Balancer** — LB cho horizontal scaling
- **13.2 Caching Strategies** — Cache giảm tải service
- **13.4 Sharding** — Shard DB cho write scalability
- **13.5 CAP Theorem** — Trade-off khi scale distributed

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.6-scalable-arch
npx ts-node examples/index.ts
```

---

## ⏭️ Bạn Đã Hoàn Thành Nhóm 13: System Design!

Tiếp theo: quay lại [12-concurrency](../../12-concurrency/README.md) nếu chưa học, hoặc bắt đầu project tổng hợp.
