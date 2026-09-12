# 🍒 15.5 Git Cherry-Pick (Chọn commit cụ thể)

> **Cherry-pick** là kỹ thuật chọn một commit cụ thể từ branch này áp dụng vào branch khác.

---

## 🎯 Vấn Đề

```
❌ Không có cherry-pick:
├─ Muốn áp dụng 1 fix từ branch A sang branch B nhưng không muốn merge cả branch
├─ Cần hotfix vào production mà không đưa feature đang phát triển
└─ Phải copy-paste code thủ công → dễ sai

✅ Git Cherry-Pick giải quyết bằng:
├─ Chọn commit cụ thể để áp dụng
├─ Giữ nguyên commit message và author
├─ Không cần merge toàn bộ branch
└─ Nhanh chóng áp dụng fix quan trọng
```

---

## 📊 Cherry-Pick Flow

```
main:        A---B---C---D---E
                      ↑
feature:     F---G---H---I   (fix I cần vào main)

Cherry-pick I vào main:
main:        A---B---C---D---E---I'
                              ↑
                         (commit mới, nội dung giống I)
```

---

## 💻 Cú pháp Cherry-Pick

```bash
# 1. Xem commit cần pick
git log --oneline feature/login
# Output:
# abc1234 fix: resolve login timeout
# def5678 feat: add password validation
# ghi9012 chore: update auth config

# 2. Copy commit hash
# abc1234

# 3. Chuyển sang branch đích
git checkout main

# 4. Cherry-pick commit
git cherry-pick abc1234

# 5. Hoặc nhiều commit cùng lúc
git cherry-pick abc1234 def5678

# 6. Hoặc range commit
git cherry-pick abc1234^..def5678
```

---

## 🛠 Các tùy chọn Cherry-Pick

```bash
# Sửa message commit mới
git cherry-pick abc1234 -e

# Apply nhưng chưa commit (xem trước)
git cherry-pick --no-commit abc1234

# cherry-pick nhiều commit thành 1
git cherry-pick abc1234 def5678 -m 1

# Abort nếu có vấn đề
git cherry-pick --abort

# Continue sau khi fix conflict
git cherry-pick --continue
```

---

## ⚠️ Pitfalls cần tránh

```
❌ CHERRY-PICK COMMITS RÁC
   → Chỉ pick commit có ý nghĩa (fix, feature hoàn chỉnh)

❌ CHERRY-PICK VÀO WRONG BRANCH
   → Kiểm tra kỹ branch đích trước khi pick

❌ BỎ QUA DEPENDENCIES
   → Commit được pick có thể phụ thuộc commit khác

✅ TỐT NHẤT:
   → Pick commit đã test kỹ
   → Kiểm tra conflict trước khi apply
   → Test lại sau khi cherry-pick
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 Chính xác | Chọn đúng commit cần |
| ⚡ Nhanh | Không cần merge cả branch |
| 🔒 An toàn | Branch chính vẫn ổn định |
| 📝 Giữ author | Commit giữ nguyên tác giả |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Conflict dễ xảy ra | Test kỹ trước khi pick |
| 🟡 Mất context | Document rõ lý do pick |
| 🟡 Duplicate work | Cân nhắc merge thay vì pick |

---

## 🎯 Khi nào dùng Cherry-Pick?

| Scenario | Hành động |
|----------|-----------|
| Hotfix production | ✅ Cherry-pick fix commit |
| Backport feature | ⚠️ Cân nhắc merge thay thế |
| Debug isolated issue | ✅ Pick commit test |
| Cần cả branch | ❌ Dùng merge thay vì pick |

---

## 🔗 Liên quan

- **15.2 Git Branching** — Quản lý branch strategies
- **15.3 Git Merging** — Hợp nhất branch
- **15.4 Git Rebase** — Tái cấu trúc history

---

## 📚 Tài liệu tham khảo

- 📖 [Git Cherry-Pick - Official Docs](https://git-scm.com/docs/git-cherry-pick)
- 📖 [When to Cherry-Pick](https://www.atlassian.com/git/tutorials/cherry-pick)

---

## ⏭️ Bài tiếp theo

→ [15.6 Git Hooks](../15.6-git-hooks/README.md)
