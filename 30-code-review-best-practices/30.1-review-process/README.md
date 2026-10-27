# 🔍 30.1 Review Process (Quy Trình Review)

> **Review là bộ lọc cuối trước khi code vào main.** Checklist tốt gồm 3 lớp:
> đúng đắn (correctness), thiết kế (design), khả năng bảo trì (maintainability).

---

## 🧠 Checklist Review Chuẩn

```
1. ĐÚNG ĐẮN (correctness)
   □ Logic đúng với yêu cầu? Edge case?
   □ Test đủ? Test có nghĩa (không phải test để xanh)?
   □ Xử lý lỗi? (null, network fail, timeout)
   □ Bảo mật: input validate? secret không lộ? (xem 09-security)

2. THIẾT KẾ (design)
   □ Đặt đúng chỗ? (không phải feature khác bị lôi kéo)
   □ Abstraction hợp lý — không quá cứng, không quá generic
   □ Tuân thủ pattern hiện có của codebase

3. KHẢ BẢO TRÌ (maintainability)
   □ Tên rõ ràng?   □ Hàm quá dài (>50 dòng)?
   □ Test đọc được? □ Có docs/cập nhật docs khi cần?
   □ Performance: N+1 query, vòng lặp lồng?
```

---

## 💻 Comment Review Hiệu Quả

```markdown
# ❌ Comment tệ:
"Này code sai."                            (không nói sai gì, nơi nào)
"Cái này dùng lodash đi."                  (không giải thích tại sao)
"Ok"                                       (không review gì)

# ✅ Comment tốt — Conventional Comments format:
**question:** Vì sao dùng O(n²) ở đây? Nếu n > 1000 có chậm không?
**suggestion:** Tách hàm này ra — đang làm 3 việc (xem SRP).
**nitpick:** Tên biến `x` → `retryCount` sẽ rõ hơn. (nit — không chặn merge)
**blocking:** Đây là SQL injection — bắt buộc fix trước khi merge (CVE).

# Phân cấp từ khóa:
blocking   — phải sửa trước khi merge (bug, bảo mật)
non-blocking— nên sửa nhưng không chặn (đề xuất)
nitpick    — mặt ngoài (format, đặt tên), không quan trọng
praise     — khen code viết tốt (duy trì văn hóa tích cực)
```

---

## ⚖️ Author vs Reviewer Trách Nhiệm

| Author | Reviewer |
|---|---|
| PR nhỏ (< 400 dòng diff) | review trong 24h |
| Tự review trước khi gửi | đọc kỹ, không approve qua loa |
| Mô tả: gì, tại sao, cách test | hỏi "tại sao" khi không rõ |
| CI xanh trước khi review | tập trung logic, không nitpick format |

---

## ⚠️ Bẫy Thường Gặp

1. **Nitpick format** — dùng linter/formatter tự động (Prettier, ESLint), review chỉ nói logic.
2. **"LGTM" không đọc** — review hình thức = không có review. Tệ hơn không review.
3. **PR khổng lồ 2000 dòng** — không ai review nổi. Tách PR nhỏ, review từng phần.
4. **Chờ 3 ngày mới review** — context nguội, rebase mệt. Đặt SLA review < 24h.
5. **Review là chiến tranh bản ngã** — "code của tôi đúng" → chữ khéo: "Điều gì xảy ra nếu X?" thay vì "Bạn sai."

---

*Leaf thuộc [Lớp 30 — Code Review](../README.md)*