# 🔢 5.7.6 Replace Magic Number

> Số "ma" (15000000, 0.085, 8...) xuất hiện lộn xộn trong code rất khó hiểu và dễ sửa nhầm → thay bằng **hằng số có tên**: một nơi định nghĩa, mọi nơi khác chỉ nhắc tên.

---

## 🎯 Vấn đề

```
❌ TRƯỚC — code đầy số ma:
   if (salary >= 15000000 && savings >= 100000000 && creditScore >= 700)
   return salary * 8;  return loan * 0.085;  return loan / 12;

   💬 15000000 là gì? 8 là gì? 0.085 là lãi tháng hay năm? 12 để làm gì?
   💬 Đổi lãi suất → phải lần từng chỗ 0.085, lỡ sửa nhầm chỗ khác

✅ SAU — hằng số có tên:
   isPrimeCustomer() dùng RmMinMonthlySalary / RmMinSavings / RmMinCreditScore
   yearlyInterest() dùng RmAnnualInterestRate
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
const RmMinMonthlySalary = 15_000_000;
const RmMinSavings = 100_000_000;
const RmMinCreditScore = 700;
const RmMaxLoanMultiple = 8;
const RmAnnualInterestRate = 0.085;

function maxLoan(salary: number, savings: number, creditScore: number): number {
  const multiple = isPrimeCustomer(salary, savings, creditScore) ? RmMaxLoanMultiple : RmNormalLoanMultiple;
  return salary * multiple;
}
```

---

## 📏 Quy tắc

| Tình huống | Xử lý |
|------------|-------|
| Số có ý nghĩa nghiệp vụ (lãi suất, hạn mức, tuổi tối thiểu) | ✅ Hằng số có tên |
| Số chỉ để đếm/tạm (`i++`, `array.length`, khởi tạo 0/1) | 🚫 Cứ để nguyên |
| Cùng nghĩa ở nhiều nơi | ✅ Dùng CHUNG một hằng số, không copy value |

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.6-replace-magic-number
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.8 Data Handling](../5.8-data-handling/README.md)