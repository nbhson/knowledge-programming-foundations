# 🧪 7.2 Integration Testing (Kiểm Thử Tích Hợp)

> **Integration Test** kiểm tra **nhiều module/component** hoạt động cùng nhau đúng cách — giữa service, database, API, cache...

---

## 🎯 Integration Testing Là Gì?

Khác với unit test (cô lập 1 function), integration test xác nhận các thành phần kết hợp hoạt động đúng.

```
┌─────────────────────────────────────────────────────────────┐
│              INTEGRATION TEST SCOPE                          │
│                                                             │
│  [Service A] ──► [Database]   ✅ Kiểm tra cả 2 chạy cùng    │
│  [Controller] ──► [Service]   ✅ HTTP flow đúng            │
│  [API] ──► [Auth] ──► [DB]    ✅ Full pipeline            │
│                                                             │
│  vs Unit Test: chỉ test Service A riêng lẻ (mock DB)        │
└─────────────────────────────────────────────────────────────┘
```

### Khi nào Unit Test Không Đủ?

| Tình huống | Unit Test fail | Integration Test giải quyết |
|------------|----------------|------------------------------|
| ORM mapping sai | Mock repo → không phát hiện | Test thật với DB schema |
| API contract mismatch | Mock API → không phát hiện | Gọi thật HTTP endpoint |
| Transaction rollback không hoạt động | Mock transaction → không phát hiện | Commit thật, verify state |
| CORS/header issue | Không test HTTP layer | Gọi thật qua HTTP |
| Connection pool exhaustion | Mock connection → không phát hiện | Test thật với connection limit |

| So sánh | Unit Test | Integration Test |
|---------|-----------|-----------------|
| Scope | 1 function/class | Nhiều component kết hợp |
| Dependencies | Mock toàn bộ | Test thật hoặc test container |
| Tốc độ | ⚡ ms | 🚗 giây |
| Độ tin cậy | Cao (cô lập) | Cao hơn thực tế |
| Chi phí | Rẻ | Trung bình |
| Phát hiện lỗi | Logic error | Configuration, connection, contract errors |

---

## 🐳 Test Containers & Test Databases

### Docker/Testcontainers

**Testcontainers** tạo container thật (Postgres, Redis, MongoDB...) tạm thời cho mỗi test suite. Ưu điểm: **same OS, same config** như production.

```yaml
# docker-compose.test.yml
services:
  test-postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: testdb
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### Test Database Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Pool, PoolClient } from "pg";

describe("OrderRepository Integration", () => {
  let pool: Pool;
  let client: PoolClient;

  beforeEach(async () => {
    // Khởi tạo connection đến test DB
    pool = new Pool({ connectionString: "postgresql://test:test@localhost:5432/testdb" });
    client = await pool.connect();

    // Seed dữ liệu
    await client.query(`
      INSERT INTO products (id, name, price, stock)
      VALUES ('p1', 'Laptop', 1500, 10),
             ('p2', 'Mouse', 25, 100)
    `);
  });

  afterEach(async () => {
    // Rollback/destroy test data
    await client.query("DELETE FROM orders");
    await client.query("DELETE FROM order_items");
    client.release();
  });

  it("tạo đơn hàng và lưu vào database thật", async () => {
    const repo = new OrderRepository(pool);
    const order = await repo.createOrder({
      customerId: 1,
      items: [{ productId: "p1", quantity: 1 }],
    });

    expect(order).toBeDefined();
    expect(order.status).toBe("pending");

    // Verify tồn tại trong DB
    const saved = await repo.findById(order.id);
    expect(saved).not.toBeNull();
    expect(saved!.total).toBe(1500);
  });
});
```

> 📌 **Transaction pattern (tốt hơn):** Thay vì DELETE, wrap mỗi test trong transaction và rollback sau test → data tự clean, parallel tests không conflict.

```typescript
beforeEach(async () => {
  await client.query("BEGIN");
});

afterEach(async () => {
  await client.query("ROLLBACK");
  client.release();
});
```

---

## 🌐 API Integration Testing với Supertest

```typescript
// orderController.ts
import { Router, Request, Response } from "express";
import { OrderService } from "./orderService";

const router = Router();
const service = new OrderService();

router.post("/orders", async (req: Request, res: Response) => {
  try {
    const order = await service.createOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/orders/:id", async (req: Request, res: Response) => {
  const order = await service.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

export default router;

// orderController.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import orderRouter from "./orderController";

let app: express.Application;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use("/api", orderRouter);
});

afterAll(() => {
  // cleanup
});

describe("POST /api/orders", () => {
  it("tạo đơn hàng thành công", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        customerId: 1,
        items: [{ productId: "p1", quantity: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.total).toBe(3000);
  });

  it("trả về 400 khi thiếu data", async () => {
    const res = await request(app).post("/api/orders").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("GET /api/orders/:id", () => {
  it("trả về 404 khi không tìm thấy", async () => {
    const res = await request(app).get("/api/orders/nonexistent");
    expect(res.status).toBe(404);
  });
});
```

---

## 🗄️ Database Integration Tests

