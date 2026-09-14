# 🔍 5.2.7 LeSS (Large-Scale Scrum)

> Mở rộng Scrum chuẩn cho **nhiều team** (từ 2 đến 8+ team) cùng làm trên **một Product Backlog** duy nhất và ra mắt **một Product Increment** chung. Triết lý: "LeSS is Scrum — Large-Scale Scrum is not a new framework, it is Scrum applied to multiple teams."

---

## 🎯 Framework này là gì?

"LeSS is Scrum — Large-Scale Scrum is not a new framework, it is Scrum applied to multiple teams." — Craig Larman & Bas Vodde, creators of LeSS.

LeSS không phát minh quy trình mới. Nó **giữ nguyên mọi nguyên tắc Scrum** (1 PO, 1 backlog, 1 sprint, team tự quản) rồi mở rộng số team — và **cố ý tối giản tầng quản lý** để tránh cồng kềnh kiểu SAFe.

**Tư tưởng cốt lõi:** Không thêm role mới, không thêm artifact mới, không thêm ceremony mới. Chỉ **mở rộng scope của existing Scrum events** để include tất cả team.

```
┌───────────────────────────────────────────────────────────────────┐
│                  LeSS — 1 SẢN PHẨM, NHIỀU TEAM                    │
│                                                                   │
│              ┌──────────────────────────────┐                     │
│              │   1 PRODUCT OWNER + 1 BACKLOG│                     │
│              └───────────────┬──────────────┘                     │
│                              │                                     │
│         ┌────────────────────┼────────────────────┐               │
│         ▼                    ▼                    ▼               │
│   ┌─────────┐          ┌─────────┐          ┌─────────┐           │
│   │ Team A  │          │ Team B  │          │ Team C  │           │
│   └─────────┘          └─────────┘          └─────────┘           │
│         │                    │                    │               │
│         └────────────────────┼────────────────────┘               │
│                              ▼                                     │
│              1 SPRINT (đồng bộ) → 1 INCREMENT chung               │
└───────────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Sprint Planning / Review / Retrospective là **chung** cho cả "hệ" — không tách theo team. Trái ngược với SAFe có nhiều tầng (Program, Portfolio).

**2 versions của LeSS:**
- **LeSS** (basic): 2–8 team, 1 Product Backlog, 1 Product Owner, 1 Sprint
- **LeSS Huge**: > 8 team, chia thành **Requirement Areas** (mỗi area ~7 người), có Area PO, Area Backlog — nhưng vẫn giữ 1 Overall PO và 1 Overall Backlog

---

## 🧩 Các thành phần chính

| Thành phần | Mô tả |
|------------|-------|
| **1 Product Owner** | Sở hữu và ưu tiên duy nhất một Product Backlog — không chia PO theo team |
| **1 Product Backlog** | Dùng chung cho mọi team trong "hệ" — không có backlog riêng cho team |
| **1 Sprint (đồng bộ)** | Các team bắt đầu/kết thúc cùng lúc, chia sẻ Definition of Done |
| **Sprint Planning chung** | Các team họp cùng nhau, kéo việc từ backlog chung (có thể chia room con) |
| **Sprint Review chung** | Demo chung một Increment, challenge chung — không phải demo theo team |
| **Retrospective chung** | Nhìn lại toàn hệ thống, không chỉ từng team (có thể có team-retro phụ) |
| **LeSS Huge** | > 8 team → chia **Requirement Area** (Area PO, Area Backlog) |

> 💡 Trong LeSS, "Done" phải hoàn toàn **potentially shippable** và được tích hợp chung — các team phối hợp trực tiếp, không qua tầng PM.

**So sánh LeSS vs SAFe decision factors:**

| Factor | LeSS | SAFe |
|--------|------|------|
| Number of teams | 2–8 (basic), >8 (Huge) | 5–125+ |
| Product Owners | 1 | Nhiều (Business Owner + PO) |
| Backlogs | 1 (hoặc Requirement Area backlogs) | Program Backlog + Team Backlogs |
| Ceremonies | Scrum ceremonies (expanded) | SAFe-specific (PI Planning, System Demo...) |
| New roles | None | RTE, System Architect, PO System Team... |
| Complexity | Low | High |
| Transformation cost | Low | High |

---

## 🖼️ Minh họa demo code

Ví dụ [`examples/index.ts`](examples/index.ts) mô phỏng **3 team cùng 1 backlog, 1 sprint**:

```
Product Backlog chung: [Login, Catalog, Cart, Checkout, Order History]
        │
        ▼  Sprint Planning CHUNG: các team cùng kéo việc
   Team Auth    → kéo 2 item
   Team Catalog → kéo item
   Team Cart    → kéo item
        │
        ▼  cuối Sprint
