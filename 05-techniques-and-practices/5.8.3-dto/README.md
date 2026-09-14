# 📦 5.8.3 DTO (Data Transfer Object)

> DTO = vật trung gian giao tiếp giữa các lớp. **Đầu ra**: entity → DTO để cắt field nhạy cảm (`passwordHash`) trước khi gửi ra ngoài. **Đầu vào**: nhận request → validate trước khi đụng vào entity/business logic.

---

## 🎯 Vấn đề

```
Entity (bên trong)          DTO (ra ngoài)
┌──────────────────┐        ┌──────────────────┐
│ User             │        │ UserResponseDto  │
│ ├─ id            │        │ ├─ id            │
│ ├─ name          │───────▶│ ├─ name          │
│ ├─ email         │ copy   │ ├─ email         │
│ ├─ passwordHash  │  ❌    │ │ (không có!)    │ ← cắt
│ └─ createdAt     │        │ └─ createdAt     │
└──────────────────┘        └──────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Entity — sống nội bộ, có thể chứa dữ liệu nhạy cảm
class UserEntity {
  constructor(public id: string, public name: string, public email: string, public passwordHash: string) {}
}

// Response DTO — chỉ chứa field an toàn
class UserResponseDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;

  private constructor(from: UserEntity) {
    this.id = from.id;
    this.name = from.name;
    this.email = from.email;
  }

  static fromEntity(entity: UserEntity): UserResponseDto {
    return new UserResponseDto(entity); // passwordHash không được copy ✅
  }
}
```

---

## 🎯 Khi nào dùng

| Tình huống | Dùng |
|------------|------|
| API response cần ẩn field nhạy cảm | ✅ Response DTO |
| Validate request trước khi xử lý | ✅ Input DTO + validator |
| API versioning / thay đổi response | ✅ DTO chặn thay đổi from entity |
| Giữ entity ổn định nội bộ | ✅ DTO là mặt nạ ra ngoài |

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.8.3-dto
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.9 Code Organization](../5.9-code-organization/README.md)