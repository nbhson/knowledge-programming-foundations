# 🔤 15.1 Git Basics (Cơ Bản Git)

> **Git** là hệ thống quản lý phiên bản phân tán, cho phép theo dõi mọi thay đổi trong source code.

---

## 🎯 Vấn Đề

```
❌ Không có version control:
├─ Không biết ai sửa file gì, khi nào
├─ Khó khôi phục code cũ
├─ Làm việc nhóm gặp conflict
└─ Không có branch để thử nghiệm tính năng mới

✅ Git giải quyết bằng:
├─ Ghi lại mọi thay đổi (commit)
├─ Tạo branch riêng cho tính năng
├─ Hợp nhất code từ nhiều người
└─ Khôi phục bất kỳ thời điểm nào
```

---

## 📊 workflow cơ bản

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
│   Remote │
│ (GitHub) │
└──────────┘
```

---

## 💻 Các lệnh cơ bản

### Khởi tạo và clone

```bash
# Tạo repo mới
git init

# Clone repo từ remote
git clone https://github.com/user/project.git

# Xem trạng thái hiện tại
git status
```

### Staging Area (Vùng chuẩn bị)

```bash
# Thêm file vào staging
git add app.js
git add *.ts
git add .              # Thêm tất cả

# Xem staging area
git diff --staged
```

### Commit

```bash
# Commit với message
git commit -m "feat: add user authentication"

# Commit nhiều file cùng lúc
git commit -am "fix: resolve login bug"

# Xem lịch sử commit
git log --oneline
git log --graph --oneline --all
```

### Push và Pull

```bash
# Đẩy lên remote
git push origin main

# Lấy về từ remote
git pull origin main

# Push lần đầu với tracking
git push -u origin main
```

### So sánh thay đổi

```bash
# So sánh working area với staging
git diff

# So sánh staging với commit cuối
git diff --staged

# So sánh hai commit
git diff abc123 def456
```

---

## 📝 .gitignore

```gitignore
# Dependencies
node_modules/
package-lock.json

# Build output
dist/
build/
*.js.map

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 📚 Theo dõi lịch sử | Mọi thay đổi được lưu lại |
| 🌿 Branch dễ dàng | Tạo nhánh riêng không ảnh hưởng chính |
| 🔄 Hợp nhất dễ dàng | Merge code từ nhiều người |
| 💾 Khôi phục được | Quay về bất kỳ commit nào |

---

## ⚠️ Lưu ý quan trọng

```
📌 Commit thường xuyên với message rõ ràng
📌 Không commit file nhạy cảm (password, key)
📌 Luôn pull trước khi push
📌 Dùng .gitignore để bỏ qua file không cần thiết
📌 Review commit trước khi push lên main
```

---

## 🎯 Khi nào dùng Git?

| Scenario | Hành động |
|----------|-----------|
| Bắt đầu project mới | `git init` |
| Muốn copy remote | `git clone <url>` |
| Sửa xong 1 tính năng | `git add` → `git commit` |
| Muốn đẩy lên server | `git push` |
| Muốn lấy code mới | `git pull` |

---

## 🔗 Liên quan

- **15.2 Git Branching** — Quản lý branch hiệu quả
- **15.3 Git Merging** — Hợp nhất các branch
- **15.4 Git Rebase** — Tái cấu trúc lịch sử commit

---

## 📚 Tài liệu tham khảo

- 📖 [Git Official Documentation](https://git-scm.com/doc)
- 📖 [Pro Git (free book)](https://git-scm.com/book/en/v2)
- 📖 [GitHub Guides](https://docs.github.com/en/get-started)

---

## ⏭️ Bài tiếp theo

→ [15.2 Git Branching](../15.2-git-branching/README.md)
