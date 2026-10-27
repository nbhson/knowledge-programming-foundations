# 🏉 5.2.1 Scrum

> Framework Agile phổ biến nhất. Làm việc theo **Sprint** (2-4 tuần), vai trò rõ ràng (Product Owner, Scrum Master, Dev Team), ceremonies cố định. Dựa trên **empiricism** — minh bạch, kiểm tra, thích ứng. Được formalize bởi Ken Schwaber và Jeff Sutherland, publish trong **Scrum Guide** (phiên bản mới nhất 2020).

---

## 🎯 Framework này là gì?

Scrum là framework quản lý công việc phức tạp — **không phải quy trình cứng nhắc**. Nó cung cấp **cấu trúc tối thiểu** để team tự tổ chức, học hỏi và cải tiến qua từng Sprint.

**Ba trụ cột của Scrum (Empiricism):**

| Trụ cột | Ý nghĩa | Manifestation trong Scrum |
|---------|---------|---------------------------|
| **Transparency** (Minh bạch) | Mọi người cùng thấy cùng hiểu | Product Backlog công khai, Definition of Done rõ ràng, Sprint Board visible |
| **Inspection** (Kiểm tra) | Kiểm tra tiến độ thường xuyên | Daily Scrum, Sprint Review — phát hiện lệch hướng sớm |
| **Adaptation** (Thích ứng) | Điều chỉnh khi phát hiện lệch hướng | Retrospective → cải tiến quy trình; Backlog grooming → điều chỉnh priority |

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCRUM FRAMEWORK                          │
│                                                                 │
│  Product Backlog (PO duy trì)                                   │
│       │                                                         │
│       ▼ Sprint Planning (2-4 giờ)                               │
│  Sprint Backlog (team cam kết) ←── Sprint Goal                  │
│       │                                                         │
│       ├─► Daily Scrum (15 phút/ngày)                            │
│       │    └── Sync + adjust plan                               │
│       │                                                         │
│       ▼ Development (Sprint)                                    │
│  Increment (potentially releasable)                             │
│       │                                                         │
│       ├──► Sprint Review (2 giờ) → Stakeholder feedback         │
│       └──► Sprint Retrospective (1 giờ) → Process improvement   │
│                                                                         │
│  (chu kỳ lặp: Planning → Daily → Review → Retro → Planning...)     │
└─────────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Sprint cố định thời lượng (**timeboxed**), mỗi Sprint tạo ra **Increment** có thể dùng được (potentially releasable). Sprint **không được kéo dài** — dù chưa xong hết item.

**Độ dài Sprint phổ biến (industry data):**
- 1 tuần: start-up, prototype, team mới học Scrum
- 2 tuần: **phổ biến nhất** (~55% team dùng), balance giữa feedback và focus
- 3 tuần: enterprise, team cần nhiều context switching
- 4 tuần: hiếm (~5%), thường là dấu hiệu Scrum bị "waterfall hóa"

---

## 👥 Vai trò (Roles) — 3 vai trò, không có PM

| Vai trò | Trách nhiệm | Quyền hạn | Hậu quả nếu yếu |
|---------|-------------|-----------|-----------------|
| **Product Owner (PO)** | Quản lý Product Backlog, ưu tiên theo giá trị, đại diện khách hàng/stakeholder | Quyết định **WHAT** — thứ tự item, chấp nhận/reject increment | Backlog mơ hồ, sprint items sai priority, stakeholder không hài lòng |
| **Scrum Master (SM)** | Đảm bảo Scrum được hiểu & thực thi, gỡ blockers, coach team vềScrum | Bảo vệ team khỏi interference, facilitator ceremonies | Team làm "Scrum-but" (nửa vời), ceremony biến thành meeting vô ích |
| **Developers** | Tự tổ chức, phát triển Increment, chịu trách nhiệm chất lượng | Quyết định **HOW** — cách technical thực hiện, estimation | Code quality thấp, không tự chủ, phụ thuộc SM/PO |

> 💡 **Không có Project Manager trong Scrum.** Team **tự quản lý** (self-managing). SM không phải "team leader" — SM là **servant-leader**, phục vụ team bằng cách gỡ obstacles.

**Phổ biến sai lầm về roles:**
- ❌ "PO là sếp của team" → PO chỉ quyết định WHAT, không quyết định HOW
- ❌ "SM là manager" → SM là facilitator, không có quyền hire/fire
- ❌ "Developer chỉ code" → Developer còn estmate, design, test, document

---

## 📋 Artifacts (Sản phẩm) — 3 artifacts chính

