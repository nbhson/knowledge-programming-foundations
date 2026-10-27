# ⏱️ 5.2.10 Dynamic Systems Development Method (DSDM)

> Tiền thân của Agile (ra đời 1994). Tối ưu hóa cho **bàn giao đúng hạn và đúng ngân sách** bằng cách cố định Thời gian & Chi phí, chỉ biến đổi Scope (MoSCoW prioritization). Được phát triển bởi **DSDM Consortium** (Anh), trước cả Agile Manifesto 7 năm.

---

## 🎯 Framework này là gì?

Hầu hết framework Agile giữ nguyên **scope** và nới **schedule** khi trễ (Scrum: sprint goal fixed, scope adjustable). DSDM làm ngược lại: **Thời gian và Chi phí là cố định**; cái biến đổi là **Scope**. Muốn vậy, DSDM ép mọi thứ vào **timebox** và dùng ưu tiên **MoSCoW** để cắt phần nào khi không đủ thời gian.

**8Nguyên tắc cốt lõi (8 Principles) của DSDM:**

1. **Focus on the business need** — every project must deliver business value
2. **Deliver on time** — time is fixed; scope adapts
3. **Collaborate** — user involvement throughout
4. **Never compromise quality** — quality is non-negotiable
5. **Build incrementally from firm foundations** — iterative development
6. **Demonstrate core functionality early** — early value delivery
7. **Iterative and incremental development** — continuous refinement
8. **Clarify requirements at all levels** — from strategy to detail

