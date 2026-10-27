# 📊 19.2 Core Web Vitals (Chỉ Số Web Cốt Lõi)

> **Google chấm điểm trải nghiệm thật bằng 3 số:** LCP (tải xong chưa),
> INP (bấm có ăn ngay không), CLS (trang có nhảy loạn không) — rớt là rớt SEO.

---

## 🎯 Vấn Đề

"Trang tôi nhanh" thường là cảm giác trên máy dev mạng xịn. User thật dùng 4G + điện thoại yếu:
ảnh hero 5MB kéo LCP lên 6s, JS main-thread bận kéo INP lên 800ms, banner chèn muộn đẩy CLS lên 0.3 —
mỗi chỉ số rớt ngưỡng là tụt hạng tìm kiếm và tăng bounce rate có đo được.

```
LCP (Largest Contentful Paint):  phần tử lớn nhất hiện trong viewport — mục tiêu ≤ 2.5s
INP (Interaction to Next Paint): p75 độ trễ từ thao tác → frame tiếp theo — mục tiêu ≤ 200ms
CLS (Cumulative Layout Shift):   tổng độ dịch layout bất ngờ — mục tiêu ≤ 0.1
```

---

## 💻 Code Ví Dụ

```typescript
// Ngưỡng chuẩn Google (2024+): tốt / cần cải thiện / kém
interface Threshold { good: number; poor: number; unit: string }

const THRESHOLDS: Record<"LCP" | "INP" | "CLS", Threshold> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "" },
};

type Rating = "good" | "needs-improvement" | "poor";

function rate(metric: "LCP" | "INP" | "CLS", value: number): Rating {
  const t = THRESHOLDS[metric];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

// CLS mô phỏng: tổng impact × distance của các lần dịch layout bất ngờ
interface LayoutShift { impactFraction: number; distanceFraction: number }

function computeCls(shifts: LayoutShift[]): number {
  return shifts.reduce((sum, s) => sum + s.impactFraction * s.distanceFraction, 0);
}
```

> Mô phỏng đo đầy đủ (LCP/INP/CLS + rating + checklist tối ưu theo từng chỉ số) trong
> `examples/index.ts` — chạy bằng `npx ts-node examples/index.ts`.

---

## ✅ Lợi Ích

| Chỉ số | Tối ưu đúng thì được gì |
|---|---|
| LCP ≤ 2.5s | User thấy nội dung chính nhanh (preload hero, nén ảnh, CDN) |
| INP ≤ 200ms | Thao tác phản hồi ngay (chia task JS, debounce, worker) |
| CLS ≤ 0.1 | Không bấm nhầm do layout nhảy (size cố định, font fallback) |

---

## ⚠️ Lưu Ý

- Đo **p75 trên dữ liệu thực** (CrUX/RUM), không chỉ Lighthouse lab một lần.
- Tối ưu sai chỉ số = phí công: LCP kém mà đi chia JS nhỏ hơn không giúp gì.
- Third-party (ads, chat widget, analytics) là thủ phạm INP/CLS hàng đầu — audit định kỳ.

---

## 🎯 Khi Nào Dùng

- Mọi trang public: gắn RUM đo LCP/INP/CLS, đặt budget trong CI (Lighthouse CI).
- Review PR thêm ảnh/script/font mới: hỏi "nó ảnh hưởng vitals nào?".
- Trang rớt SEO không rõ lý do: mở PageSpeed Insights xem vitals trước.

---

## 🔗 Liên Quan

- [19.1 Rendering Strategies](../19.1-rendering-strategies/README.md) — SSR/SSG cải thiện LCP.
- [19.3 Bundling & Caching](../19.3-bundling-caching/README.md) — bundle nhẹ cải thiện INP.
- [19.4 Image & Font Optimization](../19.4-image-font-optimization/README.md) — 2 thủ phạm LCP/CLS lớn nhất.

---

## 📚 Tài Liệu

- 📖 [web.dev: Web Vitals](https://web.dev/articles/vitals)
- 📖 [PageSpeed Insights](https://pagespeed.web.dev/)
- 📖 [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

## ⏭️ Bài Tiếp Theo

→ [19.3 Bundling & Caching](../19.3-bundling-caching/README.md)