| Artifact | Mô tả | Sự thật thực tế |
|----------|-------|-----------------|
| **Product Backlog** | Danh sách mọi thứ cần làm, được PO ưu tiên liên tục. **Luôn thay đổi** — không bao giờ "hoàn thành". | Items lớn (Epics) được refine thành Story nhỏ hơn qua **Backlog Refinement** (thường 1–2 giờ/tuần). |
| **Sprint Backlog** | Mục tiêu Sprint + các item team cam kết trong Sprint. Chỉ team mới được sửa. | Created tại Sprint Planning. Trong Sprint, item có thể được **re-estimate** nhưng không thêm item mới mà không đàm phán với PO. |
| **Increment** | Kết quả hoàn thành trong Sprint, đạt Definition of Done. Có thể release ngay. | "Potentially shippable" ≠ "phải release". Increment là **trạng thái sẵn sàng**, PO quyết định release hay không. |

**Definition of Done (DoD) — yếu tố then chốt:**

DoD là **checklist chung** mọi item phải đạt trước khi được coi là "Done". Phổ biến:
```
[x] Code completed
[x] Unit tests written & passing (>80% coverage)
[x] Code review completed (minimum 1 reviewer)
[x] Integration tests passing
[x] Documentation updated
[x] No known security vulnerabilities
[x] PO accepted the story
```

> ⚠️ **Nếu không có DoD rõ ràng:** "Done" khác nhau giữa các dev → technical debt tích lũy → cuối Sprint không có increment thật sự.

---

## 🔄 Ceremonies (Sự kiện) — 5 ceremonies chính

### 1. Sprint Planning
- **Thời lượng:** Max 8 giờ cho Sprint 4 tuần (tỷ lệ: 2 giờ/Sprint tuần)
- **Input:** Product Backlog (đã ưu tiên) + Team capacity + Sprint Goal
- **Output:** Sprint Goal + Sprint Backlog (item + estimate)
- **Câu hỏi then chốt:**
  1. **What?** — Chúng ta sẽ làm gì trong Sprint này? (PO chọn items)
  2. **How?** — Chúng ta sẽ làm như thế nào? (Team breakdown thành tasks)
  3. **Why?** — Sprint Goal là gì? (Tầm nhìn tổng thể)

### 2. Daily Scrum (Daily Standup)
- **Thời lượng:** 15 phút mỗi ngày, cùng giờ cùng chỗ
- **Ai tham gia:** Developers (bắt buộc), PO/SM (optional)
- **Mục đích:** Đồng bộ tiến độ, phát hiện blockers, **không phải báo cáo cho sếp**

**3 câu hỏi truyền thống** (còn tranh cãi trong community):
1. Hôm qua tôi đã làm gì?
2. Hôm nay tôi sẽ làm gì?
3. Có blocker gì không?

**Cách hiện đại hơn:** Nhìn vào Sprint Board, đi từ phải ← trái (Done → To Do), hỏi "cần gì để đẩy item này sang Done?"

### 3. Sprint Review
- **Thời lượng:** Max 4 giờ cho Sprint 4 tuần
- **Ai tham gia:** Toàn bộ Scrum team + stakeholders
- **Mục đích:** Demo Increment, lấy feedback, cập nhật Product Backlog
- **Không phải:** Status meeting → **phải có working software demo**

### 4. Sprint Retrospective
- **Thời lượng:** Max 3 giờ cho Sprint 4 tuần
- **Ai tham gia:** Chỉ Scrum team (PO/SM/Developers)
- **Mục đích:** Nhìn lại **quy trình**, không nhìn lại **sản phẩm**
- **Cấu trúc phổ biến:**
  - **Start** — điều gì nên bắt đầu làm?
  - **Stop** — điều gì nên dừng?
  - **Continue** — điều gì đang tốt, giữ nguyên?
- **Output:** 1–3 improvement items đưa vào Sprint tiếp theo

> ⚠️ **Rủi ro Retro:** Nếu không có action item cụ thể, Retro biến thành just complaint session. SM phải đảm bảo mỗi Retro có **ít nhất 1 cải tiến được assign owner + due date**.

### 5. Backlog Refinement (không chính thức trong Scrum Guide 2020 nhưng thực tế bắt buộc)
- **Mục đích:** Phân rã Epic → Story, estimate, clarify acceptance criteria
- **Thường làm:** 5–10% capacity mỗi Sprint (ví dụ: 4 giờ/tuần trong Sprint 2 tuần)

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

