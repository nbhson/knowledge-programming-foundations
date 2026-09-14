# 🛡️ 5.6 Error Handling Techniques (Kỹ Thuật Xử Lý Lỗi)

> **Error Handling** là cách ứng phó với lỗi运行时 — giữ cho hệ thống ổn định, recoverable, và user-friendly. Lỗi là **điều chắc chắn sẽ xảy ra**, không phải ngoại lệ. Kỹ sư giỏi không "tránh lỗi" — họ **thiết kế hệ thống chịu lỗi graceful degradation**.

---

## 🎯 Tại sao cần Error Handling Patterns?

Trong hệ thống phân tán (microservices, distributed systems), **hầu hết mọi thứ đều có thể thất bại**:
- Network partition (network cut)
- Service unavailable (depoyment lỗi, OOM)
- Timeout (service chậm, database lock contention)
- Partial failure (service A ok, service B fail → transaction nửa vời)
- Data corruption (malformed input, schema drift)
- Rate limiting (provider cắt flow)

Nếu xử lý thủ công từng chỗ: `try/catch` lồng nhau, retry logic lặp lại, circuit state quản lý thủ công → **code spaghetti**, **khó test**, **hard to reason about**. Patterns chuẩn hóa cách xử lý → **reusable, testable, observable**.

> 💡 **Quy tắc của Martin Fowler:** "Make the failure visible, not hidden." — Lỗi không được swallow (bỏ qua im lặng), phải log + alert + expose metric. Silent failure là nguyên nhân số 1 của production incidents.

---

## 📚 Mục Lục

| # | Pattern | Mục Đích |
|---|---------|----------|
| 5.6.1 | [Circuit Breaker](../5.6.1-circuit-breaker/README.md) | Ngắt mạch khi service liên tục fail |
| 5.6.2 | [Retry Pattern](../5.6.2-retry-pattern/README.md) | Thử lại với exponential backoff |
| 5.6.3 | [Saga Pattern](../5.6.3-saga-pattern/README.md) | Distributed transaction với bù trừ |
| 5.6.4 | [Dead Letter Queue](../5.6.4-dead-letter-queue/README.md) | Đưa message hỏng vĩnh viễn sang queue riêng |

---

## ⚡ Circuit Breaker Pattern

**Mô tả:** Circuit Breaker mô phỏng **cầu dao điện gia đình** — khi phát hiện quá tải (nhiều lỗi liên tiếp), nó **ngắt mạch** (open) để bảo vệ hệ thống, thay vì tiếp tục gọi service đang hỏng (gây cascade failure). Sau một khoảng thời gian, nó **thử nghiệm** (half-open) — cho 1 request đi qua để kiểm tra service đã恢复 chưa.

**Tại sao cần?** Nếu Service A gọi Service B, và B bị sập:
- Không có circuit breaker: A **liên tục retry** B → B càng đuối → A cũng kiệt tài nguyên (connection pool, thread) → **cascade failure lan toàn bộ hệ thống**.
- Có circuit breaker: Sau N failures liên tiếp, A **ngay lập tức throw error** mà không gọi B → A giữ được tài nguyên → user nhận lỗi "temporarily unavailable" thay vì timeout 30s.

**3 trạng thái:**
| Trạng thái | Hành vi | Chuyển sang |
|-----------|---------|-------------|
| **CLOSED** | Gọi bình thường, đếm lỗi | → OPEN nếu failures ≥ threshold |
| **OPEN** | Ngay lập tức throw lỗi (không gọi service) | → HALF_OPEN sau `resetTimeout` ms |
| **HALF_OPEN** | Cho 1 probe request đi qua | → CLOSED nếu thành công, → OPEN nếu fail |

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  CLOSED  │────▶│ OPEN    │────▶│ HALF-   │
│(Normal) │     │(Failures│     │ OPEN    │
│         │     │ > limit)│     │ (Test)  │
└─────────┘     └─────────┘     └─────────┘
      ▲                                   │
      └───────────────────────────────────┘
          (Success → close again)
