# 🔄 15.4 Git Rebase (Tái cấu trúc Git)

> **Rebase** là kỹ thuật di chuyển branch dựa trên commit mới nhất của branch khác, tạo lịch sử linear. Khác với merge (giữ nguyên graph), rebase **viết lại history** bằng cách replay commits lên base mới.

---

## 🎯 Vấn Đề

```
❌ Không có rebase (chỉ dùng merge):
├─ Lịch sử commit rối rắm khi merge nhiều branch
├─ Nhiều merge commit không cần thiết ("merge noise")
├─ Khó đọc `git log` — branch graph phức tạp
└─ `git bisect` kém hiệu quả do branch merging

✅ Git Rebase giải quyết bằng:
├─ Tạo linear history — commits xếp thành hàng dọc
├─ Loại bỏ merge commit không cần thiết
├─ Dễ đọc và debug — log rõ ràng
└─ PR đẹp: mỗi PR là 1 chuỗi commit clean, không chen ngang merge
```

**Cơ chế:** Rebase tìm divergence point, rồi "cut" series commits từ branch và "paste" lên đầu branch target. Result: commits mới có parent khác (commit hash thay đổi), nhưng content giống hệt.

---

## 📊 Merge vs Rebase — Deep comparison

```
MERGE (giữ nguyên):                          REBASE (viết lại):

main:    A---B---C---M                       main:    A---B---C
            \         /                               \
feature:   D---E───/                         feature: D'---E'
(feature merge commit)                        (feature replayed)

→ Giữ merge commit M                          → Linear history
→ An toàn — không rewrite                     → Sạch, dễ đọc
→ visible branch structure                    → commit hashes thay đổi
```

**Sự thật quan trọng:** D' và E' có **hash khác** D và E (vì parent khác), nhưng **content giống hệt**. Đây là lý do rebase danger zone: hash change = history rewrite.

---

## 💻 Thực hành Rebase

### Basic Rebase

```bash
# Rebase feature branch lên main mới nhất
git checkout feature/login
git rebase main
# Kết quả: D và E được replay lên đầu của main (C)

# Rebase main vào feature (rare — thường không nên)
git checkout main
git rebase feature/payment
# ⚠️ Rewrites main history — DANGER cho shared branches

# Rebase lên remote branch (sync với colleague's work)
git rebase origin/main
```

### Interactive Rebase — powerful editing tool

```bash
# Mở interactive rebase (3 commit gần nhất)
git rebase -i HEAD~3

# Trong editor sẽ hiện:
pick abc123 feat: add login form
pick def456 feat: add validation
pick ghi789 fix: update styles

# Các lệnh có thể dùng (thay 'pick' bằng):
# pick    - Giữ nguyên commit
# reword  - Sửa message commit
# edit    - Dừng lại để sửa code, rồi continue
# squash  - Gộp vào commit trước (giữ message cả 2)
# fixup   - Góp và bỏ message (giữ commit trước)
# drop    - Xóa commit hoàn toàn
# exec    - Chạy lệnh shell tại đây
```

**Interactive rebase use cases:**
| Mục đích | Thao tác |
|----------|------|
| Gom 5 WIP commits thành 1 | pick → squash × 4 |
| Sửa commit message sai | pick → reword |
| Xóa commit không cần | drop |
| Sửa code trong commit cũ | pick → edit → sửa → `git add .` → `git commit --amend` → `git rebase --continue` |
| Đảo thứ tự commits | đổi line order |

### Amend Commit

```bash
# Sửa commit cuối cùng (chưa push)
git add fixed_file.js
git commit --amend -m "fix: corrected validation logic"
# → commit hash thay đổi, content + message mới

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
   → bất kỳ branch nào người khác đã clone

✅ AN TOÀN REBASE:
   → Feature branch cá nhân (chưa push)
   → Local-only changes
   → Private work in progress
   → Branch trước khi mở PR
```

### Tại sao cấm rebase public branch?

```
Người A:     A---B---C (push main lên remote)
Người B:     A---B---C---D (pull main, rebase feature lên C, push)
Người A:     ❌ Khi pull, git thấy C ≠ C' (hash khác sau rebase)
              → Phải force push hoặc resolve thủ công
              → Có thể mất work của A nếu không cẩn thận
```

