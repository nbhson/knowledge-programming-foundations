# 🗂️ 5.2 Development Methodologies (Phương Pháp Phát Triển)

> **Development Methodologies** là các **khuôn khổ & quy trình** tổ chức cách một team phát triển phần mềm: lập kế hoạch, phân chia công việc, theo dõi tiến độ, và cải tiến liên tục. Không có "phương pháp tốt nhất" — chỉ có **phương pháp phù hợp nhất** với ngữ cảnh team, dự án, và tổ chức hiện tại.

---

## 📚 Mục lục

| # | Phương pháp | Loại | Mô tả ngắn |
|---|------------|------|------------|
| 5.2.1 | [Scrum](#521-scrum) | Agile | Sprint ngắn, vai trò rõ ràng, ceremonies cố định |
| 5.2.2 | [Kanban](#522-kanban) | Agile | Flow liên tục, giới hạn WIP, kéo công việc |
| 5.2.3 | [XP (Extreme Programming)](#523-xp-extreme-programming) | Agile | Kỷ luật kỹ thuật cao: TDD, Pair Programming, Continuous Integration |
| 5.2.4 | [Lean](#524-lean) | Agile | Loại bỏ lãng phí, tối ưu giá trị, cải tiến liên tục |
| 5.2.5 | [Waterfall](#525-waterfall) | Truyền thống | Tuần tự: Requirements → Design → Implement → Test → Deploy |
| 5.2.6 | [SAFe (Scaled Agile Framework)](#526-safe-scaled-agile-framework) | Agile (Scale) | Mở rộng Agile cho nhiều team, nhiều cấp độ |
| 5.2.7 | [LeSS (Large-Scale Scrum)](#527-less-large-scale-scrum) | Agile (Scale) | Mở rộng Scrum tối giản cho nhiều team |
| 5.2.8 | [Crystal](#528-crystal) | Agile | Nhẹ nhất, tùy biến theo quy mô team & độ quan trọng |
| 5.2.9 | [FDD (Feature-Driven Development)](#529-fdd-feature-driven-development) | Agile | Phát triển theo feature, mô hình hóa domain trước |
| 5.2.10 | [DSDM (Dynamic Systems Development Method)](#5210-dsdm-dynamic-systems-development-method) | Agile | Khung Agile sớm nhất, nhấn mạnh business value |
| 5.2.11 | [Spiral](#5211-spiral) | Truyền thống | Lặp theo vòng xoắn, tập trung quản lý rủi ro |
| 5.2.12 | [RAD (Rapid Application Development)](#5212-rad-rapid-application-development) | Truyền thống | Prototype nhanh, phản hồi người dùng liên tục |

---

## 🧭 Bản đồ lựa chọn phương pháp

```
BẮT ĐẦU: Team & dự án của bạn như thế nào?
│
├─ Yêu cầu thay đổi thường xuyên, cần phản hồi nhanh? (Agile zone)
│   ├─ Team nhỏ (1-9 người)?
│   │   ├─ Cần kỷ luật kỹ thuật cao, quality là ưu tiên hàng đầu → 5.2.3 XP
│   │   ├─ Cần quy trình rõ ràng, role phân định, sprint fixed → 5.2.1 Scrum
│   │   └─ Cần flow liên tục, ít ceremony, công việc đến liên tục → 5.2.2 Kanban
│   ├─ Team vừa (10-50 người)?
│   │   ├─ 2-8 team cùng 1 sản phẩm, muốn giữ Scrum gốc → 5.2.7 LeSS
│   │   └─ Muốn tối ưu giá trị, loại lãng phí across team → 5.2.4 Lean
│   └─ Team lớn (50+ người, nhiều cấp quản lý, enterprise)?
│       └─→ 5.2.6 SAFe
│
├─ Yêu cầu ổn định, đã hiểu rõ, ít thay đổi? (Predictive zone)
│   └─→ 5.2.5 Waterfall
│
├─ Dự án rủi ro cao, công nghệ mới, chưa chắc chắn?
│   └─→ 5.2.11 Spiral
│
├─ Cần prototype nhanh, demo cho khách hàng sớm?
│   ├─ Team nhỏ, thời gian ngắn, UI là trọng tâm → 5.2.12 RAD
│   └─ Cần khung đầy đủ, business value đảm bảo, deadline cứng → 5.2.10 DSDM
│
├─ Team nhỏ, ít quy trình, tùy biến theo ngữ cảnh?
│   └─→ 5.2.8 Crystal
│
└─ Domain phức tạp, cần mô hình hóa feature rõ ràng?
    └─→ 5.2.9 FDD
```

> 💡 **Sự thật thực tế:** Hầu hết team thành công không dùng "nguyên chất" 1 framework. Phổ biến là **Scrum + XP practices** (Scrum cho management, XP cho engineering), hoặc **Scrumban** (Scrum + Kanban board).

---

## 🔗 Mối quan hệ giữa các phương pháp

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRUYỀN THỐNG (Predictive)                        │
│   Waterfall ──cải tiến──→ Spiral (thêm vòng lặp + risk analysis)   │
│        │                                                       │
│        └───→ RAD (thêm prototype nhanh + user involvement)      │
├─────────────────────────────────────────────────────────────────────┤
│                    AGILE (Adaptive)                                 │
│   Scrum ──tối giản──→ LeSS (nhiều team, giữ 1 backlog)            │
│   Scrum ──mở rộng──→ SAFe (nhiều team + cấp quản lý enterprise)   │
│   Scrum ──kỹ thuật──→ XP (TDD, Pair, CI)                          │
│   Scrum ──flow──→ Kanban (liên tục, WIP limit, no sprint)         │
│   Agile ──tinh gọn──→ Lean (loại waste, optimize value stream)     │
│   Agile ──nhẹ──→ Crystal (tùy biến theo team size & criticality)  │
│   Agile ──feature──→ FDD (mô hình hóa + feature tracking)         │
│   Agile ──business──→ DSDM (timebox + MoSCoW prioritization)      │
└─────────────────────────────────────────────────────────────────────┘
```

> 💡 **Lưu ý quan trọng:** Các phương pháp **không loại trừ nhau**. Nhiều team dùng **Scrum + XP** (Scrum cho quy trình, XP cho kỹ thuật), hoặc **Scrum + Kanban** (Scrumban) cho flow linh hoạt hơn. Chọn methodology = chọn **phần management**; kỹ thuật (TDD, CI, refactoring) có thể thêm vào bất kỳ framework nào.

---

## 📖 Chi tiết từng mục

### 5.2.1 Scrum

Framework Agile phổ biến nhất. Làm việc theo **Sprint** (2-4 tuần), vai trò rõ ràng (Product Owner, Scrum Master, Dev Team), ceremonies cố định. Dựa trên **empiricism** — minh bạch, kiểm tra, thích ứng.

```
Product Backlog → Sprint Planning → Sprint Backlog → Daily Standup
    → Sprint Review → Retrospective → Increment
```

- ✅ **Ưu:** Quy trình rõ ràng, phản hồi nhanh, cải tiến liên tục
- ❌ **Nhược:** Ceremony nhiều, khó áp dụng cho team nhỏ/ít kỷ luật

📂 → [Chi tiết: 5.2.1-scrum](5.2.1-scrum/README.md)

---

### 5.2.2 Kanban

Tối ưu **flow liên tục** — kéo công việc khi có capacity, giới hạn WIP, không sprint cố định. Xuất phát từ hệ thống sản xuất Toyota, áp dụng cho phát triển phần mềm để giảm thời gian vòng lặp (cycle time).

```
To Do → In Progress (WIP: 3) → Review (WIP: 2) → Done
```

- ✅ **Ưu:** Linh hoạt, ít ceremony, cải thiện flow rõ rệt
- ❌ **Nhược:** Không có deadline cố định, khó ước lượng dài hạn

📂 → [Chi tiết: 5.2.2-kanban](5.2.2-kanban/README.md)

---

### 5.2.3 XP (Extreme Programming)

Nhấn mạnh **kỷ luật kỹ thuật**: TDD, Pair Programming, Continuous Integration, Refactoring liên tục.

- ✅ **Ưu:** Chất lượng code cao, phản hồi nhanh từ test
- ❌ **Nhược:** Đòi hỏi kỷ luật cao, khó áp dụng nếu team chưa quen

📂 → [Chi tiết: 5.2.3-xp](5.2.3-xp/README.md)

---

### 5.2.4 Lean

Xuất phát từ Toyota Production System. **Loại bỏ lãng phí**, tối ưu giá trị cho khách hàng, cải tiến liên tục.

- ✅ **Ưu:** Tập trung giá trị, giảm lãng phí, cải tiến bền vững
- ❌ **Nhược:** Trừu tượng, cần văn hóa tổ chức mạnh

📂 → [Chi tiết: 5.2.4-lean](5.2.4-lean/README.md)

---

### 5.2.5 Waterfall

Mô hình **tuần tự** cổ điển: mỗi giai đoạn hoàn thành rồi mới sang giai đoạn tiếp theo.

```
Requirements → Design → Implementation → Testing → Deployment → Maintenance
```

- ✅ **Ưu:** Rõ ràng, dễ quản lý khi yêu cầu ổn định, tài liệu đầy đủ
- ❌ **Nhược:** Khó thay đổi giữa chừng, phát hiện lỗi muộn

📂 → [Chi tiết: 5.2.5-waterfall](5.2.5-waterfall/README.md)

---

### 5.2.6 SAFe (Scaled Agile Framework)

Mở rộng Agile cho **tổ chức lớn** (50-125+ người) với nhiều cấp độ: Team, Program, Large Solution, Portfolio.

- ✅ **Ưu:** Phối hợp nhiều team, align với chiến lược doanh nghiệp
- ❌ **Nhược:** Nặng nề, nhiều ceremony, chi phí đào tạo cao

📂 → [Chi tiết: 5.2.6-safe](5.2.6-safe/README.md)

---

### 5.2.7 LeSS (Large-Scale Scrum)

Mở rộng Scrum **tối giản** cho 2-8 team cùng làm 1 sản phẩm. Giữ nguyên 1 Product Backlog, 1 Product Owner, 1 Sprint.

- ✅ **Ưu:** Đơn giản, giữ tinh thần Scrum gốc
- ❌ **Nhược:** Chỉ phù hợp khi các team làm chung 1 sản phẩm

📂 → [Chi tiết: 5.2.7-less](5.2.7-less/README.md)

---

### 5.2.8 Crystal

Họ phương pháp **nhẹ nhất** — tùy biến theo quy mô team (Crystal Clear, Crystal Yellow, Crystal Orange...) và độ quan trọng của hệ thống.

- ✅ **Ưu:** Cực kỳ linh hoạt, ít quy trình, tập trung con người
- ❌ **Nhược:** Khó chuẩn hóa, phụ thuộc nhiều vào team

📂 → [Chi tiết: 5.2.8-crystal](5.2.8-crystal/README.md)

---

### 5.2.9 FDD (Feature-Driven Development)

Phát triển theo **feature** — mô hình hóa domain trước, sau đó chia nhỏ thành feature và phát triển theo từng feature.

- ✅ **Ưu:** Rõ ràng tiến độ theo feature, mô hình domain tốt
- ❌ **Nhược:** Ít chú trọng quy trình team, cần domain modeling giỏi

📂 → [Chi tiết: 5.2.9-fdd](5.2.9-fdd/README.md)

---

### 5.2.10 DSDM (Dynamic Systems Development Method)

Khung Agile **sớm nhất** (1994). Nhấn mạnh business value, sự tham gia của người dùng, giao hàng thường xuyên.

- ✅ **Ưu:** Business value rõ ràng, người dùng tham gia sâu
- ❌ **Nhược:** Nặng về quản trị, ít phổ biến hiện nay

📂 → [Chi tiết: 5.2.10-dsdm](5.2.10-dsdm/README.md)

---

### 5.2.11 Spiral

Mô hình **xoắn ốc** — mỗi vòng lặp gồm: xác định mục tiêu, đánh giá rủi ro, phát triển, đánh giá kết quả. Tập trung **quản lý rủi ro**.

- ✅ **Ưu:** Quản lý rủi ro tốt, phù hợp dự án lớn/phức tạp
- ❌ **Nhược:** Phức tạp, tốn kém, cần chuyên gia đánh giá rủi ro

📂 → [Chi tiết: 5.2.11-spiral](5.2.11-spiral/README.md)

---

### 5.2.12 RAD (Rapid Application Development)

Phát triển **prototype nhanh** với sự tham gia liên tục của người dùng. Phù hợp dự án ngắn, yêu cầu UI rõ ràng.

- ✅ **Ưu:** Nhanh, phản hồi người dùng sớm, ít tài liệu
- ❌ **Nhược:** Khó scale, chất lượng kiến trúc có thể kém

📂 → [Chi tiết: 5.2.12-rad](5.2.12-rad/README.md)

---

## 🆚 So sánh nhanh

| Tiêu chí | Scrum | Kanban | XP | Waterfall | SAFe | LeSS |
|----------|-------|--------|-----|-----------|------|------|
| **Loại** | Agile | Agile | Agile | Truyền thống | Agile (Scale) | Agile (Scale) |
| **Vòng lặp** | Sprint 2-4 tuần | Liên tục | Iteration 1-2 tuần | Tuần tự 1 lần | PI 8-12 tuần | Sprint 2-4 tuần |
| **Vai trò** | PO, SM, Dev | Không cố định | Customer, Dev, Coach | PM, Architect, Dev | Nhiều cấp | PO, SM, Dev |
| **Ceremony** | 4 ceremonies | Tối thiểu | Nhiều kỹ thuật | Giai đoạn | Rất nhiều | 4 ceremonies |
| **Quy mô team** | 1-9 | Bất kỳ | 2-12 | Bất kỳ | 50-125+ | 2-8 team |
| **Thay đổi yêu cầu** | Trong sprint hạn chế | Bất kỳ lúc nào | Bất kỳ lúc nào | Rất khó | Theo PI | Trong sprint hạn chế |
| **Kỷ luật kỹ thuật** | Không quy định | Không quy định | TDD, Pair, CI (bắt buộc) | Không quy định | Không quy định | Không quy định |
| **Chi phí chuyển đổi** | Thấp | Rất thấp | Trung bình | — | Rất cao | Thấp |
| **Độ bền vững** | Trung bình | Cao (với kỷ luật) | Rất cao | Thấp | Trung bình (phụ thuộc coach) | Cao |

**Bảng bổ sung — khi nào nên tránh:**

| Phương pháp | Cảnh báo đỏ (red flag) |
|-------------|------------------------|
| Scrum | PO không có quyền quyết định, team > 10 người, management can thiệp daily |
| Kanban | Team không đo được metrics, WIP limit không được tôn trọng |
| XP | Team thiếu senior developer, không có CI/CD infrastructure, deadline quá gấp (2 tuần) |
| Waterfall | Yêu cầu chưa rõ, công nghệ mới, dự án > 6 tháng |
| SAFe | Team < 50 người, chưa có Scrum trưởng thành, ngân sách training < $100k |
| LeSS | Các team làm product khác nhau, thiếu giao tiếp trực tiếp |
| Crystal | Không có senior người hiểu biết để "tinh chỉnh" quy trình |

---

## 🎯 Khung lựa chọn thực tế (decision framework)

**3 câu hỏi then chốt trước khi chọn:**

1. **Yêu cầu thay đổi nhanh hay ổn định?**
   - Thay đổi liên tục → Agile (Scrum/Kanban/XP)
   - Ổn định, đã hiểu rõ → Waterfall hoặc Spiral

2. **Quy mô team và tổ chức?**
   - 1–9 người → Scrum/Kanban/XP/Crystal
   - 10–50 người → LeSS/XP/Lean
   - 50–125+ người → SAFe

3. **Độ rủi ro công nghệ/dự án?**
   - Rủi ro cao, công nghệ mới → Spiral, RAD
   - Rủi ro thấp, domain quen thuộc → Scrum, Kanban

> 💡 **Thực tế industry:** Theo State of DevOps Report (2023), **67% công ty Fortune 500** dùng Agile (chủ yếu Scrum variant); ~15% dùng hybrid Scrum+Kanban; < 5% dùng thuần Waterfall. Tuy nhiên, **thành công không nằm ở framework** — nằm ở **văn hóa giao tiếp và continuous improvement**.

---

## 📚 Tài liệu tham khảo

- 📖 [Agile Manifesto](https://agilemanifesto.org/)
- 📖 [Scrum Guide](https://scrumguides.org/)
- 📖 [Kanban Guide](https://kanban.university/kanban-guide/)
- 📖 [Extreme Programming - Ron Jeffries](https://ronjeffries.com/xprog/what-is-extreme-programming/)
- 📖 [Lean Software Development - Mary Poppendieck](https://en.wikipedia.org/wiki/Lean_software_development)
- 📖 [SAFe Framework](https://scaledagileframework.com/)
- 📖 [LeSS Framework](https://less.works/)
- 📖 [Crystal - Alistair Cockburn](https://alistair.cockburn.us/crystal-methods/)
- 📖 [FDD - Jeff De Luca](https://en.wikipedia.org/wiki/Feature-driven_development)
- 📖 [DSDM Consortium](https://www.agilebusiness.org/)
- 📖 [Spiral Model - Barry Boehm](https://en.wikipedia.org/wiki/Spiral_model)
- 📖 [RAD - James Martin](https://en.wikipedia.org/wiki/Rapid_application_development)
- 📖 [State of DevOps Report - Puppet/DORA](https://www.puppet.com/state-of-devops)

---

## ⏭️ Bài tiếp theo

→ [5.3 Performance Optimization](../5.3-performance-optimization/README.md)
