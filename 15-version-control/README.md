# 🔀 Lớp 15: Version Control (Quản Lý Phiên Bản)

> **Version Control** là **hệ thống theo dõi mọi thay đổi** trong source code, cho phép cộng tác, quay lại phiên bản cũ, và quản lý nhiều nhánh phát triển song song. Đây là công cụ nền tảng nhất của mọi developer hiện đại.

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm |
|---|--------|----------|
| 15.1 | [Git Basics](15.1-git-basics/README.md) | init, add, commit, push, pull |
| 15.2 | [Git Branching](15.2-git-branching/README.md) | Phân nhánh, branch strategies |
| 15.3 | [Git Merging](15.3-git-merging/README.md) | Fast-forward, three-way, conflict |
| 15.4 | [Git Rebase](15.4-git-rebase/README.md) | Replay commit, linear history |
| 15.5 | [Git Cherry-Pick](15.5-git-cherry-pick/README.md) | Chọn commit cụ thể, copy patch |
| 15.6 | [Git Hooks](15.6-git-hooks/README.md) | pre-commit, commit-msg, pre-push |
| 15.7 | [Conventional Commits](15.7-conventional-commits/README.md) | spec, semantic-release, parse commit → bump version |
| 15.8 | [Trunk-Based Development](15.8-trunk-based/README.md) | so với GitFlow, feature flags, mô phỏng trunk |
| 15.9 | [Monorepo](15.9-monorepo/README.md) | so polyrepo, tooling, mô phỏng task graph |
| 15.10 | [Bisect & Blame](15.10-bisect-blame/README.md) | debug workflow, mô phỏng binary search commits |

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

**Version Control System (VCS)** là công cụ quản lý lịch sử thay đổi của source code. Nó lưu từng phiên bản của mọi file, cho phép bạn quay lại bất kỳ thời điểm nào trong quá khứ, xem ai thay đổi gì, và hợp nhất work từ nhiều người.

```
Working Directory → Staging Area → Local Repository → Remote Repository
     (edit)          (git add)       (git commit)        (git push)
```

**Ba thế hệ VCS:**

| Thế hệ | Đại diện | Đặc điểm | Ưu điểm | Nhược điểm |
|---------|----------|-----------|---------|-----------|
| **Local VCS** | RCS, SCCS | Chỉ trên máy cá nhân | Đơn giản, không cần server | Không có collaboration, backup phụ thuộc 1 máy |
| **Centralized** | SVN, CVS | Server trung tâm lưu history | Kiểm soát tập trung, dễ quản lý access | Server single point of failure, offline làm việc khó |
| **Distributed** | Git, Mercurial | Mỗi máy có full repository | Offline work, branching nhanh, resilient | Learning curve cao hơn, storage ban đầu lớn |

> 💡 **Git dominance:** Git chiếm >90% thị phần VCS hiện nay. Học Git = học industry standard.

---

## 2. Tại sao cần Version Control?

### ❌ Không có VCS — viễn cảnh kinh hoàng:
```
project_v1.zip
project_v2.zip
project_v2_final.zip
project_v2_final_REAL.zip
project_v2_final_REAL_fixed.zip  ← 😱
project_v2_final_REAL_fixed_ACTUALLY.zip
```

### ✅ Với VCS — lịch sử rõ ràng:
```
commit abc123 - fix(auth): resolve OAuth token expiry bug
commit def456 - feat(cart): add coupon support
commit ghi789 - refactor(payment): extract payment gateway interface
commit jkl012 - chore: upgrade dependencies to v3
commit mno345 - fix(billing): handle negative amount edge case
```

### Lợi ích chính:

