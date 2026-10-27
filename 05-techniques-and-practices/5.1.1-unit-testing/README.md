# 🔬 5.1.1 Unit Testing

> **Unit Testing** là kiểm thử từng **đơn vị nhỏ nhất** (function, method, class) trong trạng thái **cô lập**, không phụ thuộc vào database, API hay filesystem.

```
❌ VẤN ĐỀ: Test phụ thuộc bên ngoài
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  calculate()  │───>│  Database    │    │  External    │
│   function    │    │  (chậm,     │    │  API         │
│              │    │   không ổn   │    │  (mất mạng)  │
│              │    └──────────────┘    └──────────────┘
└──────────────┘
→ Test chậm, không ổn định, khó debug

✅ GIẢI PHÁM: Cô lập đơn vị
┌──────────────┐    ┌──────────────┐
│  calculate()  │    │  Mock Repo   │
│   function    │───>│  (nhặt dữ    │
│              │    │   liệu giả)  │
│              │    └──────────────┘
└──────────────┘
→ Test nhanh, ổn định, dễ debug
```

---

## 🎯 Vấn Đề

Khi unit test phụ thuộc vào external dependencies:

- **Chậm**: Chạy hàng giờ thay vì hàng giây
- **Không ổn định**: Test pass/fail phụ thuộc network, DB state
- **Khó debug**: Không biết bug ở logic hay ở dependency
- **Coupling cao**: Sửa dependency = sửa toàn bộ test

```
KIỂM THỬ ĐƠN VỊ ĐÚNG CÁCH
│
├─ Mỗi test chạy độc lập
│
├─ Mock/stub tất cả external deps
│
├─ Chạy nhanh (< 10ms/test)
│
└─ Kết quả deterministic (luôn như cũ)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
import { describe, it, expect, vi } from 'vitest';

// ─────────────────────────────────────────────
// ❌ BAD: Unit test phụ thuộc real DB
// ─────────────────────────────────────────────
describe('UserService (BAD)', () => {
  it('should find user by email', async () => {
    // Phụ thuộc vào real database
    const user = await db.users.findFirst({
      where: { email: 'test@example.com' }
    });
    expect(user).not.toBeNull();
  });
  // ❌ Chậm, không ổn định, phụ thuộc DB state
});

// ─────────────────────────────────────────────
// ✅ GOOD: Unit test với mock dependency
// ─────────────────────────────────────────────
interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
}

class UserService {
  constructor(private repo: UserRepository) {}

  async getUserByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email);
  }
}

describe('UserService (GOOD)', () => {
  it('should return user when found', async () => {
    const mockRepo = {
      findByEmail: vi.fn().mockResolvedValue({ id: 1, email: 'a@b.com' })
    };
    const service = new UserService(mockRepo as any);

    const result = await service.getUserByEmail('a@b.com');

    expect(result).toEqual({ id: 1, email: 'a@b.com' });
    expect(mockRepo.findByEmail).toHaveBeenCalledTimes(1);
  });

  it('should return null when not found', async () => {
    const mockRepo = {
      findByEmail: vi.fn().mockResolvedValue(null)
    };
    const service = new UserService(mockRepo as any);

    const result = await service.getUserByEmail('missing@test.com');

    expect(result).toBeNull();
  });
});
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| 🚀 **Siêu nhanh** | Chạy hàng nghìn test trong vài giây |
| 🎯 **Cô lập cao** | Bug nằm gọn trong 1 function |
| 💰 **Rẻ** | Không cần hạ tầng (DB, API) |
| 🔁 **Deterministic** | Kết quả luôn giống nhau |
| 🛡️ **Safety net** | Refactor an toàn, test sẽ báo lỗi |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Mock quá mức** | Chỉ mock external deps, không mock logic nội bộ |
| **Test implementation** | Test hành vi, không test cách code hoạt động |
| **Quá nhiều test** | Test các trường hợp edge case quan trọng |
| **Test không đọc được** | Đặt tên descriptive: `it('should reject negative amount')` |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Test function/method thuần túy | ✅ Unit Testing |
| Logic business phức tạp | ✅ Unit Testing |
| Cần kiểm tra interaction giữa modules | ⚠️ Dùng Integration Testing |
| Kiểm tra full user flow | ⚠️ Dùng E2E Testing |
| Hiệu suất hệ thống | ⚠️ Dùng Load/Performance Testing |

---

## 🔗 Liên quan

- **5.1.2 Integration Testing** — Mở rộng unit test sang nhiều component
- **5.1.3 E2E Testing** — Kiểm thử từ góc độ người dùng
- **5.1.4 TDD** — Viết test trước code (unit test là cốt lõi)
- **3.2.1 SRP** — Unit test hiệu quả khi mỗi class có 1 trách nhiệm

---

## 📚 Tài liệu tham khảo

- 📖 [Vitest Docs](https://vitest.dev/)
- 📖 [Testing Library](https://testing-library.com/)
- 📖 [Unit Testing - Wikipedia](https://en.wikipedia.org/wiki/Unit_testing)

---

## ⏭️ Bài tiếp theo

→ [5.1.2 Integration Testing](../5.1.2-integration-testing/README.md)
