# 🌿 15.2 Git Branching (Phân nhánh Git)

> **Branch** cho phép phát triển tính năng song song mà không ảnh hưởng code chính. Branch trong Git là **lightweight pointer** — tạo/xóa branch chỉ tốn microseconds.

---

## 🎯 Vấn Đề

```
❌ Làm việc trên 1 branch duy nhất:
├─ Không thể phát triển tính năng mới mà không ảnh hưởng production
├─ Khó experiment vì sợ phá hỏng code stable
├─ Multiple developers conflict liên tục trên cùng branch
└─ Không có không gian cách ly giữa feature đang dev và hotfix

✅ Branch giải quyết bằng:
├─ Mỗi tính năng = 1 branch riêng, độc lập
├─ Branch chính (main) luôn ổn định, deploy được
└─ Merge khi tính năng hoàn thiện và đã qua review
```

**Cơ chế:** Branch thực chất là 1 file text chứa 40-character SHA-1 hash trỏ đến commit. Tạo branch mới = tạo 1 file mới. Không copy data.

---

## 📊 Visual Diagram

```
main:    A---B---C---D---E   (production-ready — luôn deploy được)
            \       /
feature:     F---G---H      (tính năng mới — divergence từ C)
                 \
bugfix:          I---J      (sửa lỗi khẩn cấp — divergence từ E)

Branch pointers:
  main     → E
  feature  → H
  bugfix   → J
```

**Key insight:** Branch không tách physical files — chúng chia sẻ same objects cho đến điểm divergence. Git chỉ lưu **commit graph**, không lưu directory per branch.

---

## 💻 Tạo và quản lý branch

```bash
# Xem các branch hiện có
git branch                        # local branches
git branch -r                     # remote tracking branches
git branch -a                     # cả local + remote
git branch -v                     # kèm commit cuối mỗi branch

# Tạo branch mới (không switch)
git branch feature/login

# Tạo branch mới từ commit cụ thể
git branch feature/v2-history abc1234

# Chuyển sang branch khác
git checkout main
git switch feature/login      # cách mới hơn (Git 2.23+)

# Tạo và chuyển ngay (gộp 2 lệnh thành 1)
git checkout -b feature/payment
git switch -c feature/payment   # cách mới hơn

# Đổi tên branch
git branch -m feature/login feature-auth
git branch -m old-name new-name            # đổi tên branch hiện tại

# Xóa branch (đã merge vào current branch)
git branch -d feature/login

# Xóa branch (chưa merge — ⚠️ cẩn thận!)
git branch -D feature/login
git branch --delete --force feature/login  # cách rõ nghĩa hơn

# Xóa remote branch
git push origin --delete feature/login

# Xem branch nào đã merge vào current
git branch --merged
git branch --no-merged                   # branch chưa merge (an toàn để xóa)
```

---

## 🔄 Chuyển đổi branch

```bash
# Chuyển branch — working dir sẽ đổi theo
git checkout main
git switch feature/login

# Tạo và chuyển ngay
git checkout -b feature/payment
git switch -c feature/payment   # Git 2.23+

# Xem lịch sử branch (đồ thị)
git log --oneline --graph --all

# Detached HEAD state — đang ở commit cụ thể, không phải branch
git checkout abc1234
# ⚠️ Commits trong detached HEAD sẽ mất nếu checkout branch khác
# ✅ An toàn: git checkout -b temp-branch abc1234
```

**Detached HEAD là gì?** Khi bạn `git checkout <commit-hash>`, bạn không ở trên branch nào — HEAD trỏ trực tiếp đến commit. Đây là mode read-only về cơ bản: commit mới tạo ra sẽ "mất" khi bạn chuyển branch.

---

## 📝 Branch Naming Conventions

```
✅ TỐT:
├─ feature/user-auth      → Tính năng xác thực user
├─ feature/payment-flow   → Tính năng thanh toán
├─ fix/login-bug          → Sửa lỗi đăng nhập
├─ fix/cart-null-coerce   → Fix null trong cart
├─ hotfix/payment-fix     → Sửa khẩn cấp thanh toán production
├─ release/v1.2.0         → Chuẩn bị phát hành version
└─ chore/update-deps      → Cập nhật dependencies

❌ KHÔNG TỐT:
├─ new-feature            → Mơ hồ, không biết làm gì
├─ tmp                    → Không rõ mục đích, dễ xóa nhầm
├─ fix                    → Quá chung chung
├─ master-backup          → Không theo convention
├─ v2-rewrite             → Sound like work-in-progress, not feature
└─ johns-branch           → Personal naming, khó hiểu cho team
```

