# ⚡ 5.2.3 XP (Extreme Programming)

> Nhấn mạnh **kỷ luật kỹ thuật** để đạt chất lượng cao và phản hồi nhanh. Đưa các practice tốt lên "cực điểm" (extreme): test liên tục, refactor liên tục, tích hợp liên tục. Sáng lập bởi **Kent Beck** (1996), trải qua nhiều phiên bản (XP 1.0 → XP 2.0 hiện đại).

---

## 🎯 Phương pháp này là gì?

XP do Kent Beck sáng lập tại Chrysler C3. Triết lý cốt lõi: **nếu việc gì tốt thì làm cực hơn**. Đây là tư duy "extreme" — không phải "tăng lên chút ít", mà **đẩy đến giới hạn** rồi quan sát kết quả:

- Review code tốt → **Pair Programming** (review liên tục, 2 người 1 lúc)
- Test tốt → **TDD** (test viết TRƯỚC code, không phải sau)
- Tích hợp tốt → **Continuous Integration** (commit nhiều lần/ngày, build tự động)
- Design tốt → **Simple Design** (chỉ làm đủ cho hiện tại, không anticipatory design)

```
┌────────────────────────────────────────────────────────────┐
│                    XP PRACTICES (4 giá trị cốt lõi)        │
│                                                            │
│   COMMUNICATION — mọi thứ trao đổi trực tiếp, không tài liệu |
│   SIMPLICITY    — chỉ build những gì cần hôm nay           │
│   FEEDBACK      — test chạy liên tục, user feedback nhanh  │
│   RESPECT       — tin tưởng nhau, không micro-management   │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  TDD        │  │ Pair         │  │ Continuous       │  │
│  │  (test      │  │ Programming  │  │ Integration      │  │
│  │   trước)    │  │ (2 người/code)│  │ (CI/CD)          │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│                                                            │
│  ┌─────────────┌  ┌──────────────┐  ┌──────────────────┐  │
│  │ Refactoring │  │ Simple       │  │ On-site          │  │
│  │ (liên tục)  │  │ Design       │  │ Customer         │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Chất lượng code là ưu tiên số 1. Kỹ thuật tốt → tốc độ bền vững (sustainable pace). Không có "technical debt hurry" — code sạch bây giờ = nhanh hơn sau này.

---

## 🔑 12 Practices chính — chi tiết

| # | Practice | Mô tả chi tiết | Mechanism |
|---|----------|---------------|-----------|
| 1 | **Planning Game** | Khách hàng chọn feature (giá trị), team ước lượng (effort), ưu tiên theo giá trị/effort ratio | Customer viết story card; team estimate với Planning Poker; priority = value / cost |
| 2 | **Small Releases** | Release thường xuyên, mỗi release nhỏ (có thể vài ngày/lần) | Continuous Deployment; feedback sớm, lỗi nhỏ dễ revert |
| 3 | **Metaphor** | Dùng ẩn dụ chung để team hiểu hệ thống (ví dụ: "system là supermarket") | Shared vocabulary → faster communication, less ambiguity |
| 4 | **Simple Design** | Chỉ làm đủ cho hiện tại, không dự đoán tương lai (YAGNI — You Aren't Gonna Need It) | Avoid over-engineering; refactor when need arises, not before |
| 5 | **Testing (TDD)** | Viết test TRƯỚC code, code chỉ đủ để pass test, sau đó refactor | Test-first design; tests là specification sống; confidence cao khi refactor |
| 6 | **Refactoring** | Cải thiện code liên tục, giữ test xanh, không đổi behavior | Technical debt trả sớm; code luôn readable; fear of changing disappears |
| 7 | **Pair Programming** | 2 người 1 máy: 1 gõ code (Driver), 1 review realtime (Navigator) — đổi vai thường xuyên | Realtime code review; knowledge sharing tự nhiên; bug rate giảm ~15–50% (study bởi Cohen et al.) |
| 8 | **Collective Ownership** | Ai cũng có thể sửa bất kỳ code nào trong codebase | Không có "code sở hữu" → cross-training tự nhiên; bus factor cao |
| 9 | **Continuous Integration** | Tích hợp code nhiều lần/ngày, build + test tự động chạy | Phát hiện integration issue trong phút, không phải ngày |
| 10 | **40-hour Week** | Làm việc bền vững, không overtime kéo dài | Overtime ~2 tuần đầuboost output, nhưng sau đó productivity giảm ~50% và quality suffers |
| 11 | **On-site Customer** | Khách hàng ngồi cùng team, trả lời question ngay, làm clear priority ngay | Giảm communication delay từ ngày → giây; requirement ambiguity giảm |
| 12 | **Coding Standards** | Chuẩn code chung, ai cũng tuân theo → code đọc như viết bởi 1 người | Reduce cognitive load; onboard mới nhanh;集体 ownership khả thi |

**Cơ chế pair programming chi tiết:**

```
Driver (người gõ code):
  - Tập trung vào syntax, implementation chi tiết
  - Viết code thực tế
  - Đổi vai sau mỗi task nhỏ (15–30 phút) hoặc mỗi khi xong feature

