# 🖥️ 19.1 Rendering Strategies (Chiến Lược Render)

> **Câu hỏi đầu tiên của mọi trang web:** HTML sinh ở đâu — server, build-time hay browser?
> Trả lời sai là trả giá bằng TTFB chậm, SEO mất hút hoặc server quá tải.

---

## 🎯 Vấn Đề

Cùng một nội dung, chọn CSR thì user thấy màn hình trắng chờ JS tải xong (SEO kém, FCP chậm);
chọn SSR cho mọi trang thì server gánh nặng mỗi request; SSG nhanh nhưng nội dung tĩnh đơ.
Thực tế mỗi route cần chiến lược riêng, cộng **hydration** (gắn sự kiện vào HTML tĩnh) và
**ISR** (tái sinh tĩnh theo chu kỳ) để dung hòa.

```
CSR: browser ─► JS ─► API ─► render   (nhanh server, chậm FCP, kém SEO)
SSR: server render mỗi request        (FCP tốt, TTFB + tải server)
SSG: render lúc build, serve CDN      (nhanh nhất, nhưng tĩnh)
ISR: SSG + tái sinh sau N giây        (nhanh + tươi vừa đủ)
```

---

## 💻 Code Ví Dụ

```typescript
// Ma trận chọn chiến lược theo tính chất route
type Strategy = "CSR" | "SSR" | "SSG" | "ISR";

interface RouteSpec {
  path: string;
  dynamic: boolean;      // nội dung đổi theo user/request?
  updateFreq: "realtime" | "hourly" | "rarely";
  seoNeeded: boolean;
}

function pickStrategy(route: RouteSpec): Strategy {
  if (!route.dynamic && route.updateFreq === "rarely") return "SSG";
  if (!route.dynamic && route.updateFreq === "hourly") return "ISR";
  if (route.dynamic && route.seoNeeded) return "SSR";
  return "CSR";
}

// Mô phỏng build: route tĩnh render 1 lần, route động đánh dấu render/runtime
function simulateBuild(routes: RouteSpec[]): string[] {
  return routes.map((r) => {
    const strategy = pickStrategy(r);
    const when = strategy === "SSG" ? "render lúc build" : strategy === "ISR" ? "build + revalidate" : `render lúc ${strategy === "SSR" ? "request" : "browser"}`;
    return `${r.path} → ${strategy} (${when})`;
  });
}
```

> Demo đầy đủ (ma trận chọn + simulate build + hydration checklist) trong `examples/index.ts` —
> chạy bằng `npx ts-node examples/index.ts`.

---

## ✅ Lợi Ích

| Chiến lược | Lợi ích |
|---|---|
| SSG + CDN | TTFB thấp nhất, chịu tải cao, rẻ |
| ISR | Tốc độ SSG + nội dung tươi theo chu kỳ |
| SSR | SEO + FCP tốt cho nội dung động |
| CSR | Giàu tương tác, giảm tải server cho app nội bộ/dashboard |

---

## ⚠️ Lưu Ý

- Hydration lỗi (HTML server ≠ render client) gây nhấp nháy + lỗi React hydration — giữ render deterministic.
- SSR không miễn phí: TTFB tăng, server phải scale; đo trước khi "SSR hóa" toàn site.
- ISR có nội dung cũ trong cửa sổ revalidate — không dùng cho giá/tồn kho realtime.

---

## 🎯 Khi Nào Dùng

- **SSG**: blog, docs, landing, marketing.
- **ISR**: tin tức, catalog sản phẩm cập nhật theo giờ.
- **SSR**: trang cá nhân hóa cần SEO (search, listing).
- **CSR**: dashboard đăng nhập, admin, app nặng tương tác không cần SEO.

---

## 🔗 Liên Quan

- [19.2 Core Web Vitals](../19.2-core-web-vitals/README.md) — đo xem chiến lược render có hiệu quả không.
- [19.3 Bundling & Caching](../19.3-bundling-caching/README.md) — JS của CSR cần chia + cache tốt.
- [13-system-design](../../13-system-design/README.md) — CDN/caching ở tầm hệ thống.

---

## 📚 Tài Liệu

- 📖 [Next.js Rendering Docs](https://nextjs.org/docs/app/building-your-application/rendering)
- 📖 [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)
- 📖 [Patterns: SSR/SSG/ISR](https://www.patterns.dev/vanilla/rendering-patterns/)

---

## ⏭️ Bài Tiếp Theo

→ [19.2 Core Web Vitals](../19.2-core-web-vitals/README.md)
