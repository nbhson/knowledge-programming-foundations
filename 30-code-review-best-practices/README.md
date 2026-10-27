# 👀 Lớp 30: Code Review Best Practices (Review Code Chuẩn Nghề)

> **Code review là kiểm tra chất lượng VÀ truyền kiến thức.** Review tốt = chất
> lượng code tăng + team hiểu code của nhau. Review kém: nitpick format, bỏ qua
> bug logic, chậm phản hồi → team chán.

> Liên quan: `14-clean-code` (chuẩn code để review), `28-documentation-adr` (ADR link),
> `07-testing` (test là điều kiện merge), `15-version-control` (PR workflow).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 30.1 | Review Process | Quy trình, checklist, tone | [30.1-review-process](30.1-review-process/README.md) |
| 30.2 | PR Etiquette | PR nhỏ, mô tả rõ, phản hồi lịch sự | [30.2-pr-etiquette](30.2-pr-etiquette/README.md) |

---

## 🧠 Triết Lý Review

```
Review KHÔNG phải để bắt lỗi — compile/test làm rồi.
Review để:
  1. Truyền kiến thức (người review hiểu code mình chưa viết)
  2. Bắt bug logic + thiết kế (test không thấy)
  3. Giữ nhất quán codebase
  4. Chia sẻ trách nhiệm chất lượng (không phải "code của ai đó")

Sức khỏe team > cá nhân đúng:
  "Đây là gợi ý" thay vì "Sai rồi" 
  Nitpick không chặn merge: Nit: ...
```

---

## 🔗 Liên Kết Chéo

- **Viết code sạch trước khi review:** `14-clean-code`
- **Quy trình git:** `15-version-control`
- **Checklist:** dùng cùng `28.3-adr` cho quyết định lớn

---

## 📖 Tài Nguyên Tham Khảo

- Google Engineering Practices — code review guide (kinh điển)
- Conventional Comments — format comment review rõ ràng