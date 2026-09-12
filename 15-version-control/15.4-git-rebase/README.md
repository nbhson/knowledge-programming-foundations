# 🔄 15.4 Git Rebase (Tái cấu trúc Git)

> **Rebase** là kỹ thuật di chuyển branch dựa trên commit mới nhất của branch khác, tạo lịch sử linear.

---

## 🎯 Vấn Đề

```
❌ Không có rebase:
├─ Lịch sử commit rối rắm khi merge nhiều branch
├─ Nhiều merge commit không cần thiết
└─ Khó đọc history

✅ Git Rebase giải quyết bằng:
├─ Tạo linear history
├─ Loại bỏ merge commit
├─ Dễ đọc và debug
└─ Clean project history
```

---

## 📊 Merge vs Rebase

```
MERGE (giữ nguyên):              REBASE (viết lại):

A---B---C---M                    A---B---C---D'---E'
 \         /                     \         /
  D---E───/                       F---G
(feature merge)                   (feature replayed)

→ Giữ merge commit                → Linear history
→ An toàn                         → Sạch sẽ hơn
```

---

## 💻 Thực hành Rebase

### Basic Rebase

```bash
# Rebase feature branch lên main mới nhất
git checkout feature/login
git rebase main

# Hoặc rebase main vào feature
git checkout main
git rebase feature/payment
```

### Interactive Rebase

```bash
# Mở interactive rebase (3 commit gần nhất)
git rebase -i HEAD~3

# Trong editor sẽ hiện:
pick abc123 feat: add login form
pick def456 feat: add validation
pick ghi789 fix: update styles

# Các lệnh có thể dùng:
# pick    - Giữ nguyên commit
# reword  - Sửa message commit
# edit    - Dừng lại để sửa code
# squash  - Gộp vào commit trước
# fixup   - Góp và bỏ message
# drop    - Xóa commit
```

### Amend Commit

```bash
# Sửa commit cuối cùng
git add file.js
git commit --amend -m "fix: corrected validation logic"

# Sửa commit ở giữa (cần rebase)
git rebase -i HEAD~3
# Change 'pick' to 'edit' cho commit cần sửa
git add fixed_file.js
git commit --amend
git rebase --continue
```

---

## ⚠️ Những việc CẤM làm Rebase

```
❌ CẤM REBASE PUBLIC BRANCH!
   → dev/main, release/* nếu đã push lên remote

✅ AN TOÀN REBASE:
   → Feature branch cá nhân (chưa push)
   → Local-only changes
   → Private work in progress
```

### Tại sao cấm rebase public branch?

```
Người A:     A---B---C (push main)
Người B:     A---B---C---D (pull, rebase, push)
Người A:     ❌ Không pull được vì history bị rewrite
             → Phải force push → Mất work của B
```

---

## 🛠 Rebase các tùy chọn

```bash
# Skip commit message check
git rebase --no-verify

# Giữ date gốc của commit
git rebase --preserve-merges

# Abort rebase nếu gặp vấn đề
git rebase --abort

# Tiếp tục rebase sau khi fix conflict
git rebase --continue

# Xem trạng thái rebase
git rebase --show-current-patch
```

---

## ✅ Ưu điểm Rebase

| Ưu điểm | Giải thích |
|---------|------------|
| 📐 Linear history | Dễ đọc, dễ theo dõi |
| 🧹 Clean project | Không có merge commit rác |
| 🔍 Dễ debug | Bisect hoạt động tốt hơn |
| 📋 PR đẹp | Mỗi PR là một chuỗi commit clean |

---

## ⚠️ Nhược điểm Rebase

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Rewrite history | Chỉ rebase local branch |
| 🔴 Mất work nếu sai | Backup trước khi rebase |
| 🟡 Học curve | Thực hành nhiều |

---

## 🎯 Khi nào dùng gì?

| Scenario | Khuyến nghị |
|----------|-------------|
| Giữ history nguyên vẹn | `git merge` |
| Muốn linear history | `git rebase` |
| Public/shared branch | `git merge` (không rebase) |
| Cleanup PR trước merge | `git rebase -i` |
| Fix commit message | `git rebase -i` + amend |

---

## 🔗 Liên quan

- **15.2 Git Branching** — Tạo và quản lý branch
- **15.3 Git Merging** — Hợp nhất branch với merge
- **15.5 Git Cherry-Pick** — Chọn commit cụ thể

---

## 📚 Tài liệu tham khảo

- 📖 [Git Rebase - Official Docs](https://git-scm.com/docs/git-rebase)
- 📖 [Interactive Rebase](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)
- 📖 [When to Rebase](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)

---

## ⏭️ Bài tiếp theo

→ [15.5 Git Cherry-Pick](../15.5-git-cherry-pick/README.md)