### Với Prisma + SQLite (test nhanh)

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { OrderService } from "../src/orderService";

const prisma = new PrismaClient();

describe("OrderService (DB Integration)", () => {
  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
  });

  it("tạo đơn hàng, giảm stock đúng", async () => {
    const service = new OrderService(prisma);

    // Seed product
    const product = await prisma.product.create({
      data: { name: "Laptop", price: 1500, stock: 10 },
    });

    const order = await service.createOrder({
      customerId: 1,
      items: [{ productId: product.id, quantity: 3 }],
    });

    expect(order).toBeDefined();
    expect(order.total).toBe(4500);

    // Verify stock reduced
    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated!.stock).toBe(7);
  });

  it("từ chối khi không đủ stock", async () => {
    const service = new OrderService(prisma);
    const product = await prisma.product.create({
      data: { name: "Mouse", price: 25, stock: 1 },
    });

    await expect(
      service.createOrder({
        customerId: 1,
        items: [{ productId: product.id, quantity: 5 }],
      })
    ).rejects.toThrow("Insufficient stock");
  });
});
```

### Với Testcontainers (Postgres thật)

```typescript
import { GenericContainer } from "testcontainers";
import { Pool } from "pg";

let pgContainer: GenericContainer;
let pool: Pool;

beforeAll(async () => {
  pgContainer = new GenericContainer("postgres:16-alpine")
    .withEnvironment({ POSTGRES_USER: "test", POSTGRES_PASSWORD: "test", POSTGRES_DB: "testdb" })
    .withExposedPorts(5432)
    .start();

  const port = pgContainer.getMappedPort(5432);
  pool = new Pool({
    host: "localhost",
    port,
    user: "test",
    password: "test",
    database: "testdb",
  });

  // Run migrations
  await pool.query(`
    CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT, price NUMERIC, stock INT);
    CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT, total NUMERIC, status TEXT);
  `);
});

afterAll(async () => {
  await pool.end();
  await pgContainer.stop();
});
```

> 💡 **Strategy lựa chọn test DB:**
> - **SQLite in-memory:** Nhanh nhất (< 1ms/setup), không cần Docker, nhưng khác SQL dialect → có thể miss PostgreSQL-specific bugs.
> - **Testcontainers:** Chậm hơn (~5s startup) nhưng **identical to production**. Dùng cho integration layer quan trọng.
> - **Local dev DB:** Dễ debug nhất (dùng pgAdmin), nhưng không clean giữa tests → cần transaction pattern.

---

## 🔁 So Sánh Các Cấp Độ Test

```
┌──────────────┬──────────────┬────────────────┬─────────────────┐
│     Loại     │  Dependencies │   Speed        │   Coverage      │
├──────────────┼──────────────┼────────────────┼─────────────────┤
│ Unit Test    │ Mock hoàn toàn │ ⚡ <1ms      │ Chi tiết nhất   │
│ Integration  │ DB/API thật    │ 🚗 100ms-5s  │ Mid-level       │
│ E2E          │ Full stack     │ 🐢 10-60s    │ End-to-end      │
└──────────────┴──────────────┴────────────────┴─────────────────┘
```

**Real-world ratio recommendation:**

| Dự án | Unit % | Integration % | E2E % | Lý do |
|-------|--------|---------------|-------|-------|
| Startup MVP | 80% | 15% | 5% | Fast feedback, critical paths only |
| Enterprise SaaS | 60% | 25% | 15% | Cần coverage API contracts & workflows |
| Fintech/Banking | 50% | 35% | 15% | Compliance requires heavy integration test |
| Open source library | 90% | 10% | 0% | Library không có UI, focus unit + integration |

---

## ⚠️ Lưu Ý Quan Trọng

| Vấn đề | Giải pháp |
|--------|-----------|
| Test chậm do DB thật | Dùng SQLite in-memory hoặc Testcontainers pool |
| State giữa các test | Dùng `beforeEach` seed/rollback dữ liệu |
| Không đồng nhất môi trường | Container hóa mọi dependency |
| Overhead khởi tạo | Cache container, dùng parallel workers |
| Hard dependency vào network | Mock network ở test layer trên |
| Race condition trong parallel tests | Mỗi test có DB schema riêng (namespace tables) |

> 📌 **Parallel testing tip:** Chạy tests song song (`vitest --pool=forks` hoặc `pytest -n auto`) giảm thời gian đáng kể. Nhưng cần đảm bảo mỗi test **độc lập hoàn toàn** — không share state toàn cục.

---

## ▶️ Chạy ví dụ

Chạy demo mô phỏng Service + DB in-memory (không cần Docker/testcontainers):

```bash
cd 07-testing/7.2-integration-testing
npx ts-node examples/index.ts
```

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|----------|
| Testcontainers Docs | https://testcontainers.com/ |
| Supertest Docs | https://visionmedia.github.io/supertest/ |
| Prisma Testing | https://www.prisma.io/docs/guides/testing |
| Docker Compose | https://docs.docker.com/compose/ |

---

## ⏭️ Bài tiếp theo → [7.3 E2E Testing](../7.3-e2e-testing/README.md)
