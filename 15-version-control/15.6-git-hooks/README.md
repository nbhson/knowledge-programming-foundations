# 🪝 15.6 Git Hooks (Git Hooks)

> **Git Hooks** là scripts tự động chạy khi có sự kiện Git xảy ra (commit, push, merge...). Chúng hoạt động như "gatekeepers" — chặn action nếu check fail.

---

## 🎯 Vấn Đề

```
❌ Không có hooks:
├─ Code chất lượng không đồng đều — dev này lint strict, dev kia bỏ qua
├─ Lỗi syntax/lint bỏ qua khi commit — chỉ phát hiện khi CI chạy
├─ Commit message không chuẩn — khó generate changelog tự động
├─ Phải chạy manual checks trước mỗi commit — dễ quên
└─ Không có quality gate tự động ở local

✅ Git Hooks giải quyết bằng:
├─ Tự động validate code trước khi commit được phép
├─ Enforce commit message convention cho cả team
├─ Chạy tests trước push — ngăn code hỏng lên production
└─ Quy chuẩn team tự động, không cần nhắc nhở
```

**Kiến trúc:** Hooks là Unix scripts (.sh, .js, .py) đặt trong `.git/hooks/`. Git gọi script và dựa vào exit code: `0` = pass, `1` = fail (ngăn action).

---

## 📊 Hook Locations — 2 loại hooks

```
┌─────────────────────────────────────────────────┐
│              .git/hooks/                        │
│  (local hooks - chỉ người dùng này thấy)        │
│  → không version controlled                       │
│  → mỗi developer tự setup                        │
├─────────────────────────────────────────────────┤
│              .husky/                            │
│  (hooks được version control - cả team thấy)    │
│  → commit vào repo → mọi member auto có hooks   │
│  → setup qua package.json hoặc husky init       │
└─────────────────────────────────────────────────┘
```

**Khi nào dùng loại nào:**
- `.git/hooks/` — personal hooks, quick tests, experiment
- `.husky/` — team-wide enforcement, must-read by all members

---

## 💻 Client-Side Hooks (phổ biến nhất)

### pre-commit (trước khi commit)

Chạy **trước** khi commit được tạo. Nếu script exit 1 → commit bị chặn.

```bash
# File: .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Chạy lint và format check — chặn commit nếu fail
npm run lint
npm run format:check
```

**Kết quả thực tế:**
```bash
$ git commit -m "feat: add user auth"

> myapp@1.0.0 lint
> eslint src/**/*.{ts,tsx}

✔ All files passed lint check!

> myapp@1.0.0 format:check
> prettier --check src/**/*.{ts,tsx}

✔ 42 files checked. All formatted correctly.

[main abc1234] feat: add user auth
 1 file changed, 23 insertions(+)
```

Nếu lint fail:
```bash
$ git commit -m "feat: add user auth"
> eslint src/auth.ts
✖ 2 errors found.
❌ Lint failed. Fix errors before committing.
```

### commit-msg (validate message)

Chạy **sau khi** viết message, **trước khi** commit được tạo. Thường dùng để enforce Conventional Commits.

```bash
# File: .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Kiểm tra commit message theo conventional commits format
commit_msg=$(cat "$1")
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"; then
  echo ""
  echo "❌ Commit message không đúng format!"
  echo "✅ Ví dụ: feat(auth): add login endpoint"
  echo "✅ Types: feat|fix|docs|style|refactor|test|chore"
  exit 1
fi
```

**Valid messages:**
```
feat: add user authentication
fix(login): resolve timeout issue
docs: update API documentation
chore: update dependencies
refactor(payment): extract gateway interface
test(auth): add unit tests for login
```

**Invalid messages:**
```
update code          ❌ Thiếu type prefix
fixed bug            ❌ Thiếu type prefix
feat:add login       ❌ Thiếu dấu cách sau colon
feat auth            ❌ Thiếu colon
```

### pre-push (trước khi push)

Chạy **trước** khi push lên remote. Lý tưởng cho full test suite.

```bash
# File: .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Chạy full test suite + build check trước push
npm run test
npm run build
```

---

## 🛠 Setup với Husky

Husky là công cụ phổ biến nhất để quản lý Git hooks trong Node.js projects.

### Cài đặt

```bash
# Cài đặt Husky (dev dependency)
npm install husky --save-dev
# hoặc
yarn add husky --dev
# hoặc
pnpm add husky -D
```

### Khởi tạo

