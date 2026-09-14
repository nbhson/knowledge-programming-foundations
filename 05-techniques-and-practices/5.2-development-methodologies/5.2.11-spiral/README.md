# 🌀 5.2.11 Spiral Model (Mô Hình Xoắn Ốc)

> Kết hợp tính lặp lại (iterative) của Agile và tính kiểm soát của Waterfall. **Phân tích rủi ro (Risk Analysis)** là trọng tâm ở mọi vòng xoắn. Được **Barry Boehm** giới thiệu năm 1986 trong paper "A Spiral Model of Software Development and Enhancement" — một trong những model rủi ro-driven sớm nhất.

---

## 🎯 Mô hình này là gì?

Barry Boehm giới thiệu Spiral Model để khắc phục điểm yếu của Waterfall: **rủi ro chỉ lộ ra ở cuối**. Spiral chia phát triển thành nhiều **vòng xoắn (loops)**; qua mỗi vòng, 4 hoạt động lặp lại — trong đó **Risk Analysis là "động cơ"** quyết định mình làm, làm prototype gì, hay dừng.

**Ý tưởng then chốt:** Mỗi vòng xoắn đại diện cho một giai đoạn phát triển, và mỗi giai đoạn đều bắt đầu với **risk analysis**. Nếu rủi ro quá cao và không thể giảm → dừng dự án (hoặc pivot), thay vì đầu tư toàn bộ vào hướng sai.

```
┌───────────────────────────────────────────────────────────────┐
│              SPIRAL MODEL — 1 vòng = 4 quadrants              │
│                                                               │
│    ① Determine Objectives        ② Identify & Resolve Risks  │
│       (mục tiêu, phương án,          (đánh giá rủi ro,         │
│        ràng buộc)                    prototype giảm rủi ro)    │
│            └──────────────┐  ┌───────────────┘                │
│                           ▼  ▼                                │
│    ④ Plan Next Phase  ◀── [phát triển] ──▶  ③ Development &   │
│       (lập kế hoạch vòng     │              Testing (phiên   │
│        tiếp theo, đánh giá    │              bản+test)         │
│        kết quả, tổng)        ┘                               │
│                                                               │
│  Độ hoàn thiện sản phẩm  ↑ theo từng vòng                    │
│  Mức rủi ro chưa xử lý    ↓ theo từng vòng                    │
└───────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Không có "vòng kết thúc ấn định" — cứ lặp tới khi rủi ro chấp nhận được và mục tiêu đạt; nếu rủi ro quá lớn, dự án có thể **dừng sớm** mà không tốn quá nhiều.

**4 Quadrants của mỗi vòng:**

| # | Quadrant | Hoạt động chính | Câu hỏi then chốt |
|---|----------|-----------------|-------------------|
| 1 | **Determine Objectives** | Chốt mục tiêu, liệt kê giải pháp thay thế, ràng buộc | "We want to achieve X, under constraints Y, with alternatives Z" |
| 2 | **Identify & Resolve Risks** | Phân tích & đánh giá rủi ro; làm **prototype/mô phỏng** cho rủi ro cao | "What could go wrong? How do we test the assumption?" |
| 3 | **Development & Testing** | Phát triển và kiểm thử phiên bản tiếp theo của sản phẩm | "Build the thing we're confident about now" |
| 4 | **Plan Next Phase** | Đánh giá kết quả, lập kế hoạch vòng lặp sau | "What did we learn? What's next? Do we continue or stop?" |

---

## 🧩 Risk Analysis — trái tim của Spiral

**Các loại rủi ro phổ biến trong software projects:**

| Loại rủi ro | Ví dụ | Cách giảm thiểu (trong Spiral) |
|-------------|-------|-------------------------------|
| **Technical risk** | Công nghệ mới chưa stabilize, performance达不到 | Prototype technical spike; proof-of-concept trước khi commit |
| **Schedule risk** | Deadline không thực tế, scope không rõ | Early validation of timeline with stakeholders |
| **Cost risk** | Budget không đủ cho scope thực | Phased funding; go/no-go gates mỗi vòng |
| **Requirements risk** | Hiểu sai nhu cầu user | User prototype; iterative requirements gathering |
| **Resource risk** | Key person离开, team thiếu skill | Knowledge sharing; cross-training; backup plan |
| **External risk** | Regulation change, market shift | Monitor外部环境; flexibility in scope |

**Quy tắc vàng Spiral:** Nếu risk assessment ở quadrant 2 cho thấy rủi ro > threshold → **không tiếp tục build**,而是做 thêm prototype hoặc dừng.

---

## 🖼️ Minh họa demo code

Ví dụ [`examples/index.ts`](examples/index.ts) mô phỏng **3 vòng xoắn** của dự án giám sát IoT:

```
Vòng 1: Xác thực tính khả thi IoT
  🔴 Rủi ro cao: cảm biến chưa có nguồn cung → prototype đánh giá khả thi
Vòng 2: Prototype giám sát 10 thiết bị
  🔴 Rủi ro cao: độ trễ cảm biến tăng → làm mô phỏng trước khi build
  🟡 Rủi ro vừa: bảo mật MQTT → thử nghiệm sớm
