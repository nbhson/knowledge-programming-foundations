# 🚫 3.1.3 YAGNI (You Ain't Gonna Need It)

> **Đừng viết code cho tương lai** — chỉ viết code khi bạn **thực sự cần** ngay bây giờ.
> Mỗi dòng code thừa là mỗi dòng phải maintain, test, debug.

---

## 🎯 Vấn đề

Viết code "phòng khi" dẫn đến:

- **Lãng phí thời gian** — viết tính năng không bao giờ dùng
- **Code phình to** — khó đọc, khó maintain
- **Bug tiềm ẩn** — code không dùng vẫn có thể sai
- **Sai thiết kế** — dự đoán tương lai thường sai, phải viết lại

```
❌ VIẾT "PHÒNG KHI"                  ✅ CHỈ VIẾT KHI CẦN
┌─────────────────────┐            ┌─────────────────────┐
│ createUser()        │            │ createUser()        │
│ deleteUser()        │            │ deleteUser()        │
│ softDeleteUser()    │  ──YAGNI──▶│                     │
│ archiveUser()       │            │  "Chưa cần →        │
│ restoreUser()       │            │   đừng viết"        │
│ bulkDeleteUsers()   │            │                     │
└─────────────────────┘            └─────────────────────┘
```

---

## 🧩 Dấu hiệu vi phạm

```
DẤU HIỆU VI PHẠM YAGNI
│
├─ "Có thể cần sau này" — nhưng chưa có yêu cầu thật
│
├─ "Biết đâu khách hàng muốn" — chưa ai xác nhận
│
├─ "Cho chắc" — thêm param/flag không ai dùng
│
├─ "Phòng khi" — viết trước tính năng chưa có deadline
│
└─ Config/abstraction cho 1 trường hợp duy nhất
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: Writing code "just in case"
class UserService {
  createUser(data: UserData) { /* ... */ }
  deleteUser(id: string) { /* ... */ }
  softDeleteUser(id: string) { /* ... */ }  // "có thể cần sau"
  archiveUser(id: string) { /* ... */ }     // "biết đâu cần"
  restoreUser(id: string) { /* ... */ }     // "cho chắc"
  bulkDeleteUsers(ids: string[]) { /* ... */ } // "phòng khi"
}

// ✅ GOOD: Only what's needed NOW
class UserService {
  createUser(data: UserData) { /* ... */ }
  deleteUser(id: string) { /* ... */ }
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| ⏱️ **Tiết kiệm thời gian** | Không viết code không dùng |
| 📏 **Code gọn** | Chỉ những gì cần thiết |
| 🐛 **Ít bug** | Ít code = ít chỗ sai |
| 🎯 **Đúng thiết kế** | Thiết kế theo nhu cầu thật, không theo dự đoán |

---

## ⚠️ Lưu ý

| Lưu ý | Giải thích |
|-------|------------|
| **YAGNI ≠ không lên kế hoạch** | Vẫn thiết kế kiến trúc, nhưng không viết code thừa |
| **YAGNI ≠ không linh hoạt** | Vẫn viết code dễ mở rộng, nhưng không mở rộng trước |
| **Cân bằng với DRY** | DRY gom logic lặp lại, YAGNI đừng tạo abstraction chưa cần |

> 💡 **Câu hỏi kiểm tra:** "Tính năng này có ai yêu cầu không? Có deadline không? Nếu không → đừng viết."

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| "Có thể cần sau" — chưa có yêu cầu | ✅ Bỏ qua |
| Yêu cầu thật từ khách hàng | ❌ Viết ngay |
| Param/flag không ai dùng | ✅ Xóa |
| Abstraction cho 1 trường hợp | ✅ Viết cụ thể |
| Kiến trúc tổng thể | ⚠️ Vẫn thiết kế, nhưng không code thừa |

---

## 🔗 Liên quan

- **3.1.2 KISS** — YAGNI đừng thêm cái chưa cần, KISS đơn giản hóa cái có
- **3.1.1 DRY** — Đừng abstraction sớm (premature abstraction) — chờ Rule of Three
- **2.1.4 Builder** — Chỉ dùng khi object thực sự phức tạp

---

## 📁 Cấu trúc thư mục

```
3.1.3-yagni/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.3-yagni
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [YAGNI - Wikipedia](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it)

---

## ⏭️ Bài tiếp theo

→ [3.1.4 SoC](../3.1.4-soc/README.md)