| Lợi ích | Mô tả | Giải thích sâu |
|---------|-------|----------------|
| **Lịch sử đầy đủ** | Mọi thay đổi đều được ghi lại | Biết chính xác commit nào introduce bug (`git bisect`), ai viết code nào (`git blame`) |
| **Cộng tác** | Nhiều người làm việc song song | Branch + merge cho phép 10+ dev cùng sửa repo mà không overwrite work của nhau |
| **Rollback** | Quay lại bất kỳ phiên bản nào | Rollback không phải "xóa file" — là di chuyển pointer đến commit cũ, an toàn và reversible |
| **Branching** | Phát triển tính năng song song | Branch = light-weight pointer, tạo/ngắt mất ~ms. Không copy directory như SVN |
| **Code Review** | Review thay đổi trước khi merge | PR/MR cho thấy diff chính xác, reviewer comment từng dòng |
| **Traceability** | Biết ai thay đổi gì, khi nào, tại sao | Commit message + author + timestamp = audit trail cho compliance |

---

## 3. Các hệ thống VCS phổ biến

### Git (Phổ biến nhất)
```bash
# Distributed - mỗi clone là full repository
git clone https://github.com/user/repo.git
git log --oneline --graph --all    # visualize history
git status                         # current state
```

### SVN (Subversion)
```bash
# Centralized - phụ thuộc server
svn checkout svn://server/repo
svn commit -m "message"
```

### So sánh chi tiết:

