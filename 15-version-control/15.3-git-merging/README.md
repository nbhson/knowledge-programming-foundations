# 🔀 15.3 Git Merging (Hợp nhất Git)

> **Merge** kết hợp thay đổi từ nhiều branch thành một, tạo commit merge mới. Đây là cơ chế cốt lõi cho collaborative workflow trong Git.

---

## 🎯 Vấn Đề

```
❌ Không có merge:
├─ Code từ nhiều developer không kết hợp được — phải copy-paste thủ công
├─ Copy-paste thủ công → dễ sai sót, dễ quên thay đổi
├─ Khó track changes qua nhiều người — không biết ai đổi gì
└─ Không có audit trail của việc hợp nhất

✅ Git Merge giải quyết bằng:
├─ Tự động combine thay đổi từ 2+ branches
├─ Tạo merge commit ghi nhận lịch sử hợp nhất
├─ Giải quyết conflict tự động hoặc semi-auto khi cần
└─ Giữ nguyên history của từng branch — traceable
```

**Cơ chế ba phía (three-way merge):** Git tìm **Common Ancestor** (LCA — Lowest Common Ancestor) của 2 branch, rồi diff separately từ LCA → each branch, cuối cùng combine 2 diffs. Đây là lý do Git merge chính xác hơn manual copy-paste.

---

## 📊 Merge vs Rebase — Nhìn trực quan

```
MERGE (giữ nguyên):                         REBASE (viết lại):

main:    A---B---C---M                       main:    A---B---C
            \         /                              \
feature:   D---E───/                         feature: D'---E'
(feature merge commit)                       (feature replayed on top)

→ Giữ merge commit M                         → Linear history, no merge commit
→ An toàn — không rewrite                    → Sạch nhưng rewrite history
```

**Khi nào dùng merge vs rebase:**
- **Merge** khi branch đã push lên remote và người khác có thể dựa vào nó
- **Rebase** khi branch chỉ có bạn dùng (local-only) và muốn clean history trước merge

---

## 💻 Thực hành Merge

### Fast-Forward Merge

Xảy ra khi feature branch **không divergence** — tức là main không có commit mới sau khi feature branch được tạo.

```bash
# Tình huống: feature branch chỉ có commit mới hơn main
git checkout main
git merge feature/login
# Kết quả: main trỏ thẳng đến feature/login HEAD
# Không tạo merge commit mới — history vẫn linear
```

```
Before:                             After:
main:      A---B---C                 main:      A---B---C---D---E
feature:          \                  feature:         \
                   D---E                         D---E
```

**Fast-forward là mặc định** khi merge có thể. Bạn có thể tắt bằng `--no-ff`.

### Three-Way Merge

Xảy ra khi 2 branch đều có commit mới sau divergence point.

```bash
git checkout main
git merge feature/payment
# Kết quả: Tạo merge commit mới (M)
```

```
Before:                              After:
main:    A---B---C---D               main:    A---B---C---D---M
            \       /                         \           /
feature:     E---F───/                       E---F───────
                                         feature: E---F
```

---

## ⚠️ Giải quyết Merge Conflict

Conflict xảy ra khi **cả 2 branch sửa cùng 1 vùng code**. Git không thể tự quyết định nên giữ phiên bản nào.

```bash
# Khi conflict xảy ra, git sẽ báo:
# CONFLICT (content): Merge conflict in src/auth/login.ts

# Bước 1: Xem file có conflict
git status
# modified:   src/auth/login.ts

# Bước 2: Mở file và tìm conflict markers
# Git chèn markers vào file:
<<<<<<< HEAD                ← đầu của main version
const port = process.env.PORT || 3000;
=======                      ← phân cách
const port = parseInt(process.env.PORT, 10) || 3000;
>>>>>>> feature/env-config   ← cuối của feature version

# Bước 3: Giải quyết conflict thủ công
# Chọn 1 phiên bản, hoặc combine cả 2, hoặc viết lại hoàn toàn
const port = parseInt(process.env.PORT, 10) || 3000;

# Bước 4: Mark as resolved (git cần biết conflict đã fix)
git add src/auth/login.ts

# Bước 5: Hoàn tất merge commit
git commit -m "Merge feature/env-config into main"
# (hoặc git merge --continue nếu đã khởi động merge trước đó)
```

### Merge conflict types:

| Type | Dấu hiệu | Cách xử lý |
|------|----------|-----------|
| Content conflict | `<<<<<<< HEAD` markers | Manual resolve: chọn/buộc merge 2 sides |
| Add/add conflict | Cùng file được add bởi 2 branch | Chọn 1 side, hoặc combine content |
| Rename/rename conflict | Cùng file rename khác nhau | Git không tự resolve được — manual |
| Delete/modify conflict | 1 bên delete, bên kia sửa | Quyết định: giữ delete hay revert |

