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

## ❌ BAD — thêm 1 case: trả entity thẳng ra API

```typescript
// ❌ BAD — entity nội bộ đi thẳng ra response: lộ passwordHash + vỡ API khi thêm cột DB
app.get("/users/:id", (req, res) => {
  const user = userRepo.findById(req.params.id); // UserEntity có passwordHash!
  res.json(user); // 💥 lộ hash + client phụ thuộc schema DB
});

// ✅ GOOD — qua Response DTO: cắt field nhạy cảm, API ổn định dù entity đổi
app.get("/users/:id", (req, res) => {
  const user = userRepo.findById(req.params.id);
  res.json(UserResponseDto.fromEntity(user)); // chỉ id/name/email/createdAt
});
```

> Quy tắc ngón tay cái: **object nào qua biên (HTTP/queue) đều phải là DTO**, không bao giờ là entity. Entity đổi schema DB là việc nội bộ.

---

## ⚖️ Trade-off: DTO vs các lựa chọn khác

| Lựa chọn | Khi nào hơn DTO | Khi nào thua |
|----------|-----------------|--------------|
| **Trả entity trực tiếp** | Prototype nội bộ, chưa có client ngoài | Lộ field nhạy cảm; vỡ API khi đổi DB |
| **Serialize thủ công** (`delete user.passwordHash`) | Fix nóng 1 chỗ | Quên 1 chỗ là lộ; không có type gác cổng |
| **GraphQL selection** (5.10.2) | Client tự chọn field | Vẫn cần input validation + versioning ở mutation |
| **DTO + validator** (zod/class-validator) | API public, cần validate + versioning | Thêm lớp mapping — overkill cho API nội bộ 1 client |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| DTO explosion (CreateX/UpdateX/PatchX/ResponseX...) | 20 class cho 1 entity, sửa 1 field đụng 10 file | Gộp khi giống nhau; chỉ tách khi validation/thể hiện khác thật |
| Map bằng tay, quên field mới | Thêm cột DB mà response thiếu, client chờ dài cổ | Viết test snapshot DTO hoặc dùng mapper có check exhaustive |
| Validate ở controller nhưng không validate ở worker/queue | Request lọt từ kênh khác không qua validation | Validate ở **ranh giới DTO → domain**, mọi kênh đều qua |
| Input DTO tái dùng làm entity | Caller gán `isAdmin: true` từ request | Input DTO chỉ chứa field client được phép gửi; quyền do server tự quyết |

---

## ✅ Checklist khi review

- [ ] Response không chứa field nhạy cảm (hash, token, CMND, lương)?
- [ ] Không có entity nào đi thẳng qua biên (HTTP/queue)?
- [ ] Input DTO có validation trước khi chạm domain?
- [ ] Thêm field mới có test/snapshot DTO cập nhật theo?
- [ ] Số lượng DTO tương xứng (không 20 class cho 1 entity đơn giản)?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.8.3-dto
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.9 Code Organization](../5.9-code-organization/README.md)