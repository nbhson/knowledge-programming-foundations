# 🧊 5.12.1 Immutability (Bất Biến)

> **Immutability**: dữ liệu **không thay đổi sau khi tạo**. Muốn "đổi" → **tạo bản sao mới**, giữ nguyên bản gốc.

---

## 📚 Mục Lục

| # | Lemma | Mô Tả |
|---|-------|-------|
| 5.12.1 | [⭐ Ví dụ nhanh](#-ví-dụ-nhanh) | Immutability trong TS |
| 5.12.1 | [Immutability](#immutability) | Khái niệm |
| 5.12.1 | [▶️ Chạy ví dụ](#️-chạy-ví-dụ) | Run examples |

---

## ⭐ Ví dụ nhanh

| | Mutable ❌ | Immutable ✅ |
|---|-----------|--------------|
| Cập nhật | `user.age = 26` | `{ ...user, age: 26 }` |
| Thêm vào array | `list.push(x)` | `[...list, x]` |
| Trạng thái gốc | Bị sửa | Giữ nguyên |
| Debug | Khó trace | Dễ trace (từng bản rõ) |

```typescript
const user = { name: "John", age: 25 };

// ❌ MUTABLE — sửa trực tiếp object gốc
user.age = 26;
console.log(user); // { name: 'John', age: 26 } ← gốc bị đổi

// ✅ IMMUTABLE — spread tạo bản mới
const updatedUser = { ...user, age: 26 };
console.log(user);        // { name: 'John', age: 25 } ← gốc nguyên vẹn
console.log(updatedUser); // { name: 'John', age: 26 } ← bản mới
```

---

## Immutability

### Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🎯 **Predictable** | Không ai sửa data của bạn bất ngờ |
| 🧪 **Dễ test** | Trạng thái cũ không còn nữa → ít bug phụ thuộc thứ tự |
| ⚖️ **Thread-safe** | Không cần lock khi concurrent đọc |
| 🔍 **Debug đơn giản** | Mỗi lần thay đổi = 1 reference mới, so sánh được |

### Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 💸 **Memory overhead** | Tạo nhiều object mới (GC xử lý khá tốt) |
| 🧠 **Học mất thời gian** | Người mới hay `push` trực tiếp |

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.12.1-immutability
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.12.2 Pure Functions](../5.12.2-pure-functions/README.md)
