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

## ❌ BAD — thêm 1 case: hằng số hóa quá đà + tên hằng mơ hồ

```typescript
// ❌ BAD — số đếm vòng lặp cũng thành hằng + tên hằng không nói đơn vị
const ONE = 1;
const TWELVE = 12;
function monthlyPayment(loan: number): number {
  return (loan * 0.085) / TWELVE + ONE; // +ONE là gì? 0.085 tháng hay năm?
}

// ✅ GOOD — chỉ hằng số hóa số NGHIỆP VỤ, tên kèm đơn vị/ngữ cảnh
const RmAnnualInterestRate = 0.085; // lãi NĂM
const RmMonthsPerYear = 12;
function monthlyPayment(loan: number): number {
  return (loan * RmAnnualInterestRate) / RmMonthsPerYear;
}
```

> 2 lỗi đối cực: **số ma không tên** (khó hiểu) và **mọi số đều có tên** (`ONE`, `TWELVE` — nhiễu). Chỉ đặt tên cho số **mang ý nghĩa nghiệp vụ**.

---

## ⚖️ Trade-off: hằng số vs để nguyên

| Tình huống | Quyết định | Vì sao |
|------------|------------|--------|
| Số gắn quy định (lãi suất, hạn mức, tuổi) | ✅ Hằng số có tên + đơn vị | Đổi 1 nơi, rõ ngữ cảnh |
| Cùng giá trị, 2 ý nghĩa khác nhau (`12` tháng vs `12` sản phẩm) | ✅ 2 hằng số riêng | Tránh sửa lãi suất làm vỡ giỏ hàng |
| Chỉ số mảng, `i++`, `0/1` khởi tạo | 🚫 Để nguyên | Tên hằng (`FIRST_INDEX`) dài hơn lợi ích |
| Giá trị config đổi theo môi trường | ⚖️ Env/config, không phải const code | `const` cứng trong code không đổi được lúc deploy |
| Số chỉ xuất hiện 1 lần trong test | ⚖️ Tùy | Test ưu tiên đọc trực tiếp; hằng khi test diễn đạt rule |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Tên hằng thiếu đơn vị (`RATE = 0.085`) | Không biết tháng/năm, trước/sau thuế | Tên kèm đơn vị: `AnnualInterestRate`, `FeeVnd` |
| Copy value thay vì dùng chung hằng | 3 nơi `0.085`, sửa sót 1 nơi | Export 1 hằng duy nhất, import mọi nơi |
| Hằng "ma" thứ cấp (`DISCOUNT = 0.9` mà là 10% off) | Đọc ngược: 0.9 hay giảm 0.9? | Đặt theo ý nghĩa: `VipDiscountPct = 10`, tính `1 - pct/100` trong code |
| Đổi giá trị hằng mà không chạy test liên quan | Hằng dùng ở 10 nơi, vỡ 3 nơi không biết | Hằng nghiệp vụ phải có test khóa hành vi xung quanh |

---

## ✅ Checklist khi review

- [ ] Mọi số nghiệp vụ đã có tên (không còn số ma trong logic)?
- [ ] Tên hằng kèm đơn vị/ngữ cảnh (`Annual`, `Vnd`, `Min`, `Max`)?
- [ ] Cùng giá trị khác ý nghĩa đã tách thành hằng riêng?
- [ ] Số đếm/index/vòng lặp không bị hằng số hóa thừa?
- [ ] Đổi giá trị hằng có test liên quan chạy kẹp không?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.7.6-replace-magic-number
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.8 Data Handling](../5.8-data-handling/README.md)