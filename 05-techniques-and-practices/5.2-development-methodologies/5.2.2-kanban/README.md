# 📋 5.2.2 Kanban

> Tối ưu **flow liên tục** — kéo công việc khi có capacity, giới hạn WIP, không sprint cố định. Xuất phát từ hệ thống sản xuất Toyota (1940s), áp dụng cho phần mềm bởi David Anderson (2009). Mục tiêu: giảm **Cycle Time** — thời gian từ khi bắt đầu đến khi giao hàng.

---

## 🎯 Phương pháp này là gì?

Kanban quản lý công việc qua **bảng trực quan** với các cột trạng thái. Công việc **kéo** (pull) qua bảng — không **đẩy** (push) như mô hình sản xuất hàng loạt. Khác với Scrum: không có sprint, không ước lượng story point, không cố định vai trò.

**Triết lý cốt lõi:** bắt đầu với quy trình hiện tại, tôn trọng quy trình hiện tại, nhưng **dần dần cải tiến** (change through evolution, not revolution).

```
┌────────────────────────────────────────────────────────────┐
│                        KANBAN BOARD                        │
│                                                            │
│  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌────────┐  │
│  │  To Do   │→ │ In Progress  │→ │ Review  │→ │  Done  │  │
│  │          │  │  (WIP: 3)    │  │(WIP: 2) │  │        │  │
│  │  A       │  │  B          │  │  D      │  │  E     │  │
│  │  C       │  │  C          │  │         │  │  F     │  │
│  └──────────┘  └──────────────┘  └─────────┘  └────────┘  │
│                                                            │
│  Nguyên tắc: KHÔNG thêm vào In Progress nếu đã đạt WIP     │
│              → phải kéo 1 item về Done trước               │
└────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Không có sprint, không ước lượng điểm. Chỉ có flow, WIP limit, và cải tiến liên tục. WIP limit là cơ chế **tự động ưu tiên** — khi In Progress đầy, team phải hoàn thành việc cũ trước khi nhận việc mới.

---

## 🔑 6 Nguyên tắc Kanban (David Anderson)

| # | Nguyên tắc | Mô tả | Hành động cụ thể |
|---|-----------|-------|------------------|
| 1 | **Visualize work** | Vẽ toàn bộ công việc lên bảng, ai cũng thấy | Board vật lý hoặc digital (Jira, Trello, Kanbanize); mỗi item = 1 card |
| 2 | **Limit WIP (Work In Progress)** | Giới hạn số việc đang làm dở — chống multitasking | Đặt WIP limit cho mỗi cột; nếu đã đạt limit → không pull thêm |
| 3 | **Manage flow** | Theo dõi cycle time, tìm bottleneck, tối ưu | Đo thời gian mỗi item nằm ở mỗi cột; highlight cột bị nghẽn |
| 4 | **Explicit policies** | Quy tắc rõ ràng: khi nào "Done", ai review, ... | Viết policy lên board: "Code review max 24h", "Test coverage > 80%" |
| 5 | **Feedback loops** | Standup, review board, cải tiến định kỳ | Daily kanban meeting (10 phút), weekly service delivery review |
| 6 | **Improve collaboratively** | Dùng data (CFD, cycle time) để cải tiến, không đổ lỗi | Mỗi tuần: "Bottleneck tuần này là Review cột, nguyên nhân là 1 người review tất cả" |

---

## 📊 Metrics chính — Data-driven improvement

| Metric | Công thức | Ý nghĩa | Benchmark healthy |
|--------|-----------|---------|-------------------|
| **WIP** | Số item trong cột "In Progress" | Multitasking indicator |越低越好 — WIP cao = context switching nhiều |
| **Cycle Time** | Thời gian từ `Started` → `Done` (ngày) | Tốc độ giao hàng | Giảm dần qua các tuần; median < 5 ngày là tốt |
| **Lead Time** | Thời gian từ `Requested` → `Done` | Customer-perceived speed | Bao gồm cả thời gian chờ trong backlog |
| **Throughput** | Số item hoàn thành / tuần |产能 | Stabilize rồi tăng dần, không boost cưỡng ép |
| **CFD** (Cumulative Flow Diagram) | Area between cumulative curves per column | Flow health overview | Bands should be horizontal (stable width = stable WIP) |
| **Work Age** | Days an item has been in current column | Stale work identification | Flag items > 2× median cycle time |

**CFD interpretation:**
- Band **mở rộng** (widening) = WIP đang tăng → bottleneck
- Band **thu hẹp** (narrowing) = flow đang cải thiện
- Band **ngang** (horizontal) = steady state, stable throughput

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô phỏng **Kanban board với WIP limit**:

```
┌─────────────────────────────────────────────────────────────┐
│                 KANBAN BOARD SIMULATION                     │
│                                                             │
│  Backlog:  [Fix bug, Add feature, Write doc, Refactor, ...] │
│       │  Pull (theo WIP limit)                              │
│       ▼                                                     │
│  In Progress (WIP: 3) → Review (WIP: 2) → Done              │
│                                                             │
│  Engine: khi Done 1 item → tự kéo item mới vào              │
└─────────────────────────────────────────────────────────────┘
```

- **KanbanBoard:** bảng với các cột + WIP limit
- **pull():** chỉ thêm item khi WIP chưa đạt giới hạn
- **Metrics:** cycle time, throughput cho từng item

> 💡 Code mô phỏng cơ chế pull + WIP limit. Chạy để thấy cách Kanban ngăn quá tải.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Thực tế đo được |
|---------|------------|-----------------|
| 🔄 **Linh hoạt tuyệt đối** | Thêm/bớt ưu tiên bất kỳ lúc nào, không cần chờ sprint | Lead time giảm ~30–50% sau 2–3 tháng áp dụng Kanban (theo Kniberg & Björk, 2012) |
| 📅 **Ít ceremony** | Chỉ cần bảng + standup ngắn, không planning/review/retro | Tiết kiệm ~4–6 giờ/tuần so với Scrum |
| 📊 **Cải tiến flow** | WIP limit + metrics giúp phát hiện bottleneck nhanh | CFD cho thấy bottleneck trực quan — corrective action trong tuần sau |
| 🚀 **Người mới dễ bắt đầu** | Không cần thay đổi quy trình hiện tại — bắt đầu từ hiện trạng | "Start where you are" principle — low resistance to adoption |
| 🎯 **Giảm multitasking** | WIP limit ép team tập trung, ít chuyển đổi ngữ cảnh | Context switch cost ~23 phút để tái-focus (UC Irvine study) → WIP limit saves ~2 giờ/ngày |
| 🔍 **Transparent** | Bất kỳ ai cũng thấy work-in-flight, bottleneck, blocker | Stakeholder không cần hỏi "tiến độ thế nào?" — nhìn board là biết |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giảm thiểu |
|------------|------------|------------|
| ⏰ **Không deadline cố định** | Không có sprint → khó cam kết ngày giao cụ thể | Dùng Lead Time distribution để probabilistic forecasting ("85% chance done within 10 days") |
| 📏 **Khó ước lượng dài hạn** | Không dùng story points, khó dự đoán roadmap | Cumulative Flow Diagram + throughput trend = better prediction than guessing |
| 🧭 **Thiếu cấu trúc** | Team thiếu kỷ luật dễ trôi dạt, không cải tiến | Enforce WIP limit nghiêm; schedule weekly improvement meeting |
| 📉 **Phụ thuộc metrics** | Đo sai metric → tối ưu sai chỗ | Focus trên **customer value throughput**, không phải "number of items done" |
| 👤 **Cần văn hóa dữ liệu** | Cải tiến dựa trên số liệu, không phải cảm tính | Train team đọc CFD; bắt đầu với 1–2 metric quan trọng nhất |
| 🏗️ **Không có role clarity** | Không có PO/SM định sẵn → có thể confusion | Assign PO role explicitly; rotate SM function nếu cần |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Hỗ trợ vận hành liên tục (support, incident, hotfix) | ✅ Rất phù hợp | Work đến không đoán trước được; Kanban pull-based最适合 reactive flow |
| Team maintenance, bugfix, công việc không đoán trước | ✅ Rất phù hợp | Không có sprint cố định → work item đến khi nào xử lý khi đó |
| Team mới chuyển từ quy trình cũ, cần thay đổi nhẹ nhàng | ✅ Phù hợp | "Start where you are" — không disrupt current process, chỉ visualize + limit WIP |
| Cần cam kết ngày giao cụ thể cho khách hàng | ⚠️ Cần probability forecasting | Dùng historical Lead Time để tính P85/P90 delivery date, thay vì sprint commitment |
| Team mới, chưa có kỷ luật quy trình | ⚠️ Cần kết hợp Scrum/XP | Kanban cần self-discipline; team chưa熟了 có thể bỏ WIP limit |
| Dự án có deadline cứng, scope rõ | ❌ Cân nhắc Scrum | Deadline hard = cần sprint commitment; Scrum có cadence rõ hơn |
| Sản phẩm mới, requirement đang hình thành | ❌ Cân nhắc Scrum/XP | Requirement unclear = cần iteration ngắn + stakeholder feedback (Scrum更好) |

> 💡 **Scrumban** — kết hợp Scrum + Kanban: giữ sprint ngắn (2 tuần) nhưng dùng board + WIP limit thay vì cam kết cứng nhắc. Phổ biến trong các team muốn **linh hoạt hơn Scrum** nhưng **cấu trúc hơn Kanban thuần**.

---

## 🔗 Liên quan

- **5.2.1 Scrum** — Đối lập: sprint cố định, ceremony đầy đủ
- **5.2.4 Lean** — Nền tảng triết lý: loại bỏ lãng phí, tối ưu flow
- **5.2.3 XP** — Bổ sung: kỷ luật kỹ thuật cho chất lượng
- **5.1 Testing** — Test automation giúp throughput tăng mà không tăng WIP
- **5.6 Error Handling** — Incident tracking flow fits Kanban perfectly

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.2-kanban/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng Kanban board + WIP limit (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.2-kanban
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Kanban Guide - David Anderson](https://kanban.university/kanban-guide/)
- 📖 [Kanbanize - What is Kanban](https://kanbanize.com/kanban-resources/getting-started/what-is-kanban)
- 📖 [Lean.org](https://www.lean.org/)
- 📖 [Kanban: Successful Evolutionary Change for Your Technology Business - David J. Anderson](https://www.amazon.com/Kanban-Evolutionary-Technology-David-Anderson/dp/1430233344)
- 📖 [Software Delivery Drama — Henrik Kniberg](https://hackernoon.com/software-delivery-drama-hyperproduction-cff386c1c472)

---

## ⏭️ Bài tiếp theo

→ [5.2.3 XP](../5.2.3-xp/README.md)
