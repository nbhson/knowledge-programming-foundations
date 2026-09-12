# 🔬 5.1.2 Integration Testing

> **Integration Testing** là kiểm thử **nhiều thành phần làm việc cùng nhau** — API + Database, Service + Queue, hoặc nhiều module giao tiếp với nhau.

```
❌ VẤN ĐỀ: Chỉ unit test không đủ
┌──────────┐    ┌──────────┐    ┌──────────┐
│  API     │───>│ Service  │───>│ Database │
└──────────┘    └──────────┘    └──────────┘
     ✅               ✅               ✅
→ Từng phần test OK, nhưng cộng lại bị lỗi!
(Ví dụ: query sai format, connection timeout, serialization error)

✅ GIẢI PHÁP: Integration Testing
┌──────────┐    ┌──────────┐    ┌──────────┐
│  API     │───>│ Service  │───>│ Database │
└──────────┘    └──────────┘    └──────────┘
     ✅               ✅               ✅
→ Kiểm tra cả pipeline hoạt động đúng
```

---

## 🎯 Vấn Đề

Unit test không phát hiện được:
- Kết nối database sai cấu hình
- API serialization/deserialization lỗi
- Tương tác giữa các module bị vỡ
- Authentication/authorization flow lỗi

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request } from 'supertest';
import { app } from './app';
import { pool } from './database';

// ─────────────────────────────────────────────
// ❌ BAD: Không test integration
// ─────────────────────────────────────────────
describe('User API (incomplete)', () => {
  it('should return user', async () => {
    // Chỉ test mock service, không test real DB connection
    const user = { id: 1, name: 'John' };
    expect(user.name).toBe('John'); // ← test đơn giản, bỏ qua tích hợp
  });
});

// ─────────────────────────────────────────────
// ✅ GOOD: Integration test với real DB
// ─────────────────────────────────────────────
describe('User API Integration', () => {
  beforeAll(async () => {
    await pool.query('CREATE TABLE IF NOT EXISTS users (...)');
  });

  afterAll(async () => {
    await pool.query('TRUNCATE users');
    await pool.end();
  });

  it('should create and retrieve user', async () => {
    // Create user via API
    const createRes = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@test.com' })
      .expect(201);

    // Retrieve from API
    const getRes = await request(app)
      .get(`/api/users/${createRes.body.id}`)
      .expect(200);

    expect(getRes.body.name).toBe('John');
    expect(getRes.body.email).toBe('john@test.com');
  });

  it('should validate email format on create', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'invalid-email' })
      .expect(400);
  });
});
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| 🔗 **Kiểm tra interaction** | Phát hiện lỗi giữa các component |
| 🗄️ **Validate queries** | Kiểm tra SQL/query đúng format |
| 🔐 **Test auth flow** | Xác thực, phân quyền hoạt động đúng |
| ⚡ **Phát hiện sớm** | Tìm lỗi tích hợp trước khi deploy |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Chậm hơn unit test** | Chỉ test các integration quan trọng |
| **Phụ thuộc infrastructure** | Dùng Test Containers cho DB |
| **Difficult setup** | Tạo migration/fixture script |
| **Flaky tests** | Reset state giữa các test |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Kiểm tra API + DB cùng lúc | ✅ Integration Testing |
| Validate database queries | ✅ Integration Testing |
| Test authentication flow | ✅ Integration Testing |
| Test function đơn lẻ | ⚠️ Dùng Unit Testing |
| Test full user flow | ⚠️ Dùng E2E Testing |

---

## 🔗 Liên quan

- **5.1.1 Unit Testing** — Nền tảng trước khi integration
- **5.1.3 E2E Testing** — Mở rộng lên full user flow
- **5.1.6 Mutation Testing** — Đánh giá chất lượng test

---

## 📚 Tài liệu tham khảo

- 📖 [Supertest Docs](https://github.com/ladjs/supertest)
- 📖 [Test Containers](https://www.testcontainers.org/)
- 📖 [Integration Testing Patterns](https://martinfowler.com/articles/practical-test-pyramid.html)

---

## ⏭️ Bài tiếp theo

→ [5.1.3 E2E Testing](../5.1.3-e2e-testing/README.md)
