# 🎯 3.2.1 SRP — Single Responsibility Principle

> **1 class chỉ có 1 lý do để thay đổi.**
> Mỗi class lo 1 trách nhiệm duy nhất.

---

## 🎯 Vấn đề

Class làm quá nhiều việc:

- **Khó sửa** — sửa 1 chức năng ảnh hưởng chức năng khác
- **Khó test** — phải test cả đống trách nhiệm
- **Khó hiểu** — class dài, nhìn không biết lo việc gì
- **Khó tái sử dụng** — muốn dùng 1 phần phải kéo cả class

```
❌ VI PHẠM SRP                      ✅ TUÂN THỦ SRP
┌─────────────────────┐            ┌─────────────────────┐
│ UserService         │            │ UserValidator       │
│  ├─ validate()      │  ──SRP──▶  │ UserRepository      │
│  ├─ save()          │            │ UserEmailService    │
│  ├─ sendEmail()     │            │ UserReportService   │
│  └─ generateReport()│            └─────────────────────┘
└─────────────────────┘
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: 1 class 4 trách nhiệm
class UserService {
  validate(user: any) { /* ... */ }
  save(user: any) { /* ... */ }
  sendEmail(user: any) { /* ... */ }
  generateReport(user: any) { /* ... */ }
}

// ✅ GOOD: mỗi class 1 trách nhiệm
class UserValidator { validate(user: any) { /* ... */ } }
class UserRepository { save(user: any) { /* ... */ } }
class UserEmailService { sendEmail(user: any) { /* ... */ } }
class UserReportService { generateReport(user: any) { /* ... */ } }
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🔧 **Dễ sửa** | Sửa 1 trách nhiệm không đụng trách nhiệm khác |
| 🧪 **Dễ test** | Test từng class riêng biệt |
| 📖 **Dễ đọc** | Class ngắn, nhìn là hiểu |
| ♻️ **Tái sử dụng** | Dùng riêng từng phần |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Class > 1 trách nhiệm rõ ràng | ✅ Tách class |
| Class dài, khó hiểu | ✅ Tách theo trách nhiệm |
| Sửa 1 chỗ vỡ nhiều nơi | ✅ Tách class |
| Class nhỏ, 1 việc duy nhất | ❌ Không cần tách |

> 💡 **Kiểm tra:** "Class này có 1 lý do duy nhất để thay đổi không?"

---

## 🔗 Liên quan

- **3.1.4 SoC** — Nền tảng: tách trách nhiệm theo lĩnh vực
- **3.2.2 OCP** — SRP giúp dễ mở rộng không sửa code cũ
- **2.2.3 Facade** — Pattern gom nhiều service cho client dùng

---

## 📁 Cấu trúc thư mục

```
3.2.1-srp/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.2-solid-principles/3.2.1-srp
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [3.2.2 OCP — Open/Closed Principle](../3.2.2-ocp/README.md)