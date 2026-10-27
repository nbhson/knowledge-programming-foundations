# 🍒 15.5 Git Cherry-Pick (Chọn commit cụ thể)

> **Cherry-pick** là kỹ thuật chọn một commit cụ thể từ branch này áp dụng vào branch khác. Khác với merge (copy toàn bộ branch), cherry-pick **chỉ copy 1 commit**.

---

## 🎯 Vấn Đề

```
❌ Không có cherry-pick:
├─ Muốn áp dụng 1 fix từ branch A sang branch B nhưng không muốn merge cả branch
├─ Cần hotfix vào production mà không đưa feature đang phát triển chưa xong
├─ Phải copy-paste code thủ công → dễ sai sót, mất context
└─ Không thể chọn lọc commit từ branch dài

✅ Git Cherry-Pick giải quyết bằng:
├─ Chọn commit cụ thể để áp dụng vào branch hiện tại
├─ Giữ nguyên commit message và author info (optionally)
├─ Không cần merge toàn bộ branch — chỉ pick những gì cần
└─ Nhanh chóng áp dụng fix quan trọng mà không drag theo feature khác
```

**Cơ chế:** Cherry-pick tạo **commit mới** (hash mới) với content giống hệt commit được pick. Patch được apply lên working dir, rồi commit như bình thường. Result: commit mới "giống" commit cũ nhưng parent khác, hash khác.

---

## 📊 Cherry-Pick Flow

```
main:        A---B---C---D---E
                          ↑
feature:     F---G---H---I   (fix I cần vào main)

Cherry-pick I vào main:
main:        A---B---C---D---E---I'
                              ↑
                         (commit mới, nội dung giống I, hash khác)
feature:     F---G---H---I   (giữ nguyên, không đổi)
```

**Important:** I' có cùng content diff với I, nhưng hash khác (vì parent là E thay vì H). Đây cũng là lý do cherry-pick có thể gây conflict — vì base khác nhau.

---

## 💻 Cú pháp Cherry-Pick

```bash
# Bước 1: Xem commit cần pick (trên branch nguồn)
git log --oneline feature/login
# Output:
# abc1234 fix: resolve login timeout
# def5678 feat: add password validation
# ghi9012 chore: update auth config

# Bước 2: Copy commit hash cần pick
# abc1234

# Bước 3: Chuyển sang branch đích
git checkout main

# Bước 4: Cherry-pick commit
git cherry-pick abc1234
# → commit mới I' được tạo trên main

# Bước 5: Hoặc nhiều commit cùng lúc
git cherry-pick abc1234 def5678
# → áp dụng tuần tự, commit cách nhau

# Bước 6: Hoặc range commit (inclusive of start, exclusive of end^)
git cherry-pick abc1234^..def5678
# → pick tất cả commit từ abc1234 đến def5678

# Bước 7: Pick commit cuối cùng của branch hiện tại
git cherry-pick HEAD
```

---

## 🛠 Các tùy chọn Cherry-Pick

```bash
# Sửa message commit mới (open editor)
git cherry-pick abc1234 -e

# Apply changes nhưng chưa commit (xem trước effect)
git cherry-pick --no-commit abc1234
# → working dir có changes, có thể edit thêm rồi commit riêng

# Cherry-pick nhiều commit thành 1 (squash)
git cherry-pick --no-commit abc1234 def5678
git commit -m "feat: consolidated auth fixes"

# Abort nếu có vấn đề
git cherry-pick --abort

# Continue sau khi fix conflict
git cherry-pick --continue

# Skip commit (apply changes nhưng không commit)
git cherry-pick --skip

# Cherry-pick commit đã bị drop (trong interactive rebase context)
git cherry-pick <sha>
```

---

## ⚠️ Pitfalls cần tránh

