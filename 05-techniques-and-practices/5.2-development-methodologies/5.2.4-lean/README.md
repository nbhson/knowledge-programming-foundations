# 🍃 5.2.4 Lean Software Development

> Xuất phát từ **Toyota Production System (TPS)**. Tập trung **loại bỏ lãng phí (waste)**, tối ưu hóa toàn bộ chuỗi giá trị (value stream), và mang lại giá trị cho khách hàng nhanh nhất có thể.

---

## 🎯 Triết lý này là gì?

Lean không quy định các role hay ceremony cụ thể như Scrum. Nó là **tập hợp 7 nguyên tắc** định hướng cách làm việc để giảm thiểu lãng phí và tối ưu hiệu suất.

```
┌────────────────────────────────────────────────────────────┐
│                    LEAN 7 PRINCIPLES                       │
│                                                            │
│  1. Eliminate Waste        (Xóa bỏ lãng phí)              │
│  2. Build Quality In       (Tích hợp chất lượng vào quy trình)│
│  3. Create Knowledge       (Tạo & chia sẻ tri thức)       │
│  4. Defer Commitment       (Quyết định trễ nhất có thể)   │
│  5. Deliver Fast           (Giao hàng nhanh)              │
│  6. Respect People         (Tôn trọng con người)          │
│  7. Optimize the Whole     (Tối ưu toàn bộ hệ thống)      │
└────────────────────────────────────────────────────────────┘
```

---

## 🚫 7 Lãng phí trong phần mềm (Software Wastes)

| Lãng phí | Mô tả | Giải pháp |
|----------|-------|-----------|
| **Partially Done Work** | Code viết xong chưa test, chưa deploy | Giảm WIP, CI/CD |
| **Extra Features** | Tính năng khách không dùng (YAGNI) | Làm việc chặt chẽ với PO |
| **Relearning** | Quên kiến thức, giải quyết lại vấn đề cũ | Viết docs, pair programming |
| **Handoffs** | Chuyển giao giữa các khâu/team gây mất ngữ cảnh | Cross-functional team |
| **Delays** | Chờ đợi quyết định, chờ review, chờ deploy | Tự động hóa, trao quyền |
| **Task Switching** | Chuyển đổi công ngữ cảnh liên tục | Giới hạn WIP |
| **Defects** | Lỗi phải sửa lại | TDD, automated testing |

---

## ✅ Ưu điểm & ⚠️ Nhược điểm

- ✅ **Ưu:** Tối ưu chi phí & thời gian, tập trung giá trị thật, văn hóa cải tiến bền vững
- ❌ **Nhược:** Trừu tượng, cần tư duy hệ thống cao, khó đo lường ban đầu

---

## 📚 Tài liệu tham khảo

- 📖 [Lean Software Development - Mary & Tom Poppendieck](https://en.wikipedia.org/wiki/Lean_software_development)