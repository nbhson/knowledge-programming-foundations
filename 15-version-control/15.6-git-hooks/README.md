# 🪝 15.6 Git Hooks (Git Hooks)

> **Git Hooks** là scripts tự động chạy khi có sự kiện Git xảy ra (commit, push, merge...).

---

## 🎯 Vấn Đề

```
❌ Không có hooks:
├─ Code chất lượng không đồng đều
├─ Lỗi syntax/lint bỏ qua khi commit
├─ Commit message không chuẩn
└─ Phải chạy manual checks trước mỗi commit

✅ Git Hooks giải quyết bằng:
├─ Tự động validate code trước commit
├─ Enforce commit message convention
├─ Chạy tests trước push
└─ Quy chuẩn team tự động
```

---

## 📊 Hook Locations

```
┌─────────────────────────────────────────────────┐
│              .git/hooks/                        │
│  (local hooks - chỉ người dùng này thấy)        │
├─────────────────────────────────────────────────┤
│              .husky/                            │
│  (hooks được version control - cả team thấy)    │
└─────────────────────────────────────────────────┘
```

---

## 💻 Client-Side Hooks

### pre-commit (trước khi commit)

```bash
# File: .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Chạy lint và format
npm run lint
npm run format:check
```

**Kết quả:**
```bash
$ git commit -m "feat: add user auth"

> myapp@1.0.0 lint
> eslint src/**/*.{ts,tsx}

✅ All checks passed!
[main abc1234] feat: add user auth
 1 file changed, 23 insertions(+)
```

### commit-msg (validate message)

```bash
# File: .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Kiểm tra commit message theo convention
# Phải bắt đầu với: feat|fix|docs|style|refactor|test|chore
commit_msg=$(cat "$1")
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"; then
  echo ""
  echo "❌ Commit message không đúng format!"
  echo "✅ Ví dụ: feat(auth): add login endpoint"
  exit 1
fi
```

**Valid messages:**
```
feat: add user authentication
fix(login): resolve timeout issue
docs: update API documentation
chore: update dependencies
```

**Invalid messages:**
```
update code          ❌ Thiếu type prefix
fixed bug            ❌ Thiếu type prefix
feat:add login       ❌ Thiếu dấu cách sau colon
```

### pre-push (trước khi push)

```bash
# File: .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Chạy tests trước push
npm run test
npm run build
```

---

## 🛠 Setup với Husky

### Cài đặt

```bash
# Cài đặt Husky
npm install husky --save-dev

# Khởi tạo husky
npx husky init

# Cấu hình trong package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint",
      "commit-msg": "npm run commitlint",
      "pre-push": "npm test"
    }
  }
}
```

### Tạo hooks thủ công

```bash
# Enable husky
npx husky install

# Tạo hook đầu tiên
npx husky add .husky/pre-commit "npm run lint"

# Tạo hook thứ hai
npx husky add .husky/commit-msg "npm run commitlint"

# Tạo hook thứ ba
npx husky add .husky/pre-push "npm run test"
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🤖 Tự động hóa | Không cần nhớ chạy manual checks |
| 📏 Quy chuẩn | Cả team tuân thủ cùng standards |
| 🔒 Chất lượng | Code lint/tests trước khi merge |
| ⚡ Nhanh | Phát hiện lỗi sớm |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Chậm commit | Optimize hooks, chạy parallel |
| 🟡 Config phức tạp | Document rõ setup |
| 🟡 CI duplicate | Hooks + CI cùng validate |

---

## 🎯 Hook phổ biến khác

| Hook | Khi chạy | Mục đích |
|------|----------|----------|
| `prepare-commit-msg` | Trước mở editor commit | Thêm template |
| `post-commit` | Sau commit | Log, notification |
| `post-checkout` | Sau checkout branch | Setup environment |
| `post-merge` | Sau merge | Clean up, notify |

---

## 🔗 Liên quan

- **15.1 Git Basics** — Nền tảng Git
- **15.2 Git Branching** — Quản lý branch
- **15.3 Git Merging** — Hợp nhất branch

---

## 📚 Tài liệu tham khảo

- 📖 [Git Hooks Documentation](https://git-scm.com/docs/githooks)
- 📖 [Husky Documentation](https://typicode.github.io/husky/)
- 📖 [Commit Convention](https://www.conventionalcommits.org/)

---

## ⏭️ Bạn đã hoàn thành Nhóm 15: Version Control!