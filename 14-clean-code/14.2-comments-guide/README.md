# 💬 14.2 Comments Guide

> Comment tốt giải thích **tại sao** — không giải thích **cái gì**. Code tự nói cái gì đang xảy ra; comment nói tại sao nó phải như vậy.

---

## 🎯 Nguyên tắc vàng

```
❌ KHÔNG viết comment giải thích CODE:       ✅ Viết comment giải thích INTENT:

// Tăng i lên 1                               // Duyệt qua 3 phần tử đầu
i++;                                          // để tránh off-by-one ở edge case
                                              // (test case #47 xác nhận)
```

**Tại sao nguyên tắc này quan trọng?**
- Code có thể bị sửa, comment có thể lạc hậu → comment giải thích "cái gì" sẽ trở thành **dối trá** (misleading comment), nguy hiểm hơn không có comment.
- Comment giải thích "tại sao" tồn tại độc lập với implementation — ngay cả khi code đổi, lý do vẫn đúng.

---

## ✅ Khi nào nên comment

| Trường hợp | Ví dụ | Giải thích |
|------------|-------|------------|
| Giải thích **tại sao** một quyết định không hiển nhiên | `// Tạm thời disable retry vì API rate-limit` | Quyết định phi trực giác cần context |
| Cảnh báo về side effect khó phát hiện | `// ⚠️ Gọi hàm này đồng bộ — blocking main thread` | Prevent future regressions |
| Link tài liệu tham khảo ngoài | `// Tài liệu API: docs.internal/payment-v2` | Source of truth nằm ở đâu |
| TODO/FIXME có context | `// TODO: migrate sang v2 khi endpoint deprecated` | Không phải TODO vô hồn |
| Legal/compliance notice | `// Copyright 2024 Company Inc.` | Bắt buộc, không thể thay bằng code |
| Workaround cho bug bên thứ 3 | `// Workaround: upstream lib bug #1234 — remove when fixed` | Prevent "why does this exist?" confusion |

**Công thức comment tốt:**

```
// [Reason]: [What this achieves]
// [Optional: reference to issue/discussion]
```

---

## ❌ Khi nào KHÔNG comment

| Trường hợp | Thay thế bằng | Lý do |
|------------|---------------|-------|
| Code đã tự nói rõ nghĩa | Không cần comment — đổi tên biến/hàm | Comment redundant sớm lạc hậu |
| Comment nói lại code (redundant) | Xóa comment, cải thiện naming | Gây nhiễu, không thêm giá trị |
| Comment cũ không còn đúng | Xóa — git history lưu mọi thứ | Misleading comment độc hại hơn không có |
| Pseudo-code dài dòng | Viết function riêng có tên rõ | Function name = comment tự động |

```typescript
// ❌ Redundant - code đã nói rõ
// Set isAdmin to false
isAdmin = false;

// ✅ Self-documenting code
const isCurrentUserAdmin = currentUser.role === 'admin';

// ❌ Lừa dối - nội dung sai
// This function returns user ID
function getUserName() { return user.name; }

// ✅ Sửa luôn function name
function getUserName() { return user.name; }
```

> 📌 **Misleading comment > no comment.** Comment sai khiến developer tin vào thứ không đúng — họ sẽ bỏ qua thực tế code.

---

## 📝 Comment styles trong TypeScript

### Block comment (`/** ... */`) — cho public API

Dùng JSDoc cho exported functions, classes, interfaces — tooling (IDE autocomplete, docs generator) đọc được.

```typescript
/**
 * Tính tổng tiền đơn hàng bao gồm thuế và phí ship.
 *
 * Thuế được tính theo tỷ lệ 10% cho đơn dưới 1 triệu,
 * miễn phí ship cho đơn từ 500k.
 *
 * @param items     Danh sách sản phẩm trong giỏ
 * @param userId    ID người dùng (dùng để xác định mức thuế)
 * @returns Tổng tiền cần thanh toán (đơn vị: VND)
 * @throws InvoiceError nếu items trống
 * @example
 * calculateInvoiceTotal([{ price: 100000, qty: 2 }], 'u1');
 * // → 200000
 */
function calculateInvoiceTotal(
  items: LineItem[],
  userId: string
): number {
  // implementation
}
```