```

```typescript
type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker<TArgs extends any[], TReturn> {
  private state: State = 'CLOSED';
  private failures = 0;
  private readonly threshold: number;
  private readonly resetTimeout: number;
  private readonly openTimer: NodeJS.Timeout | null = null;

  constructor(
    config: { threshold?: number; resetTimeoutMs?: number } = {}
  ) {
    this.threshold = config.threshold ?? 5;
    this.resetTimeout = config.resetTimeoutMs ?? 30_000;
  }

  async call(fn: (...args: TArgs) => Promise<TReturn>, ...args: TArgs): Promise<TReturn> {
    // TRẠNG THÁI OPEN: từ chối ngay, không gọi service
    if (this.state === 'OPEN') {
      throw new CircuitOpenError('Circuit is OPEN — service unavailable');
    }

    try {
      const result = await fn(...args);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'; // Service恢复了，circuit đóng lại
    }
  }

  private onFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold && this.state === 'CLOSED') {
      this.state = 'OPEN';
      setTimeout(() => {
        this.state = 'HALF_OPEN';
      }, this.resetTimeout);
    }
  }
}

class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

// Usage — wrap any async call
const breaker = new CircuitBreaker();
const data = await breaker.call(
  () => fetch('https://unstable-api.example.com/data').then(r => r.json()),
);
```

✅ **Ưu điểm:**
- **Prevents cascade failure** — cứu hệ thống khỏi domino effect.
- **Fast failure** — user nhận lỗi ngay thay vì chờ timeout 30s.
- **Self-healing** — tự động thử lại (half-open probe) không cần restart.
- **Observability** — metric failures/open-state dễ attach dashboard/alert.

❌ **Nhược điểm:**
- **False positive** — service tạm thời chậm (GC pause) bị coi là "sập" → circuit mở vô lý.
- **Configuration sensitive** — threshold + timeout cần tune theo từng service (traffic pattern khác nhau).
- **Không giải quyết root cause** — chỉ ngăn spread, không sửa service hỏng.

**Industry examples:**
- Netflix Hystrix (deprecated nhưng influential) → Resilience4j → Spring Cloud Circuit Breaker.
- gRPC built-in retry + timeout policy.
- AWS SDK v3 có built-in retry configuration.

---

## 🔄 Retry Pattern

**Mô tả:** Retry pattern **tự động thử lại** operation khi gặp lỗi, đặc biệt hữu ích cho **transient errors** — những lỗi tạm thời sẽ tự hết (network glitch, DB lock contention, rate limit 429). Không dùng retry cho **permanent errors** (404 not found, validation error) — retry lúc đó chỉ wastes time.

**Khi nào retry đúng?**
| Lỗi | Retry? | Lý do |
|-----|--------|-------|
| 503 Service Unavailable | ✅ Có | Service đang deploy, sẽ recovery |
| 429 Too Many Requests | ✅ Có (với backoff) | Rate limit tạm thời |
| ECONNRESET / ETIMEDOUT | ✅ Có | Network glitch |
| 400 Bad Request | ❌ Không | Client sai, retry vô nghĩa |
| 404 Not Found | ❌ Không | Resource không tồn tại |
| 401 Unauthorized | ❌ Không | Token hết hạn → refresh token |

**Exponential Backoff vs Linear Backoff:**
- **Linear:** `delay = base * attempt` — dễ tính nhưng có thể overwhelm server khi nhiều client retry đồng loạt (thundering herd).
- **Exponential:** `delay = base * 2^attempt` — giảm tải nhanh, nhưng vẫn cần **jitter** (randomization) để tránh synchronized retry.
- **Jitter:** Thêm random `±20%` vào delay → các client retry staggered → server không bị spike.

```typescript
interface RetryConfig {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoff?: 'exponential' | 'linear';
  jitter?: boolean;
  retryableErrors?: Set<string>;
}

