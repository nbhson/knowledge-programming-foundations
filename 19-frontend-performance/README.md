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

## 💰 Ngân Sách Hiệu Năng (Performance Budget)

Đặt **ngưỡng cứng** trước khi tối ưu — không có budget thì mọi tranh luận "nhanh đủ chưa" đều cảm tính:

| Chỉ số | Ngân sách | Ý nghĩa |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Phần tử lớn nhất hiển thị xong |
| INP (Interaction to Next Paint) | < 200ms | Độ trễ tương tác tệ nhất (p75) |
| CLS (Cumulative Layout Shift) | < 0.1 | Trang không nhảy layout |
| TBT (Total Blocking Time) | < 200ms | Main thread không bị khóa lâu |
| JS (bundle) | < 170KB gzip | Ngưỡng thumbnail của Angular team, vẫn hợp lệ |

> Vượt budget = fail build (xem mục Performance Budget trong CI bên dưới).

---

## 🧪 Lab vs Field Data

| Loại | Công cụ | Ưu | Nhược |
|---|---|---|---|
| **Lab** | Lighthouse, Chrome DevTools | Lặp lại được, debug chi tiết, chạy trong CI | Đo trên máy test, không phải user thật |
| **Field** | CrUX (Chrome UX Report), RUM (Real User Monitoring) | Số liệu người dùng thật, phân vị p75 theo thiết bị/mạng | Cần traffic thật, ít chi tiết trace |

Vì sao **phải đo field**: lab đo trên máy dev/máy ảo cấu hình tốt — user thật dùng điện thoại 4 năm tuổi
trên mạng 3G. Google xếp hạng theo **field data p75** (CrUX), không theo Lighthouse của bạn.
Page bằng 100 điểm Lighthouse vẫn có thể LCP đỏ trên CrUX. Lab dùng để **chẩn đoán**, field để **quyết định**.

---

## 🛠️ Toolchain

| Tool | Vai trò |
|---|---|
| [web-vitals.js](https://github.com/GoogleChrome/web-vitals) | Thư viện JS đo LCP/INP/CLS ngay trong app → gửi về RUM endpoint |
| [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | Chạy audit tự động trong CI, chặn regression theo budget |
| [PageSpeed Insights](https://pagespeed.web.dev/) | Lab + field (CrUX) trong một báo cáo, không cần setup |
| Chrome DevTools Performance | Profiling chi tiết: CPU, layout shift, long tasks |

---

## ⚖️ So Sánh SSR / SSG / ISR / CSR / PPR

| | SSR | SSG | ISR | CSR | **PPR** (Partial Prerendering) |
|---|---|---|---|---|---|
| HTML sinh lúc | Mỗi request | Build | Build + revalidate | Browser (client) | Build (shell tĩnh) + streaming phần động |
| TTFB/FCP | Tốt | Tốt nhất | Tốt | Chậm | Tốt nhất (shell tĩnh trả ngay) |
| Nội dung động | ✅ | ❌ | Theo chu kỳ | ✅ (sau load) | ✅ (stream trong 1 request) |
| Tải server | Cao | Gần 0 | Gần 0 | Gần 0 | Gần 0 cho phần tĩnh |
| SEO | ✅ | ✅ | ✅ | Kém | ✅ |
| Dùng cho | Trang cá nhân hóa cần SEO | Blog, docs, landing | Catalog, tin tức | Dashboard, app nội bộ | Trang **trộn** tĩnh + động (Next.js 15+, 2024+) |

> Chi tiết PPR và RSC tại [19.1 Rendering Strategies](19.1-rendering-strategies/README.md).

---

## 🚦 Performance Budget Trong CI

Budget chỉ có tác dụng khi **chặn trong pipeline**, không phải tài liệu để "tham khảo":

```yaml
# Ví dụ Lighthouse CI trong GitHub Actions (khái niệm)
- run: npx @lhci/cli autorun
  # assertions: lcp < 2500ms, total-byte-weight < 170000, cls < 0.1
  # fail nếu vượt → PR không merge được
```

- Chạy Lighthouse CI trên mỗi PR so với baseline của branch chính — số liệu lab ổn định để diff.
- RUM (field) theo dõi dashboard riêng; cảnh báo khi p75 vượt budget ở production.
- Bundle size cũng là budget: fail build khi JS vượt 170KB gzip (xem [19.3 Bundling & Caching](19.3-bundling-caching/README.md)).

---

## ⏭️ Bài Tiếp Theo

→ [19.1 Rendering Strategies](19.1-rendering-strategies/README.md) — CSR/SSR/SSG/ISR và hydration.