**Pattern recommendation:**
| Prefix | Dùng khi | Example |
|--------|----------|---------|
| `feature/` | Tính năng mới | `feature/user-profile` |
| `fix/` | Bug fix | `fix/header-z-index` |
| `hotfix/` | Emergency fix production | `hotfix/payment-timeout` |
| `release/` | Chuẩn bị release | `release/v2.1.0` |
| `chore/` | Maintenance | `chore/update-eslint` |

---

## 🛠 Branch Strategies — When to use what

### Git Flow (phức tạp, có cấu trúc)

```
main (production)      ← release chỉ merge vào đây
    ▲
    │ merge
develop (integration)  ← feature merge vào đây
    ▲
    │ merge
feature/* (worker)
```

**Phù hợp:** Team có release schedule cố định (v1.0, v2.0), có release manager, sản phẩm enterprise.

**Không phù hợp:** Startup MVP, continuous deployment, team < 5 người.

### GitHub Flow (đơn giản)

```
main ←── merge PR ── feature/xyz
  ▲
  │ branch off
  └── always deployable
```

**Phù hợp:** Web app deployed continuously, team agile, không có release manager.

### Trunk-Based (tốc độ cao)

```
main/trunk ──●──●──●──●──●──● (commit trực tiếp hoặc branch < 1 ngày)
```

**Phù hợp:** CI/CD mature, test coverage cao, feature flags, team Google-scale.

---

## ✅ Ưu điểm của Branching

| Ưu điểm | Giải thích sâu |
|---------|----------------|
| 🧪 Experiment an toàn | Thử nghiệm không ảnh hưởng main — nếu hỏng thì xóa branch, không mất gì |
| 👥 Parallel work | Nhiều developer làm different features đồng thời, không lock file |
| 🔀 Easy rollback | Xóa branch nếu không cần — zero cost, no side effect |
| 📋 Code review | PR/MR trước khi merge = quality gate tự động |

---

## ⚠️ Lưu ý quan trọng

```
📌 Luôn pull branch chính trước khi tạo feature mới
   → git checkout main && git pull origin main
   → đảm bảo branch mới bắt đầu từ base latest

📌 Đổi tên branch cho rõ ràng mục đích
   → git branch -m old-name new-name
   → đặc biệt quan trọng khi branch tên mơ hồ như "dev", "new"

📌 Xóa branch đã merge để repository sạch
   → git branch --merged | grep -v "\*" | xargs git branch -d
   → giữ repo không rác branch

📌 Không push branch develop trực tiếp lên remote nếu không cần
   → develop là integration branch nội bộ, không phải shared

📌 Dùng feature branch cho MỌI thay đổi
   → kể cả fix 1 dòng — branching costs ≈ 0, không có lý do commit trực tiếp main
```

---

## 🎯 Khi nào tạo branch mới?

| Scenario | Hành động | Lập luận |
|----------|-----------|----------|
| Phát triển tính năng mới | `git checkout -b feature/ten-tinh-nang` | Cách ly work khỏi main, dễ review |
| Sửa bug | `git checkout -b fix/ten-bug` | Branch name communicates purpose |
| Hotfix production | `git checkout -b hotfix/ten-hotfix` từ main | Không chờ feature branch merge xong |
| Release preparation | `git checkout -b release/v1.0` từ develop | Isolate release-specific changes |
| Experiment/POC | `git checkout -b experiment/idea-name` | Safe sandbox, xóa khi không dùng |

---

## 🔗 Liên quan

- **15.1 Git Basics** — Nền tảng Git cơ bản
- **15.3 Git Merging** — Hợp nhất branch với merge
- **15.4 Git Rebase** — Tái cấu trúc lịch sử commit

---

## 📚 Tài liệu tham khảo

- 📖 [Git Branching - Pro Git, Chapter 3](https://git-scm.com/book/en/v2/Git-Branching)
- 📖 [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- 📖 [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- 📖 [Trunk-Based Development — Martin Fowler](https://martinfowler.com/articles/nonDeterminism.html)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.2-git-branching
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [15.3 Git Merging](../15.3-git-merging/README.md)