### Line comment (`//`) — cho logic nội bộ

```typescript
// Dùng binary search vì array đã được sort sẵn → O(log n)
const idx = bisectLeft(sortedUsers, targetId);

// FIXME: connection pool chưa được close khi error → memory leak
const conn = await pool.acquire();

// NOTE: timeout 5s là giới hạn từ SLA provider, không đổi
const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
```

### Directive comments (tool-specific)

```typescript
/* eslint-disable no-console */   // tắt rule cụ thể (giữ scope nhỏ nhất)
/* c8 ignore next 3 */            // bỏ qua branch khỏi coverage
// ts-ignore: upstream library has bad types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw: any = data;
```

---

## 🚩 Comment anti-patterns

```
📌 Comment thừa:                    📌 Comment không thêm giá trị:
// Kiểm tra nếu user null            if (user === null) return;
// Trả về mảng rỗng                 return [];  // (trả về mảng rỗng)

📌 Comment dạng status log:           📌 Comment hướng dẫn chạy code:
// 2024-01-15: sửa bug login         // Chạy lệnh này để deploy
// 2024-03-01: thêm feature         // (dùng git log hoặc changelog)

📌 Comment tạo kỳ vọng sai:           📌 Comment quá dài (>1 dòng không cần thiết)
// Hàm này rất nhanh (< 1ms)        // (Viết 10 dòng giải thích 1 dòng code)
```

**Phân loại anti-pattern chi tiết:**

| Anti-pattern | Ví dụ | Vấn đề | Fix |
|-------------|-------|--------|-----|
| Restatement | `i++; // increment i` | Code tự nói, comment redundant | Xóa comment |
| Misleading | `// Returns user ID` trên `getUserName()` | Developer tin comment, code sai | Sửa code hoặc tên function |
| Mandatory | Javadoc bắt buộc trên getter | Noise, không thêm giá trị | Tắt rule linter |
| Journal | `// 2024-01-15 đổi logic` | Git history đã lưu | Xóa, dùng changelog |
| Obscure | `// magic here` | Không giải thích được gì | Viết rõ reason hoặc refactor |

---

## 🎯 Self-documenting code vs Comment

```
Tốt nhất: code tự hiểu được              Trung bình: code + comment ngắn
┌─────────────────────────┐             ┌─────────────────────────┐
│ const daysUntilExpiry   │             │ // Approximate value    │
│   = formatDateDiff(     │             │ // for planning        │
│     today, expiryDate   │             │                        │
│   );                    │             │ const approxDays =      │
│                         │             │   Math.round(days);    │
│ Tên biến + kiểu rõ ràng │             │ // (why approximate)   │
└─────────────────────────┘             └─────────────────────────┘
```

**Mức ưu tiên:**
1. **Self-documenting** — đổi tên biến/hàm để code tự giải thích
2. **Good comment** — chỉ khi intent không thể hiện qua code
3. **No comment** — tốt hơn comment sai/redundant

---

## 📋 Comment Templates useful

```typescript
// TODO(username): description — due date hoặc ticket
// FIXME(username): description — known issue
// HACK: reason — temporary workaround
// NOTE: additional context that code doesn't show
// WARNING: important caution about behavior
```

> 💡 **Best practice:** TODO/FIXME nên có **owner** và **context**, không phải "fix later". Dùng `// TODO(@username): describe — reason` để dễ follow-up.

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Dùng JSDoc cho public API | Comment diễn giải từng dòng code |
| Giải thích **tại sao**, không **cái gì** | Comment mô tả thay đổi gần đây |
| Xóa comment cũ khi refactor code | Để TODO/FIXME không theo dõi |
| Dùng `// TODO:` + owner + date | Comment dài >2 dòng cho logic đơn giản |
| Giữ comment scope nhỏ (1–2 dòng) | Comment khối dài giải thích function |

---

## 📚 Tài liệu

- 📖 [Supercomments — James Sumners](https://jsumners.github.io/supercomments/)
- 📖 [JSDoc reference](https://jsdoc.app/)
- 📖 [Clean Code: Comments — Robert C. Martin, Chapter 8]

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 14-clean-code/14.2-comments-guide
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [14.3 Error Handling](../14.3-error-handling/README.md)
