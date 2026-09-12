# 🛡️ 5.6 Error Handling Techniques (Kỹ Thuật Xử Lý Lỗi)

> **Error Handling** là cách ứng phó với lỗi运行时—giữ cho hệ thống ổn định, recoverable, và user-friendly.

---

## ⚡ Circuit Breaker Pattern

**Mô tả:** Ngắt kết nối khi service target liên tục fail, tránh cascade failure.

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  CLOSED  │────▶│ OPEN    │────▶│ HALF-   │
│ (Normal) │     │(Failures│     │ OPEN    │
│          │     │ > limit)│     │ (Test)  │
└─────────┘     └─────────┘     └─────────┘
      ▲                                   │
      └───────────────────────────────────┘
          (Success → close again)
```

```typescript
class CircuitBreaker {
  private state = 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  private failures = 0;
  private readonly threshold = 5;
  private readonly resetTimeout = 30000;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit is OPEN');
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (err) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
        setTimeout(() => this.state = 'HALF_OPEN', this.resetTimeout);
      }
      throw err;
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}
```

✅ **Ưu điểm:** Tránh cascade failure, tự động recover
❌ **Nhược điểm:** Additional complexity

---

## 🔄 Retry Pattern

**Mô tả:** Thử lại operation khi fail, thường dùng cho transient errors.

```typescript
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

// Usage
const data = await retry(() => api.get('/unstable-endpoint'), 3, 1000);
```

**Exponential Backoff:**
```typescript
const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
```

✅ **Ưu điểm:** Handle transient failures gracefully
❌ **Nhược điểm:** Tăng latency, có thể overwhelm server

---

## 📜 Saga Pattern

**Mô tả:** Quản lý distributed transactions qua sequence của local transactions.

```
Saga: [Order] → [Payment] → [Shipping] → [Notification]
                              ↓ (Payment fails)
Saga compensate: [Shipping] ← [Payment] ← [Order] (rollback)
```

```typescript
interface SagaStep {
  execute: () => Promise<void>;
  compensate: () => Promise<void>; // Undo action
}

class Saga {
  private steps: SagaStep[] = [];
  private executedSteps: SagaStep[] = [];

  addStep(step: SagaStep) {
    this.steps.push(step);
  }

  async execute() {
    for (const step of this.steps) {
      try {
        await step.execute();
        this.executedSteps.push(step);
      } catch (err) {
        // Compensate in reverse order
        await this.compensate();
        throw err;
      }
    }
  }

  private async compensate() {
    for (let i = this.executedSteps.length - 1; i >= 0; i--) {
      await this.executedSteps[i].compensate();
    }
  }
}
```

---

## 📮 Dead Letter Queue (DLQ)

**Mô tả:** Chuyển message fail sau N attempts sang queue riêng để xử lý later.

```
Producer → Main Queue → Consumer
                         ↓ (fail 3 lần)
                    Dead Letter Queue
                         ↓
                    Replay / Investigate
```

```typescript
const MAX_RETRIES = 3;

async function processMessage(message: Message) {
  const retryCount = message.headers?.retryCount || 0;

  try {
    await handle(message);
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      // Requeue with incremented retry count
      publish(requeue(message, retryCount + 1));
    } else {
      // Move to DLQ
      publishToDLQ(message, err.message);
    }
  }
}
```

---

## 🧭 Bảng chọn error handling technique

| Scenario | Technique |
|----------|-----------|
| Service call intermittently fails | Retry + Exponential Backoff |
| Dependent service is down | Circuit Breaker |
| Distributed transaction | Saga Pattern |
| Message processing permanently fails | Dead Letter Queue |
| Network timeout | Retry |
| Data corruption | Alert + Manual review |

---

## 🔗 Liên quan

- **1.9 Event Sourcing** — Event replay cho recovery
- **1.8 CQRS** — Saga thường dùng trong CQRS systems

---

## 📚 Tài liệu tham khảo

- 📖 [Circuit Breaker - Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- 📖 [Saga Pattern - Microsoft](https://docs.microsoft.com/azure/architecture/reference-architectures/saga)
- 📖 [Resilience4j](https://github.com/resilience4j/resilience4j)

---

## ⏭️ Bài tiếp theo

→ [5.7 Refactoring Techniques](../5.7-refactoring-techniques/README.md)