async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    backoff = 'exponential',
    jitter = true,
  } = config;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;

      // Không retry permanent errors
      if (attempt === maxAttempts) break;

      // Tính delay
      let delay: number;
      if (backoff === 'exponential') {
        delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      } else {
        delay = Math.min(baseDelayMs * attempt, maxDelayMs);
      }

      // Jitter: thêm ±20% random
      if (jitter) {
        delay = delay * (0.8 + Math.random() * 0.4);
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`, err);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

> 💡 **Thundering herd problem:** Nếu 1000 client retry cùng lúc sau khi service恢复, chúng lại gây lỗi cho service. **Solution:** jitter + full jitter (random delay 0–maxDelay) hoặc **adaptive retry** (giảm tốc độ nếu still failing).

✅ **Ưu điểm:** Tự động recover transient failures — tăng uptime mà không cần can thiệp.
❌ **Nhược điểm:** Tăng latency tổng (user phải chờ), có thể làm vấn đề tệ hơn nếu server đã overload.

**Bonus — Idempotent retry:** Chỉ retry operation **idiempotent** (gọi nhiều lần = cùng kết quả). DELETE, GET, PUT là idempotent; POST (tạo resource) thường **không** idempotent — retry có thể tạo duplicate.

---

## 📜 Saga Pattern

**Mô tả:** Saga giải quyết **distributed transaction** — khi 1 nghiệp vụ kéo dài qua nhiều service, mỗi service có DB riêng → không thể dùng ACID transaction thông thường. Saga chia nghiệp vụ thành **chuỗi local transactions**, mỗi local transaction update 1 service. Nếu bước nào fail, **compensating transactions** (rollback semantic) được chạy ngược lại để undo những gì đã làm.

**Hai triển khai chính:**

| | Choreography | Orchestration |
|--|-------------|---------------|
| Ai điều phối? | Mỗi service tự lắng nghe event và phản hồi | Có **saga orchestrator** trung tâm điều khiển flow |
| Coupling | Loose (service chỉ biết event) | Tight hơn (orchestrator biết tất cả) |
| Debug | Khó (event flow distributed) | Dễ hơn (orchestrator lưu state) |
| Example | Event: OrderCreated → PaymentService subscribes → ... | Orchestrator: call Payment() → call Shipping() → ... |

```typescript
interface SagaStep {
  execute: () => Promise<void>;
  compensate: () => Promise<void>; // Undo action — compensating transaction
}

class Saga {
  private steps: SagaStep[] = [];
  private executedSteps: SagaStep[] = [];

  addStep(step: SagaStep): void {
    this.steps.push(step);
  }

  async execute(): Promise<void> {
    for (const step of this.steps) {
      try {
        await step.execute();
        this.executedSteps.push(step);
      } catch (err) {
        console.error(`Step failed: ${err}`, err);
        await this.compensate(); // Rollback reverse
        throw new SagaCompensatedError('Saga failed, compensations executed', err);
      }
    }
  }

  private async compensate(): Promise<void> {
    for (let i = this.executedSteps.length - 1; i >= 0; i--) {
      try {
        await this.executedSteps[i].compensate();
      } catch (compErr) {
        // Compensating transaction itself may fail → manual intervention needed
        console.error('Compensation failed! Manual review required.', compErr);
      }
    }
  }
}

class SagaCompensatedError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'SagaCompensatedError';
  }
}
```

**Real-world example — E-commerce order flow:**
```typescript
const saga = new Saga();

saga.addStep({
  execute: async () => {
    await orderRepo.create({ itemId, quantity, status: 'PENDING' });
  },
  compensate: async () => {
    await orderRepo.cancelPendingOrder(); // Delete/Cancel
  },
});

saga.addStep({
  execute: async () => {
    await paymentGateway.charge(userId, amount);
  },
  compensate: async () => {
    await paymentGateway.refund(paymentId); // Refund is the compensation
  },
});

