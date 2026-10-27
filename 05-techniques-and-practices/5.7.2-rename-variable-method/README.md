# 🏷️ 5.7.2 Rename Variable/Method

> Đổi tên biến, tham số, method, class cho **tự nói lên ý định** — không đổi logic, chỉ đổi "ngôn ngữ" của code.

---

## 🎯 Vấn đề

Tên tối nghĩa (`calc`, `u`, `e`, `act`, `d`) khiến người đọc phải **đoán** nghĩa:

```
❌ calc(u, e, act, exp)   — u là username hay unit? d = act - exp là gì?

✅ canResumeTrial(contact, activeDays, expiredDays)
   → hasValidContact && stillInsideWindow — đọc như câu hỏi nghiệp vụ
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ TRƯỚC
function calc(u: string, e: string, act: number, exp: number): boolean {
  const d = act - exp;
  return u !== "" && e.includes("@") && d > 30;
}

// ✅ SAU
function canResumeTrial(contact: Contact, activeDays: number, expiredDays: number): boolean {
  const freeDaysUsed = activeDays - expiredDays;
  const hasValidContact = contact.username !== "" && contact.email.includes("@");
  return hasValidContact && freeDaysUsed > 30;
}
```

---

## 📏 Quy tắc đặt tên

| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| Method | Bắt đầu bằng **verb** | `calculateTotal`, `sendNotification` |
| Biến | **Danh từ** rõ nghĩa | `freeDaysUsed`, `orderTotal` |
| Boolean | `is` / `has` / `can` | `isGold`, `hasValidContact` |
| Hằng số | Viết hoa + nghĩa | `RnvResumeWindowDays` |
| Tránh | Abbreviation | `u` → `username`, `act` → `activeDays` |

---

## ❌ BAD — thêm 1 case: tên dài nhưng vẫn tối nghĩa

Dài không đồng nghĩa với rõ — tên kể sai "cấp độ" (quá chi tiết implementation, thiếu ý định):

```typescript
// ❌ BAD — dài dòng mà vẫn phải đoán: string đó là gì? check để làm gì?
function checkStringValueAndReturnBooleanResult(inputStringValue: string): boolean {
  const tempFlagVariable = inputStringValue.includes("@");
  return tempFlagVariable;
}

// ✅ GOOD — ngắn hơn nhưng đúng cấp độ nghiệp vụ
function isValidEmail(email: string): boolean {
  const hasAtSign = email.includes("@");
  return hasAtSign;
}
```

> Tên tốt trả lời **"cái gì / để làm gì"** ở đúng cấp độ trừu tượng của hàm, không phải "nó là kiểu gì".

---

## ⚖️ Trade-off: đổi tên vs giữ tên cũ

| Tình huống | Quyết định | Vì sao |
|------------|------------|--------|
| Tên viết tắt, 1 chữ (`u`, `d`, `tmp`) | ✅ Đổi ngay | Rẻ, an toàn, lợi ích đọc hiểu lớn |
| Tên sai ý định (`getUser` mà còn ghi DB) | ✅ Đổi ngay | Tên dối trá gây bug hiểu nhầm |
| Tên đã dùng ở public API nhiều caller | ⚖️ Cân nhắc | Giữ alias cũ (deprecated) + đổi dần, tránh vỡ caller |
| Tên "hơi chưa hay" nhưng cả team đã quen | 🚫 Khoan đổi | Rename hàng loạt gây nhiễu diff, tốn review |
| Đổi tên kèm đổi logic | 🚫 Tách 2 bước | Rename thuần trước (diff chỉ là tên), logic sau |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Tên quá dài kể cả implementation (`getUserFromDbByIdWithCache`) | Đọc mệt, tên thối rữa khi đổi implementation | Tên nói **ý định**, chi tiết giấu trong body |
| Đổi tên biến local mà quên rename ở closure lồng nhau | Shadow variable — bug lén khó thấy | Dùng refactor tool của IDE (F2), không find-replace tay |
| Dùng từ đồng nghĩa lung tung (`fetch`/`get`/`retrieve` lẫn lộn) | Cả codebase 3 tên cho 1 việc | Thống nhất 1 từ điển: `get` (sync), `fetch` (async)... |
| Tên boolean không phải câu hỏi (`isValid` → `check`) | `if (check)` đọc không thành câu | Boolean luôn `is/has/can/should` |

---

## ✅ Checklist khi review

- [ ] Đọc tên hàm + tham số có đoán đúng việc nó làm không (không cần đọc body)?
- [ ] Biến boolean đọc thành câu hỏi `is/has/can` chưa?
- [ ] Không còn viết tắt 1 chữ (`u`, `e`, `d`) trừ biến vòng lặp ngắn?
- [ ] Thuật ngữ nhất quán với cả codebase (không `fetch` chỗ này `get` chỗ kia)?
- [ ] Rename thuần túy (diff chỉ đổi tên, không lẫn logic)?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.2-rename-variable-method
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.3 Inline Method](../5.7.3-inline-method/README.md)