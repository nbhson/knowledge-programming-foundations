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

## ❌ BAD — thêm 1 case: spread nông (shallow) tưởng là bất biến

```typescript
// ❌ BAD — spread chỉ copy tầng 1: object lồng bên trong vẫn chung reference
const order = { id: "o1", customer: { name: "An", vip: false } };
const copy = { ...order };
copy.customer.vip = true;      // 💥 order.customer.vip cũng thành true!
console.log(order.customer);   // { name: "An", vip: true } ← gốc bị đổi lén

// ✅ GOOD — copy sâu đúng chỗ cần đổi (hoặc structuredClone khi cần cả cây)
const fixed = { ...order, customer: { ...order.customer, vip: true } };
// order.customer.vip vẫn false ✅ — mỗi tầng trên đường đổi đều là bản mới
```

> Spread/`Object.freeze` đều **nông**. Quy tắc: **copy mọi tầng trên đường đi tới chỗ đổi**; còn lại giữ reference chung (vừa an toàn vừa tiết kiệm memory).

---

## ⚖️ Trade-off: immutable vs mutable có kiểm soát

| Tình huống | Chọn | Vì sao |
|------------|------|--------|
| State chia sẻ (store, cache, props) | ✅ Immutable | Không ai sửa lén data của người khác |
| Vòng lặp nóng, mảng triệu phần tử | ⚖️ Mutable cục bộ | Tạo bản mới mỗi vòng lặp = GC gánh nặng → mutate buffer nội bộ, trả bản frozen ra |
| Object lồng sâu, đổi lá | ⚖️ Copy đường đi / lib (immer) | Spread tay 5 tầng vừa rối vừa dễ sót |
| Freeze để "an toàn" | ⚠️ Nhớ là shallow | `Object.freeze` không chặn đổi lồng trong — cần deep-freeze hoặc type readonly |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Tưởng spread là deep copy | Đổi lồng trong làm gốc đổi theo (ví dụ trên) | Copy theo đường đi; `structuredClone` khi cần cả cây (nhớ mất function/Date đặc biệt) |
| `sort()`/`reverse()` tại chỗ rồi bảo "immutable" | 2 method này mutate mảng gốc | `[...arr].sort()`, `[...arr].reverse()` |
| `Object.freeze` nông + tin là xong | Lồng trong vẫn đổi được, xanh giả | `readonly` ở type + freeze; hoặc immer produce |
| So sánh `===` để check đổi sau khi mutate lén | Reference giống nhau → memo/React.memo tưởng không đổi | Kỷ luật: mọi "đổi" đều trả reference mới |

---

## ✅ Checklist khi review

- [ ] Mọi cập nhật state đều trả object/array mới (không `.push`/gán trực tiếp)?
- [ ] Chỗ lồng sâu đã copy đủ các tầng trên đường đổi?
- [ ] Không có `.sort()`/`.reverse()`/`.splice()` tại chỗ trên data chia sẻ?
- [ ] `Object.freeze` (nếu dùng) đi kèm type `readonly`, không tin mù quáng?
- [ ] Test assert cả "bản gốc không đổi" chứ không chỉ "bản mới đúng"?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.12.1-immutability
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.12.2 Pure Functions](../5.12.2-pure-functions/README.md)
