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

| Aspect | Vertical Scaling | Horizontal Scaling |
|--------|------------------|-------------------|
| Cost | Cao (hardware đắt) | Thấp (commodity servers) |
| Limit | Hard ceiling | Soft ceiling (thêm server) |
| Fault tolerance | Poor (single node) | Good (redundancy) |
| Complexity | Low | High |

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

| Pattern | Mô Tả | Khi Dùng |
|---------|-------|----------|
| **API Gateway** | Single entry point | Multiple services |
| **Circuit Breaker** | Stop failing calls | Service degradation |
| **Service Discovery** | Tự động tìm service | Cloud-native |
| **Event Sourcing** | Store state changes | Auditable systems |
| **CQRS** | Separate read/write models | High-performance reads |

```typescript
// API Gateway (Express + Routing)
const gateway = express();

gateway.use('/api/users', userRouter);
gateway.use('/api/orders', orderRouter);
gateway.use('/api/payments', paymentRouter);

// Circuit Breaker Pattern
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private readonly threshold = 5;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker OPEN');
    }
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.state = 'open';
        setTimeout(() => { this.state = 'half-open'; }, 30_000);
      }
      throw err;
    }
  }
}
```

---

## 13.6.2 Event-Driven Architecture (EDA)

```
Producer ──▶ [Event Bus / Kafka] ──▶ Consumer 1
                                      ├──▶ Consumer 2
                                      └──▶ Consumer 3

Advantages: Decoupled, async, scalable consumers
```

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
  await sendNotification(data.userId, `Đơn hàng ${data.orderId} đã xác nhận`);
});

emitter.on('order.created', async (data) => {
  await updateInventory(data.orderId);
});

emitter.on('order.created', async (data) => {
  await logAnalytics(data);
});
```

---

## 13.6.3 Case Studies

### Case 1: E-Commerce Platform (Tiki/Shopee)

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

| Component | Technology | Reason |
|-----------|-----------|--------|
| API Gateway | Kong/Traefik | Rate limiting, auth, routing |
| Services | Node.js / Go | Fast I/O, microservice-friendly |
| Cache | Redis | Session, product catalog |
| Queue | RabbitMQ/Kafka | Async order processing |
| DB | PostgreSQL + MongoDB | Relational + flexible docs |

### Case 2: Real-Time Chat (Zalo/Viber)

```
Client ──▶ WebSocket Server Cluster ──▶ Message Queue ──▶ Chat DB
    │              │                          │
    │              ▼                          ▼
    │         Presence Service            Analytics
    │         (Redis Pub/Sub)
    └◀── Ack ────┘
```

| Challenge | Solution |
|-----------|----------|
| Scalable connections | WebSocket cluster + sticky sessions |
| Message delivery | Persistent queue + ack pattern |
| Presence tracking | Redis pub/sub with TTL |
| Geo-distribution | CDN edge + regional gateways |

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

---

## 🔗 Liên Quan

- **13.1 Load Balancer** — LB cho horizontal scaling
- **13.2 Caching Strategies** — Cache giảm tải service
- **13.4 Sharding** — Shard DB cho write scalability
- **13.5 CAP Theorem** — Trade-off khi scale distributed

---

## ⏭️ Bạn Đã Hoàn Thành Nhóm 13: System Design!
