# ⚡ 5.2.3 XP (Extreme Programming)

> Nhấn mạnh **kỷ luật kỹ thuật** để đạt chất lượng cao và phản hồi nhanh. Đưa các practice tốt lên "cực điểm" (extreme): test liên tục, refactor liên tục, tích hợp liên tục.

---

## 🎯 Phương pháp này là gì?

XP do Kent Beck sáng lập. Triết lý: **nếu việc gì tốt thì làm cực hơn**. Ví dụ: review code tốt → pair programming (review liên tục); test tốt → TDD (test trước khi code); tích hợp tốt → CI (tích hợp nhiều lần/ngày).

```
┌────────────────────────────────────────────────────────────┐
│                    XP PRACTICES                            │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  TDD        │  │ Pair         │  │ Continuous       │  │
│  │  (test      │  │ Programming  │  │ Integration      │  │
│  │   trước)    │  │ (2 người/code)│  │ (CI/CD)          │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Refactoring │  │ Simple       │  │ On-site          │  │
│  │ (liên tục)  │  │ Design       │  │ Customer         │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Chất lượng code là ưu tiên số 1. Kỹ thuật tốt → tốc độ bền vững.

---

## 🔑 12 Practices chính

| # | Practice | Mô tả |
|---|----------|-------|
| 1 | **Planning Game** | Khách hàng chọn feature, team ước lượng, ưu tiên theo giá trị |
| 2 | **Small Releases** | Release thường xuyên, mỗi release nhỏ |
| 3 | **Metaphor** | Dùng ẩn dụ chung để team hiểu hệ thống |
| 4 | **Simple Design** | Chỉ làm đủ cho hiện tại, không dự đoán tương lai (YAGNI) |
| 5 | **Testing (TDD)** | Viết test trước, code sau, test tự động |
| 6 | **Refactoring** | Cải thiện code liên tục, giữ test xanh |
| 7 | **Pair Programming** | 2 người 1 máy: 1 gõ code, 1 review — đổi vai thường xuyên |
| 8 | **Collective Ownership** | Ai cũng có thể sửa bất kỳ code nào |
| 9 | **Continuous Integration** | Tích hợp code nhiều lần/ngày, build + test tự động |
| 10 | **40-hour Week** | Làm việc bền vững, không overtime kéo dài |
| 11 | **On-site Customer** | Khách hàng ngồi cùng team, trả lời ngay |
| 12 | **Coding Standards** | Chuẩn code chung, ai cũng tuân theo |

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô phỏng **vòng lặp TDD**:

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD CYCLE (Red-Green-Refactor)           │
│                                                             │
│  1. RED:   Viết test thất bại (chưa có code)               │
│  2. GREEN: Viết code tối thiểu để test pass                 │
│  3. REFACTOR: Cải thiện code, test vẫn xanh                 │
│                                                             │
│  Lặp lại cho từng behavior mới                              │
└─────────────────────────────────────────────────────────────┘
```

- **TestRunner:** chạy test, báo pass/fail
- **Vòng lặp:** test thất bại → code tối thiểu → test pass → refactor

> 💡 Code mô phỏng chu trình Red-Green-Refactor. Chạy để thấy cách TDD dẫn dắt việc viết code.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🛡️ **Chất lượng cao** | TDD + Pair + CI bắt lỗi sớm, code sạch |
| ⚡ **Phản hồi nhanh** | Test tự động chạy liên tục, biết lỗi ngay |
| 🔄 **Thay đổi an toàn** | Refactor + test xanh → sửa code không sợ vỡ |
| 👥 **Chia sẻ kiến thức** | Pair programming lan truyền kỹ năng |
| 🚀 **Tốc độ bền vững** | Code sạch → không nợ kỹ thuật → nhanh lâu dài |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🎓 **Đòi hỏi kỷ luật cao** | TDD/Pair khó duy trì nếu team chưa quen |
| 💰 **Chi phí ban đầu lớn** | Pair programming tốn 2 người/1 task |
| 🧩 **Khó áp dụng từng phần** | Practices hỗ trợ nhau, bỏ 1 cái ảnh hưởng cả hệ |
| 📏 **Không phù hợp mọi dự án** | Dự án ngắn hạn, prototype nhanh không cần |
| 👤 **Phụ thuộc khách hàng** | On-site customer khó có trong thực tế |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Sản phẩm dài hạn, yêu cầu chất lượng cao | ✅ Rất phù hợp |
| Team có kinh nghiệm, kỷ luật tốt | ✅ Rất phù hợp |
| Dự án yêu cầu thay đổi liên tục | ✅ Phù hợp |
| Team mới, chưa quen TDD | ❌ Cần đào tạo trước |
| Prototype nhanh, throwaway code | ❌ Không cần thiết |

---

## 🔗 Liên quan

- **5.2.1 Scrum** — Bổ sung: Scrum cho quy trình, XP cho kỹ thuật
- **5.2.2 Kanban** — Bổ sung: flow + kỷ luật kỹ thuật
- **07 Testing** — TDD, test automation chi tiết (07-testing)
- **08 DevOps / CI-CD** — Continuous Integration (08-devops-cicd)
- **14 Clean Code** — Refactoring, coding standards (14-clean-code)

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.3-xp/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng TDD cycle (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.3-xp
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Extreme Programming - Ron Jeffries](https://ronjeffries.com/xprog/what-is-extreme-programming/)
- 📖 [Extreme Programming - Martin Fowler](https://martinfowler.com/bliki/ExtremeProgramming.html)
- 📖 [Test Driven Development - Kent Beck](https://en.wikipedia.org/wiki/Test-driven_development)

---

## ⏭️ Bài tiếp theo

→ [5.2.4 Lean](../5.2.4-lean/README.md)