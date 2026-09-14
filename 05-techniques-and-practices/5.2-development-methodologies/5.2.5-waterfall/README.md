# 🌊 5.2.5 Waterfall (Mô Hình Thác Nước)

> Mô hình phát triển phần mềm **tuần tự (sequential)** truyền thống. Mỗi giai đoạn (Requirements, Design, Implementation, Testing, Maintenance) phải hoàn thành 100% trước khi chuyển sang giai đoạn tiếp theo. Dù bị chỉ trích nhiều trong Agile era, Waterfall vẫn phù hợp trong một số ngữ cảnh nhất định.

---

## 🎯 Mô hình này là gì?

Do **Winston W. Royce** giới thiệu năm 1970 trong paper "Managing the Development of Large Software Systems". Luồng công việc chảy xuống một chiều như thác nước, không quay lại giai đoạn trước — **giống dây chuyền lắp ráp**: sản phẩm chỉ hoàn thiện khi đi hết các trạm.

**Royce himself noted** trong paper original rằng model ông mô tả có vấn đề và cần iteration — nhưng idea đã bị hiểu sai thành "strict sequential" version phổ biến ngày nay.

```
┌────────────────────────────────────────────────────────────┐
│                    WATERFALL MODEL                         │
│                                                            │
│  [ Requirements Analysis ]        ← chốt 100% tài liệu     │
│           │                                                │
│           ▼   (gate: BRD đã duyệt?)                         │
│  [ System Design ]                ← kiến trúc, ERD, ...    │
│           │                                                │
│           ▼   (gate: Design doc OK?)                        │
│  [ Implementation ]               ← code theo design       │
│           │                                                │
│           ▼   (gate: unit test xong?)                       │
│  [ Testing & Integration ]        ← QA, system test        │
│           │                                                │
│           ▼   (gate: test pass?)                            │
│  [ Deployment & Maintenance ]     ← bàn giao vận hành      │
│                                                            │
│  ← Một chiều, không có vòng lặp ←                          │
└────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Mỗi phase có **gate check** — output phase trước là input duy nhất của phase sau. Không có vòng lặp, không demo giữa chừng cho khách hàng. Gate check là "approval checkpoint" bắt buộc trước khi chuyển phase.

---

## 🧩 Các giai đoạn (Phases) — chi tiết

| Giai đoạn | Output chính | Gate check đi tiếp | Chi phí rework nếu phát hiện lỗi ở phase sau |
|-----------|--------------|--------------------|---------------------------------------------|
| **Requirements** | BRD/PRD (đặc tả yêu cầu chi tiết), SRS document | Khách hàng duyệt tài liệu | Nếu sai: fix BRD = rẻ; nếu phát hiện sau coding = rất đắt |
| **Design** | Bản kiến trúc, thiết kế DB, ERD, UI mockups, API spec | Review thiết kế đạt chuẩn | Design fix sau coding: ~10x cost so với fix in design phase |
| **Implementation** | Code hoàn chỉnh module, unit tests | Unit test cơ bản pass, code review | Bug trong code: ~1x base cost nếu phát hiện sớm |
| **Testing & Integration** | Báo cáo test (system test, regression), bug list | Bug threshold đạt (ví dụ: < 5 critical bugs) | Bug phát hiện late: ~30–100x cost so với unit test phase |
| **Deployment & Maintenance** | Hệ thống vận hành, documentation, training | Go-live approved, SLA agreed | Post-deploy bug: ~100x+ cost; reputation damage unquantifiable |

**Tại sao rework cost tăng theo phase?** Mỗi phase sau càng xa source của bug → càng nhiều component bị ảnh hưởng → càng nhiều thứ phải sửa lại.

**Hệ quả quan trọng:** Thay đổi yêu cầu giữa chừng = **rework toàn chuỗi**. Muốn sửa 1 tính năng sau khi code xong → quay lại Requirements, sửa tài liệu, sửa design, sửa code, chạy test lại toàn bộ. Chi phí có thể tăng **10–100x** so với sửa ngay từ Requirements.

---

## 🖼️ Minh họa demo code

Ví dụ [`examples/index.ts`](examples/index.ts) mô phỏng **5 phase tuần tự + gate check**:

```
Run các phase thành công:
  Requirements → Design → Implementation → Testing → Deployment
  mỗi bước: ✅ GATE CHECK PASS → bàn giao tài liệu cho phase kế

Mô phỏng "khách đổi yêu cầu trước Deployment":
  🌀 phải quay lại Requirements → ... → Deployment
  💥 chi phí rework toàn bộ chuỗi
