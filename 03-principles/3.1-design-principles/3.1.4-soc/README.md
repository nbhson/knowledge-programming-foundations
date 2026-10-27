# 🧩 3.1.4 SoC (Separation of Concerns)

> **Tách trách nhiệm theo lĩnh vực** — mỗi module/class chỉ lo 1 việc.
> Thay đổi 1 lĩnh vực không ảnh hưởng lĩnh vực khác.

---

## 🎯 Vấn đề

Khi 1 class/module làm nhiều việc:

- **Khó hiểu** — 1 class chứa quá nhiều khái niệm
- **Khó sửa** — sửa 1 phần có thể vỡ phần khác
- **Khó test** — phải setup nhiều thứ mới test được 1 chức năng
- **Khó tái sử dụng** — muốn dùng 1 phần phải kéo cả class

```
❌ 1 CLASS LÀM MỌI THỨ              ✅ TÁCH TRÁCH NHIỆM
┌─────────────────────┐            ┌─────────────────────┐
│ UserService         │            │ UserRepository      │
│ ├─ validate()       │            │ ├─ save()           │
│ ├─ save()           │  ──SoC──▶  │ └─ find()           │
│ ├─ sendEmail()      │            │ UserEmailService    │
│ ├─ generateReport() │            │ ├─ sendWelcome()    │
│ └─ logActivity()    │            │ └─ sendReset()      │
└─────────────────────┘            │ ReportService       │
                                   │ └─ generate()       │
                                   └─────────────────────┘
```

---

## 🧩 Dấu hiệu vi phạm

```
DẤU HIỆU VI PHẠM SoC
│
├─ Class tên "Service" nhưng làm cả validate + save + email + report
│
├─ 1 file > 500 dòng, nhiều khái niệm khác nhau
│
├─ Sửa 1 chức năng phải đụng nhiều phần không liên quan
│
├─ Test 1 chức năng phải mock quá nhiều thứ
│
└─ "God class" / "God object" — class biết làm tất cả
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: One class does everything
class UserService {
  validateUser(user: any) { /* ... */ }
  saveToDatabase(user: any) { /* ... */ }
  sendWelcomeEmail(user: any) { /* ... */ }
  generateUserReport(user: any) { /* ... */ }
}

// ✅ GOOD: Separation of concerns
class UserValidator {
  validate(user: any) { /* ... */ }
}

class UserRepository {
  save(user: any) { /* ... */ }
}

class UserEmailService {
  sendWelcome(user: any) { /* ... */ }
}

class ReportService {
  generateUserReport(user: any) { /* ... */ }
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🎯 **Rõ ràng** | Mỗi class 1 mục đích, dễ hiểu |
| 🔧 **Dễ sửa** | Sửa email không đụng database |
| 🧪 **Dễ test** | Test riêng từng phần, mock ít |
| ♻️ **Tái sử dụng** | Dùng riêng từng module khi cần |

---

## ⚠️ Lưu ý

| Lưu ý | Giải thích |
|-------|------------|
| **Đừng tách quá nhỏ** | Tách đến mức 1 class 1 method là over-engineering |
| **Tách theo lĩnh vực** | Tách theo "việc gì" không phải "ai gọi" |
| **Cân bằng với KISS** | SoC tách trách nhiệm, KISS giữ đơn giản — đừng tách quá mức |

> 💡 **Nguyên tắc:** Tách khi class bắt đầu có **nhiều lý do để thay đổi** (multiple reasons to change).

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| 1 class làm nhiều lĩnh vực | ✅ Tách theo lĩnh vực |
| Class > 500 dòng | ✅ Cân nhắc tách |
| Sửa 1 chức năng vỡ chức năng khác | ✅ Tách ngay |
| Class nhỏ, 1 mục đích rõ ràng | ❌ Đừng tách thêm |
| Tách đến mức 1 class 1 method | ❌ Quá mức |

---

## 🔗 Liên quan

- **3.2.1 SRP** — SoC ở mức module, SRP ở mức class — cùng tư tưởng
- **3.1.1 DRY** — DRY gom logic trùng, SoC tách trách nhiệm khác
- **1.4 Layered Architecture** — SoC áp dụng ở mức kiến trúc (presentation, business, data)

---

## 📁 Cấu trúc thư mục

```
3.1.4-soc/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.4-soc
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Separation of Concerns - Wikipedia](https://en.wikipedia.org/wiki/Separation_of_concerns)

---

## ⏭️ Bài tiếp theo

→ [3.1.5 Law of Demeter](../3.1.5-law-of-demeter/README.md)