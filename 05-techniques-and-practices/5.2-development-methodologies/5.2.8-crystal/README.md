# 💎 5.2.8 Crystal Agile Framework

> Gia đình các phương pháp luận Agile do **Alistair Cockburn** phát triển từ 1990s. Tập trung vào **con người, tương tác và sự phù hợp ngữ cảnh** thay vì quy trình cứng nhắc. Tư tưởng cốt lõi: **không có "one size fits all"** — quy trình phải vừa với dự án, không phải ngược lại.

---

## 🎯 Framework này là gì?

Crystal là **"family" chứ không phải 1 quy trình**. Ý tưởng cốt lõi: **mỗi dự án có ngữ cảnh riêng** (số người, độ nghiêm trọng của hệ thống) nên không thể "một size cho tất cả". Crystal cho bạn chọn **mức quy trình phù hợp** — từ nhẹ nhất (Crystal Clear) đến nặng hơn (Crystal Red).

**Crystal color coding** — mỗi màu tương ứng một mức độ quy trình:

| Màu | Quy mô team | Criticality hệ thống | Quy trình đặc trưng |
|-----|-------------|---------------------|---------------------|
| **Crystal Clear** | 1–8 người | Comfort (dễ chịu) | Reflection Workshop, Daily Sync — tối giản nhất |
| **Crystal Yellow** | ~10 người | Comfort/Discretionary | + Review Meetings, watching each other |
| **Crystal Orange** | ~20 người | Discretionary/Essential | + 7 project meetings, Test Plan, QA group |
| **Crystal Gold** | ~50 người | Essential | + Formal project management, process documentation |
| **Crystal Red** | ~100 người | Life-critical (sinh tử) | + QA group, strict process, wizard-level governance |
| **Crystal Clear (cho >100)** | >100 người | Life-critical | Requirement Areas, Area POs (tương tự LeSS Huge) |

**Criticality levels** (độ nghiêm trọng khi hệ thống lỗi):

| Level | Ví dụ | Mức độ trách nhiệm |
|-------|-------|---------------------|
| **Comfort** | Internal tool, personal productivity | Lỗi = phiền toái, không nguy hiểm |
| **Discretionary** | E-commerce, content site | Lỗi = mất revenue, mất niềm tin |
| **Essential** | Banking, trading platform | Lỗi = mất tiền thật, vi phạm regulation |
| **Life** | Medical device, aviation, nuclear | Lỗi = thương tích hoặc tử vong |

```
TRÁCH NHIỆM khi hệ thống lỗi ↑
  ┌────────────────────────────────────────────┐
  │  Life ★★★★     │ Red   │ Red   │ Red   │  │
  │  Essential ★★★ │ Orange│ Orange│ Red   │  │
  │  Discretionary★│ Clear │ Yellow│ Orange│  │
  │  Comfort ★     │ Clear │ Clear │ Yellow│  │
  └────────────────────────────────────────────┘
      1-8 người      10-20     20-50    50-100
                    QUY MÔ TEAM →
```

> 📌 **Đặc trưng:** Càng ít người + hệ thống càng nhẹ → **càng ít quy trình**. Crystal Clear có thể chỉ cần 1 buổi "reflection workshop"; Crystal Red cần thêm QA group, đóng gói quy trình đầy đủ.

---

## 🧩 4 Thuộc tính cốt lõi (Crystal Properties)

| Thuộc tính | Ý nghĩa | Biểu hiện trong project |
|------------|---------|------------------------|
| **Frequent Delivery** | Giao hàng thường xuyên → phản hồi sớm, tin tưởng | Release mỗi 1–4 tuần; working software là metric chính |
| **Reflective Improvement** | Nhìn lại & cải tiến định kỳ (reflection workshop) | Weekly/biweekly retro; "what worked, what didn't, what next" |
| **Osmotic Communication** | Ngồi gần nhau, "nghe trộm" tự nhiên → thông tin thẩm thấu | Open office; pair programming; không cần meeting để truyền đạt info |
| **Personal Safety** | An toàn tâm lý: nói thẳng, thử sai không bị trù | Psychological safety; blameless postmortem; experiment encouraged |

> 💡 **"Osmotic communication"** = đặt team ngồi chung, mọi người hít thở thông tin lẫn nhau — hiệu quả hơn meeting hùng hục. Research cho thấy ~50% information exchange trong team qua "overhearing" (natural listening), không qua scheduled meeting.

**Các Crystal variants khác:**

| Variant | Đặc điểm riêng | Khi nào dùng |
|---------|---------------|--------------|
| **Crystal Clear** | Không có quy trình bắt buộc; chỉ có principles | Team nhỏ, project đơn giản |
| **Crystal Half Duplex** | Communication one-direction at a time (like radio) | Remote teams, async preference |
| **Crystal Balloon** | "Expand when needed, deflate when not" — adaptive | Uncertain scope, exploratory projects |

---

## 🖼️ Minh họa demo code

Ví dụ [`examples/index.ts`](examples/index.ts) mô phỏng **phân loại Crystal** theo size + criticality:

