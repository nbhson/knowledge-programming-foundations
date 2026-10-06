# 📸 7.9 Snapshot Testing (Kiểm Thử Chụp Ảnh)

> **Snapshot testing** lưu lại output đúng một lần, rồi các lần sau **so sánh tự động** — rẻ cho UI/API shape ổn định, nguy hiểm khi lạm dụng cho logic hay thay đổi.

---

## 🎯 Vấn đề

Viết assert tay cho object lớn (UI tree 200 nodes, API response 50 fields) rất mệt. Snapshot giải quyết bằng cách serialize output thành file `.snap` và diff tự động:

```
lần 1: render(UserCard) → lưu snapshot ✅ (review tay 1 lần)
lần 2: render(UserCard) → so với snapshot → khác? báo fail ⚠️
```

Vấn đề: developer bấm `-u` (update) mù quáng → snapshot sai cũng thành "đúng".

---

## 💻 Code ví dụ

Mô phỏng serializer + so sánh snapshot, kèm ví dụ snapshot tốt/xấu.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

// Serializer: object → chuỗi ổn định (sort keys để diff deterministic)
function serialize(value: unknown): string {
  return JSON.stringify(sortKeys(value), null, 2);
}

// So sánh: stored vs received → diff dòng đầu tiên khác nhau
function matchSnapshot(stored: string, received: unknown): { pass: boolean; diff: string } {
  const next = serialize(received);
  if (stored === next) return { pass: true, diff: "" };
  return { pass: false, diff: diffLines(stored, next) };
}

// ✅ TỐT: snapshot API error shape ổn định
// ❌ XẤU: snapshot chứa timestamp/random (fail mỗi lần chạy)
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Rẻ cho output lớn | 1 dòng `toMatchSnapshot()` thay 50 dòng assert tay |
| Phát hiện thay đổi ngoài ý muốn | Ai đó vô tình đổi CSS class/API field → test đỏ ngay |
| Review diff trực quan | Snapshot file là text — xem diff trong PR như code thường |

---

## ⚠️ Lưu Ý

- **Không snapshot giá trị động**: timestamp, UUID, random → dùng serializer che đi hoặc mock clock.
- Snapshot fail ≠ bug: có thể là thay đổi có chủ đích → review diff rồi mới `-u`.
- Không thay thế assert có ý nghĩa: snapshot chỉ nói "có thay đổi", không nói "đúng hay sai".
- Giữ snapshot nhỏ: snapshot 5000 dòng không ai review được → tách component.

---

## 🎯 Khi nào dùng

- UI component ổn định (design system), API response shape, error format, config sinh ra.
- Không dùng khi: logic tính toán (viết assert explicit), data chứa random/time, output khổng lồ hay đổi.

---

## 🔗 Liên quan

- **7.1 Unit Testing** — snapshot là một dạng unit test cho output render.
- **7.3 E2E Testing** — visual regression (Percy/Chromatic) là snapshot ở tầng ảnh chụp.
- **5.x Code Review** — review snapshot diff trong PR như review code.

---

## 📚 Tài liệu

- Jest Snapshot Testing — https://jestjs.io/docs/snapshot-testing
- Vitest Snapshots — https://vitest.dev/guide/snapshot.html
- *Effective Snapshot Testing* — Kent C. Dodds blog

---

## ▶️ Chạy ví dụ

```bash
cd 07-testing/7.9-snapshot-testing
npx ts-node examples/index.ts
```

Demo: snapshot pass → thay đổi có chủ đích (fail + diff) → snapshot xấu chứa timestamp (flaky) → cách fix bằng serializer.

---

## ⏭️ Bài tiếp theo

→ [7.10 Fuzz Testing](../7.10-fuzz-testing/README.md)
