# 🍃 5.2.4 Lean Software Development

> Xuất phát từ **Toyota Production System (TPS)**, áp dụng vào phần mềm bởi Mary & Tom Poppendieck (2003). Tập trung **loại bỏ lãng phí (waste)**, tối ưu hóa toàn bộ chuỗi giá trị (value stream), và mang lại giá trị cho khách hàng nhanh nhất có thể.

---

## 🎯 Mô hình là gì?

Lean không quy định role hay ceremony cụ thể như Scrum. Nó là **tập hợp 7 nguyên tắc** định hướng cách làm việc để giảm thiểu lãng phí và tối ưu hiệu suất — áp dụng được cho mọi quy trình (Dev, Ops, thậm chí cả quản lý dự án).

**Nguồn gốc:** Toyota phát triển TPS trong 1950–1970s để cạnh tranh với Ford. Ý tưởng then chốt: **mọi hoạt động không thêm giá trị cho khách hàng đều là waste** — và waste phải bị systematically eliminate.

```
┌──────────────────────────────────────────────────────────────────┐
│                  LEAN — TỐI ƯU CHUỖI GIÁ TRỊ                     │
│                                                                  │
│   Idea → Value Stream → Giá trị giao đến khách hàng             │
│              │                                                   │
│              ├── Liên tục loại bỏ WASTE ở từng bước             │
│              └── Chất lượng (quality) nhúng vào quy trình        │
│                                                                  │
│   WASTE (Muda): chờ đợi, chuyển giao, defect, WIP cao,          │
│                 feature thừa, relearning, task switching         │
└──────────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Nhìn toàn **value stream** (từ ý tưởng → deploy), không chỉ nhìn team — và hỏi câu "bước nào KHÔNG tạo giá trị cho khách hàng?" để cắt.

---

## 🧩 7 Nguyên tắc Lean (Poppendieck)

| # | Nguyên tắc | Ý nghĩa khi áp dụng | Hành động cụ thể |
|---|------------|---------------------|------------------|
| 1 | **Eliminate Waste** (Xóa bỏ lãng phí) | Cắt mọi thứ khách không trả tiền | Audit value stream; eliminate manual handoffs, waiting, unused features |
| 2 | **Build Quality In** (Chất lượng nhúng) | Chất lượng làm ngay từ code, không chờ QA ở cuối | TDD, CI, automated testing, code review — chất lượng là responsibility của developer |
| 3 | **Create Knowledge** (Tạo tri thức) | Doc, pair programming, chia sẻ → không "quên để học lại" | Wiki nội bộ, pair programming, knowledge-sharing sessions, documentation as code |
| 4 | **Defer Commitment** (Trì hoãn quyết định) | Quyết định quan trọng càng trễ càng tốt, khi có đủ thông tin | Không quyết định architecture early; dùng spike/protype để gather information trước khi commit |
| 5 | **Deliver Fast** (Giao nhanh) | Batch nhỏ, CI/CD, vòng lặp ngắn | Small batch size (< 1 day work); deploy frequently (daily/weekly); feedback loop ngắn |
| 6 | **Respect People** (Tôn trọng con người) | Trao quyền cho team, không quản lý vi mô | Self-organizing teams; trust developers to make technical decisions; remove.cmd control |
| 7 | **Optimize the Whole** (Tối ưu toàn hệ thống) | Không tối ưu cục bộ — tối ưu cả luồng | Don't optimize 1 team's throughput if it creates bottleneck elsewhere; look at system-level flow |

---

## 🚫 7 Lãng phí trong phần mềm (Software Wastes)

| Lãng phí | Mô tả | Giải pháp Lean | Tác động nếu không xử lý |
|----------|-------|----------------|------------------------|
| **Partially Done Work** | Code viết xong chưa test, chưa deploy | Giảm WIP, CI/CD, Definition of Done | Inventory chất đống = work-in-progress cost; không có business value until shipped |
| **Extra Features** | Tính năng khách không dùng (YAGNI) | MoSCoW prioritization; talk to users | Waste of dev time; code complexity tăng → maintenance cost tăng |
| **Relearning** | Quên kiến thức, giải quyết lại vấn đề cũ | Pair programming, docs as code | Same bug fix 3 lần = 3x cost; knowledge silos = single point of failure |
| **Handoffs** | Chuyển giao giữa các khâu/team gây mất ngữ cảnh | Cross-functional team, dev owns test | Context switch cost: ~23 phút/recovery; error rate tăng ~30% per handoff |
| **Delays** | Chờ đợi quyết định, chờ review, chờ deploy | Tự động hóa, trao quyền, limit WIP | Queue time >> processing time; overall lead time 10x longer than needed |
| **Task Switching** | Chuyển đổi công ngữ cảnh liên tục | Limit WIP, single-piece flow | Mỗi switch cost ~15–30 phút tái-focus; productivity giảm 40% với nhiều context |
| **Defects** | Lỗi phải sửa lại | TDD, automated testing, CI | Bug fix cost 100x more in production vs. unit test; reputation damage |

> 💡 **Quy tắc vàng Lean:** Nếu một bước không tạo ra giá trị mà khách hàng sẵn sàng trả tiền → nó là **waste**. Nếu không thể xóa, hãy **tối thiểu hóa** nó.

**Phân loại waste (dựa trên TPS):**
- **Muda** (waste): 7 loại trên
- **Mura** (unevenness): workload fluctuation → overwork/burnout hoặc idle thời gian
- **Muri** (overburden): ép team làm quá sức → quality giảm, attrition tăng

Lean address cả 3: Muda qua elimination, Mura qua leveling (heijunka), Muri qua sustainable pace.

---

## 🖼️ Minh họa demo code

Ví dụ [`examples/index.ts`](examples/index.ts) mô phỏng **1 value stream** (code → review → test → deploy) trước/sau khi áp dụng Lean:

```
❌ TRƯỚC Lean                    ✅ SAU Lean
Code  (4 useful + 2 waste)       Code + test tự động (4 useful + 0 waste)
Chờ review  (0 + 3 waste)        CI/CD deploy (2 useful + 0 waste)
Handoff QA  (0 + 2 waste)        Automated review (1 useful + 0 waste)
Test thủ công (2 + 3 waste)
Chờ deploy   (0 + 3 waste)
Sửa defect   (2 + 4 waste)
─────────────────────────────    ──────────────────────────────
Hiệu quả giá trị: thấp            Hiệu quả giá trị: cao (100%)
```

- `LeanPipeline` đo **useful time** vs **waste time** theo từng bước
- So sánh tỉ lệ giá trị `ratio = useful / (useful + waste)` trước và sau
- Minh họa cách **Eliminate Waste**, **Build Quality In**, **Deliver Fast** cải thiện hiệu quả

> 💡 Code mô phỏng quy trình, không phải ứng dụng thật. Chạy để thấy con số "trước vs sau" Lean.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Thực tế đo được |
|---------|------------|-----------------|
| 💰 **Tối ưu chi phí & thời gian** | Cắt waste → làm việc ít hơn nhưng ra giá trị nhiều hơn | Companies adopting lean see 30–50% reduction in lead time (ASME study) |
| 🎯 **Tập trung giá trị thật** | Mọi thứ đều gắn với giá trị khách hàng | Feature waste giảm ~60%; ROI per feature tăng rõ rệt |
| 🌱 **Văn hóa cải tiến bền vững** | Không phải 1 dự án — là cách làm việc dài hạn | Kaizen culture: mỗi team continuous improvement every day |
| 🔄 **Flow liên tục** | Giảm WIP, tăng tốc độ giao hàng | Throughput tăng 2–3x sau 6 months của Lean transformation |
| 🧠 **Tôn trọng con người** | Trao quyền, giảm chán nản, tăng ownership | Employee engagement tăng khi team có autonomy (Gallup study: +19% productivity) |
| 🛡️ **Giảm risk** | Small batches = smaller blast radius per deploy | Rollback easier; incident frequency giảm nhờ quality-in |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giảm thiểu |
|------------|------------|------------|
| 🤔 **Trừu tượng** | Không có "làm thế nào" cụ thể như Scrum — dễ hiểu sai | Pair Lean với Scrum/Kanban; Lean as philosophy, framework as container |
| 🧩 **Cần tư duy hệ thống** | Tối ưu toàn hệ thống đòi hỏi hiểu biết lớn | Value Stream Mapping workshops với cross-functional team |
| 📏 **Khó đo lường ban đầu** | Chưa có mét ric trung gian, khó báo cáo tiến độ | Start với 2–3 metrics đơn giản: Lead Time, Throughput, Defect Rate |
| 🏛️ **Cần văn hóa tổ chức mạnh** | Nếu management theo kiểu quản lý vi mô, Lean khó sống | Leadership training; demonstrate Lean benefits with pilot team first |
| 🔄 **Khó áp dụng cho R&D thuần túy** | Research projects không có "customer value" rõ ràng | Adapt: customer = internal stakeholders; value = knowledge gained |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Quy trình nhiều waste (chờ đợi, chuyển giao nhiều) | ✅ Rất phù hợp | Lean's primary weapon is waste elimination; direct fit |
| Team muốn cải tiến văn hóa lâu dài | ✅ Phù hợp | Lean builds culture, not just process — compounding benefits over time |
| Muốn áp dụng TƯ TƯỞNG bao trùm hơn là 1 framework | ✅ Dùng Lean làm nền tảng | Lean = mindset; can layer Scrum/Kanban on top |
| Cần quy trình chi tiết, từng bước rõ ràng | ⚠️ Cần kết hợp Scrum/Kanban | Lean tells you WHAT to optimize, not HOW to organize daily work |
| Đo lường tiến độ theo sprint/story point | ⚠️ Lean không quy định metric đó | Lean dùng Lead Time, Throughput — thay vì story points |
| Dự án research/innovation thuần túy | ⚠️ Cần adapt | Lean's "value" definition needs extension for knowledge work |

> 💡 **Lean thường được dùng cùng** với Kanban (flow) hoặc Scrum (ceremony) — Lean là "triết lý", không phải "quy trình đóng khung". Nhiều team thành công: **Lean mindset + Scrum structure + XP technical practices**.

---

## 🔗 Liên quan

- **5.2.1 Scrum** — Vay cấu trúc sprint nhưng thêm tư tưởng Loại bỏ waste
- **5.2.2 Kanban** — Flow liên tục + WIP limit là ứng dụng trực tiếp của Lean
- **5.2.3 XP** — Kỹ thuật "Build Quality In": TDD, CI, Pair Programming
- **5.2.6 SAFe** — SAFe tuyên bố kết hợp Lean + Agile + DevOps ở quy mô lớn
- **5.1 Testing** — Automated testing là công cụ chống waste "Defects"
- **08 DevOps** — CI/CD là công cụ thực thi "Deliver Fast"

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.4-lean/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng value stream trước/sau Lean
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.4-lean
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Lean Software Development - Mary & Tom Poppendieck](https://en.wikipedia.org/wiki/Lean_software_development)
- 📖 [Toyota Production System (Wikipedia)](https://en.wikipedia.org/wiki/Toyota_Production_System)
- 📖 [7 Wastes of Software Development (The Lean Way)](https://theleanway.net/The-8-Wastes-of-Lean)
- 📖 [Lean Thinking — Womack & Jones](https://www.amazon.com/Lean-Thinking-Memories-Better-Way/dp/0743243657)
- 📖 [The Lean Software Development Guide](https://www.lean.org/lexicon.cfm)

---

## ⏭️ Bài tiếp theo

→ [5.2.5 Waterfall](../5.2.5-waterfall/README.md)
