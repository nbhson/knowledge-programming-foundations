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

---

## ✅ Khi nào nên comment

| Trường hợp | Ví dụ |
|------------|-------|
| Giải thích **tại sao** một quyết định không hiển nhiên | `// Tạm thời disable retry vì API rate-limit` |
| Cảnh báo về side effect khó phát hiện | `// ⚠️ Gọi hàm này đồng bộ — blocking main thread` |
| Link tài liệu tham khảo ngoài | `// Tài liệu API: docs.internal/payment-v2` |
| TODO/FIXME có context | `// TODO: migrate sang v2 khi endpoint deprecated` |
| Legal/compliance notice | `// Copyright 2024 Company Inc.` |

---

## ❌ Khi nào KHÔNG comment

| Trường hợp | Thay thế bằng |
|------------|---------------|
| Code đã tự nói rõ nghĩa | Không cần comment — đổi tên biến/hàm |
| Comment nói lại code (redundant) | Xóa comment, cải thiện naming |
| Comment cũ không còn đúng | Xóa — git history lưu mọi thứ |
| Pseudo-code dài dòng | Viết function riêng có tên rõ |

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

---

## 📝 Comment styles trong TypeScript

### Block comment (`/** ... */`) — cho public API

```typescript
/**
 * Tính tổng tiền đơn hàng bao gồm thuế và phí ship.
 *
 * @param items     Danh sách sản phẩm trong giỏ
 * @param userId    ID người dùng (dùng để xác định mức thuế)
 * @returns Tổng tiền cần thanh toán (đơn vị: VND)
 * @throws InvoiceError nếu items trống
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
```

### Directive comments (tool-specific)

```typescript
/* eslint-disable no-console */   // tắt rule cụ thể
/* c8 ignore next 3 */            // bỏ qua branch khỏi coverage
// ts-ignore: upstream library has bad types
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

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Dùng JSDoc cho public API | Comment diễn giải từng dòng code |
| Giải thích **tại sao**, không **cái gì** | Comment mô tả thay đổi gần đây |
| Xóa comment cũ khi refactor code | Để TODO/FIXME không theo dõi |
| Dùng `// TODO:` + owner + date | Comment dài >2 dòng cho logic đơn giản |

---

## 📚 Tài liệu

- 📖 [Supercomments — James Sumners](https://jsumners.github.io/supercomments/)
- 📖 [JSDoc reference](https://jsdoc.app/)

---

## ⏭️ Bài tiếp theo

→ [14.3 Error Handling](../14.3-error-handling/README.md)