Navigator (người quan sát):
  - Nhìn big picture, strategy
  - Tìm bugs, logic errors, style violations ngay lập tức
  - Gợi ý alternatives, ask "why not...?"
  - Đọc story card, ensure alignment with requirement
```

**Lợi ích đo được của Pair Programming (theo nghiên cứu IBM, 2012):**
- Defect density: giảm 15–50% so với solo coding
- Code review time: giảm ~50% (vì đã review realtime qua pair)
- Knowledge spread: giảm bus factor风险 — nhiều người biết nhiều code

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

| Ưu điểm | Giải thích | Dữ liệu/Research |
|---------|------------|------------------|
| 🛡️ **Chất lượng cao** | TDD + Pair + CI bắt lỗi sớm, code sạch | Code with TDD có defect rate thấp hơn 40–80% so với không TDD (Pekka Abrahams study) |
| ⚡ **Phản hồi nhanh** | Test tự động chạy liên tục, biết lỗi ngay | CI pipeline < 5 phút → developer fix bug trong tích tắc |
| 🔄 **Thay đổi an toàn** | Refactor + test xanh → sửa code không sợ vỡ | Codebase có test coverage cao → refactor cost ≈ 0, codebase evolves smoothly |
| 👥 **Chia sẻ kiến thức** | Pair programming lan truyền kỹ năng | Bus factor ↑; new hire learns codebase in days instead of weeks |
| 🚀 **Tốc độ bền vững** | Code sạch → không nợ kỹ thuật → nhanh lâu dài | Long-term velocity không declinewe vì technical debt tích lũy |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giảm thiểu |
|------------|------------|------------|
| 🎓 **Đòi hỏi kỷ luật cao** | TDD/Pair khó duy trì nếu team chưa quen | Start with 1–2 practices (TDD trước, pair sau); coach/senior guide |
| 💰 **Chi phí ban đầu lớn** | Pair programming tốn 2 người/1 task | Pair 2–3 giờ/ngày, không phải 8 giờ; non-pair work (doc, research) still solo |
| 🧩 **Khó áp dụng từng phần** | Practices hỗ trợ nhau, bỏ 1 cái ảnh hưởng cả hệ | Học full XP, không chỉ "lấy vài practice"; hiểu relationship giữa practices |
| 📏 **Không phù hợp mọi dự án** | Dự án ngắn hạn, prototype nhanh không cần | XP最适合 long-lived products; short projects dùng lightweight approach |
| 👤 **Phụ thuộc khách hàng** | On-site customer khó có trong thực tế | Async customer (PO available Slack/email trong 4 giờ) — không lý tưởng nhưng acceptable |
| 🏢 **Cultural resistance** | Management không quen 2 người/1 task → nhìn như "lãng phí" | Show data: pair program reduces rework; net productivity vẫn cao hơn |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Sản phẩm dài hạn, yêu cầu chất lượng cao | ✅ Rất phù hợp | TDD + Pair + Refactor = codebase sạch bền vững; ROI cao sau 6–12 tháng |
| Team có kinh nghiệm, kỷ luật tốt | ✅ Rất phù hợp | XP demands maturity; team đã quen DI/TDD sẽ fit naturally |
| Dự án yêu cầu thay đổi liên tục | ✅ Phù hợp | Simple Design + TDD = thay đổi không sợ; refactoring cost thấp |
| Team mới, chưa quen TDD | ⚠️ Cần đào tạo trước | Ramp-up 2–4 tháng; ban đầu velocity giảm ~30%, sau đó vượt solo |
| Prototype nhanh, throwaway code | ❌ Không cần thiết | XP overhead quá cao cho code sẽ bị delete; dùng ad-hoc approach |
| Dự án ngắn hạn (< 3 tháng) | ❌ Overkill | ROI của XP practices chưa kịp hiện hữu trước khi project end |
| Team distributed (remote, khác múi giờ) | ⚠️ Cần điều chỉnh | Pair async (screen share + remote pair tools); TDD still essential |

> 💡 **Phổ biến thực tế:** Gần như không có team nào dùng XP "nguyên chất". Phổ biến là **Scrum + XP practices** (Scrum management + TDD/Pair/CI). Đây gọi là **Agile+**: framework + technical discipline.

---

## 🔗 Liên quan

- **5.2.1 Scrum** — Bổ sung: Scrum cho quy trình, XP cho kỹ thuật (phiên bản phổ biến nhất)
- **5.2.2 Kanban** — Bổ sung: flow + kỷ luật kỹ thuật
- **5.1 Testing** — TDD, test automation chi tiết (07-testing)
- **08 DevOps / CI-CD** — Continuous Integration (08-devops-cicd)
- **14 Clean Code** — Refactoring, coding standards (14-clean-code)
- **04-paradigms OOP** — Simple Design + Metaphor dựa trên OO thinking

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
- 📖 [XP Installed: Ideas in Practice - Liz Keogh & Ron Jeffries](https://www.xpinstalled.com/)
- 📖 [Pair Programming Productivity - Cohen et al. (2006)](https://www.cc.gatech.edu/fac/Lizy.John.Nahum/papers/pair-programming-study.pdf)

---

## ⏭️ Bài tiếp theo

→ [5.2.4 Lean](../5.2.4-lean/README.md)
