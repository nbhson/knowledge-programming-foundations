# 🏗️ 5.2.9 Feature-Driven Development (FDD)

> Phương pháp Agile tập trung vào **xây dựng phần mềm theo từng tính năng cụ thể (feature)**, kết hợp thiết kế hướng đối tượng (OO Design) và quy trình ngắn hạn (2 tuần/feature). Được phát triển bởi **Jeff De Luca** và **Peter Coad** (1997), áp dụng thành công tại Singapore Đại Hà (Great River) và many large Java projects.

---

## 🎯 Phương pháp này là gì?

FDD do Jeff De Luca và Peter Coad đề xuất. Khác với Scrum chia work theo "user story" và XP nhấn mạnh technical practice, FDD chia work theo **feature** — mỗi feature là một hành vi nhỏ, có giá trị, viết theo khuôn mẫu:

> **`<action> the <result> for a/an <object>`**
> Ví dụ: "Calculate the total for this order", "Check the stock for a product".

Vì feature nhỏ và mô tả hành vi → tiến độ **đếm được** (bao nhiêu feature đã done) và **demo được** ngay.

**Điểm khác biệt then chốt giữa FDD và Scrum:**
- Scrum: item trong backlog là **User Story** (mô tả nhu cầu từ perspective user)
- FDD: item trong backlog là **Feature** (mô tả hành vi cụ thể của system, OO-style)
- FDD dành thời gian cho **domain modeling** trước khi code — Scrum thường làm sau

```
┌──────────────────────────────────────────────────────────────────┐
│                        FDD — 5 PROCESSES                         │
│                                                                  │
│  1. Develop Overall Model        ← domain model tổng thể         │
│  2. Build Feature List           ← features nhỏ, có giá trị      │
│  3. Plan by Feature              ← phân công & lịch theo feature │
│  4. Design by Feature            ← class diagram cho cụm nhỏ     │
│  5. Build by Feature             ← code + test + integrate       │
│                                                                  │
│  MỖI FEATURE = 1 milestone nhìn thấy (đếm tiến độ thực)          │
└──────────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** "Build by Feature" mỗi batch 2 tuần — không phải sprint đa mục tiêu mà là cụm vài feature nhỏ đi từ design đến integrate. Progress = % feature completed, không phải % sprint completed.

---

## 🧩 5 Bước trong FDD — chi tiết

| # | Bước | Hoạt động | Output | Người chủ trì |
|---|------|-----------|--------|---------------|
| 1 | **Develop Overall Model** | Dựng domain model tổng thể (OO, ngắn gọn), xác định classes và relationships | Class diagram level cao | Chief Architect |
| 2 | **Build Feature List** | Phân rã hệ thống thành feature nhỏ theo khuôn mẫu `<action> <result> <object>` | Feature list (ordered by domain complexity) | Domain Expert + Architect |
| 3 | **Plan by Feature** | Sắp thứ tự, gán chủ sở hữu (Class Owner), lập lịch theo feature | Feature plan (who does what, when) | Project Manager + Class Owners |
| 4 | **Design by Feature** | Thiết kế chi tiết cho nhóm feature nhỏ: class diagram, sequence diagram, algorithm | Design packages | Class Owner + Chief Architect |
| 5 | **Build by Feature** | Code, peer review, test, integrate → demo | Completed features (counted as progress) | Class Owner + Developers |

**Phân rã feature — rules of thumb:**
- Feature cỡ **1–5 ngày work** cho 1 developer
- Nếu > 5 ngày → chưa nhỏ đủ, cần phân rã thêm
- Nếu < 1 ngày → quá nhỏ, gom vào feature khác
- "Feature nhỏ cỡ nào?": Nếu 1 structure-class + 2-10 method thì là 1 "feature"

**Vai trò đặc thù của FDD:**

| Role | Trách nhiệm |
|------|-------------|
| **Chief Architect** | overall design, model validation, design reviews |
| **Domain Expert** | business knowledge, feature definition, acceptance |
| **Project Manager** | planning, tracking, reporting (not controlling) |
| **Class Owner** | responsible for specific classes/features (primary coder) |
| **Feature Team** | 2–3 developers per feature, collaborative coding |
| **Language Master** | coding standards, best practices advocate |

---

## 🖼️ Minh họa demo code

Ví dụ [`examples/index.ts`](examples/index.ts) mô phỏng **toàn bộ 5 bước FDD**:

```
1️⃣ Develop Overall Model: Khách hàng · Đơn hàng · Sản phẩm · Giỏ hàng
2️⃣ Build Feature List:
   • "Check the stock for a product"
   • "Add a product for this order"
   • "Calculate the total for this order"
3️⃣ Plan by Feature: gán owner (Mai/Huy/An)
4️⃣ Design by Feature: Entity, Repository, Service, Controller
5️⃣ Build by Feature: từng feature ✅ done + tích hợp + demo được
   → Progress: 4/4 feature built (100%)
