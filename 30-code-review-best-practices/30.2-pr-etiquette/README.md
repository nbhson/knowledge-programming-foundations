# 📬 30.2 PR Etiquette (Nghi Thức Pull Request)

> **PR nhỏ, mô tả rõ, tự review trước — là 3 yếu tố quyết định review nhanh.**
> PR 200 dòng có review trong 1 giờ; PR 2000 dòng nằm 2 tuần.

---

## 🧠 Quy Tắc PR

```
1. PR NHỎ (< 400 dòng diff) — review chất lượng giảm mạnh khi PR lớn
2. MỘT MỤC ĐÍCH MỘT PR — không trộn "fix bug + thêm feature + đổi format"
3. Mô tả: WHAT + WHY + HOW TO TEST + ảnh/chụp nếu UI
4. Tự review trước khi gửi — tự bắt lỗi trước reviewer
5. Draft PR cho WIP — tránh review nhầm code chưa xong
```

---

## 💻 Code Ví Dụ

```markdown
## Mô tả PR chuẩn

### What
Thêm endpoint `GET /orders/:id/export` xuất CSV.

### Why
Sales cần xuất đơn hàng để báo cáo (ticket: SALES-321).

### How
- Dùng streaming để không tốn RAM với đơn lớn (xem 24.1)
- Thêm test: 200, 404, 403
- ADR-012: chọn CSV thay vì Excel (file nhẹ, Excel mở được)

### How to test
1. `npm test` — 12 test mới
2. `curl localhost:3000/orders/ORD-1/export -H "Authorization: Bearer ..."`

### Checklist
- [x] Test coverage ≥ 80%
- [x] Docs cập nhật
- [x] Không secret trong code
```

```bash
# ===== Trước khi gửi PR: tự review =====
git diff main...HEAD --stat        # tổng quan files
git diff main...HEAD               # đọc lại từng dòng như reviewer
# Câu hỏi tự vấn: commit nhỏ gọn? có debug log sót? naming nhất quán?
```

---

## ⚠️ Bẫy Thường Gặp

1. **PR to đùng** — reviewer lướt, bug lọt. Quy tắc thực chiến: < 400 dòng diff, > 800 thì tách PR.
2. **Mô tả chỉ có "fix bug"** — viết: symptom, nguyên nhân, giải pháp, cách test.
3. **Trộn format + logic trong 1 PR** — format làm diff lớn, che bug thật. Tách PR format riêng.
4. **Draft PR để review** — reviewer tốn công review code chưa xong. Draft rõ ràng.
5. **Force-push giữa review** — comment reviewer thành stale. Đẩy commit mới lên, không force-push khi đang review.

---

*Leaf thuộc [Lớp 30 — Code Review](../README.md)*