### Tools giúp resolve conflict:

```bash
# Merge tool (opens visual diff tool)
git mergetool          # dùng tool mặc định (meld, vimdiff, tkdiff...)
git mergetool -t VSCode # dùng VS Code làm merge tool

# Xem diff chi tiết của conflict
git diff               # hiện conflict regions

# Abort merge nếu muốn quay lại trước khi merge
git merge --abort
```

---

## 🛠 Các tùy chọn Merge

```bash
# Merge với message tùy chỉnh
git merge feature/login -m "Merge feature/login for auth module"

# Luôn tạo merge commit, kể cả fast-forward possible
git merge --no-ff feature/login
# → useful khi muốn đánh dấu "feature hoàn thành" trong history

# Squash merge — nén tất cả commit feature thành 1 commit duy nhất
git merge --squash feature/login
git commit -m "feat: add user authentication"
# → main chỉ có 1 commit mới, nhưng feature history bị ẩn

# Merge giữ author info của từng commit
git merge --no-ff --no-squash feature/login

# Abort merge giữa chừng (khi chưa commit)
git merge --abort

# Merge chỉ metadata (không thay đổi file) — rare use case
git merge -s ours feature/legacy
```

**So sánh `--no-ff` vs `--squash`:**

| Option | History | Commit count | Use case |
|--------|---------|-------------|----------|
| Default (ff) | Linear | +0 (fast-forward) | Feature branch đã merge, không cần dấu |
| `--no-ff` | Branching | +1 (merge commit) | Muốn đánh dấu "feature complete" |
| `--squash` | Linear | +1 (squash commit) | Muốn history sạch, hide individual commits |

---

## ✅ Ưu điểm Merge

| Ưu điểm | Giải thích sâu |
|---------|----------------|
| 📚 Giữ history | Mọi commit được giữ nguyên, merge commit đánh dấu thời điểm integration |
| 🔒 An toàn | Không rewrite history — safe cho shared/public branches |
| 🔄 Dễ rollback | `git revert <merge-commit>` undo merge an toàn |
| 👥 Team-friendly | Ai cũng hiểu được history — nhìn graph là thấy branch merge point |

---

## ⚠️ Lưu ý quan trọng

```
📌 Luôn pull remote trước khi merge — đảm bảo base latest
   → git pull origin main trước khi merge feature

📌 Resolve conflict cẩn thận, đọc kỹ code 2 sides
   → Đừng accept mặc định 1 side nếu không hiểu tại sao conflict xảy ra

📌 Test sau khi merge xong — conflict resolve có thể introduce bug
   → Chạy test suite trước khi push merge commit

📌 Dùng --no-ff để giữ merge commit rõ ràng
   → Giúp trace "feature X được integrate khi nào"

📌 Tránh squashing commit public (shared branch)
   → Squash rewrite history, gây vấn đề cho đồng nghiệp
```

---

## 🎯 Khi nào dùng gì? — Bảng quyết định

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Feature branch đã merge xong, muốn giữ history | `git merge --no-ff` | Merge commit đánh dấu integration point rõ ràng |
| Giữ linear history đẹp, không quan tâm merge commit | `git rebase` trước khi merge | History sạch, dễ bisect |
| Public/shared branch (người khác đã clone) | `git merge` (không rebase) | Tránh rewrite history gây hại cho team |
| Cleanup trước merge PR (nhiều WIP commits) | `git merge --squash` + 1 commit | PR hiện 1 commit sạch, không lộ WIP history |
| Feature branch small, 1–2 commits | Fast-forward merge (mặc định) | Không cần merge commit noise |
| Emergency hotfix vào production | Merge từ hotfix branch vào main | Fast, audit trail rõ |

---

## 🔗 Liên quan

- **15.2 Git Branching** — Tạo và quản lý branch
- **15.4 Git Rebase** — Tái cấu trúc commit
- **15.5 Git Cherry-Pick** — Chọn commit cụ thể

---

## 📚 Tài liệu tham khảo

- 📖 [Git Merge - Official Docs](https://git-scm.com/docs/git-merge)
- 📖 [Resolving a merge conflict — GitHub Docs](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts)
- 📖 [Git Branching Strategies — Atlassian](https://www.atlassian.com/git/tutorials/comparing-workflows)
- 📖 [Three-way merge — Git internals explanation](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.3-git-merging
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [15.4 Git Rebase](../15.4-git-rebase/README.md)
