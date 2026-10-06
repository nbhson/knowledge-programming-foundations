# 🖼️ 19.4 Image & Font Optimization (Tối Ưu Ảnh & Font)

> **Ảnh và font là 2 asset nặng nhất trang:** ảnh sai kích cỡ tốn MB vô ích,
> font chặn render gây FOIT/FOUT — cả hai đều đánh thẳng vào LCP và CLS.

---

## 🎯 Vấn Đề

Upload ảnh gốc 5MB hiển thị ở khung 400px: user tải gấp 50 lần cần thiết. Font web render-blocking:
trình duyệt chờ font xong mới vẽ chữ (FOIT — màn hình trắng) hoặc vẽ font hệ thống rồi nhảy layout
khi font thật về (FOUT/CLS). Giải pháp: responsive images (`srcset`/`sizes` + format hiện đại AVIF/WebP
+ lazy-load) và font (`font-display: swap` + preload + subset).

```
Ảnh:  photo.jpg 5MB ──► photo-400.avif 30KB + photo-800.webp 80KB + srcset ─► browser tự chọn
Font: @font-face { font-display: swap } + preload + subset latin ─► chữ hiện ngay, swap êm
```

---

## 💻 Code Ví Dụ

```typescript
// Chọn ứng viên srcset phù hợp khung hiển thị × pixel-ratio (mô phỏng browser)
interface ImageCandidate { url: string; width: number; bytes: number }

function pickCandidate(candidates: ImageCandidate[], displayWidth: number, dpr: number): ImageCandidate {
  const needed = displayWidth * dpr;
  const sorted = [...candidates].sort((a, b) => a.width - b.width);
  for (const c of sorted) {
    if (c.width >= needed) return c; // ảnh đủ nét nhỏ nhất
  }
  return sorted[sorted.length - 1]; // fallback: ảnh lớn nhất
}

// Snippet sinh <img> responsive + lazy-load (copy vào HTML)
function responsiveImg(srcBase: string, alt: string, width: number, height: number): string {
  return `<img src="${srcBase}-800.webp" ` +
    `srcset="${srcBase}-400.avif 400w, ${srcBase}-800.webp 800w, ${srcBase}-1600.webp 1600w" ` +
    `sizes="(max-width: 600px) 100vw, 800px" width="${width}" height="${height}" ` +
    `loading="lazy" decoding="async" alt="${alt}">`;
}

// Snippet @font-face tối ưu (swap + subset gợi ý)
function fontFace(family: string, url: string): string {
  return `@font-face {\n  font-family: '${family}';\n  src: url('${url}') format('woff2');\n` +
    `  font-display: swap;\n  unicode-range: U+0000-00FF, U+0102-0103, U+1EA0-1EF9;\n}`;
}
```

> Checklist + demo chọn ảnh + sinh snippet trong `examples/index.ts` —
> chạy bằng `npx ts-node examples/index.ts`.

---

## ✅ Lợi Ích

| Tối ưu | Lợi ích |
|---|---|
| srcset + sizes | Tải đúng pixel cần — tiết kiệm 50-90% bytes ảnh |
| AVIF/WebP | Nhẹ hơn JPEG/PNG 30-50% cùng chất lượng |
| width/height cố định | Không còn CLS do ảnh (browser giữ chỗ trước) |
| font-display: swap + preload | Chữ hiện ngay, không trắng màn hình |
| Subset font | Chỉ tải glyph tiếng Việt/latin cần — nhẹ hơn nhiều |

---

## ⚠️ Lưu Ý

- Ảnh LCP (hero) phải `fetchpriority="high"` + preload, **không** lazy-load — lazy hero là tự sát LCP.
- `alt` là bắt buộc (a11y + SEO), width/height là bắt buộc (chống CLS).
- Đừng preload quá 2-3 font: preload nhiều tranh băng thông với hero image.

---

## 🎯 Khi Nào Dùng

- Mọi `<img>`: srcset + modern format + width/height + lazy (trừ hero).
- Mọi font web: woff2 + swap + preload file chính + subset.
- Audit định kỳ: Images + Fonts thường chiếm > 60% bytes trang.

---

## 🔗 Liên Quan

- [19.2 Core Web Vitals](../19.2-core-web-vitals/README.md) — ảnh/font quyết định LCP/CLS.
- [19.1 Rendering Strategies](../19.1-rendering-strategies/README.md) — preload hero theo chiến lược render.
- [16-design-systems](../../16-design-systems/README.md) — typography scale và font chuẩn hệ thống.

---

## 📚 Tài Liệu

- 📖 [web.dev: Image Optimization](https://web.dev/articles/image-optimization)
- 📖 [web.dev: Font Best Practices](https://web.dev/articles/font-best-practices)
- 📖 [Squoosh (nén thử trực quan)](https://squoosh.app/)

---

## ⏭️ Bài Tiếp Theo

→ [Lớp 17: AI & LLM Engineering](../../17-ai-llm-engineering/README.md) — ôn lại toàn bộ series mở rộng.
