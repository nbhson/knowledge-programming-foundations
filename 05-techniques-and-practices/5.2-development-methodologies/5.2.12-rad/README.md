# 🚀 5.2.12 Rapid Application Development (RAD)

> Nhấn mạnh **tốc độ phát triển nhanh** thông qua việc xây dựng **prototype liên tục**, nhận phản hồi từ khách hàng và tái sử dụng linh kiện/code. Giới thiệu bởi **James Martin** (1991), phản ứng lại Waterfall's tài liệu-nặng và chậm chạp.

---

## 🎯 Mô hình này là gì?

RAD chống lại tư duy Waterfall "tài liệu trước, code sau": thay vì đặc tả khổng lồ, bạn **dựng prototype NGAY**, để user dùng thử, gom feedback, rồi mới build chính thức. Kết quả là **vòng lặp "dựng - dùng thử - sửa"** rất nhanh.

**RAD khác Agile ở đâu?**
- RAD tập trung vào **tốc độ prototype** và **user participation** — ít nói về values/principles
- Agile (Scrum/XP) có **framework structure** (sprint, roles, ceremonies) — RAD là **technique-driven** approach
- RAD có thể được xem như "proto-Agile" — ý tưởng tương tự nhưng đến trước Agile Manifesto 9 năm

```
┌──────────────────────────────────────────────────────────────────┐
│                  RAD — 4 PHA VỚI VÒNG PROTOTYPE                 │
│                                                                  │
│  1. Requirements Planning  ──▶ chốt mục tiêu tổng quan (ngắn)   │
│            │                                                    │
│            ▼                                                    │
│  2. User Design            ──▶ dựng prototype nhanh             │
│            │                    │                               │
│            │      ▲─────────────┘                               │
│            │      │ (chưa duyệt → sửa prototype, không đè code) │
│            ▼      │                                             │
│  3. Rapid Construction    ◀─── prototype ĐÃ DUYỆT → build chính │
│            │                 thức + dùng component tái sử dụng  │
│            ▼                                                    │
│  4. Cutover               ──▶ integration, test, chuyển giao    │
└──────────────────────────────────────────────────────────────────┘
```

> 📌 **Đặc trưng:** Chia module nhỏ, xây **song song** (parallel) với các nhóm; dùng **công cụ sinh code & component có sẵn** để tăng tốc; yêu cầu **user tham gia liên tục**.

---

## 🧩 4 Pha chính trong RAD

| # | Pha | Hoạt động | Đầu ra | Thời gianTypical |
|---|-----|-----------|--------|------------------|
| 1 | **Requirements Planning** | Hội thảo ngắn (javelin session), chốt mục tiêu & scope tổng quan | Scope mô-tả ngắn gọn (1–2 pages) | 1–3 ngày |
| 2 | **User Design (Prototyping)** | Dựng prototype nhanh, user dùng thử & phản hồi → lặp | Prototype + feedback → iterate until approved | Days–weeks (many iterations) |
| 3 | **Rapid Construction** | Build chính thức dựa trên prototype đã duyệt; dùng component tái sử dụng | Modules hoàn chỉnh, tested | Weeks |
| 4 | **Cutover** | Integration, testing, deployment, training, chuyển giao | Hệ thống vận hành | Days–weeks |

**Javelin Session** (Requirements Planning workshop format):
- All stakeholders (user, developer, manager) in cùng room
- Facilitated session để capture requirements
-产出: high-level scope document, not detailed spec
- Key: user có mặt đầy đủ, ra quyết định ngay

**Pha 2 là trái tim RAD:** Vòng prototype lặp cho đến khi user nói "đây là cái tôi muốn". Mỗi iteration: build → test với user → feedback → sửa → repeat. Thông thường 2–5 vòng trước khi "approve".

---

## 🖼️ Minh họa demo code

Ví dụ [`examples/index.ts`](examples/index.ts) mô phỏng **4 pha + vòng lặp prototype**:

```
1️⃣ Requirements Planning: "Hệ thống quản lý kho (MVP)"
2️⃣ Prototype v1 → user feedback:
      💬 "Giao diện khó nhìn" / "Chưa có tìm kiếm nhanh" / "Muốn xuất Excel"
    → CHƯA DUYỆT → vòng prototype v2
    Prototype v2 → feedback ít → ✅ DUYỆT
3️⃣ Rapid Construction — build chính thức từ prototype đã duyệt
4️⃣ Cutover — tích hợp + test + chuyển giao
```

- `RadProject` quản lý các vòng `PrototypeVersion` (version + feedback + approved)
- `buildPrototype()` mô phỏng user test; feedback nhiều → chưa duyệt
- `rapidConstruction()` và `cutover()` mô phỏng 2 pha cuối

