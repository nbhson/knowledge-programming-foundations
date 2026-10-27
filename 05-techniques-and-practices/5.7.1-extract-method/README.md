# ✂️ 5.7.1 Extract Method

> Tách một đoạn code dài (validate + tính toán + định dạng) thành các **method nhỏ có tên** — mỗi method chỉ làm MỘT việc, hành vi không đổi.

---

## 🎯 Vấn đề

Một hàm dài làm mọi thứ rất khó đọc, khó test, khó tái dùng:

```
❌ TRƯỚC — print() dồn hết: validate + subtotal + VIP + gift + format

✅ SAU — mỗi bước là 1 method nhỏ:
   hasItems() → validate() → subtotal() → applyVip() → applyGift() → format()
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ TRƯỚC — một hàm dài
function print(items: OrderItem[], isVip: boolean): string {
  // validate items...
  let total = 0;
  for (const item of items) total += item.qty * item.price;
  if (isVip) total *= 0.9;
  if (totalQty >= 5) total *= 0.85;
  return `Tổng: ${total} đồng`;
}

// ✅ SAU — mỗi bước một method
function print(items: OrderItem[], isVip: boolean): string {
  if (!hasItems(items)) return "Hóa đơn rỗng";
  validate(items);
  return format(applyGift(applyVip(subtotal(items), isVip), items));
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 📖 **Đọc như bảng mục lục** | `print()` chỉ còn các bước đặt tên rõ nghĩa |
| 🧪 **Test riêng được** | Mỗi method test độc lập, không cần chạy cả luồng |
| ♻️ **Tái dùng** | `subtotal()`, `validate()` dùng lại ở nhiều nơi |
| 🐞 **Dễ fix bug** | Biết ngay lỗi nằm ở bước applyVip hay format |

> ⚠️ Đừng tách quá nhỏ thành "sốt ruột" — method vô nghĩa (1 dòng, tên thừa) thường bị **Inline** ngược lại (xem 5.7.3).

---

## ❌ BAD — thêm 1 case: tách sai ranh giới

Tách theo "số dòng" chứ không theo ý nghĩa — cắt đôi 1 phép tính, người đọc vẫn phải ghép 2 hàm mới hiểu:

```typescript
// ❌ BAD — calcPart1/calcPart2: tên không kể được câu chuyện nghiệp vụ
function calcPart1(items: OrderItem[]): number {
  let total = 0;
  for (const item of items) total += item.qty * item.price;
  return total;
}
function calcPart2(total: number, isVip: boolean): number {
  return isVip ? total * 0.9 : total;
}

// ✅ GOOD — tách ở ranh giới nghiệp vụ: tên chính là tài liệu
function subtotal(items: OrderItem[]): number { /* tổng tiền hàng */ return 0; }
function applyVip(total: number, isVip: boolean): number { /* chiết khấu VIP */ return total; }
```

> Ranh giới tốt = chỗ mà **tên method kể được 1 câu nghiệp vụ hoàn chỉnh**.

---

## ⚖️ Trade-off: tách vs giữ nguyên

| Tình huống | Quyết định | Vì sao |
|------------|------------|--------|
| Đoạn code lặp lại ≥ 2 nơi | ✅ Extract | 1 nơi sửa, mọi nơi hưởng |
| Hàm dài > 20 dòng, nhiều bước | ✅ Extract từng bước | Đọc như mục lục |
| Đoạn code chỉ dùng 1 lần, ngắn (< 5 dòng) | ⚖️ Tùy | Tách chỉ khi tên làm rõ ý định |
| Method 1–2 dòng, tên không thêm nghĩa | 🚫 Giữ nguyên (xem 5.7.3) | Thêm lớp indirection vô ích |
| Đang debug gấp, chưa hiểu luồng | 🚫 Khoan tách | Tách khi chưa hiểu dễ bẻ gãy logic |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Tách quá nhỏ (mỗi hàm 1–2 dòng) | "Hàm sốt ruột" — nhảy 10 hàm mới hiểu 1 việc | Gộp ngược bằng Inline (5.7.3) |
| Tên method chung chung (`handle`, `process`, `doPart1`) | Tách mà vẫn khó đọc như cũ | Tên phải chứa động từ + đối tượng nghiệp vụ |
| Extract xong đổi luôn logic bên trong | Không còn là refactor — dễ sinh bug lén | Bước 1: tách y nguyên; bước 2 mới sửa (có test kẹp giữa) |
| Truyền 5–6 tham số vào method mới | Code smell: method đang "thèm" dữ liệu chỗ khác | Gom tham số thành object, hoặc xem lại ranh giới (5.7.4) |

---

## ✅ Checklist khi review

- [ ] Method mới có tên kể được 1 câu nghiệp vụ không?
- [ ] Hành vi trước/sau giống hệt (có test chạy xanh cả 2 bản)?
- [ ] Không truyền quá 3 tham số vào method mới?
- [ ] Không tạo ra method 1 dòng vô nghĩa (nên inline ngược)?
- [ ] Đoạn code gốc bị lặp ở nơi khác đã được tái dùng method mới chưa?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.1-extract-method
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.2 Rename Variable/Method](../5.7.2-rename-variable-method/README.md)