```
Crystal Clear — app nội bộ nhỏ (6 người, Comfort)      → Clear
Crystal Yellow— e-commerce vừa (15 người)              → Yellow
Crystal Orange— ngân hàng (30 người, Essential)        → Orange
Crystal Red   — y tế điều khiển (60 người, Life)        → Red
```

- `CrystalProject` tính "màu" từ `teamCount` + `criticality`
- Criticality cao (Essential/Life) → tự "bump" thêm 1 bậc quy trình
- `coreProperties()` liệt kê 4 thuộc tính cốt lõi của Crystal

> 💡 Code mô phỏng quy trình, không phải ứng dụng thật. Chạy để thấy cách Crystal "tô màu" dự án.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Thực tế |
|---------|------------|---------|
| 🪶 **Cực kỳ linh hoạt** | Quy trình vừa đủ, không làm quá mức cần thiết | Tailored process = better fit than rigid framework |
| 👥 **Tập trung con người** | Con người & tương tác > quy trình & công cụ | Agile Manifesto principle #1: "Individuals and interactions over processes" |
| 🔍 **Phù hợp ngữ cảnh thật** | Không áp đặt quy trình "giống nhau" cho mọi dự án | Different projects have different needs; Crystal respects this |
| ⚡ **Ít tài liệu, ít ceremony** | Tiết kiệm tối đa cho team nhỏ | Fast setup; low overhead for simple projects |
| 🛡️ **An toàn tâm lý** | Team thử nghiệm, học hỏi, không sợ sai | Psychological safety → innovation, faster learning |
| 🎯 **Self-adapting** | Quy trình tự điều chỉnh theo growth | Start light, add process only when needed |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giảm thiểu |
|------------|------------|------------|
| 🧩 **Khó chuẩn hóa** | Không có quy trình "chuẩn" để audit hoặc nhân rộng nhanh | Create internal guidelines; document "our Crystal variant" |
| 🤝 **Phụ thuộc nhiều vào team** | Team chưa trưởng thành → Crystal dễ "chả có gì" | Ensure team has basic discipline; use as fallback |
| 🧠 **Cần người hiểu biết** | Phải biết "tinh chỉnh" quy trình cho vừa ngữ cảnh | Invest in experienced facilitator/coach |
| 📈 **Không phổ biến** | Ít công cụ, ít tài liệu, ít cộng đồng so với Scrum | Join Crystal community; read Cockburn's writings |
| 🔢 **Loại criticality mơ hồ** | Phân loại "Comfort/Discretionary..." mang tính phán đoán | Use structured risk assessment to justify criticality level |
| 📋 **Khó bán cho management** | "No process" sounds risky to executives | Show data: faster delivery, higher quality, lower cost |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Team nhỏ (1-8) muốn tối giản quy trình | ✅ Crystal Clear | Minimum overhead; maximum flexibility for small team |
| Hệ thống ít rủi ro, yêu cầu linh hoạt | ✅ Phù hợp | Comfort/Discretionary criticality = lighter process justified |
| Team trưởng thành, tự chủ cao | ✅ Phù hợp | Mature teams need less process; Crystal trusts them |
| Cần quy trình chuẩn để audit/ngành bị quản lý chặt | ⚠️ Cân nhắc Waterfall/Scrum | Regulated industries may require documented process |
| Tổ chức muốn chuẩn hóa 1 cách làm cho mọi dự án | ⚠️ Crystal phản lại tư duy này | Crystal's core philosophy is context-specific, not standardized |
| Dự án rất phức tạp, đội lớn (100+ người) | ⚠️ Cân nhắc Crystal Red + LeSS/SAFe hybrid | Crystal Red has governance but may need supplemental scaling |
| Startup, product exploration | ✅ Crystal Clear | Unknown domain demands maximum flexibility |

> 💡 **Crystal's motto:** "Select the simplest process that will allow the project to succeed." Không phải "least process possible" — mà là "least process needed". This is a crucial distinction.

---

## 🔗 Liên quan

- **5.2.3 XP** — Cùng phổ Agile kỹ thuật; XP nặng kỹ thuật, Crystal nặng ngữ cảnh
- **5.2.1 Scrum** — Crystal nhẹ hơn, không bắt buộc ceremony cố định
- **5.2.4 Lean** — Cùng tinh thần "làm vừa đủ, bỏ waste"
- **5.2.7 LeSS** — Cùng tư tưởng tối giản; LeSS có cấu trúc rõ hơn Crystal

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.8-crystal/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng phân loại Crystal theo size + risk
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.8-crystal
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Crystal Methods - Alistair Cockburn](https://en.wikipedia.org/wiki/Crystal_Clear_(software_development))
- 📖 [Crystal Methodology homepage (Cockburn)](https://alistair.cockburn.us/crystal-methods/)
- 📖 [Agile Manifesto](https://agilemanifesto.org/)
- 📖 [Art of Agile Development - James Shore & Shane Warden](https://www.artofagile.com/) — includes Crystal perspective
- 📖 [Why the Agile Manifesto Doesn't Mean What You Think It Means - Alistair Cockburn](https://alistair.cockburn.us/why-the-agile-manifesto-doesnt-mean-what-you-think-it-means/)

---

## ⏭️ Bài tiếp theo

→ [5.2.9 FDD](../5.2.9-fdd/README.md)