| Tính năng | Git | SVN | Lý do |
|-----------|-----|-----|-------|
| Kiểu | Distributed | Centralized | Git copy toàn bộ history về local |
| Branching | Rất nhanh (~ms) | Chậm (directory copy) | Git branch = 1 pointer, SVN = copy thực |
| Offline work | Có đầy đủ | Không (cần connect server) | LocalRepo chứa everything |
| Learning curve | Cao hơn | Đơn giản hơn | Git có nhiều concept: staging, reflog, detached HEAD |
| Phổ biến | ⭐⭐⭐⭐⭐ | ⭐⭐ | GitHub/GitLab dominant |
| Performance | O(1) operations | O(n) cho nhiều ops | Git dùng compressed snapshot |
| Storage | ~3x working tree | ~1x working tree | Git lưu delta, nhưng full history per clone |

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
│   (objects, refs, config, HEAD)         │
├─────────────────────────────────────────┤
│    git commit ↑           ↓ git reset   │
├─────────────────────────────────────────┤
│            Staging Area (Index)         │
│   (next commit's snapshot preview)      │
├─────────────────────────────────────────┤
│    git add ↑             ↓ git checkout │
├─────────────────────────────────────────┤
│           Working Directory             │
│   (your actual files on disk)           │
└─────────────────────────────────────────┘
```

**Giải thích các layer:**
- **Working Directory:** file thực tế bạn edit. `git status` so sánh layer này với Stage.
- **Staging Area (Index):** "bản nháp" của commit tiếp theo. Cho phép chọn từng file/segment muốn commit.
- **Local Repository (.git/):** objects (blob, tree, commit), refs (branch pointers), config. Đây là "database" thực sự của Git.
- **Remote Repository:** bản sao trên server (GitHub, GitLab...). `git push` copy local objects lên; `git fetch` download objects về.

### 4.2 Các lệnh Git thiết yếu

```bash
# === Khởi tạo ===
git init                          # Tạo repo mới (tạo .git/)
git clone <url>                   # Clone repo có sẵn về local

# === Trạng thái ===
git status                        # Xem working dir + staging area state
git diff                          # So sánh working dir vs staging
git diff --staged                 # So sánh staging vs last commit
git diff HEAD~2 HEAD              # So sánh commit cách nhất vs commit mới nhất

# === Staging & Commit ===
git add <file>                    # Stage 1 file
git add *.ts                      # Stage theo glob pattern
git add .                         # Stage tất cả (cẩn thận: stage cả file không intended)
git rm <file>                     # Remove từ working dir + stage deletion
git commit -m "feat: add login"   # Commit staged changes
git commit --amend                # Sửa commit gần nhất (thêm file hoặc đổi message)
git commit --amend --no-edit      # Thêm file vào commit cũ, giữ nguyên message

# === Branching ===
git branch                        # Liệt kê branch local
git branch -v                     # Liệt kê + commit cuối cùng của mỗi branch
git branch <name>                 # Tạo branch mới (không switch)
git checkout <branch>             # Chuyển sang branch (cũ)
git switch <branch>               # Chuyển sang branch (Git 2.23+, rõ nghĩa hơn)
git checkout -b <branch>          # Tạo + chuyển branch (gộp 2 lệnh)
git branch -d <branch>            # Xóa branch (chỉ khi đã merge)
git branch -D <branch>            # Xóa branch (bất kể merge status)
git branch -a                     # Liệt kê cả remote tracking branches

# === Remote ===
git remote -v                     # Xem remote URLs
git remote add origin <url>       # Thêm remote
git push origin <branch>          # Push local branch lên remote
git push -u origin main           # Push + set upstream tracking lần đầu
git pull origin <branch>          # Fetch + merge về local
git fetch origin                  # Chỉ download metadata, không merge
git pull --rebase origin main     # Fetch + rebase lên remote thay vì merge

# === Xem lịch sử ===
git log                           # Xem history chi tiết
git log --oneline                 # Mỗi commit 1 dòng
git log --oneline --graph --all   # History dạng đồ thị, all branches
git log --oneline --author="name" # Filter theo author
git log --oneline --since="2 weeks ago"  # Filter theo thời gian
git blame <file>                  # Xem ai sửa mỗi dòng (line-by-line)
git show <commit>                 # Xem chi tiết 1 commit
git diff <commit1> <commit2>      # So sánh 2 commit

# === Undo & Reset ===
git reset --soft HEAD~1           # Undo commit, giữ staged (hoàn tác commit)
git reset --mixed HEAD~1          # Undo commit + unstage (mặc định)
git reset --hard HEAD~1           # Undo commit + discard changes (⚠️ mất code!)
git revert <commit>               # Tạo commit mới đảo ngược thay đổi (an toàn cho shared)
git stash                         # Cất tạm working dir changes
git stash list                    # Xem danh sách stashes
git stash pop                     # Lấy stash đầu tiên ra (vẫn giữ trong list)
git stash drop                    # Xóa stash
git stash apply stash@{2}         # Áp dụng stash cụ thể
```

### 4.3 Git Objects — Cấu trúc bên trong

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Commit  │────▶│   Tree   │────▶│   Blob   │
│ (snapshot)│     │ (folder) │     │  (file)  │
└──────────┘     └──────────┘     └──────────┘
      │
      ▼
┌──────────┐
│  Parent  │
│  Commit  │  (link đến commit trước)
└──────────┘
```

**4 loại objects trong Git:**
| Object | Mô tả | Content |
|--------|-------|---------|
| **Blob** | File content (không có tên, không có metadata) | Raw file bytes, compressed |
| **Tree** | Directory entry (giống folder) | Mapping: name → blob/tree + permissions |
| **Commit** | Snapshot + metadata | tree pointer, parent(s), author, timestamp, message |
| **Tag** | Pointer đến commit (optionally signed) | commit SHA + metadata con người đọc được |

> 💡 **Deep insight:** Git không lưu "sự thay đổi" (diff) — nó lưu **snapshots** (tree objects). Commit mới trỏ đến tree mới, commit cha trỏ đến tree cũ. Khi diff được hiển thị, Git tính toán difference giữa 2 trees. Đây là lý do Git nhanh khi tạo commit — chỉ cần ghi object mới, không cần lưu diff.

---

## 5. Branching Strategies

### 5.1 Git Flow

```
main     ──●──────────────────●──────────── (production)
            \                /
develop  ────●──●──●──●──●──● ──────────── (integration)
               \     /
feature  ───────●──●── ────────────────── (feature branch)

release/* ──▶ main (khi release)
hotfix/*  ──▶ main + develop (khi emergency fix)
```

| Branch | Mục đích | Ai tạo | lifetime |
|--------|----------|--------|----------|
| `main` | Production-ready code | — | vĩnh viễn |
| `develop` | Integration branch | maintainer | vĩnh viễn |
| `feature/*` | Tính năng mới | developer | Days–weeks |
| `release/*` | Chuẩn bị release | maintainer | Days |
| `hotfix/*` | Fix lỗi production | maintainer | Hours–days |

**Phù hợp khi:** released theo version (v1.0, v2.0), team có dedicated release manager.

### 5.2 GitHub Flow (Đơn giản hơn)

```
main     ──●──────●──────●──────── (always deployable)
            \    /  \    /
feature  ────●──●    ●──● ──────── (short-lived branches)
             PR↑      PR↑
```

**Quy trình:**
1. Từ `main` tạo branch `feature/ten-tinh-nang`
2. Commit thay đổi
3. Push + mở Pull Request
4. Code Review
5. Merge vào `main` (auto-deploy)
6. Xóa branch

**Phù hợp khi:** continuous deployment, team nhỏ–trung bình, không có release manager.

### 5.3 Trunk-Based Development

```
main/trunk  ──●──●──●──●──●──●── (commit trực tiếp)
                    \  /
short-lived  ────────●── ──────── (< 1 ngày)
```

**Đặc điểm:**
- Commit trực tiếp vào trunk/main (hoặc feature branch sống < 24h)
- Feature flags để toggle tính năng chưa ready
- CI/CD chạy mỗi commit
- Yêu cầu high test coverage + automated deployment

**Phù hợp khi:** Google-scale team, CI/CD mature, test tự động 100%.

### So sánh 3 strategies:

| Tiêu chí | Git Flow | GitHub Flow | Trunk-Based |
|----------|----------|-------------|-------------|
| Độ phức tạp | Cao | Thấp | Trung bình |
| Phù hợp team size | 5–20 người | 1–10 người | 10+ người |
| Release pattern | Batch (version) | Continuous | Continuous |
| Learning curve | Cao | Thấp | Trung bình |
| Branch proliferation | Nhiều | Ít | Rất ít |

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

| Ưu điểm | Nhược điểm |
|---------|-----------|
| ✅ Giữ nguyên lịch sử thực tế | ❌ Lịch sử phức tạp (nhiều branch giao nhau) |
| ✅ An toàn cho shared branches | ❌ Merge commit noise trong log |
| ✅ Hiển thị rõ "khi nào feature được integrate" | ❌ Khó `git bisect` do branch merge |

### Rebase

```bash
git checkout feature
git rebase main
```

```
main     ──A──B──
                  \
feature  ──────────C'──D'── (commits được replay lên đầu main mới)
```

| Ưu điểm | Nhược điểm |
|---------|-----------|
| ✅ Lịch sử sạch, tuyến tính | ❌ **Rewrite history** — danger zone |
| ✅ Dễ đọc `git log` | ❌ **KHÔNG rebase branch đã push shared** |
| ✅ Dễ `git bisect` | ❌ Gây conflict nếu base thay đổi nhiều |

### Quy tắc vàng (must remember):

> **Không bao giờ rebase branch đã push lên remote mà người khác đang dùng.**
>
> Vi phạm = đồng nghiệp phải `git pull --force` hoặc rebuild work từ đầu. Đây là lỗi nghiêm trọng nhất trong team workflow.

**Khi nào rebase an toàn:**
- Feature branch cá nhân, chưa push
- Local branch trước khi push lần đầu
- Cleanup commit trước khi merge PR (interacive rebase)

---

## 7. Git Hooks & Automation

Git Hooks là scripts tự động chạy khi sự kiện Git xảy ra. 2 vị trí đặt hooks:

```
┌─────────────────────────────────────────────────┐
│              .git/hooks/                        │
│  (local hooks - chỉ người dùng này thấy)        │
├─────────────────────────────────────────────────┤
│              .husky/                            │
│  (hooks được version control - cả team thấy)    │
└─────────────────────────────────────────────────┘
```

### Các hook quan trọng:

| Hook | Khi chạy | Mục đích |
|------|----------|----------|
| `pre-commit` | Trước khi commit | Chạy lint, format, unit test nhanh |
| `commit-msg` | Sau viết message | Validate conventional commit format |
| `pre-push` | Trước khi push | Chạy full test suite, build check |
| `prepare-commit-msg` | Trước mở editor | Thêm template mặc định |
| `post-commit` | Sau commit | Log, notification |

### Conventional Commits:

```
<type>[optional scope]: <description>

feat:     add login page                    → new feature
fix:       resolve null pointer in auth      → bug fix
docs:     update API documentation          → doc change
style:    fix code formatting                → whitespace, semicolons
refactor: extract payment logic             → code change, no feature
test:     add unit tests for cart           → test addition
chore:    update dependencies               → tooling, config
```

**Công cụ enforce:**
- **Husky** — cài đặt và quản lý hooks dễ dàng
- **commitlint** — validate commit message theo conventional commits
- **lint-staged** — chỉ chạy lint trên staged files (nhanh hơn)
- **Commitizen** — interactive commit message builder

---

## 8. Best Practices

### ✅ Commit Messages

```
# TỐT ✅
feat(auth): add OAuth2 Google login
fix(cart): resolve negative quantity bug (#123)
refactor(user): extract validation logic to service
chore(deps): upgrade react to v18

# KHÔNG TỐT ❌
fix bug
update code
asdfgh
WIP
```

**Công thức commit message:**
```
type(scope): description

[optional body explaining why]

[optional footer: closes #123, BREAKING CHANGE: ...]
```

### ✅ Branching

| Practice | Lý do |
|----------|-------|
| Đặt tên rõ ràng: `feature/user-auth`, `fix/login-redirect` | Dễ tra cứu, dễ hiểu từ tên |
| Branch sống ngắn — merge sớm, merge thường xuyên | Giảm merge conflict, giảm context switching |
| Xóa branch sau khi merge | Giữ repo sạch, không rác branch |
| Luôn `git pull` trước khi tạo branch mới | Bắt đầu từ base mới nhất |

### ✅ Pull Requests

| Practice | Lý do |
|----------|-------|
| Mô tả rõ thay đổi và **tại sao** | Reviewer không cần đoán intent |
| Giữ PR nhỏ (< 400 dòng thay đổi) | PR nhỏ = review nhanh, ít bug sót |
| Yêu cầu ít nhất 1 reviewer | Double-check, chia sẻ kiến thức |
| Sử dụng PR templates | Standardize thông tin cung cấp |

### ✅ Repository Hygiene

```bash
# Viết .gitignore đầy đủ
node_modules/
dist/
build/
.env
*.log
.DS_Store

# Không bao giờ commit secrets
# Dùng .env + gitignore
# Dùng tool như git-secrets hoặc trufflehog để scan
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
────────          ────────────        ─────────
init, add          branching           interactive rebase
commit, push       merge/rebase        cherry-pick, bisect
pull, clone        conflict resolve    hooks, automation
status, log        Git Flow            submodules
diff, blame        PR workflow         worktrees, reflog
```

---

> 💡 **"Version control is not just about code management — it's about team collaboration and project integrity."**

---

## 🔗 Liên quan

- **15.1 Git Basics** — init, add, commit, push, pull
- **15.2 Git Branching** — branch strategies
- **15.3 Git Merging** — merge types, conflict resolution
- **15.4 Git Rebase** — linear history, interactive rebase
- **15.5 Git Cherry-Pick** — selective commit application
- **15.6 Git Hooks** — automation, conventional commits
- **15.7 Conventional Commits** — spec, semantic-release, parse commit → bump version
- **15.8 Trunk-Based Development** — trunk vs GitFlow, feature flags
- **15.9 Monorepo** — monorepo vs polyrepo, task graph
- **15.10 Bisect & Blame** — debug workflow, binary search commits

---

## 📚 Tài liệu tham khảo

- 📖 [Git Official Documentation](https://git-scm.com/doc)
- 📖 [Pro Git (free book)](https://git-scm.com/book/en/v2)
- 📖 [GitHub Guides](https://docs.github.com/en/get-started)
- 📖 [Git Pocket Guide — R. Stefanov](https://www.oreilly.com/library/view/git-pocket-guide/9781449329673/)

---

## ⏭️ Bài tiếp theo

→ [15.1 Git Basics](15.1-git-basics/README.md)
