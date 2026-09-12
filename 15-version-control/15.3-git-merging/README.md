# 🔀 15.3 Git Merging (Hợp nhất Git)

> **Merge** kết hợp thay đổi từ nhiều branch thành một, tạo commit merge mới.

---

## 🎯 Vấn Đề

```
❌ Không có merge:
├─ Code từ nhiều developer không kết hợp được
├─ Phải copy-paste thủ công → dễ sai sót
└─ Khó track changes qua nhiều người

✅ Git Merge giải quyết bằng:
├─ Tự động combine thay đổi
├─ Tạo merge commit ghi nhận lịch sử
├─ Giải quyết conflict khi cần
└─ Giữ nguyên history của từng branch
```

---

## 📊 Merge vs Rebase

```
MERGE:                          REBASE:
A---B---C---M                   A---B---C---D'---E'
 \         /                    \         /
  D---E───/                      F---G
(feature)                         (feature replayed)
```

- **Merge**: Giữ nguyên history, tạo merge commit
- **Rebase**: Viết lại history, linear hơn

---

## 💻 Thực hành Merge

### Fast-Forward Merge

```bash
# Khi branch không divergence (chạy song song)
git checkout main
git merge feature/login
# Kết quả: main trỏ thẳng đến feature/login
# Không tạo merge commit mới
```

### Three-Way Merge

```bash
# Khi branch đã divergence
git checkout main
git merge feature/payment
# Kết quả: Tạo merge commit mới
```

---

## ⚠️ Giải quyết Merge Conflict

```bash
# Khi conflict xảy ra, git sẽ báo:
# CONFLICT (content): Merge conflict in app.js

# 1. Xem file có conflict
git status
# modified:   app.js

# 2. Mở file và tìm conflict markers
<<<<<<< HEAD
const port = process.env.PORT || 3000;
=======
const port = parseInt(process.env.PORT, 10) || 3000;
>>>>>>> feature/env-config

# 3. Giải quyết conflict thủ công
const port = parseInt(process.env.PORT, 10) || 3000;

# 4. Mark as resolved
git add app.js

# 5. Commit merge
git commit -m "Merge feature/payment into main"
```

---

## 🛠 Các tùy chọn Merge

```bash
# Merge với message tùy chỉnh
git merge feature/login -m "Merge feature/login for auth"

# Abort merge nếu cần
git merge --abort

# Merge preserve author info
git merge --no-ff feature/login

# Squash merge (nhiều commit thành 1)
git merge --squash feature/login
git commit -m "feat: add user authentication"
```

---

## ✅ Ưu điểm Merge

| Ưu điểm | Giải thích |
|---------|------------|
| 📚 Giữ history | Mọi commit được giữ nguyên |
| 🔒 An toàn | Không rewrite history |
| 🔄 Dễ rollback | Revert merge commit được |
| 👥 Team-friendly | Ai cũng hiểu được history |

---

## ⚠️ Lưu ý quan trọng

```
📌 Luôn pull remote trước khi merge
📌 Resolve conflict cẩn thận, đọc kỹ code
📌 Test sau khi merge xong
📌 Dùng --no-ff để giữ merge commit rõ ràng
📌 Tránh squashing commit public (shared branch)
```

---

## 🎯 Khi nào dùng gì?

| Scenario | Khuyến nghị |
|----------|-------------|
| Feature branch đã merge xong | `git merge --no-ff` |
| Giữ linear history | `git rebase` |
| Public/shared branch | `git merge` (không rebase) |
| Cleanup trước merge PR | `git merge --squash` |

---

## 🔗 Liên quan

- **15.2 Git Branching** — Tạo và quản lý branch
- **15.4 Git Rebase** — Tái cấu trúc commit
- **15.5 Git Cherry-Pick** — Chọn commit cụ thể

---

## 📚 Tài liệu tham khảo

- 📖 [Git Merge - Official Docs](https://git-scm.com/docs/git-merge)
- 📖 [Resolving a merge conflict](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts)
- 📖 [Git Branching Strategies](https://www.atlassian.com/git/tutorials/comparing-workflows)

---

## ⏭️ Bài tiếp theo

→ [15.4 Git Rebase](../15.4-git-rebase/README.md)
