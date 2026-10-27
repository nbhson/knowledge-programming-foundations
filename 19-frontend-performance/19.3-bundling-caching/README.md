# 📦 19.3 Bundling & Caching (Đóng Gói & Cache)

> **Bundle to thì tải lâu, cache dở thì tải lại hoài:**
> chia nhỏ (chunking) + đặt tên theo nội dung (content-hash) để user chỉ tải đúng phần đổi.

---

## 🎯 Vấn Đề

Ship một `bundle.js` 3MB: đổi 1 dòng cũng bắt user tải lại 3MB, cache vô dụng. Không chia chunk
thì trang nào cũng gánh code của trang khác; không hash tên file thì deploy mới không dám cache lâu
(sợ user dính bản cũ), mà cache ngắn thì tốn băng thông. Giải pháp: split vendor/app/route + tên file
chứa hash nội dung + chiến lược cache `immutable` cho asset hashed.

```
bundle.js (3MB, đổi 1 dòng → tải lại 3MB)
  ──chunking──► vendor.[hash].js + app.[hash].js + route-checkout.[hash].js
                đổi app → chỉ app hash đổi → vendor vẫn dùng cache cũ ✅
```

---

## 💻 Code Ví Dụ

```typescript
// Hash nội dung giả lập (FNV-1a 32-bit) — production bundler dùng sha256 cắt ngắn
function contentHash(content: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

interface Chunk { name: string; content: string; file?: string }

// Đặt tên file theo hash: nội dung đổi → tên đổi → cache tự vô hiệu đúng file
function manifest(chunks: Chunk[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of chunks) {
    const file = `${c.name}.${contentHash(c.content)}.js`;
    c.file = file;
    map[`${c.name}.js`] = file;
  }
  return map;
}

// Quyết định cache header: file có hash → immutable 1 năm; html → không cache dài
function cacheHeader(fileName: string): string {
  const hashed = /\.[0-9a-f]{8}\.js$/.test(fileName);
  return hashed ? "public, max-age=31536000, immutable" : "no-cache";
}
```

> Mô phỏng đầy đủ (chunking + manifest + so sánh deploy cũ/mới + cache headers) trong
> `examples/index.ts` — chạy bằng `npx tsx examples/index.ts`.

---

## ✅ Lợi Ích

| Kỹ thuật | Lợi ích |
|---|---|
| Code splitting (route/dynamic import) | Trang chỉ tải code nó cần — FCP/INP cải thiện |
| Vendor chunk riêng | Lib ít đổi → nằm cache hàng tháng |
| Content-hash filename | Cache 1 năm mà deploy mới vẫn tươi đúng file đổi |
| `immutable` header | Browser khỏi revalidate — tiết kiệm request |

---

## ⚠️ Lưu Ý

- Chia quá vụn → waterfall request + overhead HTTP; gom nhóm route liên quan.
- Hash dựa trên **nội dung**, không phải version tay — version tay quên bump là dính cache cũ.
- File HTML entry **không** cache dài (no-cache) để luôn trỏ manifest mới nhất.

---

## 🎯 Khi Nào Dùng

- Mọi SPA/SSR production: split theo route + vendor, hash tên file, header immutable.
- Khi bundle > ~200KB gzip: phân tích (bundle analyzer) tìm lib nặng thay thế/lazy-load.
- Deploy CDN: manifest ánh xạ logical → hashed file cho server render đúng URL.

---

## 🧰 Toolchain Bundler 2026

- **Webpack v5** đã vào **maintenance mode (2026)** — vẫn chạy tốt, chỉ nhận fix bảo mật, không thêm feature mới.
- Lựa chọn chính hiện nay:
  - **Vite** (dev bằng **esbuild**, build bằng Rollup; đang chuyển sang **Rolldown** viết bằng Rust) — mặc định cho app mới.
  - **Turbopack** (viết bằng Rust, Vercel) — bundler tích hợp Next.js, thay thế Webpack trong dev.

---

## 🔍 Phân Tích Bundle

"Không đo thì không tối ưu" — dùng source map để xem **cái gì chiếm dung lượng**:

| Tool | Dùng với | Output |
|---|---|---|
| `webpack-bundle-analyzer` | Webpack | Treemap tương tác từng module |
| `rollup-plugin-visualizer` | Rollup/Vite | Treemap + stats JSON cho CI |
| `source-map-explorer` | Mọi bundler | So sánh byte theo file từ source map |

Workflow: generate source map → visualize → tìm lib nặng (moment, lodash full, polyfill cũ) →
thay bằng lib nhỏ hơn (`dayjs`, import submodule, `@babel/preset-modules`) hoặc dynamic import.

---

## 🌐 HTTP/2 Multiplexing & Số Lượng Chunk

Thời HTTP/1.1, mỗi request tốn 1 connection song song giới hạn → chia **vụn** nhiều chunk nhỏ là tối ưu.
**HTTP/2 multiplexing** gửi nhiều request song song trên **một** connection:

- → Overhead per-request gần như biến mất, **ít chunk to cũng được** (thậm chí tốt hơn: ít request,
  ít overhead nén, cache ít file dễ quản hơn).
- Ưu tiên **ít request lớn hơn** thay vì hàng chục chunk 2KB — vẫn giữ split theo route/vendor để tận dụng cache.

> 💡 **Import maps** cho micro-frontends: dùng `<script type="importmap">` ánh xạ module URL qua CDN/bundle
> — chia sẻ dependency giữa các micro-app mà không build chung một bundle.

---

## 🔗 Liên Quan

- [19.1 Rendering Strategies](../19.1-rendering-strategies/README.md) — CSR phụ thuộc nặng vào bundle.
- [19.2 Core Web Vitals](../19.2-core-web-vitals/README.md) — bundle nhẹ cải thiện LCP/INP.
- [08-devops-cicd](../../08-devops-cicd/README.md) — pipeline build + deploy asset lên CDN.

---

## 📚 Tài Liệu

- 📖 [web.dev: Code Splitting](https://web.dev/articles/code-splitting)
- 📖 [Webpack Caching Guide](https://webpack.js.org/guides/caching/)
- 📖 [Vite Build / Rollup Code Splitting](https://vitejs.dev/guide/build.html)

---

## ⏭️ Bài Tiếp Theo

→ [19.4 Image & Font Optimization](../19.4-image-font-optimization/README.md)
