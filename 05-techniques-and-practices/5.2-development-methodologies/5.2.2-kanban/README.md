# 📋 5.2.2 Kanban

> Tối ưu **flow liên tục** — kéo công việc khi có capacity, giới hạn WIP, không sprint cố định. Xuất phát từ hệ thống sản xuất Toyota, áp dụng cho phát triển phần mềm để giảm thời gian vòng lặp (cycle time).

---

## 🎯 Phương pháp này là gì?

Kanban quản lý công việc qua **bảng trực quan** với các cột trạng thái. Công việc **kéo** (pull) qua bảng — không **đẩy** (push) như mô hình sản xuất hàng loạt.

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

> 📌 **Đặc trưng:** Không có sprint, không ước lượng điểm. Chỉ có flow, WIP limit, và cải tiến liên tục.

---

## 🔑 6 Nguyên tắc Kanban

| # | Nguyên tắc | Mô tả |
|---|-----------|-------|
| 1 | **Visualize work** | Vẽ toàn bộ công việc lên bảng, ai cũng thấy |
| 2 | **Limit WIP (Work In Progress)** | Giới hạn số việc đang làm dở — chống multitasking |
| 3 | **Manage flow** | Theo dõi cycle time, tìm bottleneck, tối ưu |
| 4 | **Explicit policies** | Quy tắc rõ ràng: khi nào "Done", ai review, ... |
| 5 | **Feedback loops** | Standup, review board, cải tiến định kỳ |
| 6 | **Improve collaboratively** | Dùng data (CFD, cycle time) để cải tiến, không đổ lỗi |

---

## 📊 Metrics chính

| Metric | Ý nghĩa |
|--------|---------|
| **WIP** | Số việc đang làm dở — giữ thấp để tăng throughput |
| **Cycle Time** | Thời gian từ lúc bắt đầu đến lúc Done cho 1 item |
| **Lead Time** | Thời gian từ lúc khách yêu cầu đến lúc giao |
| **Throughput** | Số item hoàn thành trong 1 đơn vị thời gian |
| **CFD (Cumulative Flow Diagram)** | Biểu đồ tích lũy, phát hiện bottleneck |

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

| Ưu điểm | Giải thích |
|---------|------------|
| 🔄 **Linh hoạt tuyệt đối** | Thêm/bớt ưu tiên bất kỳ lúc nào, không cần chờ sprint |
| 📅 **Ít ceremony** | Chỉ cần bảng + standup ngắn, không planning/review/retro |
| 📊 **Cải tiến flow** | WIP limit + metrics giúp phát hiện bottleneck nhanh |
| 🚀 **Người mới dễ bắt đầu** | Không cần thay đổi quy trình hiện tại — bắt đầu từ hiện trạng |
| 🎯 **Giảm multitasking** | WIP limit ép team tập trung, ít chuyển đổi ngữ cảnh |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| ⏰ **Không deadline cố định** | Không có sprint → khó cam kết ngày giao cụ thể |
| 📏 **Khó ước lượng dài hạn** | Không dùng story points, khó dự đoán roadmap |
| 🧭 **Thiếu cấu trúc** | Team thiếu kỷ luật dễ trôi dạt, không cải tiến |
| 📉 **Phụ thuộc metrics** | Đo sai metric → tối ưu sai chỗ |
| 👤 **Cần văn hóa dữ liệu** | Cải tiến dựa trên số liệu, không phải cảm tính |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Hỗ trợ vận hành liên tục (support, incident, hotfix) | ✅ Rất phù hợp |
| Team maintenance, bugfix, công việc không đoán trước | ✅ Rất phù hợp |
| Team mới chuyển từ quy trình cũ, cần thay đổi nhẹ nhàng | ✅ Phù hợp |
| Cần cam kết ngày giao cụ thể cho khách hàng | ❌ Cân nhắc Scrum |
| Team mới, chưa có kỷ luật quy trình | ❌ Cần kết hợp Scrum/XP |

> 💡 **Scrumban** — kết hợp Scrum + Kanban: giữ sprint ngắn nhưng dùng board + WIP limit thay vì cam kết cứng nhắc.

---

## 🔗 Liên quan

- **5.2.1 Scrum** — Đối lập: sprint cố định, ceremony đầy đủ
- **5.2.4 Lean** — Nền tảng triết lý: loại bỏ lãng phí, tối ưu flow
- **5.2.3 XP** — Bổ sung: kỷ luật kỹ thuật cho chất lượng
- **8 DevOps / CI-CD** — Kanban áp dụng cho flow deployment (08-devops-cicd)

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

- 📖 [Kanban Guide](https://kanban.university/kanban-guide/)
- 📖 [Kanbanize - What is Kanban](https://kanbanize.com/kanban-resources/getting-started/what-is-kanban)
- 📖 [Lean.org](https://www.lean.org/)

---

## ⏭️ Bài tiếp theo

→ [5.2.3 XP](../5.2.3-xp/README.md)