# 🧩 5.7.5 Decompose Conditional

> Tách điều kiện dài & khó đọc thành các **method predicate có tên** — mỗi điều kiện con là một câu hỏi nghiệp vụ rõ ràng.

---

## 🎯 Vấn đề

```
❌ TRƯỚC — phải căng não phân tích:
   if (leave.age >= 60 || leave.serviceYears >= 15 || (leave.joinedOnHoliday && !leave.isExpat))

✅ SAU — điều kiện được "đặt tên":
   topTier = isSenior(age) || isLongService(years) || isHolidayLocal(joinedOnHoliday, isExpat)
   → mỗi predicate trả lời 1 câu: già chưa? thâm niên? nghỉ lễ nội địa?
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ TRƯỚC
function extraDays(leave: Leave): number {
  if (leave.age >= 60 || leave.serviceYears >= 15 || (leave.joinedOnHoliday && !leave.isExpat)) {
    return 5;
  }
  if (leave.serviceYears >= 10) return 3;
  return 0;
}

// ✅ SAU
function extraDays(leave: Leave): number {
  const topTier =
    isSenior(leave.age) ||
    isLongService(leave.serviceYears) ||
    isHolidayLocal(leave.joinedOnHoliday, leave.isExpat);
  if (topTier) return 5;
  if (hasTenure(leave.serviceYears)) return 3;
  return 0;
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 📖 **Đọc như quy tắc nghiệp vụ** | Không cần phân tích lại từng `&&` / `\|\|` |
| ♻️ **Tái dùng predicate** | `isSenior()` dùng ở nhiều chỗ khác |
| 📝 **Tự tài liệu hóa** | Tên predicate ghi lại ý định của rule |
| 🔍 **Debug dễ hơn** | Biết nhánh nào true/false mà không cần breakpoint sâu |

---

## ❌ BAD — thêm 1 case: tách predicate nhưng tên vẫn kể implementation

```typescript
// ❌ BAD — predicate chỉ "dịch" code sang tiếng Anh, không lên cấp nghiệp vụ
function checkCond1(leave: Leave): boolean {
  return leave.age >= 60;
}
function checkCond2And3(leave: Leave): boolean {
  return leave.serviceYears >= 15 || (leave.joinedOnHoliday && !leave.isExpat);
}

// ✅ GOOD — mỗi predicate là 1 câu hỏi nghiệp vụ, tái dùng được ở nơi khác
function isSenior(age: number): boolean { return age >= 60; }
function isLongService(years: number): boolean { return years >= 15; }
function isHolidayLocal(joinedOnHoliday: boolean, isExpat: boolean): boolean {
  return joinedOnHoliday && !isExpat;
}
```

> Predicate tốt đặt tên bằng **ngôn ngữ của domain** (`isSenior`), không phải `checkCond1`. Tên dở = decompose hình thức, đọc vẫn mệt.

---

## ⚖️ Trade-off: decompose vs giữ if nguyên

| Tình huống | Quyết định | Vì sao |
|------------|------------|--------|
| Điều kiện lồng ≥ 2 tầng hoặc dài > 1 dòng | ✅ Decompose | Não người giữ được ~3 mảnh logic cùng lúc |
| Điều kiện con tái dùng ở nơi khác | ✅ Decompose thành predicate | Viết 1 lần, test 1 lần |
| If đơn giản 1 điều kiện rõ nghĩa | 🚫 Giữ nguyên | `if (age >= 18)` đã là câu hoàn chỉnh |
| Predicate chỉ dùng 1 lần và tên không rõ hơn code | ⚖️ Tùy | Dùng biến const đặt tên thay vì tách hàm |
| Điều kiện là state machine nhiều nhánh | ⚖️ Cân nhắc Strategy (11.x) | Decompose quá nhiều predicate vẫn rối — đổi pattern |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Predicate có side effect (`isValidAndSave()`) | Gọi trong `if` 2 lần → ghi DB 2 lần | Predicate phải **pure**: chỉ trả boolean |
| Thứ tự `&&`/`\|\|` phụ thuộc short-circuit mà tách bừa | Đổi thứ tự gọi → null-check chạy sau chỗ dùng | Giữ đúng thứ tự đánh giá, test case null/undefined |
| Tên predicate khẳng định nhưng logic phủ định (`isReady` mà check `!expired`) | Đọc ngược, review miss bug | Tên và logic cùng chiều; phủ định thì tên phủ định (`isExpired`) |
| Decompose xong xóa luôn comment giải thích "tại sao" | Mất lý do nghiệp vụ (quy định nào? từ khi nào?) | Giữ comment WHY ở predicate, code chỉ nói WHAT |

---

## ✅ Checklist khi review

- [ ] Mỗi predicate đọc thành 1 câu hỏi nghiệp vụ (không `check1/check2`)?
- [ ] Predicate là hàm pure (không side effect, không đổi state)?
- [ ] Thứ tự short-circuit (`&&`/`||`) được giữ nguyên sau khi tách?
- [ ] Comment WHY (quy định nào) còn nguyên ở predicate?
- [ ] Nhánh true/false nào cũng có test (không predicate nào "chết")?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.5-decompose-conditional
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.6 Replace Magic Number](../5.7.6-replace-magic-number/README.md)