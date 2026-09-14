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

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.5-decompose-conditional
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.6 Replace Magic Number](../5.7.6-replace-magic-number/README.md)