# 🏉 5.2.1 Scrum

> Framework Agile phổ biến nhất. Làm việc theo **Sprint** (2-4 tuần), vai trò rõ ràng (Product Owner, Scrum Master, Dev Team), ceremonies cố định. Dựa trên **empiricism** — minh bạch, kiểm tra, thích ứng.

---

## 🎯 Framework này là gì?

Scrum là framework quản lý công việc phức tạp. Không phải quy trình cứng nhắc — nó cung cấp **cấu trúc tối thiểu** để team tự tổ chức, học hỏi và cải tiến qua từng Sprint.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCRUM FRAMEWORK                          │
│                                                                 │
│  Product Backlog ──Sprint Planning──→ Sprint Backlog            │
│       ↑                                      │                  │
│       │                                      ▼                  │
│  (PO ưu tiên)                          Daily Standup (15 phút)  │
│       │                                      │                  │
│       │                                      ▼                  │
│  Feedback ←──Sprint Review←── Increment ←── Development         │
│       │                                      │                  │
│       └──────Retrospective (cải tiến)────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Sprint cố định thời lượng (timeboxed), mỗi Sprint tạo ra **Increment** có thể dùng được (potentially releasable).

---

## 👥 Vai trò (Roles)

| Vai trò | Trách nhiệm |
|---------|-------------|
| **Product Owner (PO)** | Quản lý Product Backlog, ưu tiên theo giá trị, đại diện khách hàng |
| **Scrum Master (SM)** | Đảm bảo Scrum được hiểu & thực thi, gỡ blockers, coach team |
| **Developer** | Tự tổ chức, phát triển Increment, chịu trách nhiệm chất lượng |

> 💡 Không có Project Manager trong Scrum. Team **tự quản lý** (self-managing).

---

## 📋 Artifacts (Sản phẩm)

| Artifact | Mô tả |
|----------|-------|
| **Product Backlog** | Danh sách mọi thứ cần làm, được PO ưu tiên liên tục |
| **Sprint Backlog** | Mục tiêu Sprint + các item team cam kết trong Sprint |
| **Increment** | Kết quả hoàn thành trong Sprint, đạt Definition of Done |

---

## 🔄 Ceremonies (Sự kiện)

### Sprint Planning

Chọn item từ Product Backlog vào Sprint Backlog. Team trả lời 2 câu hỏi:
- **What?** — Chúng ta sẽ làm gì trong Sprint này?
- **How?** — Chúng ta sẽ làm như thế nào?

```
Input:  Product Backlog (đã ưu tiên) + Team capacity
Output: Sprint Goal + Sprint Backlog
```

### Daily Standup (Daily Scrum)

15 phút mỗi ngày, cùng giờ cùng chỗ. Mỗi dev trả lời 3 câu:
1. Hôm qua tôi đã làm gì?
2. Hôm nay tôi sẽ làm gì?
3. Có blocker gì không?

> ⚠️ Không phải meeting báo cáo cho sếp — là meeting để team **đồng bộ & lên kế hoạch** cho 24h tới.

### Sprint Review

Cuối Sprint. Team **demo Increment** cho stakeholder, nhận feedback, cập nhật Product Backlog.

### Sprint Retrospective

Sau Sprint Review. Team nhìn lại quy trình và trả lời:
- Điều gì **tốt**? → Giữ nguyên
- Điều gì **chưa tốt**? → Cải thiện
- Điều gì **thử mới**? → Thí nghiệm

---

## 🖼️ Minh họa demo code

Ví dụ `examples/index.ts` mô phỏng **vòng đời 1 Sprint** của team Scrum:

```
┌─────────────────────────────────────────────────────────────┐
│                    SCRUM SIMULATION                         │
│                                                             │
│  Product Backlog: [Login, Cart, Checkout, Search, Review]   │
│       │  Sprint Planning (chọn theo priority + capacity)    │
│       ▼                                                     │
│  Sprint Backlog: [Login, Cart, Checkout]                    │
│       │  Daily Standup × 10 ngày                            │
│       ▼                                                     │
│  Increment: Login ✅, Cart ✅, Checkout ✅                   │
│       │  Sprint Review (demo) + Retrospective               │
│       ▼                                                     │
│  Next Sprint Backlog: [Search, Review]                      │
└─────────────────────────────────────────────────────────────┘
```

- **ProductBacklog:** danh sách item với priority
- **Sprint:** chọn item theo capacity, mô phỏng daily standup, đánh dấu done
- **SprintReview:** in ra increment đã hoàn thành
- **Retrospective:** gợi ý cải tiến

> 💡 Code mô phỏng quy trình, không phải ứng dụng thật. Chạy để thấy cách Scrum vận hành từng bước.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔄 **Phản hồi nhanh** | Mỗi Sprint có Increment dùng được, stakeholder thấy tiến độ thật |
| 🎯 **Ưu tiên đúng** | PO liên tục ưu tiên backlog theo giá trị |
| 🧠 **Cải tiến liên tục** | Retrospective mỗi Sprint giúp team tốt dần |
| 👥 **Tự tổ chức** | Team tự quyết cách làm, tăng ownership |
| 📊 **Minh bạch** | Mọi thứ nhìn thấy: backlog, sprint board, burndown |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📅 **Ceremony nhiều** | 4 ceremonies mỗi Sprint, tốn thời gian nếu team nhỏ |
| 🎭 **Scrum-but** | Nhiều team áp dụng nửa vời, mất tinh thần framework |
| 📏 **Khó ước lượng** | Story point mang tính tương đối, dễ sai |
| 🚫 **Không phù hợp mọi thứ** | Ops/support liên tục khó nhét vào sprint cố định |
| 👑 **Phụ thuộc PO** | PO yếu → backlog mơ hồ → Sprint thất bại |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Sản phẩm mới, yêu cầu thay đổi thường xuyên | ✅ Rất phù hợp |
| Team 3-9 người, cùng làm 1 sản phẩm | ✅ Phù hợp |
| Cần phản hồi khách hàng thường xuyên | ✅ Phù hợp |
| Team nhỏ 1-2 người, dự án cực ngắn | ❌ Cân nhắc Kanban |
| Hỗ trợ vận hành liên tục (incident, hotfix) | ❌ Cân nhắc Kanban |
| Tổ chức 50+ người, nhiều team | ❌ Cân nhắc SAFe / LeSS |

---

## 🔗 Liên quan

- **5.2.2 Kanban** — Thay thế: flow liên tục, không sprint
- **5.2.3 XP** — Bổ sung: kỷ luật kỹ thuật (TDD, Pair Programming)
- **5.2.6 SAFe** — Mở rộng: Scrum cho tổ chức lớn
- **5.2.7 LeSS** — Mở rộng: Scrum tối giản cho nhiều team
- **5.2.4 Lean** — Triết lý nền tảng: loại bỏ lãng phí

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.1-scrum/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng vòng đời Sprint (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.1-scrum
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Scrum Guide](https://scrumguides.org/)
- 📖 [Scrum.org](https://www.scrum.org/)
- 📖 [Agile Manifesto](https://agilemanifesto.org/)

---

## ⏭️ Bài tiếp theo

→ [5.2.2 Kanban](../5.2.2-kanban/README.md)