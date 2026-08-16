# 🔘 2.3.3 Command Pattern

> Đóng gói hành động thành object

---

## 🎯 Vấn đề

Đóng gói hành động thành object

**Scenario điển hình:** Khi cần undo/redo, queue, log thao tác (editor undo, task queue) — tách nơi gọi và nơi thực thi

---

## 🧩 Cấu trúc

```
(Chi tiết trong examples/index.ts — đọc code kèm comment)
```

Cấu trúc đầy đủ + luồng hoạt động minh họa trong code ví dụ.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

Chạy:
```bash
cd 02-design-patterns/2.3-behavioral/2.3.3-command
npx ts-node examples/index.ts
```

---

## ✅ Ưu điểm

- Giải quyết đúng vấn đề coupling/duplication/điều phối ở trên
- Dễ mở rộng — thêm biến thể mới không sửa code cũ

## ⚠️ Nhược điểm

- Nhiều class/interface hơn — overkill cho case đơn giản
- Cần cân nhắc khi ứng dụng nhỏ, số biến thể ít

---

## 📚 Tài liệu tham khảo

- 📖 [Refactoring Guru](https://refactoring.guru/design-patterns)
- 📖 [GoF Design Patterns](https://en.wikipedia.org/wiki/Design_Patterns)

---

## 📁 Thư mục

```
2.3.3-command/
├── README.md           # File này
└── examples/index.ts   # Demo
```