saga.addStep({
  execute: async () => {
    await inventoryRepo.reserveStock(itemId, quantity);
  },
  compensate: async () => {
    await inventoryRepo.releaseStock(itemId, quantity);
  },
});

await saga.execute();
// Thành công → order confirmed
// Payment fail → compensate: cancel order
// Inventory fail → compensate: refund payment + cancel order
```

> ⚠️ **Compensating transaction không phải rollback ACID!** Nếu compensation自己也失败（例如 refund API down），需要人工介入。Saga **最终一致性** — dữ liệu có thể ở trạng thái "nửa nọ nửa kia" trong thời gian ngắn.

✅ **Ưu điểm:** Giải quyết được distributed transaction — mô hình thực tế của microservices.
❌ **Nhược điểm:** Complexity cao, compensation logic dễ sai, debugging khó (event-driven choreography).

**Industry examples:**
- Axon Framework (Java) — built-in saga support.
- Netflix Conductor — visual workflow orchestration.
- AWS Step Functions — serverless saga orchestration.

---

## 📮 Dead Letter Queue (DLQ)

**Mô tả:** DLQ là **queue chuyên dụng** chứa messages **không thể xử lý sau N lần retry** — thay vì forever retry mãi (vòng lặp vô tận), message được "chôn" vào DLQ để **human review** hoặc **replay后有问题的数据修复后**。

```
Producer → Main Queue → Consumer
                         ↓ (fail 3 lần)
                    Dead Letter Queue
                         ↓
                    Investigate → Fix → Replay
```

**Tại sao DLQ quan trọng?**
- **Prevent poison pill:** 1 message lỗi (ví dụ: JSON malformed) làm consumer stuck trong vòng lặp retry → **queue backlog tăng**, các message khác bị block.
- **Observability:** DLQ size là **metric cảnh báo sớm** — DLQ growing = có vấn đề dữ liệu đầu vào.
- **Manual intervention:** Engineer đọc message trong DLQ, xác định root cause, fix code/data, replay.

```typescript
const MAX_RETRIES = 3;

interface Message {
  id: string;
  payload: any;
  headers?: { retryCount?: number; error?: string };
}

async function processMessage(message: Message): Promise<void> {
  const retryCount = message.headers?.retryCount ?? 0;

  try {
    await handleBusinessLogic(message.payload);
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      // Requeue với retry count tăng
      await publishToQueue(message, {
        ...message,
        headers: { ...message.headers, retryCount: retryCount + 1, error: err.message },
      });
    } else {
      // Move to DLQ — stop retrying
      await publishToDLQ(message, {
        originalError: err.message,
        payload: message.payload,
        exhaustedAt: new Date().toISOString(),
      });
      console.error(`Message ${message.id} moved to DLQ after ${MAX_RETRIES} attempts`, err);
    }
  }
}

