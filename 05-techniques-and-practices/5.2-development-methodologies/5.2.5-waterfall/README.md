# 🌊 5.2.5 Waterfall (Mô Hình Thác Nước)

> Mô hình phát triển phần mềm **tuần tự (sequential)** truyền thống. Mỗi giai đoạn (Requirements, Design, Implementation, Testing, Maintenance) phải hoàn thành 100% trước khi chuyển sang giai đoạn tiếp theo.

---

## 🎯 Mô hình này là gì?

Do Winston W. Royce giới thiệu năm 1970. Luồng công việc chảy xuống một chiều như thác nước, không quay lại giai đoạn trước.

```
┌────────────────────────────────────────────────────────────┐
│                    WATERFALL MODEL                         │
│                                                            │
│  [ Requirements Analysis ]                                 │
│           │                                                │
│           ▼                                                │
│  [ System Design ]                                         │
│           │                                                │
│           ▼                                                │
│  [ Implementation (Coding) ]                               │
│           │                                                │
│           ▼                                                │
│  [ Testing & Integration ]                                 │
│           │                                                │
│           ▼                                                │
│  [ Deployment & Maintenance ]                              │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ Ưu điểm & ⚠️ Nhược điểm

- ✅ **Ưu:** Dễ quản lý, kế hoạch & tài liệu rõ ràng, phù hợp dự án cố định scope/ngân sách
- ❌ **Nhược:** Khó thay đổi yêu cầu, phát hiện lỗi muộn ở khâu Test, khách hàng chỉ thấy sản phẩm ở cuối quy trình

---

## 🎯 Khi nào dùng?

- Dự án y tế, hàng không, tài chính có quy chuẩn khắt khe và cố định scope
- Yêu cầu cực kỳ rõ ràng, công nghệ quen thuộc, không thay đổi

---

## 📚 Tài liệu tham khảo

- 📖 [Waterfall Model - Wikipedia](https://en.wikipedia.org/wiki/Waterfall_model)