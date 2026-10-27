# 📄 28.1 Code Documentation (Tài Liệu Code)

> **Comment tốt giải thích TẠI SAO, không phải LÀM GÌ.** Code đã nói "làm gì";
> comment giải thích logic không hiện ra từ code: WHY, trade-off, caveat, link ticket.

---

## 🎯 Quy Tắc Vàng

```
✅ NÊN comment:
  - WHY (lý do không rõ: "hack này vì bug #1234 trong Safari 15")
  - Trade-off đã cân nhắc ("dùng O(n²) vì n < 100, đủ nhanh")
  - Magic number nguồn gốc ("43200 = 12 giờ, theo SLA CS")
  - Warning nguy hiểm ("không gọi trong transaction — sẽ deadlock")

❌ ĐỪNG comment:
  - Dịch code ra lời (i++ // tăng i) — code tự nói
  - Lịch sử chỉnh sửa (sửa bởi Sơn ngày...) — git log làm việc đó
  - Code chết đã comment — git history giữ, cứ xóa
```

---

## 💻 Code Ví Dụ

```typescript
/**
 * Tính lãi suất kép theo tháng.
 *
 * @param principal - vốn gốc (VND)
 * @param annualRate - lãi suất năm, ví dụ 0.08 = 8%
 * @param months - số tháng gửi
 * @returns tổng tiền cuối kỳ (gốc + lãi), làm tròn VND
 * @throws {RangeError} nếu principal ≤ 0
 * @example
 *   compoundInterest(10_000_000, 0.08, 12) // → ~10_381_289
 */
function compoundInterest(principal: number, rate: number, months: number): number {
  // WHY: dùng công thức đóng thay vì vòng lặp — chính xác hơn khi months lớn
  return principal * Math.pow(1 + rate / 12, months);
}

// ===== TODO vs FIXME: quy ước team phải thống nhất =====
// TODO: chia nhỏ hàm này khi thêm feature X (dự kiến Q3)
// FIXME: race condition khi 2 request cùng gọi — cần mutex (issue #456)
// ⚠️ TODO không có ticket/owner = rác. Luôn ghi: TODO(#123): nội dung

// ===== Doc comment cho PUBLIC API, comment inline cho WHY =====
/**
 * Xác thực user bằng token.
 * @throws {UnauthorizedError} token hết hạn hoặc sai
 * @example
 *   const user = await authenticate(token);
 */
export async function authenticate(token: string): Promise<User> {
  // Không check cache ở đây — Redis cho phép stale 30s (trade-off: freshness vs load)
  ...
}
```

---

## ⚠️ Bẫy Thường Gặp

1. **Comment "LÀM GÌ" thay vì "TẠI SAO"** — `// tăng i` vô dụng; `// skip user bị ban` có giá trị.
2. **Comment với code chết** — `// const old = ...` — xóa, git history có hết.
3. **Doc không cập nhật khi đổi code** — comment sai còn tệ hơn không có. Review phải check docs.
4. **JSDoc quá dài dòng cho private** — docs công khai (API/lib) cần; private function tên rõ là đủ.
5. **Dùng comment thay vì refactor** — đoạn code cần 10 dòng comment để giải thích = tách hàm, đặt tên tốt hơn.

---

*Leaf thuộc [Lớp 28 — Documentation & ADR](../README.md)*