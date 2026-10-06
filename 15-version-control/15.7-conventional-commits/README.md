# 📝 15.7 Conventional Commits (Quy Ước Commit)

> **Conventional Commits** là quy ước viết commit message theo cấu trúc **máy đọc được**: `type(scope): mô tả`. Nhờ đó **semantic-release** tự tính **bump version** (major/minor/patch) và sinh **changelog** — không cần con người quyết định release gì.

---

## 🎯 Vấn đề

```
❌ Message tự do — máy không hiểu:
   "fix bug", "update code", "asdfgh", "WIP"
   → release version mấy? có breaking không? changelog viết tay?

✅ Conventional — máy parse được:
   feat(auth): add OAuth2 Google login        → tính năng mới → minor
   fix(cart): resolve negative quantity bug   → sửa lỗi      → patch
   feat(api)!: drop v1 endpoints              → breaking     → major (! = BREAKING CHANGE)
```

---

## 📐 Spec — Cấu trúc message

```
<type>[optional scope][!]: <description>

[optional body — giải thích TẠI SAO]

[optional footer: BREAKING CHANGE: ..., Closes #123]
```

| Thành phần | Quy tắc |
|------------|---------|
| **type** | `feat` (tính năng) · `fix` (sửa lỗi) · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert` |
| **scope** | Phạm vi ảnh hưởng: `(auth)`, `(cart)`, `(api)` — optional |
| **`!`** | Đánh dấu **BREAKING CHANGE** ngay trên dòng đầu |
| **description** | Ngắn gọn, thể mệnh lệnh: "add", không phải "added" |
| **footer** | `BREAKING CHANGE: <mô tả>` hoặc `Closes #123` |

```bash
# ✅ Hợp lệ
feat: add login page
fix(auth): resolve OAuth token expiry bug
docs(api): update rate-limit section
feat(api)!: remove deprecated v1 endpoints
refactor(payment): extract gateway interface

# ❌ Không hợp lệ
fix bug              # thiếu type prefix
feat:add login       # thiếu dấu cách sau colon
Feat(auth): add x    # type phải viết thường
```

---

## 🚀 Semantic Release — Từ commit → version

Quy tắc bump (theo **SemVer** `MAJOR.MINOR.PATCH`), commit "mạnh nhất" thắng:

| Commit trong release | Bump | Ví dụ `1.4.2` → |
|----------------------|------|-----------------|
| Có `!` / `BREAKING CHANGE` | **major** 🔴 | `2.0.0` |
| Có `feat` | **minor** 🟡 | `1.5.0` |
| Chỉ `fix`/`perf` | **patch** 🟢 | `1.4.3` |
| Chỉ `docs`/`style`/`chore`/`test`/... | **none** (không release) | `1.4.2` |

```
commits ──parse──▶ [{type, breaking}...] ──quy tắc──▶ bump ──▶ version mới + changelog

feat(api)!: drop v1        → major  → 2.0.0  "⚠ BREAKING CHANGES: drop v1"
feat(cart): add coupon     → minor  → 1.5.0  "✨ Features: add coupon"
fix(auth): token expiry    → patch  → 1.4.3  "🐛 Fixes: token expiry"
docs: update readme        → none   → (không release)
```

**Pipeline thực tế:** push lên `main` → CI chạy `semantic-release` → parse commits từ tag cũ → bump version → tạo GitHub Release + changelog → publish npm — **zero thao tác tay**.

---

## 💻 Mô phỏng parse commit → bump version

[`examples/index.ts`](examples/index.ts) cài đặt pipeline thu nhỏ, không deps ngoài:

```typescript
// 1. Parse message → { type, scope, breaking }
function parseCommit(message: string): ParsedCommit {
  const m = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<bang>!)?: (?<desc>.+)$/.exec(message);
  // + quét body tìm "BREAKING CHANGE:"
}

// 2. Quyết định bump từ danh sách commits (mạnh nhất thắng)
function decideBump(commits: ParsedCommit[]): Bump {
  if (commits.some((c) => c.breaking)) return "major";
  if (commits.some((c) => c.type === "feat")) return "minor";
  if (commits.some((c) => c.type === "fix" || c.type === "perf")) return "patch";
  return "none";
}

// 3. Bump SemVer + sinh changelog
bumpVersion("1.4.2", "minor"); // → "1.5.0" (reset patch về 0)
```

Demo chạy 4 đợt release: patch (chỉ fix) → minor (có feat) → major (có `!`) → none (chỉ docs/chore).

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🤖 **Release tự động** | Không tranh cãi "version mấy", không quên changelog |
| 📜 **Changelog chuẩn** | Features/fixes/breaking tự phân loại từ type |
| 🔍 **Lịch sử đọc được** | `git log` cho biết ngay bản chất từng thay đổi |
| 🛡️ **Breaking lộ rõ** | `!` + footer khiến thay đổi phá vỡ không bị chôn vùi |

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 📚 **Cần kỷ luật team** | 1 message sai format làm tool parse lệch → dùng commitlint hook (xem 15.6) |
| 🟡 **Squash làm mất粒** | Squash PR thành 1 commit phải viết lại message tổng hợp đúng type |
| 🔧 **Setup ban đầu** | Cần cấu hình semantic-release + CI + token publish |

---

## 🔗 Liên quan

- **15.6 Git Hooks** — `commit-msg` hook + commitlint enforce format ngay lúc commit
- **15.1 Git Basics** — `git log` đọc lịch sử conventional
- **15.8 Trunk-Based** — Release liên tục từ trunk càng cần version tự động

---

## 📚 Tài liệu tham khảo

- 📖 [Conventional Commits Spec](https://www.conventionalcommits.org/)
- 📖 [Semantic Versioning](https://semver.org/)
- 📖 [semantic-release](https://github.com/semantic-release/semantic-release)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.7-conventional-commits
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [15.8 Trunk-Based Development](../15.8-trunk-based/README.md)
