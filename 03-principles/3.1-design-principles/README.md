# 🧭 3.1 Design Principles (Nguyên Tắc Thiết Kế)

> Quy tắc chung cho mọi codebase — không phụ thuộc ngôn ngữ, framework hay mô hình.
> Giúp code **dễ đọc, dễ bảo trì, dễ mở rộng**.

---

## 🎯 Vấn đề chung

Code không có nguyên tắc dẫn đến:

- **Trùng lặp** — sửa 1 chỗ phải sửa nhiều nơi
- **Phức tạp** — khó hiểu, khó maintain
- **Over-engineering** — viết code cho tương lai không chắc xảy ra
- **Coupling cao** — đổi 1 module vỡ nhiều module khác

```
❌ KHÔNG NGUYÊN TẮC                    ✅ CÓ NGUYÊN TẮC
┌─────────────────────┐                ┌─────────────────────┐
│ Code trùng lặp      │                │ 1 nguồn duy nhất    │
│ Class làm mọi thứ   │   ──ÁP DỤNG──▶ │ Mỗi class 1 việc    │
│ Viết cho tương lai  │   NGUYÊN TẮC   │ Chỉ viết khi cần    │
│ Gọi xuyên object    │                │ Nói chuyện trực tiếp│
└─────────────────────┘                └─────────────────────┘
```

---

## 📚 Các nguyên tắc trong nhóm

| # | Principle | Mục đích | Khi nào dùng |
|---|-----------|----------|--------------|
| [3.1.1](3.1.1-dry/README.md) | **DRY** | Tránh trùng lặp, 1 nguồn duy nhất | Cùng logic xuất hiện nhiều nơi |
| [3.1.2](3.1.2-kiss/README.md) | **KISS** | Giữ mọi thứ đơn giản | Code bắt đầu phức tạp hóa |
| [3.1.3](3.1.3-yagni/README.md) | **YAGNI** | Chỉ viết code khi thực sự cần | Đang định viết "phòng khi" |
| [3.1.4](3.1.4-soc/README.md) | **SoC** | Tách trách nhiệm theo lĩnh vực | 1 class/module làm nhiều việc |
| [3.1.5](3.1.5-law-of-demeter/README.md) | **Law of Demeter** | Chỉ nói chuyện với object trực tiếp | Chuỗi method gọi xuyên object |
| [3.1.6](3.1.6-composition-over-inheritance/README.md) | **Composition over Inheritance** | Kết hợp thay vì kế thừa | Kế thừa gây ràng buộc, override vụng về |

---

## 🧭 Chọn nguyên tắc nào?

```
BẠN ĐANG GẶP VẤN ĐỀ GÌ?
│
├─ Code trùng lặp nhiều nơi? → DRY
│
├─ Code phức tạp, khó hiểu? → KISS
│
├─ Đang viết code "phòng khi" cần sau? → YAGNI
│
├─ 1 class/module làm quá nhiều việc? → SoC
│
├─ Gọi method xuyên qua nhiều object? → Law of Demeter
│
└─ Kế thừa gây rắc rối, override vụng về? → Composition over Inheritance
```

---

## 🆚 So sánh các nguyên tắc dễ nhầm lẫn

```
┌─────────────────────────────────────────────────────────────┐
│  DRY vs SoC                                                 │
│                                                             │
│  DRY:  Tránh trùng lặp code — cùng logic, 1 nơi định nghĩa  │
│  SoC:  Tách trách nhiệm — mỗi module 1 lĩnh vực             │
│                                                             │
│  Ví dụ: 2 service cùng validate email → DRY gom lại         │
│         UserService + EmailService → SoC tách riêng         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  KISS vs YAGNI                                              │
│                                                             │
│  KISS:  Đơn giản hóa cái ĐANG CÓ                            │
│  YAGNI: Đừng thêm cái CHƯA CẦN                              │
│                                                             │
│  KISS:  "Code này phức tạp quá, đơn giản lại"               │
│  YAGNI: "Tính năng này chưa cần, đừng viết"                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
3.1-design-principles/
├── README.md                    # File này
├── 3.1.1-dry/
│   ├── README.md
│   ├── violations.md            # Tình huống vi phạm
│   └── examples/index.ts
├── 3.1.2-kiss/
├── 3.1.3-yagni/
├── 3.1.4-soc/
├── 3.1.5-law-of-demeter/
└── 3.1.6-composition-over-inheritance/
```

---

## ⏭️ Bài tiếp theo

→ [3.2 SOLID Principles](../3.2-solid-principles/README.md)