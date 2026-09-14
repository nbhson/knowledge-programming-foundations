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

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.2-rename-variable-method
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.7.3 Inline Method](../5.7.3-inline-method/README.md)