> 💡 Code mô phỏng quy trình, không phải ứng dụng thật. Chạy để thấy vòng "prototype → feedback → duyệt".

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Thực tế đo được |
|---------|------------|-----------------|
| ⚡ **Tốc độ cực nhanh** | Prototype + component reuse thay vì đặc tả khổng lồ | Time-to-MVP: 2–8 tuần thay vì 3–6 tháng (Waterfall) |
| 💬 **Người dùng thấy sản phẩm sớm** | Không chờ "cuối dự án" mới thấy | User sees working system trong tuần đầu tiên |
| 🔄 **Bắt sai yêu cầu rất sớm** | Feedback xuyên suốt → ít đổ bể ở cuối | Requirement mismatch phát hiện ở prototype phase (~1% cost) thay vì post-build (~100% cost) |
| 🧩 **Build song song được** | Chia module nhỏ → nhiều nhóm cùng làm | Parallel development → overall project time giảm |
| 📉 **Ít tài liệu nặng nề** | Chỉ cần tài liệu vừa đủ, tập trung prototype | Documentation overhead giảm 50–70% so với Waterfall |
| 🎯 **User satisfaction cao** | User参与了 design → feel ownership | Higher adoption rates; fewer "this is not what I wanted" moments |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giảm thiểu |
|------------|------------|------------|
| 📈 **Khó scale dự án lớn** | Prototype & build nhanh không hợp hệ thống khổng lồ/phân tán | Use RAD cho module nhỏ; kết hợp với architecture framework cho phần lớn |
| 🏛️ **Kiến trúc dễ kém** | Vội vàng → nợ kỹ thuật, thiết kế thiếu tầm nhìn | Dành thời gian cho architectural prototype; don't skip design entirely |
| 👥 **Phụ thuộc user tham gia** | User bận/không góp mặt → vòng lặp nghẽn | Secure executive commitment for user availability; alternative: proxy user |
| 🧠 **Chất lượng phụ thuộc team** | Đội đòi hỏi giàu kinh nghiệm component/công cụ | Invest in skilled team; use proven frameworks and components |
| 🐢 **Không hợp module ít tương tác UI** | Phần lõi thuật toán/phức tạp thì RAD chẳng lợi gì | Use RAD cho UI/presentation layer; khác approach cho core algorithms |
| 📋 **Documentation gap** | Fast pace → docs lag behind → maintenance hard | Automated docs (code comments, API docs); lightweight documentation standards |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Dự án ngắn (vài tháng), team nhỏ | ✅ Rất phù hợp | RAD shines in short-duration projects; quick turnaround |
| Yêu cầu UI rõ, giao diện là trọng tâm | ✅ Rất phù hợp | Visual prototyping best for UI-heavy systems |
| Khách hàng sẵn sàng tham gia test prototype | ✅ Phù hợp | User involvement là condition sine qua non của RAD |
| Hệ thống lõi phức tạp, kiến trúc lớn, nhiều rủi ro | ❌ Cân nhắc Spiral | Core complexity better handled with risk-analysis-driven approach |
| Dự án đòi hỏi audit/tài liệu chuẩn hóa | ⚠️ Tài liệu mỏng có thể không đủ | Add documentation requirements to RAD process; hybrid approach |
| Distributed team, user không có mặt | ❌ RAD khó thành công | RAD cần user participation; distributed setting undermines it |

---

## 🔗 Liên quan

- **5.2.10 DSDM** — Cùng chia sẻ triết lý prototype + user tham gia + fixed deadline
- **5.2.11 Spiral** — Dùng cho dự án rủi ro cao hơn RAD
- **5.2.5 Waterfall** — RAD là "phản ứng" chống lại Waterfall tài-liệu-nặng
- **5.2.9 FDD** — Cả 2 đều "giao thành phần nhỏ thấy được" (RAD: module; FDD: feature)
- **5.1 Testing** — Test liên tục trong "Rapid Construction" để giữ chất lượng
- **5.2.1 Scrum** — Scrum có thể xem là "structured RAD" — có ceremony và iteration

---

## 📁 Cấu trúc thư mục ví dụ

```
5.2.12-rad/
├── README.md           # File này
└── examples/
    └── index.ts        # Mô phỏng 4 pha + vòng lặp prototype
```

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.2-development-methodologies/5.2.12-rad
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Rapid Application Development - Wikipedia](https://en.wikipedia.org/wiki/Rapid_application_development)
- 📖 [RAD: Rapid Application Development - James Martin](https://www.amazon.com/Rapid-Application-Development-James-Martin/dp/0023767756)
- 📖 [Agile vs RAD - AltexSoft](https://www.altexsoft.com/blog/business/rapid-application-development/)
- 📖 [JAD (Joint Application Development) - Wikipedia](https://en.wikipedia.org/wiki/Joint_application_development) — related RAD technique

---

## ⏭️ Bài tiếp theo

Phần này đã kết thúc 12 phương pháp phát triển. → [Quay về 5.2 Development Methodologies](../README.md)
