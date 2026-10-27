# 🔁 3.1.1 DRY (Don't Repeat Yourself)

> **Mỗi kiến thức nên có một nguồn duy nhất** (single source of truth) trong hệ thống.
> Tránh trùng lặp mã nguồn — sửa 1 chỗ, không phải sửa nhiều nơi.

---

## 🎯 Vấn đề

Khi cùng logic xuất hiện ở nhiều nơi:

- **Sửa 1 chỗ quên chỗ khác** → bug khó tìm
- **Code dài dòng** → khó đọc, khó maintain
- **Thay đổi lan rộng** → 1 thay đổi nhỏ phải sửa nhiều file

```
❌ VẤN ĐỀ: Logic trùng lặp
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ validateUser│  │validateAdmin│  │validateStaff│  ← cùng logic
│ name check  │  │ name check  │  │ name check  │    lặp 3 lần
│ email check │  │ email check │  │ email check │
└─────────────┘  └─────────────┘  └─────────────┘

✅ GIẢI PHÁP: DRY
┌─────────────────────────────┐
│      validateName()         │  ← 1 nguồn duy nhất
│      validateEmail()        │
└─────────────────────────────┘
        ▲          ▲          ▲
        │          │          │
┌───────┴──┐ ┌─────┴────┐ ┌───┴────────┐
│validateU │ │validateA │ │validateSt  │
└──────────┘ └──────────┘ └────────────┘
```

---

## 🧩 Cách nhận biết vi phạm

```
DẤU HIỆU VI PHẠM DRY
│
├─ Copy-paste code từ nơi này sang nơi khác
│
├─ Sửa logic phải tìm & sửa nhiều chỗ
│
├─ 2 function có cùng đoạn code gần giống nhau
│
└─ Cùng 1 hằng số xuất hiện rải rác (magic number)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Duplicated validation logic
function validateUser(user: any) {
  if (!user.name || user.name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }
  if (!user.email || !user.email.includes("@")) {
    throw new Error("Invalid email");
  }
}

function validateAdmin(admin: any) {
  if (!admin.name || admin.name.length < 3) {
    throw new Error("Name must be at least 3 characters"); // duplicated!
  }
  if (!admin.email || !admin.email.includes("@")) {
    throw new Error("Invalid email"); // duplicated!
  }
}

// ✅ GOOD: Single source of truth
function validateName(name: string) {
  if (!name || name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }
}

function validateEmail(email: string) {
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email");
  }
}

function validateUser(user: any) {
  validateName(user.name);
  validateEmail(user.email);
}

function validateAdmin(admin: any) {
  validateName(admin.name);
  validateEmail(admin.email);
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🎯 **1 nguồn duy nhất** | Sửa 1 chỗ, mọi nơi đều đúng |
| 📏 **Code ngắn hơn** | Không lặp lại logic |
| 🔍 **Dễ tìm bug** | Chỉ cần kiểm tra 1 nơi |
| 🚀 **Dễ mở rộng** | Thêm logic mới chỉ sửa 1 chỗ |

---

## ⚠️ Lưu ý — Đừng DRY quá mức

DRY quá mức cũng gây hại:

| Vấn đề | Ví dụ |
|--------|-------|
| **Premature abstraction** | Gom code giống nhau 2 chỗ thành 1 function — nhưng 2 chỗ đó sẽ phát triển khác nhau |
| **Khó đọc** | Abstraction quá sâu, phải nhảy nhiều file mới hiểu |
| **Coupling giả tạo** | 2 nơi dùng chung 1 function nhưng yêu cầu khác nhau → sửa chỗ này vỡ chỗ kia |

> 💡 **Rule of Three:** Chỉ trừu tượng hóa khi logic lặp lại **3 lần trở lên**.
> Lặp 2 lần — chấp nhận được, đợi đến lần thứ 3 mới gom lại.

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Cùng logic xuất hiện ≥ 3 nơi | ✅ DRY |
| Cùng hằng số dùng nhiều nơi | ✅ Đưa vào constant |
| Logic giống nhau 2 nơi nhưng sẽ khác nhau | ⚠️ Chờ Rule of Three |
| Copy-paste 1 lần, không chắc tái sử dụng | ⚠️ Cân nhắc |
| 2 nơi "giống" nhưng yêu cầu khác nhau | ❌ Đừng gom |

---

## 🔗 Liên quan

- **3.1.4 SoC** — DRY gom logic, SoC tách trách nhiệm — kết hợp để module rõ ràng
- **3.2.1 SRP** — Class 1 trách nhiệm giúp tránh lặp logic
- **2.1.2 Factory Method** — Gom logic tạo object về 1 nơi

---

## 📁 Cấu trúc thư mục

```
3.1.1-dry/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.1-dry
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [DRY - Wikipedia](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- 📖 [Rule of Three - Wikipedia](https://en.wikipedia.org/wiki/Rule_of_three_(computer_programming))

---

## ⏭️ Bài tiếp theo

→ [3.1.2 KISS](../3.1.2-kiss/README.md)