```bash
# Cách 1: Auto-init (tạo .husky/ và cấu hình package.json)
npx husky init

# Cách 2: Manual setup
npx husky install         # tạo .husky/ directory
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/commit-msg "npx commitlint --edit ${1}"
npx husky add .husky/pre-push "npm run test && npm run build"
```

### Cấu hình trong package.json

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run format:check",
      "commit-msg": "commitlint --edit ${1}",
      "pre-push": "npm run test && npm run build"
    }
  }
}
```

### Commitlint setup (bắt buộc cho commit-msg hook)

```bash
npm install @commitlint/cli @commitlint/config-conventional --save-dev
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích sâu |
|---------|----------------|
| 🤖 Tự động hóa | Không cần nhớ chạy manual checks — hook enforce automatically |
| 📏 Quy chuẩn | Cả team tuân thủ cùng standards — lint, format, commit message |
| 🔒 Chất lượng | Code lint/tests trước khi merge — ngăn buggy code lên main |
| ⚡ Nhanh | Phát hiện lỗi tại local, không chờ CI pipeline (tiết kiệm cloud cost) |

---

## ⚠️ Nhược điểm và mitigation

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Chậm commit | Chạy parallel tasks, chỉ lint staged files (`lint-staged`) |
| 🟡 Config phức tạp | Document setup rõ trong README, dùng `npx husky init` one-liner |
| 🟡 CI duplicate | Hooks + CI cùng validate — hooks cho local fast feedback, CI cho safety net |
| 🟡 Bypass temptation | Dev có thể `git commit --no-verify` — giáo dục team về tầm quan trọng |

---

## 🎯 Hook phổ biến khác (server-side & advanced)

| Hook | Khi chạy | Mục đích |
|------|----------|----------|
| `prepare-commit-msg` | Trước mở editor commit | Thêm template, prepend issue number |
| `post-commit` | Sau commit thành công | Log, send notification (Slack, Discord) |
| `post-checkout` | Sau checkout branch | Setup environment, install deps cho branch đó |
| `post-merge` | Sau merge thành công | Clean up, reinstall deps, restart server |
| `pre-rebase` | Trước rebase | Chặn rebase nếu branch có unpushed commits |
| `commit-msg` (server-side) | Trên git server | Enforce policy không thể bypass (khác với client-side) |
| `post-receive` | Sau push lên server | Trigger CI/CD, deploy automation |

### Pre-commit hook templates

```bash
# pre-commit: chạy lint-staged (chỉ lint files đang stage)
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged
```

```bash
# pre-commit: type-check trước khi commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx tsc --noEmit
```

```bash
# pre-commit: kiểm tra bảo mật — scan secrets
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx git-secrets --scan
# hoặc
npx trufflehog filesystem --config .trufflehog.yaml
```

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Hooks có thể bị bypass hoàn toàn" | Client-side hooks có thể bypass (`--no-verify`), nhưng server-side hooks (GitLab pre-receive) thì không |
| "Hooks làm chậm development" | Initial setup cost, nhưng tiết kiệm thời gian debug và CI fix về dài hạn |
| "Hooks thay thế được CI" | Không — hooks là local gate, CI là server gate. Cả 2 cần design |
| "Hooks phức tạp để setup" | `npx husky init` mất 30 giây, config qua package.json là declarative |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Dùng Husky để version-control hooks | Chỉ setup local `.git/hooks/` (không share được) |
| Commit message convention qua hook | Để dev tự do viết message không format |
| Lint staged files (nhanh) | Lint entire repo mỗi commit (chậm) |
| Pre-push test suite | Chỉ commit-msg, bỏ qua code quality checks |
| Document hooks trong README | Giấu hooks config, dev mới không biết setup |

---

## 🔗 Liên quan

- **15.1 Git Basics** — Nền tảng Git
- **15.2 Git Branching** — Quản lý branch
- **15.3 Git Merging** — Hợp nhất branch

---

## 📚 Tài liệu tham khảo

- 📖 [Git Hooks Documentation — git-scm](https://git-scm.com/docs/githooks)
- 📖 [Husky Documentation](https://typicode.github.io/husky/)
- 📖 [Conventional Commits Specification](https://www.conventionalcommits.org/)
- 📖 [commitlint Documentation](https://commitlint.js.org/)
- 📖 [lint-staged Documentation](https://github.com/okonet/lint-staged)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.6-git-hooks
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [15.7 Conventional Commits](../15.7-conventional-commits/README.md)