```

- `FddProject.addFeature()` dùng khuôn mẫu `<action> <result> <object>`
- `planByFeature()`, `designByFeature()`, `buildByFeature()` mô phỏng 3 bước cuối
- `progress()` đếm `built/total` — tiến độ THEO FEATURE, đọc hiểu ngay

> 💡 Code mô phỏng quy trình, không phải ứng dụng thật. Chạy để thấy "feature" làm milestone.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Thực tế |
|---------|------------|---------|
| 📊 **Tiến độ dễ theo dõi** | Đếm feature has done — metric trực quan, đáng tin | Management thấy "75% features done" thay vì "sprint 3/4" |
| 🎯 **Mô hình domain tốt** | Bước 1 dành thời gian cho domain model → nền vững | Giảm architectural debt; system structure clear from start |
| 🔍 **Feature rõ ràng cho cả dev & business** | Khuôn mẫu `<action> <result> <object>` ai cũng đọc được | Business stakeholders hiểu được what is being built |
| 🔄 **Vòng giao ngắn** | Mỗi batch 2 tuần, feature được demo thường xuyên | Feedback loop ngắn; early validation of assumptions |
| 👥 **Vai trò chủ feature (class owner)** | Trách nhiệm rõ, tránh "cả team không ai nhận" | High accountability; ownership culture |
| 🏗️ **OO design naturally fits** | Feature-driven decomposition aligns with object-oriented thinking | Java/.NET teams find FDD intuitive |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giảm thiểu |
|------------|------------|------------|
| 🏗️ **Cần kỹ năng OO/domain modeling cao** | Bước 1 & 4 đòi hỏi senior architects | Invest in architect training; use experienced chief architect |
| 🪶 **Ít chú trọng quy trình team** | FDD không quy định meeting, công cụ, retro như Scrum | Add Scrum ceremonies (daily standup, retro) as supplement |
| 📋 **Feature list có thể phình to** | Nếu tách feature quá nhỏ → hàng trăm feature, khó quản | Set feature size boundary (1–5 days); use hierarchy (feature → sub-feature) |
| 🤷 **Văn hóa "owner" có thể cô lập dev** | Mỗi người ôm feature riêng, ít pairing | Encourage cross-feature collaboration; pair programming optional |
| 📉 **Phổ biến hạn chế** | Ít team dùng → ít bài học/tài liệu thực chiến | Join FDD community; learn from case studies (Great River, etc.) |
| 🔄 **Less flexible to change** | Domain model upfront can resist change | Keep model lightweight; refine iteratively |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Domain nghiệp vụ phức tạp, cần model rõ ràng | ✅ Rất phù hợp | FDD's first step (domain modeling) excels here; complexity managed by clear structure |
| Muốn tiến độ "đếm được" theo hành vi | ✅ Phù hợp | Feature count = concrete progress metric; executive-friendly reporting |
| Đã có sẵn hạ tầng kiến trúc OO tốt | ✅ Phù hợp | Java/.NET teams with OO culture adopt FDD naturally |
| Dự án lớn (> 10 developers), nhiều modules | ✅ Phù hợp | Class Owner model scales; clear ownership prevents confusion |
| Team thiếu senior OO/domain modeling | ⚠️ Gặp khó ở bước 1 & 4 | Invest in training or hire architect; don't skip domain modeling |
| Cần quy trình team đầy đủ (ceremony, retro) | ⚠️ Kết hợp FDD + Scrum-like process | Use FDD for feature tracking, Scrum for team process |
| Startup, unknown domain, rapid pivoting | ❌ Cân nhắc Scrum/Kanban | FDD's upfront modeling assumes some domain stability |

---

## 🔗 Liên quan

- **5.2.3 XP** — Bổ sung kỷ luật kỹ thuật (TDD, CI) cho "Build by Feature"
- **5.2.1 Scrum** — Nhiều team dùng "Scrum process + FDD feature" để có cả 2
- **5.2.8 Crystal** — Cùng tư tưởng "quy trình tùy ngữ cảnh, focused on people"
- **04-paradigms/4.1-oop** — Nền tảng kỹ thuật: OOP & class design
- **01-architecture/1.3-clean-architecture** — Domain modeling overlap

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.9-fdd/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng 5 bước FDD
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.9-fdd
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Feature-Driven Development - Wikipedia](https://en.wikipedia.org/wiki/Feature-driven_development)
- 📖 [A Practical Guide to Feature-Driven Development - Stephen Palmer & John Felsing](https://www.amazon.com/Practical-Guide-Feature-Driven-Development/dp/0130676152)
- 📖 [FDD and Agile - Jeff De Luca](https://www.featuredrivendevelopment.com/)
- 📖 [Object-Oriented Software Construction (OOSS) - Bertrand Meyer](https://en.wikipedia.org/wiki/Object-Oriented_Software_Construction) — foundational for FDD's OO approach

---

## ⏭️ Bài tiếp theo

→ [5.2.10 DSDM](../5.2.10-dsdm/README.md)
