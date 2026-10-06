# 📜 03 - Principles (Nguyên Tắc)

> **Principles** là các **quy tắc vàng** định hướng cách viết code tốt,
> duy trì codebase dễ bảo trì và mở rộng.
>
> **Ví dụ:** Quy chuẩn xây dựng — phải đúng kỹ thuật để tòa nhà vững chắc.

---

## 📚 Mục lục

| # | Nhóm | Mô tả | Principles |
|---|------|-------|------------|
| 3.1 | [Design Principles](#31-design-principles-nguyên-tắc-thiết-kế) | Nguyên tắc thiết kế chung | DRY, KISS, YAGNI, SoC, Law of Demeter, Composition over Inheritance, GRASP, CUPID, Postel's Law, Convention over Configuration |
| 3.2 | [SOLID Principles](#32-solid-principles) | 5 nguyên tắc OOP nền tảng | SRP, OCP, LSP, ISP, DIP |

---

## 🎯 Principles là gì?

**Principles** = quy tắc vàng định hướng cách viết code. Không phải pattern cụ thể, mà là **kim chỉ nam** — áp dụng mọi lúc, mọi nơi.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   QUY TẮC VÀNG              ÁP DỤNG              KẾT QUẢ    │
│   ┌────────────┐          ┌────────────┐      ┌──────────┐   │
│   │  DRY       │          │  Tránh     │      │ Code     │   │
│   │  (nguyên   │ ───────▶ │  trùng     │ ───▶ │ ngắn,    │   │
│   │   tắc)     │          │  lặp       │      │ dễ sửa   │   │
│   └────────────┘          └────────────┘      └──────────┘   │
│                                                             │
│   Principle = kim chỉ nam. Pattern = giải pháp cụ thể.       │
└─────────────────────────────────────────────────────────────┘
```

### Principles vs Patterns

| | Principles | Patterns |
|---|-----------|----------|
| **Bản chất** | Quy tắc, triết lý | Giải pháp cụ thể |
| **Phạm vi** | Toàn bộ codebase | Từng vấn đề thiết kế |
| **Ví dụ** | DRY, SRP | Singleton, Observer |
| **Bắt buộc?** | Nên tuân thủ | Tùy ngữ cảnh |

---

## 🧭 Bản đồ lựa chọn

```
BẠN ĐANG GẶP VẤN ĐỀ GÌ?
│
├─ VỀ THIẾT KẾ CHUNG (Design Principles)
│   ├─ Code trùng lặp nhiều nơi? → DRY
│   ├─ Code phức tạp, khó hiểu? → KISS
│   ├─ Viết code cho tương lai không chắc xảy ra? → YAGNI
│   ├─ 1 class làm quá nhiều việc? → SoC
│   ├─ Gọi method xuyên qua nhiều object? → Law of Demeter
│   ├─ Kế thừa gây rắc rối? → Composition over Inheritance
│   ├─ Không biết method mới đặt ở class nào? → GRASP
│   ├─ Hàm to, side-effect ẩn, khó tái dùng? → CUPID
│   ├─ API khắt khe vô lý / output thiếu nhất quán? → Postel's Law
│   └─ Config thủ công mọi thứ, boilerplate nhiều? → Convention over Configuration
│
└─ VỀ OOP (SOLID)
    ├─ Class có nhiều lý do để thay đổi? → SRP
    ├─ Thêm chức năng phải sửa code cũ? → OCP
    ├─ Subtype phá vỡ hành vi cha? → LSP
    ├─ Interface quá "béo", client phải implement thừa? → ISP
    └─ Module cấp cao phụ thuộc module cấp thấp? → DIP
```

---

## 📖 Chi tiết từng nguyên tắc

### 3.1 Design Principles (Nguyên Tắc Thiết Kế)

> Quy tắc chung cho mọi codebase, không phụ thuộc ngôn ngữ hay mô hình.

| # | Principle | Mục đích | Chi tiết |
|---|-----------|----------|----------|
| 3.1.1 | **DRY** | Tránh trùng lặp, 1 nguồn duy nhất | [→ Xem](3.1-design-principles/3.1.1-dry/README.md) |
| 3.1.2 | **KISS** | Giữ mọi thứ đơn giản | [→ Xem](3.1-design-principles/3.1.2-kiss/README.md) |
| 3.1.3 | **YAGNI** | Chỉ viết code khi thực sự cần | [→ Xem](3.1-design-principles/3.1.3-yagni/README.md) |
| 3.1.4 | **SoC** | Tách trách nhiệm, mỗi module 1 lĩnh vực | [→ Xem](3.1-design-principles/3.1.4-soc/README.md) |
| 3.1.5 | **Law of Demeter** | Chỉ nói chuyện với object trực tiếp | [→ Xem](3.1-design-principles/3.1.5-law-of-demeter/README.md) |
| 3.1.6 | **Composition over Inheritance** | Kết hợp thay vì kế thừa | [→ Xem](3.1-design-principles/3.1.6-composition-over-inheritance/README.md) |
| 3.1.7 | **GRASP** | Gán đúng trách nhiệm cho object | [→ Xem](3.1-design-principles/3.1.7-grasp/README.md) |
| 3.1.8 | **CUPID** | Code vui vẻ: ghép nối, 1 việc, đoán được | [→ Xem](3.1-design-principles/3.1.8-cupid/README.md) |
| 3.1.9 | **Postel's Law** | Input rộng, output chặt | [→ Xem](3.1-design-principles/3.1.9-postel-law/README.md) |
| 3.1.10 | **Convention over Configuration** | Quy ước default, chỉ config ngoại lệ | [→ Xem](3.1-design-principles/3.1.10-convention-over-configuration/README.md) |

### 3.2 SOLID Principles

> 5 nguyên tắc nền tảng cho thiết kế OOP — viết tắt của 5 chữ cái đầu.

| # | Principle | Mục đích | Chi tiết |
|---|-----------|----------|----------|
| 3.2.1 | **S — SRP** | 1 class = 1 trách nhiệm | [→ Xem](3.2-solid-principles/3.2.1-srp/README.md) |
| 3.2.2 | **O — OCP** | Mở rộng, không sửa đổi | [→ Xem](3.2-solid-principles/3.2.2-ocp/README.md) |
| 3.2.3 | **L — LSP** | Subtype thay thế được cha | [→ Xem](3.2-solid-principles/3.2.3-lsp/README.md) |
| 3.2.4 | **I — ISP** | Interface nhỏ, tập trung | [→ Xem](3.2-solid-principles/3.2.4-isp/README.md) |
| 3.2.5 | **D — DIP** | Depend abstraction, không depend concrete | [→ Xem](3.2-solid-principles/3.2.5-dip/README.md) |

---

## 🆚 So sánh các nguyên tắc dễ nhầm lẫn

| Cặp nguyên tắc | Khác nhau |
|----------------|-----------|
| **DRY vs SoC** | DRY: tránh trùng lặp code. SoC: tách trách nhiệm — 2 class có thể cùng logic nhưng khác lĩnh vực |
| **KISS vs YAGNI** | KISS: đơn giản hóa cái đang có. YAGNI: đừng thêm cái chưa cần |
| **SRP vs SoC** | SRP: 1 class 1 lý do thay đổi (OOP). SoC: tách module theo lĩnh vực (rộng hơn) |
| **OCP vs Composition** | OCP: mở rộng không sửa. Composition: 1 cách cụ thể để đạt OCP |
| **LSP vs ISP** | LSP: subtype giữ contract cha. ISP: interface không bắt client làm thừa |

---

## 📁 Cấu trúc thư mục

```
03-principles/
├── README.md                    # File này (overview)
├── 3.1-design-principles/
│   ├── README.md                # Tổng quan nhóm Design Principles
│   ├── 3.1.1-dry/
│   │   ├── README.md            # Tutorial DRY
│   │   ├── violations.md        # Tình huống vi phạm DRY
│   │   └── examples/index.ts    # Code ví dụ
│   ├── 3.1.2-kiss/
│   ├── 3.1.3-yagni/
│   ├── 3.1.4-soc/
│   ├── 3.1.5-law-of-demeter/
│   ├── 3.1.6-composition-over-inheritance/
│   ├── 3.1.7-grasp/
│   ├── 3.1.8-cupid/
│   ├── 3.1.9-postel-law/
│   └── 3.1.10-convention-over-configuration/
└── 3.2-solid-principles/
    ├── README.md                # Tổng quan nhóm SOLID
    ├── 3.2.1-srp/
    ├── 3.2.2-ocp/
    ├── 3.2.3-lsp/
    ├── 3.2.4-isp/
    └── 3.2.5-dip/
```

---

## 📚 Tài liệu tham khảo

- 📖 [SOLID - Wikipedia](https://en.wikipedia.org/wiki/SOLID)
- 📖 [The Principles of OOD - Robert C. Martin](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod)
- 📖 [Refactoring Guru - Code Smells](https://refactoring.guru/refactoring/smells)
- 📖 [Clean Code - Robert C. Martin](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)

---

## ⏭️ Bài tiếp theo

→ [04-paradigms](../04-paradigms/README.md)