Vòng 3: Bản đầy đủ 100 thiết bị + cảnh báo + dashboard
  🟢 Rủi ro thấp → build chính thức
```

- `SpiralLoop` gom đủ 4 quadrants của một vòng
- `addRisk()` gán mức rủi ro; rủi ro `high` luôn phải xử lý bằng prototype/mô phỏng
- `planNextPhase()` đẩy rủi ro tồn đọng sang vòng sau

> 💡 Code mô phỏng quy trình, không phải ứng dụng thật. Chạy để thấy "rủi ro cao → giảm rủi ro bằng prototype" lặp qua từng vòng.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Thực tế |
|---------|------------|---------|
| 🛡️ **Quản lý rủi ro xuất sắc** | Rủi ro lớn được phát hiện & xử lý sớm nhất | Early risk identification saves 30–50% of potential project cost overruns |
| 🔄 **Vừa iterative vừa có kiểm soát** | Có milestone & đánh giá rõ như Waterfall, lặp như Agile | Best of both worlds: control + flexibility |
| 🧪 **Thất bại sớm còn rẻ** | Prototype/mô phỏng thay vì đầu tư toàn bộ ngay | Fail fast, fail cheap — $10k prototype vs $1M wrong build |
| 🛠️ **Linh hoạt trong công nghệ** | Thích hợp dự án công nghệ mới/chưa rõ | Can adapt when technology choices are uncertain |
| 🛑 **Điểm dừng sớm an toàn** | Có thể chấm dứt trước khi thâm hụt lớn | Kill switches at each quadrant 4 review — no sunk cost fallacy trap |
| 📊 **Visible progress** | Mỗi vòng có output rõ ràng (prototype, demo) | Stakeholders see progress; confidence builds incrementally |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giảm thiểu |
|------------|------------|------------|
| 🐢 **Tốn kém & nặng nề** | Mỗi vòng đòi hỏi đánh giá rủi ro chi tiết → chậm | Streamline risk analysis; don't over-document; focus on high-risk areas |
| 🧠 **Cần chuyên gia rủi ro** | Không phải ai cũng phân tích rủi ro tốt | Hire/train risk analyst; use checklist-based risk assessment |
| 📉 **Khó ước lượng tổng** | Không rõ cần bao nhiêu vòng → hợp đồng công khó chốt | Use probabilistic estimates; communicate range not point estimate |
| 📄 **Tài liệu nhiều** | Mỗi vòng có review & báo cáo rủi ro riêng | Template-driven documentation; automate reports |
| 🔀 **Khó quản lý trong team lớn** | Quy trình phức tạp, nhiều bên liên quan | Clear roles; dedicated risk management function |
| 🏢 **Management resistance** | Executive thích "fix date, fix scope" → Spiral's uncertainty scares them | Educate leadership on risk management value; start with pilot project |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Dự án công nghệ mới, nhiều rủi ro, chưa chắc chắn | ✅ Rất phù hợp | Spiral's core strength — risk-driven iteration for uncertain terrain |
| Hệ thống lớn, độ phức tạp cao | ✅ Phù hợp | Multiple spirals allow gradual complexity ramp-up |
| Mục tiêu mơ hồ cần dần bóc tỏa | ✅ Phù hợp | Each spiral clarifies objectives; discovery is built into process |
| Dự án government/defense contract | ✅ Phù hợp | Risk management required by procurement regulations |
| Scope rõ ràng, ít rủi ro, deadline gấp | ❌ Waterfall/Agile đơn giản hơn | Overkill to use Spiral for low-risk projects |
| Team nhỏ cần chạy nhanh | ❌ Quá nặng — dùng Scrum/Kanban | Spiral overhead too high for small/fast teams |
| Startup, product discovery | ❌ Cân nhắc Crystal/Lean Startup | Spiral is too formal; lean experimentation更适合 |

---

## 🔗 Liên quan

- **5.2.5 Waterfall** — Spiral là "Waterfall + vòng lặp + Risk Analysis" để vá điểm yếu
- **5.2.12 RAD** — Cùng triết lý prototype nhanh để giảm rủi ro hiểu sai
- **5.2.10 DSDM** — Iterative + timebox kiểu DSDM có thể ghép với tư duy Spiral
- **5.2.4 Lean** — Tinh thần "thất bại sớm, học nhanh" trong việc chọn phương án
- **5.2.1 Scrum** — Spiral có thể xem như "meta-framework" bao trùm Scrum iterations

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.11-spiral/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng 3 vòng xoắn + risk analysis
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.11-spiral
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Spiral Model - Wikipedia](https://en.wikipedia.org/wiki/Spiral_model)
- 📖 [A Spiral Model of Software Development and Enhancement - Barry Boehm (1986)](https://doi.org/10.1145/12944.12948) — original paper
- 📖 [SEI - The Spiral Model](https://insights.sei.cmu.edu/blog/the-spiral-model/)
- 📖 [Software Engineering Economics - Barry Boehm](https://www.ise.ksu.edu/~ Boehm/78se.pdf)

---

## ⏭️ Bài tiếp theo

→ [5.2.12 RAD](../5.2.12-rad/README.md)
