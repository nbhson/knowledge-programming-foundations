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

Tất cả 6 nguyên tắc này là **lời khuyên thực dụng**, không phải luật pháp. Chúng sinh ra từ hàng thập kỷ debugging spaghetti code, refactor production system, và quan sát các dự án thành công. Không tuân thủ = **chi phí kỹ thuật** — sớm hay muộn sẽ trả.

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

| # | Principle | Mục đích | Khi nào dùng | Điểm nhấn quan trọng |
|---|-----------|----------|--------------|---------------------|
| [3.1.1](3.1.1-dry/README.md) | **DRY** | Tránh trùng lặp, 1 nguồn duy nhất | Cùng logic xuất hiện nhiều nơi | DRY ≠ "không code lặp" — đúng là "không **kiến thức** trùng". Logic lặp nhưng intent khác → có thể chấp nhận. |
| [3.1.2](3.1.2-kiss/README.md) | **KISS** | Giữ mọi thứ đơn giản | Code bắt đầu phức tạp hóa | Đơn giản ≠ đơn giản hóa quá mức (tránh over-simplification). Simple code giải quyết problem đúng mức. |
| [3.1.3](3.1.3-yagni/README.md) | **YAGNI** | Chỉ viết code khi thực sự cần | Đang định viết "phòng khi" | Đây là **antithesis của over-engineering** — 80% "generic abstraction" không bao giờ được dùng. |
| [3.1.4](3.1.4-soc/README.md) | **SoC** | Tách trách nhiệm theo lĩnh vực | 1 class/module làm nhiều việc | Nguyên tắc cha của tất cả pattern khác. Architecture, design patterns đều là special case của SoC. |
| [3.1.5](3.1.5-law-of-demeter/README.md) | **Law of Demeter** | Chỉ nói chuyện với object trực tiếp | Chuỗi method gọi xuyên object | Gọi `a.getB().getC().doStuff()` = vi phạm. Hiểu: "talk to friends, not to friends of friends". |
| [3.1.6](3.1.6-composition-over-inheritance/README.md) | **Composition over Inheritance** | Kết hợp thay vì kế thừa | Kế thừa gây ràng buộc, override vụng về | Composition = runtime flexibility; inheritance = compile-time rigidity. |

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
│                                                             │
│  Trường hợp biên: Cùng logic nhưng domain khác → KHÔNG DRY  │
│  (ví dụ: validation email user vs validation email order —  │
│   2 business rules khác nhau, mặc dù code giống)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  KISS vs YAGNI                                              │
│                                                             │
│  KISS:  Đơn giản hóa cái ĐANG CÓ                            │
│  YAGNI: Đừng thêm cái CHƯA CẦN                              │
│                                                             │
│  KISS:  "Code này phức tạp quá, đơn giản lại"               │
│  YAGNI: "Tính năng này chưa cần, đừng viết"                 │
│                                                             │
│  Tương tác: YAGNI giúp tránh phức tạp từ đầu,              │
│  KISS giúp giảm độ phức tạp đã có.                          │
└─────────────────────────────────────────────────────────────┘
```

**Lưu ý quan trọng về YAGNI:** YAGNI không có nghĩa "đừng bao giờ chuẩn bị cho tương lai". Nó có nghĩa "**chỉ chuẩn bị khi có bằng chứng rõ ràng** rằng feature đó sẽ tồn tại". Rule: nếu bạn đang **dự đoán** tính năng 6 tháng sau → YAGNI. Nếu bạn đang **gặp requirement** hiện tại → implement.

---

## 🏛️ Mức độ áp dụng

| Level | Nguyên tắc | Phạm vi |
|-------|-----------|---------|
| **Micro (function/method)** | DRY, KISS, YAGNI | 1–10 dòng code |
| **Meso (class/module)** | SoC, Law of Demeter | 1–10 class |
| **Macro (system)** | Composition over Inheritance, SoC | System architecture |
| **Strategic (team/process)** | Tất cả | Team workflow, code review |

Thực hành tốt nhất: **áp dụng tất cả ở đúng level**, không cứng nhắc — có trường hợp DRY tạo abstraction tai hại (YAGNI), hoặc YAGNI khiến code duplicate (DRY). Trade-off là nghệ thuật.

---

## 🔗 Liên quan

- **3.2 SOLID Principles** — Nguyên tắc OOP chi tiết hóa các design principle trên.
- **1.4 Layered Architecture** — SoC qua layer separation.
- **2.3.6 Iterator** — Law of Demeter compliant iteration.
- **5.8.1 Repository** — SoC + Dependency Inversion.

---

## ⏭️ Tiếp theo

→ [3.2.1 SRP — Single Responsibility Principle](../3.2-solid-principles/3.2.1-srp/README.md)