```

- `WaterfallPhase` mô phỏng một giai đoạn với **gate check** (kiểm tra input hợp lệ)
- `WaterfallProject` chạy tuần tự qua từng phase; throw nếu gate không đạt
- Mô phỏng kịch bản **late requirement change** và cái giá phải trả

> 💡 Code mô phỏng quy trình, không phải ứng dụng thật. Chạy để thấy cả 2 kịch bản (thành công + đổi yêu cầu).

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Thực tế áp dụng |
|---------|------------|-----------------|
| 📅 **Dễ quản lý & lập kế hoạch** | Mỗi phase có milestone rõ ràng, dễ đưa vào Gantt chart | Dễ báo cáo tiến độ cho management; contract milestones rõ ràng |
| 📚 **Tài liệu đầy đủ** | BRD, Design doc đều cố định từ đầu → dễ bàn giao/audit | Regulatory industries (y tế, tài chính) bắt buộc documentation traceability |
| 💰 **Ước lượng ngân sách cố định** | Scope chốt trước → hợp đồng, chi phí rõ ràng | Fixed-price contracts dễ định giá; client biết trước budget |
| 🏛️ **Phù hợp quy chuẩn ngặt** | Ngành y tế/hàng không đòi hỏi traceability nghiêm ngặt | ISO 13485 (medical devices), DO-178C (avionics) yêu cầu documentation-driven process |
| 👥 **Áp dụng được cho team thiếu kinh nghiệm** | Quy trình bước nhỏ, ít đòi hỏi tự chủ | Junior dev hiểu rõ "làm gì tiếp theo" — không cần quyết định nhiều |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Hậu quả thực tế |
|------------|------------|-----------------|
| 🔄 **Khó thay đổi yêu cầu** | Sửa giữa chừng = rework toàn chuỗi, tốn kém | Late requirement change cost 10–100x earlier; thường dẫn đến "scope creep" bị giấu kín |
| 🐛 **Phát hiện lỗi muộn** | Bug kiến trúc chỉ lộ ở Testing (tận cuối) | Architectural flaw found in UAT = project-threatening; may require redesign |
| 🙈 **Khách thấy sản phẩm quá muộn** | Không demo giữa chừng → rủi ro hiểu sai yêu cầu | Client sees product only at Deployment → "this is not what I wanted" surprise |
| ⏳ **Sản phẩm ra chậm** | Phải chờ "100%" phase mới sang phase kế | Time-to-market dài; competitor có thể launch trước |
| 📉 **Khó ước lượng chính xác** | Estimate ở phase Requirements thường sai ±50% | Fixed-price contract với underestimate = project loss |
| 🧱 **Không phản ánh real software work** | Software là exploratory, không phải construction | "Writing code is thinking" — cannot fully design before building |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Dự án y tế, hàng không, tài chính có quy chuẩn khắt khe | ✅ Rất phù hợp | Regulatory requirement demands documentation traceability; Waterfall provides structured audit trail |
| Yêu cầu cực kỳ rõ ràng, công nghệ quen thuộc, ít thay đổi | ✅ Phù hợp | Low uncertainty = low risk of late changes; Waterfall prediction works well |
| Dự án cố định scope & ngân sách, hợp đồng chặt | ✅ Phù hợp | Fixed-price contract requires fixed scope; Waterfall aligns with contract milestones |
| Dự án government/defense procurement | ✅ Phù hợp | RFP (Request for Proposal) process demands detailed specification before bidding |
| Yêu cầu có khả năng thay đổi, khách chưa rõ mình muốn gì | ❌ Dùng Agile (Scrum/XP) | Requirement uncertainty = Waterfall will fail; iteration needed to discover true needs |
| Sản phẩm mới, công nghệ mới nhiều rủi ro | ❌ Dùng Spiral | High technical risk requires prototype/iteration; Waterfall cannot absorb uncertainty |
| Startup, product-market fit đang tìm kiếm | ❌ Dùng Scrum/Kanban | Unknown domain = rapid iteration essential; Waterfall is too slow for discovery |

---

## 🔗 Liên quan

- **5.2.11 Spiral** — "Waterfall + vòng lặp + Risk Analysis" để khắc phục nhược điểm
- **5.2.12 RAD** — "Waterfall cải tiến" với prototype nhanh trước khi build
- **5.2.1 Scrum** — Đối lập: iterative, phản hồi liên tục thay vì tuần tự
- **5.2.4 Lean** — Waterfall là ví dụ điển hình của waste "chờ đợi & chuyển giao"

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.5-waterfall/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng 5 phase + gate check
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.5-waterfall
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Waterfall Model - Wikipedia](https://en.wikipedia.org/wiki/Waterfall_model)
- 📖 [Managing the Development of Large Software Systems - Winston Royce (1970)](https://www.scrumhalf.com/wp-content/uploads/2019/02/royce1970.pdf) — original paper, note: Royce advocated iterative approach!
- 📖 [The Waterfall Model - Gartner](https://www.gartner.com/en/information-technology/glossary/waterfall-model)

---

## ⏭️ Bài tiếp theo

→ [5.2.6 SAFe](../5.2.6-safe/README.md)
