# 🔀 Lớp 15: Version Control (Quản Lý Phiên Bản)

> **Version Control** là **hệ thống theo dõi mọi thay đổi** trong source code,
> cho phép cộng tác, quay lại phiên bản cũ, và quản lý nhiều nhánh phát triển song song.

---

## 📑 Mục Lục

- [1. Version Control là gì?](#1-version-control-là-gì)
- [2. Tại sao cần Version Control?](#2-tại-sao-cần-version-control)
- [3. Các hệ thống VCS phổ biến](#3-các-hệ-thống-vcs-phổ-biến)
- [4. Git — Kiến thức cốt lõi](#4-git--kiến-thức-cốt-lõi)
- [5. Branching Strategies](#5-branching-strategies)
- [6. Merge vs Rebase](#6-merge-vs-rebase)
- [7. Git Hooks & Automation](#7-git-hooks--automation)
- [8. Best Practices](#8-best-practices)
- [9. Tổng kết](#9-tổng-kết)

---

## 1. Version Control là gì?

**Version Control System (VCS)** là công cụ quản lý lịch sử thay đổi của source code:

```
Working Directory → Staging Area → Local Repository → Remote Repository
     (edit)          (git add)       (git commit)        (git push)
```

### Ba thế hệ VCS:

| Thế hệ | Đại diện | Đặc điểm |
|---------|----------|-----------|
| **Local VCS** | RCS | Chỉ trên máy cá nhân |
| **Centralized** | SVN, CVS | Server trung tâm |
| **Distributed** | Git, Mercurial | Mỗi máy có full repository |

---

## 2. Tại sao cần Version Control?

### ❌ Không có VCS:
```
project_v1.zip
project_v2_final.zip
project_v2_final_REAL.zip
project_v2_final_REAL_fixed.zip  ← 😱
```

### ✅ Với VCS:
```
commit abc123 - Fix login bug
commit def456 - Add user profile
commit ghi789 - Refactor auth module
commit jkl012 - Initial commit
```

### Lợi ích chính:

| Lợi ích | Mô tả |
|---------|-------|
| **Lịch sử đầy đủ** | Mọi thay đổi đều được ghi lại |
| **Cộng tác** | Nhiều người làm việc song song |
| **Rollback** | Quay lại bất kỳ phiên bản nào |
| **Branching** | Phát triển tính năng song song |
| **Code Review** | Review thay đổi trước khi merge |
| **Traceability** | Biết ai thay đổi gì, khi nào, tại sao |

---

## 3. Các hệ thống VCS phổ biến

### Git (Phổ biến nhất)
```bash
# Distributed - mỗi clone là full repository
git clone https://github.com/user/repo.git
git log --oneline --graph --all
```

### SVN (Subversion)
```bash
# Centralized - phụ thuộc server
svn checkout svn://server/repo
svn commit -m "message"
```

### So sánh:

| Tính năng | Git | SVN |
|-----------|-----|-----|
| Kiểu | Distributed | Centralized |
| Branching | Rất nhanh | Chậm |
| Offline work | Có | Không |
| Learning curve | Cao hơn | Đơn giản hơn |
| Phổ biến | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## 4. Git — Kiến thức cốt lõi

### 4.1 Cấu trúc Git

```
┌─────────────────────────────────────────┐
│              Remote Repository          │
│           (GitHub/GitLab/Bitbucket)     │
├─────────────────────────────────────────┤
│    git push ↑              ↓ git fetch  │
├─────────────────────────────────────────┤
│           Local Repository (.git/)      │
├─────────────────────────────────────────┤
│    git commit ↑           ↓ git reset   │
├─────────────────────────────────────────┤
│            Staging Area (Index)         │
├─────────────────────────────────────────┤
│    git add ↑             ↓ git checkout │
├─────────────────────────────────────────┤
│           Working Directory             │
└─────────────────────────────────────────┘
```

### 4.2 Các lệnh Git thiết yếu

```bash
# === Khởi tạo ===
git init                          # Tạo repo mới
git clone <url>                   # Clone repo có sẵn

# === Staging & Commit ===
git status                        # Xem trạng thái
git add <file>                    # Stage file
git add .                         # Stage tất cả
git commit -m "message"           # Commit
git commit --amend                # Sửa commit gần nhất

# === Branching ===
git branch                        # Liệt kê branch
git branch <name>                 # Tạo branch
git checkout <branch>             # Chuyển branch
git checkout -b <branch>          # Tạo + chuyển branch
git switch <branch>               # Chuyển branch (Git 2.23+)

# === Remote ===
git remote add origin <url>       # Thêm remote
git push origin <branch>          # Push lên remote
git pull origin <branch>          # Pull từ remote
git fetch origin                  # Fetch metadata

# === Xem lịch sử ===
git log --oneline --graph --all   # Xem log dạng graph
git diff                          # Xem thay đổi
git blame <file>                  # Xem ai sửa dòng nào

# === Undo ===
git reset --soft HEAD~1           # Undo commit, giữ staged
git reset --mixed HEAD~1          # Undo commit + unstage
git reset --hard HEAD~1           # Undo tất cả (⚠️ mất code)
git revert <commit>               # Tạo commit đảo ngược
git stash                         # Cất tạm thay đổi
git stash pop                     # Lấy lại thay đổi
```

### 4.3 Git Objects

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Commit  │────▶│   Tree   │────▶│   Blob   │
│ (snapshot)│     │ (folder) │     │  (file)  │
└──────────┘     └──────────┘     └──────────┘
     │
     ▼
┌──────────┐
│  Parent  │
│  Commit  │
└──────────┘
```

---

## 5. Branching Strategies

### 5.1 Git Flow

```
main     ──●──────────────────●──────────── (production)
            \                /
develop  ────●──●──●──●──●──● ──────────── (integration)
               \     /
feature  ───────●──●── ────────────────── (feature branch)
```

| Branch | Mục đích |
|--------|----------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | Tính năng mới |
| `release/*` | Chuẩn bị release |
| `hotfix/*` | Fix lỗi production |

### 5.2 GitHub Flow (Đơn giản hơn)

```
main     ──●──────●──────●──────── (always deployable)
            \    /  \    /
feature  ────●──●    ●──● ──────── (short-lived branches)
             PR↑      PR↑
```

**Quy trình:**
1. Tạo branch từ `main`
2. Commit thay đổi
3. Mở Pull Request
4. Code Review
5. Merge vào `main`
6. Deploy

### 5.3 Trunk-Based Development

```
main/trunk  ──●──●──●──●──●──●── (commit trực tiếp)
                    \  /
short-lived  ────────●── ──────── (< 1 ngày)
```

**Đặc điểm:**
- Commit trực tiếp vào trunk/main
- Branch sống rất ngắn (< 1-2 ngày)
- Phù hợp CI/CD tốc độ cao
- Yêu cầu feature flags

---

## 6. Merge vs Rebase

### Merge
```bash
git checkout main
git merge feature
```
```
main     ──A──B──────M── (merge commit)
            \       /
feature  ────C──D──── 
```
- ✅ Giữ nguyên lịch sử
- ✅ An toàn cho shared branches
- ❌ Lịch sử phức tạp

### Rebase
```bash
git checkout feature
git rebase main
```
```
main     ──A──B──
                  \
feature  ──────────C'──D'── (commits được replay)
```
- ✅ Lịch sử sạch, tuyến tính
- ✅ Dễ đọc git log
- ❌ **KHÔNG rebase shared branches** ⚠️

### Interactive Rebase
```bash
git rebase -i HEAD~3
# pick, squash, reword, edit, drop
```

### Quy tắc vàng:
> **Không bao giờ rebase branch đã push lên remote mà người khác đang dùng.**

---

## 7. Git Hooks & Automation

### Các hook phổ biến:

```
.git/hooks/
├── pre-commit        # Chạy trước khi commit
├── commit-msg        # Validate commit message
├── pre-push          # Chạy trước khi push
├── post-merge        # Chạy sau khi merge
└── pre-rebase        # Chạy trước khi rebase
```

### Ví dụ pre-commit hook:
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Chạy linter
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Lint failed. Fix errors before committing."
  exit 1
fi

# Chạy tests
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Fix tests before committing."
  exit 1
fi
```

### Conventional Commits:
```
<type>[optional scope]: <description>

feat: add login page
fix: resolve null pointer in user service
docs: update API documentation
refactor: extract payment logic
test: add unit tests for auth
chore: update dependencies
```

### Tools hữu ích:
- **Husky** — Quản lý Git hooks dễ dàng
- **commitlint** — Validate commit messages
- **lint-staged** — Chỉ lint staged files
- **Commitizen** — Interactive commit message builder

---

## 8. Best Practices

### ✅ Commit Messages
```
# TỐT ✅
feat(auth): add OAuth2 Google login
fix(cart): resolve negative quantity bug (#123)
refactor(user): extract validation logic to service

# KHÔNG TỐT ❌
fix bug
update code
asdfgh
WIP
```

### ✅ Branching
- Đặt tên rõ ràng: `feature/user-authentication`, `fix/login-redirect`
- Branch sống ngắn — merge sớm, merge thường xuyên
- Xóa branch sau khi merge

### ✅ Pull Requests
- Mô tả rõ ràng thay đổi và lý do
- Giữ PR nhỏ (< 400 dòng thay đổi)
- Yêu cầu ít nhất 1 reviewer
- Sử dụng PR templates

### ✅ Repository
- Viết `.gitignore` đầy đủ
- Sử dụng `.gitattributes` cho line endings
- Không commit secrets/credentials
- Sử dụng `.env` cho environment variables

### ✅ Workflow
```
1. Pull latest changes
2. Create feature branch
3. Make small, focused commits
4. Push and create PR
5. Code review
6. Squash merge to main
7. Delete feature branch
```

---

## 9. Tổng kết

```
┌─────────────────────────────────────────────────┐
│              VERSION CONTROL                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  Git Basics        Branching          Workflow   │
│  ┌─────────┐      ┌───────────┐    ┌──────────┐│
│  │ add     │      │ Git Flow  │    │ Commit   ││
│  │ commit  │      │ GitHub    │    │ PR/MR    ││
│  │ push    │      │ Flow     │    │ Review   ││
│  │ pull    │      │ Trunk    │    │ Merge    ││
│  │ merge   │      │ Based    │    │ Deploy   ││
│  └─────────┘      └───────────┘    └──────────┘│
│                                                  │
│  Advanced          Automation       Best         │
│  ┌─────────┐      ┌───────────┐    Practices   │
│  │ rebase  │      │ Hooks     │    ┌──────────┐│
│  │ cherry  │      │ Husky     │    │ Messages ││
│  │ pick    │      │ Commit    │    │ Naming   ││
│  │ stash   │      │ lint      │    │ Security ││
│  │ bisect  │      │ CI        │    │ .gitignore│
│  └─────────┘      └───────────┘    └──────────┘│
│                                                  │
└─────────────────────────────────────────────────┘
```

### 🎯 Lộ trình học:

```
Beginner           Intermediate        Advanced
─────────          ────────────        ─────────
init, add          branching           interactive rebase
commit, push       merge/rebase        cherry-pick, bisect
pull, clone        conflict resolve    hooks, automation
status, log        Git Flow            submodules
diff, blame        PR workflow         worktrees, reflog
```

---

> 💡 **"Version control is not just about code management — it's about team collaboration and project integrity."**

[⬅️ Quay lại trang chính](../README.md)