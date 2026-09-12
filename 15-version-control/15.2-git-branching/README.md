# 🌿 15.2 Git Branching (Phân nhánh Git)

> **Branch** cho phép phát triển tính năng song song mà không ảnh hưởng code chính.

---

## 🎯 Vấn Đề

```
❌ Làm việc trên 1 branch duy nhất:
├─ Không thể phát triển tính năng mới mà không ảnh hưởng production
├─ Khó experiment vì sợ phá hỏng codestable
└─ Multiple developers conflict liên tục

✅ Branch giải quyết bằng:
├─ Mỗi tính năng = 1 branch riêng
├─ Branch chính (main) luôn ổn định
└─ Merge khi tính năng hoàn thiện
```

---

## 📊 Visual Diagram

```
main:    A---B---C---D---E   (production-ready)
            \       /
feature:     F---G---H      (tính năng mới)
                 \
bugfix:          I---J      (sửa lỗi khẩn cấp)
```

---

## 💻 Tạo và quản lý branch

```bash
# Xem các branch hiện có
git branch
git branch -v

# Tạo branch mới
git branch feature/login
git checkout feature/login

# Hoặc tạo và chuyển ngay (gộp 2 lệnh)
git checkout -b feature/login

# Đổi tên branch
git branch -m feature/login feature-auth

# Xóa branch (đã merge)
git branch -d feature/login

# Xóa branch (chưa merge - cẩn thận!)
git branch -D feature/login
```

---

## 🔄 Chuyển đổi branch

```bash
# Chuyển sang branch khác
git checkout main
git switch feature/login      # cách mới hơn

# Tạo và chuyển ngay
git checkout -b feature/payment

# Xem lịch sử branch
git log --oneline --graph --all
```

---

## 📝 Branch Naming Conventions

```
✅ TỐT:
├─ feature/user-auth      → Tính năng xác thực user
├─ fix/login-bug          → Sửa lỗi đăng nhập
├─ hotfix/payment-fix     → Sửa khẩn cấp thanh toán
├─ release/v1.2.0         → Phát hành version
└─ chore/update-deps      → Cập nhật dependencies

❌ KHÔNG TỐT:
├─ new-feature            → Mơ hồ
├─ tmp                    → Không rõ mục đích
├─ fix                    → Quá chung chung
└─ main-backup            → Không theo convention
```

---

## 🛠 Branch Strategies

### Git Flow

```
┌─────────────────────────────────────┐
│  main (production)                  │
│       ▲                             │
│       │ merge                     │
│  develop ──▶ feature/*             │
│       ▲                             │
│       │ merge                     │
│  release/* ──▶ hotfix/*            │
└─────────────────────────────────────┘
```

### GitHub Flow (đơn giản hơn)

```
main ──▶ feature/xyz ──merge──▶ main
                        PR review
```

---

## ✅ Ưu điểm của Branching

| Ưu điểm | Giải thích |
|---------|------------|
| 🧪 Experiment an toàn | Thử nghiệm không ảnh hưởng main |
| 👥 Parallel work | Nhiều người làm cùng lúc |
| 🔀 Easy rollback | Xóa branch nếu không cần |
| 📋 Code review | PR/MR trước khi merge |

---

## ⚠️ Lưu ý quan trọng

```
📌 Luôn pull branch chính trước khi tạo feature mới
📌 Đổi tên branch cho rõ ràng mục đích
📌 Xóa branch đã merge để repository sạch
📌 Không push branch develop trực tiếp lên remote nếu không cần
📌 Dùng feature branch cho mọi thay đổi
```

---

## 🎯 Khi nào tạo branch mới?

| Scenario | Hành động |
|----------|-----------|
| Phát triển tính năng mới | `git checkout -b feature/ten-tinh-nang` |
| Sửa bug | `git checkout -b fix/ten-bug` |
| Hotfix production | `git checkout -b hotfix/ten-hotfix` |
| Release preparation | `git checkout -b release/v1.0` |

---

## 🔗 Liên quan

- **15.1 Git Basics** — Nền tảng Git cơ bản
- **15.3 Git Merging** — Hợp nhất branch với merge
- **15.4 Git Rebase** — Tái cấu trúc lịch sử commit

---

## 📚 Tài liệu tham khảo

- 📖 [Git Branching - Pro Git](https://git-scm.com/book/en/v2/Git-Branching)
- 📖 [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- 📖 [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

---

## ⏭️ Bài tiếp theo

→ [15.3 Git Merging](../15.3-git-merging/README.md)