async function publishToDLQ(message: Message, meta: any): Promise<void> {
  // Gửi đến queue riêng: "dlq-order-processing"
  await dlqQueue.publish({ ...message, dlqMeta: meta });
}
```

**Consumer DLQ pattern:**
```typescript
async function consumeDLQ(): Promise<void> {
  const messages = await dlqQueue.consume({ limit: 10 });

  for (const msg of messages) {
    const meta = msg.dlqMeta;
    console.error(`DLQ Message ${msg.id}:`, meta.originalError);

    // Options:
    // 1. Archive permanently (audit trail)
    await archiveMessage(msg);

    // 2. Fix and replay (if root cause is temporary)
    // await processWithFixedHandler(msg);

    // 3. Send alert + notify oncall
    await sendAlert('DLQ growth detected', { messageId: msg.id, error: meta.originalError });
  }
}
```

✅ **Ưu điểm:** Cô lập poison pill, cung cấp audit trail, enable manual intervention.
❌ **Nhược điểm:** DLQ không tự xử lý — cần **operational process** (người xem, người sửa, người replay). Nếu không có người trực, DLQ thành graveyard vô hình.

**Real examples:**
- RabbitMQ `x-dead-letter-exchange` argument — auto-route failed messages.
- AWS SQS `RedrivePolicy` — configure DLQ trên queue.
- Kafka — consumer lag + error topic pattern.

---

## 🧭 Bảng chọn error handling technique

| Scenario | Technique | Lập luận |
|----------|-----------|----------|
| Service call intermittently fails (network glitch) | Retry + Exponential Backoff + Jitter | Transient lỗi tự hết sau vài giây; backoff giảm tải server đang phục hồi |
| Dependent service is down | Circuit Breaker | Tránh cascade failure; cho service recover mà không bị traffic mới |
| Distributed transaction across services | Saga Pattern | Không có 2PC trong microservices; compensation là cách duy nhất duy trì consistency |
| Message processing permanently fails (malformed data) | Dead Letter Queue | Poison pill blocking queue; cần human review trước khi replay |
| Network timeout | Retry (với timeout ngắn) | Timeout là transient; retry giúp recovery nhanh |
| Data corruption (schema mismatch) | DLQ + Alert | Không thể retry — lỗi sẽ lặp; cần fix data/code trước |
| Validation error (client bug) | Fail fast + Return 4xx | Permanent error; retry là waste |
| 3rd party API rate limit (429) | Retry + Exponential Backoff | Rate limit là temporary; chờ vài giây là qua |
| Partial service degradation | Circuit Breaker + Fallback | Fallback trả về cached/default data thay vì lỗi cứng |
| Idempotency requirement (payments) | Retry + Idempotency Key | Retry an toàn nếu có key tránh duplicate charge |

---

## 🧠 Misconceptions

| Hiểu lầm | Sự thật |
|----------|----------|
| "Retry luôn tốt" | Retry chỉ tốt cho **transient** errors. Retry permanent error = waste time + potential duplicate side-effect. |
| "Circuit breaker = không gọi service" | Circuit breaker **protect caller**, không bảo vệ callee. Service vẫn nhận được probe request từ half-open state. |
| "Saga = distributed ACID" | Saga là **eventual consistency** — có khoảng thời gian data inconsistent (order created, payment pending). Không phải ACID. |
| "DLQ = tự động fix lỗi" | DLQ **không tự xử lý** — cần human process (review → fix → replay). DLQ chỉ ngăn poison pill. |
| "Try/catch đủ rồi" | Try/catch xử lý **local** error. Distributed error cần patterns (circuit, retry, saga) để hệ thống **resilient**. |

---

## 🔗 Liên quan

- **1.9 Event Sourcing** — Event replay cho recovery
- **1.8 CQRS** — Saga thường dùng trong CQRS systems
- **5.5 State Management** — Saga + Redux có thể tích hợp (redux-saga)
- **5.3 Performance** — Retry/Circuit ảnh hưởng latency measurement

---

## 📚 Tài liệu tham khảo

- 📖 [Circuit Breaker - Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- 📖 [Saga Pattern - Microsoft Azure](https://docs.microsoft.com/azure/architecture/reference-architectures/saga)
- 📖 [Resilience4j Documentation](https://resilience4j.readthedocs.io/)
- 📖 [The Retry Pattern - Microsoft Patterns & Practices](https://learn.microsoft.com/azure/architecture/patterns/retry)
- 📖 [Dead Letter Queue Pattern](https://docs.aws.amazon.com/AmazonSQS/latest/developerguide/sqs-dead-letter-queues.html)
- 📖 [Designing Data-Intensive Applications — Chapter 10 (Transaction Processing)](https://dataintensive.net/)

---

## ⏭️ Bài tiếp theo

→ [5.7 Refactoring Techniques](../5.7-refactoring-techniques/README.md)
