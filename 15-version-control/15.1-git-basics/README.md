# 🔤 15.1 Git Basics (Cơ Bản Git)

> **Git** là hệ thống quản lý phiên bản phân tán (distributed), cho phép theo dõi mọi thay đổi trong source code. Mọi developer đều có full copy của repository history.

---

## 🎯 Vấn Đề

```
❌ Không có version control:
├─ Không biết ai sửa file gì, khi nào
├─ Khó khôi phục code cũ (phải nhớ manual backup)
├─ Làm việc nhóm gặp conflict — overwrite nhau
└─ Không có branch để thử nghiệm tính năng mới

✅ Git giải quyết bằng:
├─ Ghi lại mọi thay đổi (commit) — immutable history
├─ Tạo branch riêng cho tính năng (lightweight pointer)
├─ Hợp nhất code từ nhiều người (merge/rebase)
└─ Khôi phục bất kỳ thời điểm nào (checkout commit cũ)
```

**Deep insight:** Git không lưu "difference" — nó lưu **snapshots**. Mỗi commit là 1 tree object (directory structure) trỏ đến blob objects (file contents). Điều này khiến Git cực nhanh khi commit nhưng tốn storage ban đầu (~3x working tree).

---

## 📊 Git Workflow — Dòng chảy dữ liệu

```
┌──────────┐     git add      ┌──────────┐   git commit   ┌──────────┐
│   Work   │ ───────────────▶ │  Stage   │ ─────────────▶ │  Local   │
│   Area   │                  │ (Index)  │                │  Commit  │
└──────────┘                  └──────────┘                └────┬─────┘
      ▲                                                    git push
      │                                                        │
      │              git pull ◀────────────────────────────────┘
      │                                                        │
      │◀──────────────────── git pull ─────────────────────────┘
      │
┌──────────┐
│   Remote │  (GitHub/GitLab — shared source of truth)
│ (server) │
└──────────┘
```

**4 khu vực quan trọng:**
1. **Working Directory** — file thực tế bạn edit trên disk
2. **Staging Area (Index)** — bản nháp của commit tiếp theo; `git add` đưa file từ working dir vào đây
3. **Local Repository** — `.git/` folder chứa objects, refs, history
4. **Remote Repository** — bản sao trên server; `git push` đồng bộ local → remote

> 💡 **Mix-up phổ biến:** `git pull` = `git fetch` + `git merge`. `git fetch` chỉ download metadata/object, không thay đổi working dir.

---

## 💻 Các lệnh cơ bản

### Khởi tạo và clone

```bash
# Tạo repo mới từ thư mục hiện tại
git init

# Clone repo từ remote (tải full history về local)
git clone https://github.com/user/project.git
git clone git@github.com:user/project.git   # SSH

# Xem thông tin repo
git remote -v          # hiện URLs của remote
git config --list      # xem config
```

### Staging Area (Vùng chuẩn bị)

```bash
# Thêm file cụ thể vào staging
git add app.js
git add src/components/Button.tsx

# Thêm theo pattern
git add *.ts
git add src/**/*

# Thêm TẤT CẢ (cẩn thận — stage cả file không intended)
git add .

# Hủy stage 1 file
git restore --staged app.js    # Git 2.23+
git reset HEAD app.js          # cách cũ

# Xem những gì đang staged
git diff --staged              # so sánh staged vs last commit
git diff --cached              # alias của --staged

# Xem những gì đã thay đổi nhưng chưa stage
git diff                       # so sánh working dir vs staging
```

### Commit

```bash
# Commit với message
git commit -m "feat(auth): add OAuth2 login"

# Commit nhiều file đã staged
git commit -m "fix(cart): resolve negative quantity"

# Commit tất cả tracked file changed (shortcut, bỏ qua stage)
git commit -am "fix: resolve login redirect bug"
# ⚠️ -a chỉ stage tracked files, không stage file mới (untracked)

# Sửa commit cuối (thêm file hoặc đổi message)
git add fixed_file.js
git commit --amend -m "fix: corrected validation logic"

# Xem lịch sử
git log                          # chi tiết
git log --oneline                # 1 dòng/commit
git log --oneline --graph --all  # đồ thị + all branches
git log --oneline --author="Sơn" # filter author
git log --oneline --since="2 weeks ago"  # filter thời gian
git log --oneline --since="2024-01-01" --until="2024-03-01"
```

### Push và Pull

