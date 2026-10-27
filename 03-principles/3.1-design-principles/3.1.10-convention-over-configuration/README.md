# ⚙️ 3.1.10 Convention over Configuration

> **"Quy ước hơn cấu hình"** — framework lo sẵn default hợp lý theo quy ước chung,
> dev chỉ cấu hình khi muốn khác default. Ít code mẫu (boilerplate), vào việc nhanh.

---

## 🎯 Vấn đề

Dự án không có quy ước thì mỗi người cấu hình 1 kiểu:

- **Config dài dòng** — route, model, table nào cũng khai báo thủ công, file config phình to
- **Mỗi người 1 kiểu** — cùng 1 việc mà 3 module cấu hình 3 cách khác nhau
- **Onboard chậm** — dev mới phải đọc hết config mới hiểu app chạy thế nào
- **Ngược lại: config mọi thứ** cũng khổ — framework bắt khai báo cả những thứ hiển nhiên

```
❌ CONFIG THỦ CÔNG MỌI THỨ          ✅ CONVENTION OVER CONFIG
┌─────────────────────┐            ┌─────────────────────┐
│ routes.config.ts    │            │ pages/              │
│  50 dòng map        │  ──CoC───▶ │  dashboard.tsx      │
│  path → component   │            │  admin.tsx  → route │
│ models.config.ts    │            │  tự sinh từ tên file│
│  table mapping      │            │ schema.prisma       │
└─────────────────────┘            │  model User → users │
                                   └─────────────────────┘
```

---

## 🧩 Convention trông như thế nào? (Next.js / Prisma)

| Framework | Quy ước (convention) | Khi muốn khác mới config |
|-----------|---------------------|--------------------------|
| **Next.js** (routing) | File `pages/dashboard.tsx` → route `/dashboard`; `pages/blog/[slug].tsx` → route động | Muốn route lạ → thêm `rewrites()` trong `next.config.js` |
| **Next.js** (API) | File `pages/api/users.ts` → endpoint `/api/users` | Muốn custom server → cấu hình tường minh |
| **Prisma** | `model User` → bảng `User`; field `createdAt DateTime @default(now())` theo tên chuẩn | Muốn tên bảng khác → `@@map("users")`; muốn cột khác → `@map("user_name")` |
| **Rails/Laravel** (gốc của CoC) | Class `User` → bảng `users`; file đặt đúng thư mục là tự nạp | Ngoại lệ mới cần khai báo |

```
NGUYÊN TẮC VÀNG
│
├─ Trường hợp phổ biến (80%) → theo convention, KHÔNG config gì cả
│
└─ Trường hợp đặc biệt (20%) → config tường minh để override convention
    → Convention tốt LUÔN cho phép thoát ra (escape hatch)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: config thủ công mọi route — thêm 1 trang là sửa 1 bảng map
const manualRoutes: Record<string, string> = {
  "/dashboard": "DashboardPage",
  "/admin": "AdminPage",
  "/settings": "SettingsPage",
  // ... mỗi trang mới lại thêm 1 dòng, quên là 404
};

function resolveBad(path: string): string {
  const page = manualRoutes[path];
  if (!page) throw new Error(`404: no route for ${path}`);
  return page;
}

// ✅ GOOD: convention — route suy ra từ tên file, chỉ config ngoại lệ
function fileToRoute(filePath: string): string {
  // Convention: pages/admin.tsx → /admin, pages/blog/[slug].tsx → /blog/:slug
  return filePath
    .replace(/^pages/, "")
    .replace(/\.tsx$/, "")
    .replace(/\[(\w+)\]/g, ":$1")
    .replace(/\/index$/, "/");
}

const overrides: Record<string, string> = {
  "/old-admin": "/admin", // ngoại lệ (redirect) mới cần config tường minh
};

function resolveGood(filePaths: string[], path: string): string {
  if (overrides[path]) return `redirect → ${overrides[path]}`;
  for (const file of filePaths) {
    if (fileToRoute(file) === path) return `render ${file}`;
  }
  throw new Error(`404: no page for ${path}`);
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🚀 **Vào việc nhanh** | Trường hợp phổ biến không cần config gì — code ngay |
| 📏 **Code ít hơn** | Không còn file config mapping dài dòng cho thứ hiển nhiên |
| 🤝 **Đồng nhất** | Mọi người theo 1 quy ước → đọc dự án nào cũng quen |
| 🔧 **Vẫn linh hoạt** | Ngoại lệ vẫn config tường minh được (escape hatch) |

---

## ⚠️ Khi nào convention TỐT vs khi nào nên config tường minh?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Quy ước cộng đồng đã chuẩn (Next.js routing, Prisma model) | ✅ Theo convention |
| Team/project có pattern lặp lại > 3 lần | ✅ Đúc thành convention nội bộ (ghi vào README) |
| Hành vi **ngạc nhiên** nếu đoán sai (billing, phân quyền, bảo mật) | ❌ Config tường minh — đừng để "đoán" |
| Ngoại lệ 1 lần, không lặp lại | ❌ Config tường minh tại chỗ, đừng đẻ convention mới |
| Convention của framework mờ, ít người biết | ⚠️ Bọc thêm 1 lớp config rõ ràng + comment dẫn link docs |

> 💡 **Quy tắc:** Convention phải **hiển nhiên với người mới** (tên file → route là hiển nhiên;
> "file tên `_x.tsx` sẽ bị bỏ qua lúc nửa đêm" thì không). Không hiển nhiên → config tường minh.

---

## 🎯 Checklist đặt convention nội bộ

```
1. Có lặp lại ≥ 3 lần không? (chưa → đừng vội đúc convention)
2. Người mới đoán được không? (không → viết docs + ví dụ)
3. Có lối thoát không? (luôn cho phép override tường minh)
4. Có ghi thành văn bản không? (convention miệng = không có convention)
```

---

## 🔗 Liên quan

- **3.1.2 KISS** — Convention xóa boilerplate, giữ code đơn giản
- **3.1.9 Postel's Law** — Convention chung chính là 1 dạng "output chặt" mọi bên cùng theo
- **3.1.3 YAGNI** — Đừng xây hệ thống config "phòng khi" — convention default đủ dùng
- **14.x Clean Code** — Tên và vị trí file nhất quán là nền của convention

---

## 📁 Cấu trúc thư mục

```
3.1.10-convention-over-configuration/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.1-design-principles/3.1.10-convention-over-configuration
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Convention over Configuration - Wikipedia](https://en.wikipedia.org/wiki/Convention_over_configuration)
- 📖 [Next.js Routing — File conventions](https://nextjs.org/docs/app/building-your-application/routing)
- 📖 [Prisma Schema — Naming conventions](https://www.prisma.io/docs/orm/prisma-schema)

---

## ⏭️ Bài tiếp theo

→ [3.2 SOLID Principles](../3.2-solid-principles/README.md)
