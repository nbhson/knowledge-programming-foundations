# ⚡ Lớp 19: Frontend Performance (Hiệu Năng Frontend)

> **Frontend Performance** quyết định người dùng ở lại hay rời đi:
> chiến lược render nào, Core Web Vitals bao nhiêu, bundle chia thế nào,
> ảnh/font tối ưu ra sao — tất cả đều đo được và cải thiện được.

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 19.1 | Rendering Strategies | CSR/SSR/SSG/ISR, hydration, ma trận chọn | [19.1-rendering-strategies](19.1-rendering-strategies/README.md) |
| 19.2 | Core Web Vitals | LCP/INP/CLS, mô phỏng đo, checklist | [19.2-core-web-vitals](19.2-core-web-vitals/README.md) |
| 19.3 | Bundling & Caching | Chunking, content-hash, long-term caching | [19.3-bundling-caching](19.3-bundling-caching/README.md) |
| 19.4 | Image & Font Optimization | Responsive images, font-display, checklist | [19.4-image-font-optimization](19.4-image-font-optimization/README.md) |

---

## 📖 Tổng Quan

```
┌─────────────────────────────────────────────────────────┐
│  19.1 RENDERING ──► HTML sinh ở đâu? (server/client/    │
│                     build-time) + hydration             │
│       │                                                 │
│       ▼                                                 │
│  19.2 CORE WEB VITALS ──► đo trải nghiệm thật           │
│       (LCP: tải • INP: tương tác • CLS: ổn định)         │
│       │                                                 │
│       ▼                                                 │
│  19.3 BUNDLING/CACHING ──► chia bundle + cache lâu      │
│       │                    bằng content hash            │
│       ▼                                                 │
│  19.4 IMAGE/FONT ──► 2 asset nặng nhất trang            │
│       (responsive + modern format + font-display)       │
└─────────────────────────────────────────────────────────┘
```

| Leaf | Câu hỏi trả lời |
|---|---|
| 19.1 Rendering | Trang này nên CSR, SSR, SSG hay ISR? |
| 19.2 Web Vitals | Trang có "nhanh" theo chuẩn Google không? |
| 19.3 Bundling | Làm sao deploy mới mà user vẫn dùng cache cũ? |
| 19.4 Image/Font | Vì sao ảnh 5MB và font render-blocking giết performance? |

---

## 🗺️ Lộ Trình Học

1. **19.1**: chọn chiến lược render trước khi viết code — quyết định này ảnh hưởng mọi thứ phía sau.
2. **19.2**: học cách đo (LCP/INP/CLS) để mọi tối ưu đều có số liệu.
3. **19.3 → 19.4**: tối ưu tài sản nặng nhất: JS bundle, rồi ảnh và font.

Thứ tự gợi ý: `19.1 → 19.2 → 19.3 → 19.4`.

---

## ▶️ Chạy Ví Dụ

```bash
# Mô phỏng chọn rendering + build routing
cd 19-frontend-performance/19.1-rendering-strategies
npx ts-node examples/index.ts

# Mô phỏng đo Web Vitals
cd ../19.2-core-web-vitals
npx ts-node examples/index.ts
```

Mọi ví dụ thuần TypeScript, strict ES2020, mô phỏng bằng số liệu, không cần trình duyệt.

---

## ⏭️ Bài Tiếp Theo

→ [19.1 Rendering Strategies](19.1-rendering-strategies/README.md) — CSR/SSR/SSG/ISR và hydration.
