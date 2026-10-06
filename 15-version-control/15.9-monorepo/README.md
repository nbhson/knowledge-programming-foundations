# 📚 15.9 Monorepo (Kho Đơn)

> **Monorepo** gom nhiều packages/apps vào **1 repository duy nhất** — chia sẻ code bằng import thường, version đồng bộ (atomic commit), refactor xuyên dự án trong 1 PR. Ngược lại là **polyrepo** (mỗi dự án 1 repo).

---

## 🎯 So với Polyrepo

```
Polyrepo (mỗi dự án 1 repo):
  repo-web/      repo-mobile/      repo-shared/
  └── package.json  └── package.json  └── package.json (publish npm mới dùng được!)
  → sửa shared phải: bump version → publish → chờ → upgrade ở web + mobile (3 PR!)

Monorepo (1 repo, nhiều packages):
  monorepo/
  ├── apps/web/        → import { Button } from "@acme/ui"
  ├── apps/mobile/     → import { Button } from "@acme/ui"   (cùng source!)
  └── packages/ui/     → Button.tsx (sửa 1 chỗ, cả 2 app hưởng)
  → 1 PR refactor xuyên web + mobile + ui, CI chạy 1 lần
```

| Tiêu chí | Polyrepo | Monorepo |
|----------|----------|----------|
| Chia sẻ code | Publish package + upgrade version | Import trực tiếp source |
| Refactor xuyên dự án | Nhiều PR, nhiều version trung gian | 1 PR atomic |
| Version | Mỗi repo version riêng | Thường **1 version chung** (hoặc independent) |
| CI | Đơn giản từng repo | Cần **affected** (chỉ build/test phần bị ảnh hưởng) |
| Quyền truy cập | Dễ phân quyền từng repo | Cần tooling (CODEOWNERS, scopes) |
| Phù hợp | Team độc lập, release riêng | Design system + nhiều app cùng công ty |

---

## 🛠️ Tooling — Giải 3 bài toán của monorepo

| Bài toán | Công cụ | Cách hoạt động |
|----------|---------|----------------|
| **Workspace linking** | pnpm/npm/yarn workspaces | `packages/*` link vào nhau, 1 lần `install` ở root |
| **Task graph** | Nx, Turborepo, Bazel | Khai báo `dependsOn: [build]` → tool **topo-sort** + chạy song song theo tầng |
| **Affected** | `nx affected`, `turbo --filter` | So với `main` → chỉ build/test package **bị đổi + phụ thuộc nó** |
| **Cache** | Remote cache (Nx Cloud, Turborepo) | Task cùng input → lấy kết quả cũ, không build lại |

```
Task graph ví dụ (mũi tên = "phụ thuộc"):
  ui ──▶ web ──▶ e2e
  ui ──▶ mobile
  utils ─▶ ui

Tầng chạy song song: [utils] → [ui] → [web, mobile] → [e2e]
Đổi mỗi mobile → affected = {mobile} → bỏ qua web/e2e ✅
```

---

## 💻 Mô phỏng task graph

[`examples/index.ts`](examples/index.ts) cài đặt thu nhỏ, không deps ngoài:

```typescript
class TaskGraph {
  dependsOn(task: string, dep: string): void { /* task cần dep xong trước */ }

  // Kahn's algorithm: xếp tầng topo → mỗi tầng chạy song song
  levels(): string[][] { /* [utils] → [ui] → [web, mobile] → [e2e] */ }

  // Đổi 1 package → lan theo chiều ngược (ai phụ thuộc nó đều affected)
  affectedOf(changed: string): Set<string> { /* mobile → {mobile} (không lan tới web) */ }
}
```

Demo chạy 3 kịch bản: full graph 4 tầng → đổi `mobile` chỉ build 1 package → phát hiện **dependency cycle** (`a → b → a` báo lỗi thay vì treo).

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔗 **Chia sẻ code thật** | Không publish nội bộ, không version trung gian |
| ⚛️ **Atomic refactor** | Đổi API + mọi caller trong 1 commit — không bao giờ lệch version |
| 👀 **Nhìn toàn cảnh** | 1 nơi thấy hết app + lib, onboard nhanh |
| 🧪 **Test xuyên suốt** | 1 PR chạy test tất cả bên liên quan |

## ⚠️ Nhược điểm

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🐘 **Repo phình to** | Sparse checkout, partial clone, VFS (như Google/Microsoft) |
| ⏳ **CI chậm nếu build hết** | Affected + cache — chỉ chạy phần đổi |
| 🔐 **Phân quyền khó** | CODEOWNERS theo folder, branch protection theo path |
| 📦 **Version chung gượng ép** | Dùng independent versioning nếu các app release lệch nhau |

---

## 🔗 Liên quan

- **15.2 Git Branching** — 1 PR atomic xuyên packages trên cùng branch
- **15.7 Conventional Commits** — Commit có scope `(web)`/`(ui)` cho tool tính affected + changelog từng package
- **8 DevOps CI/CD** — Pipeline affected + remote cache

---

## 📚 Tài liệu tham khảo

- 📖 [monorepo.tools](https://monorepo.tools/)
- 📖 [Nx — Mental model](https://nx.dev/concepts/mental-model)
- 📖 [Turborepo Handbook](https://turbo.build/repo/docs)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.9-monorepo
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [15.10 Bisect & Blame](../15.10-bisect-blame/README.md)