| Ưu điểm | Giải thích | Thực tế ngành |
|---------|------------|---------------|
| 🔄 **Phản hồi nhanh** | Mỗi Sprint có Increment dùng được, stakeholder thấy tiến độ thật | Release frequency: trung bình 2–4 tuần thay vì 3–6 tháng (waterfall) |
| 🎯 **Ưu tiên đúng** | PO liên tục ưu tiên backlog theo giá trị business | Prioritized backlog → team luôn làm việc **quan trọng nhất trước** |
| 🧠 **Cải tiến liên tục** | Retrospective mỗi Sprint giúp team tốt dần | Teams với mature retro improve velocity ~10–20% mỗi quarter |
| 👥 **Tự tổ chức** | Team tự quyết cách làm, tăng ownership | High-autonomy teams có engagement cao hơn 14%, productivity cao hơn 10% (Harvard Business Review) |
| 📊 **Minh bạch** | Mọi thứ nhìn thấy: backlog, sprint board, burndown | Transparency giảm surprise — stakeholder không bao giờ "bất ngờ" khi sprint kết thúc |
| 🛡️ **Risk giảm** | Mỗi Sprint là mini-risk mitigation | Risk lộ ra sớm (trong sprint), không chờ đến "go-live" |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Cách giảm thiểu |
|------------|------------|-----------------|
| 📅 **Ceremony nhiều** | 4 ceremonies mỗi Sprint, tốn thời gian nếu team nhỏ | Combine Retro + Review nếu team < 5 người; timebox nghiêm ngặt |
| 🎭 **Scrum-but** | Nhiều team áp dụng nửa vời, mất tinh thần framework | Train SM chuẩn, enforce Definition of Done, không bỏ ceremony |
| 📏 **Khó ước lượng** | Story point mang tính tương đối, dễ sai | Kế từ velocity history; dùng planning poker để reduce bias |
| 🚫 **Không phù hợp mọi thứ** | Ops/support liên tục khó nhét vào sprint cố định | Dùng Kanban cho support track; Scrum cho feature track (Scrumban) |
| 👑 **Phụ thuộc PO** | PO yếu → backlog mơ hồ → Sprint thất bại | Backup PO (alternate contact); PO phải available daily, không chỉ planning |
| 📉 **Velocity fluctuation** | Velocity dao động → khó predict release date | Dùng range (min/max velocity) thay vì single number; communicate uncertainty |
| 🏢 **Enterprise resistance** | Management muốn Gantt chart, không thích self-organizing | Giáo dục leadership về benefits; show data từ pilot team |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Sản phẩm mới, yêu cầu thay đổi thường xuyên | ✅ Rất phù hợp | Sprint 2 tuần = feedback loop nhanh; PO điều chỉnh priority liên tục theo market |
| Team 3-9 người, cùng làm 1 sản phẩm | ✅ Phù hợp | Quy mô lý tưởng cho Scrum — giao tiếp face-to-face dễ, ceremony không quá nặng |
| Cần phản hồi khách hàng thường xuyên | ✅ Phù hợp | Sprint Review là kênh chính thức cho feedback; stakeholder thấy working software mỗi 2 tuần |
| Đội ngũ remote/hybrid | ⚠️ Cần điều chỉnh | Daily standup online, async communication tools (Slack, Notion); SM phải proactive hơn |
| Team nhỏ 1-2 người, dự án cực ngắn | ❌ Cân nhắc Kanban | Scrum ceremony overhead > value cho team siêu nhỏ; Kanban lightweight hơn |
| Hỗ trợ vận hành liên tục (incident, hotfix) | ❌ Cân nhắc Kanban | Incident flow không theo sprint rhythm; Kanban pull-based phù hợp hơn |
| Tổ chức 50+ người, nhiều team | ❌ Cân xét SAFe / LeSS | 1 Scrum team = 1 product; nhiều team cần scale framework mới phối hợp được |
| Dự án compliance-ngặt (y tế, tài chính) | ⚠️ Cần kết hợp documentation rigor | Scrum có thể kết hợp với waterfall documentation requirements; DoD include audit trail |

> 💡 **Scrum-but (Scrum but) phenomenon:** Đây là failure mode phổ biến nhất — team "làm Scrum" nhưng bỏ bớt ceremony, vai trò, artifact để "thích nghi". Hậu quả: mất cả benefits của Scrum lẫn structure, chỉ còn chaos có tên. Nhận diện bằng cách: nếu bỏ 1 ceremony, hỏi "value mất đi là gì?" trước khi quyết định bỏ.

---

## 🔗 Liên quan

- **5.2.2 Kanban** — Thay thế: flow liên tục, không sprint
- **5.2.3 XP** — Bổ sung: kỷ luật kỹ thuật (TDD, Pair Programming)
- **5.2.6 SAFe** — Mở rộng: Scrum cho tổ chức lớn
- **5.2.7 LeSS** — Mở rộng: Scrum tối giản cho nhiều team
- **5.2.4 Lean** — Triết lý nền tảng: loại bỏ lãng phí
- **5.1 Testing** — TDD là technical practice của XP, thường dùng cùng Scrum

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.1-scrum/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng vòng đời Sprint (chạy: npx tsx examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.1-scrum
npx tsx examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Scrum Guide 2020](https://scrumguides.org/) — source of truth chính thức
- 📖 [Scrum.org](https://www.scrum.org/) — certification & community
- 📖 [Agile Manifesto](https://agilemanifesto.org/) — triết lý nền tảng
- 📖 [The Sprint — Jeff Sutherland](https://hbr.org/2014/11/the-sprint) — HBR article
- 📖 [Scrum: The Art of Doing Twice the Work in Half the Time - Jeff Sutherland](https://www.amazon.com/Scrum-Art-Doing-Twice-Work/dp/1451675522)

---

## ⏭️ Bài tiếp theo

→ [5.2.2 Kanban](../5.2.2-kanban/README.md)