```
┌──────────────────────────────────────────────────────────────────┐
│            DSDM — TIMEBOX + MoSCoW (duy nhất một biến)           │
│                                                                  │
│   CỐ ĐỊNH (không đổi):      Thời gian │ Chi phí │ Chất lượng     │
│   BIẾN THIÊN:               Scope (cắt theo MoSCoW)              │
│                                                                  │
│   Must have  ──▶ Bắt buộc xong (dự án thất bại nếu thiếu)        │
│   Should have──▶ Nên có nếu có thể                               │
│   Could have ──▶ Có thì tốt, không có cũng OK                    │
│   Won't have ──▶ Chưa làm lần này (thương lượng, đẩy tương lai)  │
└──────────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Timebox là đơn vị kế hoạch nhỏ nhất — mỗi timebox có deadline cố định, không nới. Nếu không đủ time → cắt feature (theo MoSCoW), không gia hạn.

---

## 🧩 4 Level của DSDM

| Level | Purpose | Duration | Example |
|-------|---------|----------|---------|
| **Strategic Planning** | Align projects with business strategy | Months | Annual portfolio planning |
| **Pre-Project** | Feasibility & initiation | Days–weeks | Business case, project initiation document |
| **Project Lifecycle** | Actual delivery | Weeks–months | Multiple timeboxes, each delivering increment |
| **Post-Project** | Benefits realization & closure | Days–weeks | Review, handover, lessons learned |

**5 Phase trong Project Lifecycle:**

| Giai đoạn | Mục đích | Đầu ra |
|-----------|----------|--------|
| **Feasibility** | Xác định có khả thi không (rất ngắn) | Feasibility study — go/no-go decision |
| **Business Study** | Khảo sát nghiệp vụ, mô hình hóa business area | Business case updated; requirements baseline |
| **Functional Model Iteration** | Prototype chức năng + phản hồi liên tục | Functional model (subset of final system) |
| **Design & Build Iteration** | Tinh chỉnh prototype thành hệ thống thật | Complete system, tested and ready |
| **Implementation** | Chuyển giao, train, đi vào vận hành | System in production; benefits realized |

> 💡 Trong mỗi timebox chỉ có một phần nhỏ scope, chạy đủ vòng: plan → build → review → (mở rộng/thu hẹp scope cho timebox sau).

---

## 🖼️ Minh họa demo code

Ví dụ [`examples/index.ts`](examples/index.ts) mô phỏng **1 timebox cố định + MoSCoW**:

```
Timebox "Release 1 — 2 tuần" (năng lực 10 effort)
  I. Login              [Must have]    (4)   ✅
  II. Trang chủ sản phẩm[Must have]    (3)   ✅
  III. Giỏ hàng cơ bản  [Should have]  (3)   ✅
  IV. Thanh toán online [Should have]  (5)   ⚠️ cắt vì hết ngân sách
  V. Chat hỗ trợ        [Could have]   (2)   ❌ cắt
  VI. App iOS riêng      [Won't have]  (20)  ✖ loại khỏi đợt này
```

- `DsdmTimebox.commit()` xếp theo MoSCoW, đóng gói theo `maxEffort`
- Khi vượt năng lực → cắt "Could/Should" và bảo vệ "Must have"
- `describe()` in trạng thái từng feature (✅/❌/✖)

> 💡 Code mô phỏng quy trình, không phải ứng dụng thật. Chạy để thấy "cố định time, biến thiên scope".

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Thực tế |
|---------|------------|---------|
| ⏰ **Bàn giao đúng hạn** | Timebox cố định → cam kết ngày thật sự | Client biết exact delivery date; no "we'll deliver next quarter" surprises |
| 💰 **Kiểm soát ngân sách** | Chi phí cố định, không "vỡ quỹ" | Fixed-price contracts work; budget predictable |
| 🎯 **Business value là trên hết** | Must have luôn được bảo vệ → giá trị cốt lõi chắc chắn về | Prioritization ensures most valuable features ship first |
| 🔄 **Prototype + user tham gia sâu** | Phản hồi liên tục, ít hiểu lầm yêu cầu | User sees working system early; requirement mismatch caught fast |
| 🧠 **Tiền thân Agile kinh điển** | Nhiều nguyên tắc đã ảnh hưởng Agile Manifesto | Historical significance; foundation for modern Agile |
| 📊 **Explicit scope management** | MoSCoW makes trade-offs visible | Stakeholders understand "why X wasn't built" — it was "Could have" |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giảm thiểu |
|------------|------------|------------|
| 📊 **Nặng về quản trị** | Nhiều phase & quy trình (feasibility report, ...) | Keep feasibility/Business Study lightweight; don't over-document |
| 🧩 **MoSCoW có thể bị lạm dụng** | "Mọi thứ đều Must have" → mất ý nghĩa | PM/DSDM Consultant enforce honest MoSCoW; challenge "Must" claims |
| 🐢 **Ít phổ biến hiện nay** | Chủ yếu ở Anh/Châu Âu; ít tài liệu mới | Use DSDM principles (timeboxing + MoSCoW) even if not full framework |
| 🧭 **Scope dễ "teo"** | Nếu planning kém, phần Should/Could bị bỏ nhiều | Protect "Must have"; communicate scope cuts early to stakeholders |
| 🤝 **Đòi hỏi cam kết user mạnh** | Người dùng phải tham gia liên tục, nhiều tổ chức không sắp xếp nổi | Executive sponsorship essential; schedule user availability upfront |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Deadline & ngân sách **cứng** (hợp đồng) | ✅ Rất phù hợp | DSDM's core strength: fixed time+cost, variable scope |
| Khách hàng cần đúng hạn hơn là đủ tính năng | ✅ Rất phù hợp | "On time, on budget" > "everything built" philosophy |
| Người dùng/business sẵn sàng tham gia sâu | ✅ Phù hợp | DSDM requires active user involvement throughout |
| Yêu cầu số lượng "must" quá lớn | ⚠️ Khó — nên chia nhỏ release | If everything is "Must have", MoSCoW loses meaning; split into multiple timeboxes |
| Team đã quen Scrum, muốn tối giản | ❌ Cân nhắc Scrum/Kanban | DSDM has more process overhead than Scrum; may not worth switching |
| Dự án research/innovation, scope chưa rõ | ❌ Không phù hợp | DSDM requires clarified requirements; use Spiral or Crystal instead |

> 💡 **Thực tế hiện đại:** Nhiều team không dùng DSDM "nguyên chất" mà chỉ áp dụng **2 nguyên tắc then chốt**: **Timeboxing** (deadline cứng cho mỗi iteration) + **MoSCoW prioritization** (phân loại Must/Should/Could/Won't). Đây là pattern phổ biến trong enterprise Agile.

---

## 🔗 Liên quan

- **5.2.1 Scrum** — DSDM đi trước & có nhiều ý tưởng chung (iteration, backlog-like priorities)
- **5.2.12 RAD** — Cùng triết lý prototype nhanh + user feedback
- **5.2.8 Crystal** — Cùng tư tưởng "fit-to-purpose", tập trung con người
- **5.2.11 Spiral** — DSDM (giống Spiral) đều "iterate & revisit"

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.10-dsdm/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng timebox + MoSCoW
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.10-dsdm
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Agile Business Consortium — DSDM](https://www.agilebusiness.org/dsdm-framework.html)
- 📖 [DSDM Atern - Wikipedia](https://en.wikipedia.org/wiki/Dynamic_systems_development_method)
- 📖 [MoSCoW method - Wikipedia](https://en.wikipedia.org/wiki/MoSCoW_method)
- 📖 [Agile Business Consortium](https://www.agilebusiness.org/) — primary source for DSDM materials

---

## ⏭️ Bài tiếp theo

→ [5.2.11 Spiral](../5.2.11-spiral/README.md)