```
❌ CHERRY-PICK COMMITS RÁC
   → Chỉ pick commit có ý nghĩa (fix, feature hoàn chỉnh)
   → Đừng pick commit WIP, intermediate state, hoặc "chore" không liên quan
   → COMMIT RÁC = pollute target branch history

❌ CHERRY-PICK VÀO WRONG BRANCH
   → Kiểm tra kỹ `git branch` trước khi pick
   → Pick nhầm branch = commit sai chỗ, phải undo sau

❌ BỎ QUA DEPENDENCIES
   → Commit được pick có thể phụ thuộc commit khác
   → Ví dụ: pick "fix UI bug" nhưng fix đó cần "new API endpoint" từ commit trước
   → Kết quả: conflict hoặc code chạy sai

✅ TỐT NHẤT:
   → Pick commit đã test kỹ, có message rõ
   → Kiểm tra conflict trước khi apply (dry-run với --no-commit)
   → Test lại sau khi cherry-pick — context khác có thể gây regression
```

### Dependency example (pitfall phổ biến):

```
feature branch:
  A (feat: add API endpoint)
  B (feat: use new endpoint in UI)    ← muốn pick cái này
  C (fix: style tweak)

Nếu chỉ pick B mà không pick A:
  → UI code gọi endpoint không tồn tại
  → runtime error, hoặc conflict khi apply
```

**Giải pháp:** pick cả A và B cùng lúc, hoặc merge cả branch.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích sâu |
|---------|----------------|
| 🎯 Chính xác | Chọn đúng commit cần, không drag theo code không liên quan |
| ⚡ Nhanh | Không cần merge cả branch — chỉ 1 commit operation |
| 🔒 An toàn | Branch chính vẫn ổn định, chỉ thêm commit đã chọn |
| 📝 Giữ author | Commit giữ nguyên tác giả gốc (`git cherry-pick -x` ghi chú original) |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Conflict dễ xảy ra | Test kỹ trước, dùng `--no-commit` để review trước khi commit |
| 🟡 Mất context | Commit message tự nói, nhưng relationship với commit gốc mất |
| 🟡 Duplicate work | Nếu branch source đang phát triển tiếp, phải cherry-pick lại commit mới |
| 🟡 Dependency hidden | Kiểm tra dependencies trước khi pick — dùng `git log --oneline <sha>^..<sha>` |

---

## 🎯 Khi nào dùng Cherry-Pick? — Bảng quyết định

| Scenario | Hành động | Lập luận |
|----------|-----------|----------|
| Hotfix production cần gấp | ✅ Cherry-pick fix commit | Cách nhanh nhất đưa fix vào main mà không merge feature đang dev |
| Backport feature sang older release branch | ⚠️ Cân nhắc merge thay thế | Cherry-pick từng commit phức tạp nếu có dependencies |
| Debug isolated issue | ✅ Pick commit test | Tách commit test ra branch debug riêng |
| Need the whole branch | ❌ Dùng merge thay vì pick | Cherry-pick không phải tool cho bulk transfer |
| Fix đã được test và approved | ✅ Cherry-pick | Safe khi commit đã có CI pass |
| Commit có nhiều dependencies | ❌ Dùng merge hoặc rebase | Pick single commit có thể break build |

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Cherry-pick = copy commit" | Cherry-pick tạo commit **mới** với hash mới — content giống, nhưng parent khác |
| "Cherry-pick an toàn tuyệt đối" | Có thể gây conflict hoặc missing dependency — cần test sau pick |
| "Cherry-pick tốt hơn merge" | Tùy case: pick cho 1 commit; merge cho toàn bộ branch |
| "Cherry-pick giữ original hash" | Không — hash luôn thay đổi vì parent khác |

---

## 🔗 Liên quan

- **15.2 Git Branching** — Quản lý branch strategies
- **15.3 Git Merging** — Hợp nhất branch
- **15.4 Git Rebase** — Tái cấu trúc history

---

## 📚 Tài liệu tham khảo

- 📖 [Git Cherry-Pick - Official Docs](https://git-scm.com/docs/git-cherry-pick)
- 📖 [When to Cherry-Pick — Atlassian](https://www.atlassian.com/git/tutorials/cherry-pick)
- 📖 [Pro Git — Cherry-Pick Chapter](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.5-git-cherry-pick
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [15.6 Git Hooks](../15.6-git-hooks/README.md)