```bash
# Đẩy branch lên remote (lần đầu cần -u để set tracking)
git push -u origin main

# Đẩy branch đã có tracking
git push origin feature/login

# Lấy về từ remote (fetch + merge)
git pull origin main

# Chỉ download metadata, không merge
git fetch origin
git fetch origin main   # tải riêng branch

# Pull with rebase (thay vì merge — keep linear history)
git pull --rebase origin main
```

### So sánh thay đổi

```bash
git diff                            # working dir vs staging
git diff --staged                   # staging vs last commit
git diff HEAD~2 HEAD                # so sánh 2 commit cách nhau
git diff main..feature/login        # diff giữa main và feature branch
git diff --stat main..feature       # diff stats (số dòng thêm/xóa)
git show HEAD                       # xem chi tiết commit hiện tại
git show abc123                     # xem chi tiết commit cụ thể
```

---

## 📝 .gitignore

File quy định những gì Git **bỏ qua** (không track). Thiếu .gitignore = repo rác, leak secrets.

```gitignore
# Dependencies
node_modules/
vendor/
.env
.env.local
.env.*.local

# Build output
dist/
build/
.next/
out/
*.js.map
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*

# Test coverage
coverage/
.nyc_output/

# Temp files
tmp/
temp/
*.tmp
```

> 📌 **Quy tắc:** nếu không chắc file có nên ignore hay không → ignore. File build, dependency, và env luôn nên ignore.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích sâu |
|---------|----------------|
| 📚 Theo dõi lịch sử | Mỗi commit là 1 immutable snapshot. Chưa bao giờ mất change — dù đã delete, amend, hay merge |
| 🌿 Branch dễ dàng | Branch = 1 pointer 41 bytes. Tạo/xóa branch mất < 1ms. Không cần copy directory như SVN |
| 🔄 Hợp nhất dễ dàng | Three-way merge tự động combine thay đổi từ 2 branch. Conflict chỉ xảy ra khi 2 người sửa cùng dòng |
| 💾 Khôi phục được | `git checkout <commit>` về bất kỳ timepoint nào. `git bisect` tìm commit introduce bug tự động |

---

## ⚠️ Lưu ý quan trọng

```
📌 Commit thường xuyên với message rõ ràng — mỗi commit = 1 logical change
📌 Không commit file nhạy cảm (password, key, .env) — dùng .gitignore + env vars
📌 Luôn pull/fetch trước khi push — tránh overwrite work đồng nghiệp
📌 Dùng .gitignore để bỏ qua file không cần thiết — giữ repo sạch
📌 Review commit trước khi push lên main — đảm bảo quality gate
📌 Dùng --amend cẩn thận — chỉ amend local commit chưa push
```

**Phổ biến mistake: force push**
```bash
# ❌ DANGER — rewrite public history
git push --force origin main

# ✅ ANH TOÀN — force push chỉ cho local-only branch
git push --force-with-lease origin feature/my-work
# --force-with-lease: chỉ force nếu remote chưa có commit mới từ người khác
```

---

## 🎯 Khi nào dùng Git?

| Scenario | Hành động | Lý do |
|----------|-----------|-------|
| Bắt đầu project mới | `git init` | Tạo repository local, sau đó `git remote add origin` |
| Muốn copy remote | `git clone <url>` | Tải full history về, bắt đầu làm việc |
| Sửa xong 1 tính năng | `git add .` → `git commit -m "..."` | Stage tất cả thay đổi, commit với message rõ |
| Muốn đẩy lên server | `git push origin main` | Đồng bộ local → remote |
| Muốn lấy code mới | `git pull origin main` | Đồng bộ remote → local (fetch + merge) |
| Cần testing branch | `git checkout -b feature/test` | Tạo branch mới từ HEAD hiện tại |

---

## 🔗 Liên quan

- **15.2 Git Branching** — Quản lý branch hiệu quả
- **15.3 Git Merging** — Hợp nhất các branch
- **15.4 Git Rebase** — Tái cấu trúc lịch sử commit

---

## 📚 Tài liệu tham khảo

- 📖 [Git Official Documentation](https://git-scm.com/doc)
- 📖 [Pro Git (free book) — Chapter 1, 2](https://git-scm.com/book/en/v2)
- 📖 [GitHub Guides — Hello World](https://docs.github.com/en/get-started)
- 📖 [Git Cheat Sheet — Atlassian](https://www.atlassian.com/git/tutorials/atlassian-git-cheatsheet)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.1-git-basics
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [15.2 Git Branching](../15.2-git-branching/README.md)