Sprint Review CHUNG → 1 Product Increment (gộp mọi team)
Retrospective CHUNG  → cải tiến toàn hệ, không tách team
```

- `LeSsProgram` quản lý 1 backlog chung + nhiều team
- `LeSsTeam.pullFromBacklog()` mô phỏng cùng kéo việc trong planning chung
- `sprintReview()` và `retrospective()` mô phỏng ceremony chung

> 💡 Code mô phỏng quy trình, không phải ứng dụng thật. Chạy để thấy mô hình "1 backlog, nhiều team".

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Thực tế |
|---------|------------|---------|
| 🪶 **Tối giản cồng kềnh** | Không thêm tầng quản lý trung gian như SAFe | Transformation cost thấp; faster adoption |
| 🎯 **Giữ đúng tinh thần Scrum** | Ít role mới, ít artifact mới | Less bureaucracy = faster decisions |
| 🌍 **Tập trung sản phẩm toàn cục** | 1 PO → 1 backlog → tránh mỗi team làm một hướng |全局 optimization > local optimization |
| 💰 **Chi phí chuyển đổi thấp hơn SAFe** | Không cần bộ máy đào tạo đồ sộ | Can start in weeks, not months |
| 🔄 **Đồng bộ tự nhiên** | Các team phối hợp trực tiếp thay vì báo cáo lên trên | Cross-team communication tăng, silos giảm |
| 👥 **Team autonomy preserved** | Mỗi team vẫn self-organizing như Scrum gốc | Không hy sinh agility khi scale |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giảm thiểu |
|------------|------------|------------|
| 🤝 **Đòi hỏi tự chủ & giao tiếp cực cao** | Team phải chủ động cross-team, không chờ chỉ đạo | Hire/develop communicative team members; invest in team building |
| 🌐 **Khó khi văn hóa phân cấp** | LeSS không có PM trung gian — nhiều tổ chức không quen | Leadership training; demonstrate "pull" over "push" benefits |
| 🧩 **Chỉ hợp cùng 1 sản phẩm** | Nhiều sản phẩm độc lập → LeSS không (hoặc khó) áp dụng | LeSS Huge với Requirement Areas; hoặc dùng SAFe cho multi-product |
| 📐 **Cần kỷ luật integration** | 1 Increment chung → phối hợp CI/CD & merge thường xuyên | Automated CI/CD; trunk-based development |
| 🧠 **Hiếm coach giỏi** | LeSS ít phổ biến hơn SAFe → khó tìm chuyên gia | Train internal coaches; use SAFe for initial transformation then LeSS |
| 📏 **Khó đo lường cấp enterprise** | Không có "PI Objectives" equivalent | Use velocity across teams + system-level metrics |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| 2-8 team cùng làm 1 sản phẩm | ✅ Rất phù hợp | LeSS designed exactly for this; minimal overhead for coordination |
| Team tự chủ cao, giao tiếp tốt | ✅ Phù hợp | LeSS requires high autonomy; well-functioning teams thrive |
| Muốn scale Scrum mà không muốn cồng kềnh | ✅ Phù hợp | "Just Scrum, more teams" philosophy; no new ceremonies |
| Tổ chức văn hóa phân cấp nặng | ⚠️ Cân nhắc kỹ | LeSS lacks management layers that hierarchical orgs rely on |
| Nhiều sản phẩm độc lập | ❌ LeSS không hợp | Need separate product ownership; consider SAFe or separate Scrum teams |
| 50+ team, nhiều cấp quản lý | ❌ Cân nhắc SAFe | LeSS Huge has limits; beyond 8 teams, SAFe's structure may be necessary |
| Organization mới chuyển Agile | ⚠️ Cân nhắcSAFe first | SaFe has more structure and guidance for greenfield transformations |

---

## 🔗 Liên quan

- **5.2.1 Scrum** — LeSS là "Scrum gốc + nhiều team"
- **5.2.6 SAFe** — Cùng scale, khác triết lý (SAFe nhiều tầng, LeSS tối giản)
- **5.2.4 Lean** — Tư tưởng tối giản, trị waste hành chính
- **5.2.2 Kanban** — Có thể áp dụng trong luồng của từng team
- **5.1 Testing** — Shared DOD includes testing standards across teams

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.7-less/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng 3 team + 1 backlog + 1 sprint
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.7-less
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [LeSS Official Site](https://less.works/)
- 📖 [Large-Scale Scrum - Wikipedia](https://en.wikipedia.org/wiki/Large-scale_srum)
- 📖 [More with LeSS - Craig Larman & Bas Vodde](https://www.morewithless.net/)
- 📖 [Scaling Up Agility with LeSS - YouTube (keynote)](https://www.youtube.com/watch?v=l2YU5C0b05U)
- 📖 [Scrum Guide](https://scrumguides.org/)

---

## ⏭️ Bài tiếp theo

→ [5.2.8 Crystal](../5.2.8-crystal/README.md)