> 📌 **Quy tắc vàng:** Chỉ rebase những commit **chỉ bạn mới có**. Nếu commit đã push lên remote và người khác có thể dựa vào, dùng merge thay thế.

** exception:** `git pull --rebase` an toàn vì nó chỉ rebase **local commits của bạn** lên các commits mới nhất trên remote, không rebase shared branches.

---

## 🛠 Các tùy chọn Rebase

```bash
# Skip pre-rebase hook check
git rebase --no-verify

# Giữ merge commits trong quá trình rebase (preserve structure)
git rebase --preserve-merges    # cũ
git rebase --rebase-merges      # Git 2.27+

# Abort rebase nếu gặp vấn đề (quay lại trạng thái trước rebase)
git rebase --abort

# Tiếp tục rebase sau khi fix conflict
git rebase --continue

# Xem patch đang apply
git rebase --show-current-patch

# Rebase với conflict strategy
git rebase -X theirs main    # prefer incoming changes on conflict
git rebase -X ours main     # prefer current branch on conflict
```

---

## ✅ Ưu điểm Rebase

| Ưu điểm | Giải thích sâu |
|---------|----------------|
| 📐 Linear history | Lịch sử dạng cây thẳng, dễ đọc `git log --oneline` |
| 🧹 Clean project | Không có merge commit noise — mỗi PR là chuỗi commit clean |
| 🔍 Dễ debug | `git bisect` hoạt động tốt hơn trên linear history |
| 📋 PR đẹp | Reviewer thấy commits theo thứ tự thời gian, không chen merge |

---

## ⚠️ Nhược điểm Rebase

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Rewrite history | Chỉ rebase local branch, không rebase shared |
| 🔴 Mất work nếu sai | Backup branch trước khi rebase: `git branch backup-feature` |
| 🟡 Học curve | Thực hành với local repo trước, dùng `--abort` khi cần undo |
| 🟡 Force push required | Luôn dùng `--force-with-lease` thay vì `--force` |

**Mitigation tips:**
```bash
# Backup trước khi rebase lớn
git branch backup/my-feature-before-rebase

# Force push an toàn (chỉ overwrite nếu remote chưa có commit mới)
git push --force-with-lease origin feature/login

# Undo rebase nếu sai
git reflog              # tìm commit trước rebase
git reset --hard <before-rebase-commit>
```

---

## 🎯 Khi nào dùng gì? — Bảng quyết định

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Giữ history nguyên vẹn (branch shared) | `git merge` | Tránh rewrite history gây vấn đề cho team |
| Muốn linear history (branch local only) | `git rebase` | History sạch, dễ đọc |
| Public/shared branch | `git merge` (không rebase) | Quy tắc vàng: không rewrite shared history |
| Cleanup PR trước merge | `git rebase -i` | Gom WIP commits, sửa message trước khi merge |
| Sync feature branch với main mới nhất | `git rebase main` | Tránh merge commit noise khi PR merge sau |
| Fix commit message sai | `git rebase -i` + reword | Sửa history local trước khi push |
| Incorporate main updates vào feature | `git rebase main` hoặc `git merge main` | Nếu feature chưa push → rebase; nếu đã push → merge |

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Rebase và merge giống nhau" | Merge giữ graph; rebase rewrite parent chain → hash thay đổi |
| "Rebase luôn tốt hơn merge" | Không — rebase danger zone khi branch đã shared |
| "Interactive rebase nguy hiểm" | Chỉ nguy hiểm khi dùng trên shared branch. Local branch → an toàn |
| "Rebase = mất commits" | Rebase không xóa commit — nó tạo commit mới với parent khác. Commit cũ vẫn tồn tại trong reflog |

---

## 🔗 Liên quan

- **15.2 Git Branching** — Tạo và quản lý branch
- **15.3 Git Merging** — Hợp nhất branch với merge
- **15.5 Git Cherry-Pick** — Chọn commit cụ thể

---

## 📚 Tài liệu tham khảo

- 📖 [Git Rebase - Official Docs](https://git-scm.com/docs/git-rebase)
- 📖 [Interactive Rebase — Pro Git](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)
- 📖 [When to Rebase — Atlassian](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)
- 📖 [Git Rebase Demo —interactive rebase visualization](https://git-rebase.info/)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.4-git-rebase
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [15.5 Git Cherry-Pick](../15.5-git-cherry-pick/README.md)
