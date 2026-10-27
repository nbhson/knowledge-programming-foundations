# 🔄 14.5 DRY Principle (Nguyên Tắc Không Lặp Lại)

> **DRY** — *Don't Repeat Yourself* — nhưng quan trọng hơn là **hiểu khi nào được phép lặp lại**. DRY đúng chỗ là strength; DRY sai chỗ là over-engineering.

---

## 🎯 DRY Là Gì?

DRY không phải "không bao giờ lặp code". DRY là **"mỗi piece of knowledge có một đại diện duy nhất, rõ ràng, trong hệ thống"**.

Khi nào có **two sources of truth** cho cùng 1 rule → đó là vi phạm DRY. Khi nào hai đoạn code **giống hình thức nhưng khác kiến thức** → không vi phạm.

```
❌ BAD — Cùng logic, viết 3 lần (true duplication)
function createUser(data) {
  const emailValid = validateEmail(data.email);
  const nameValid = data.name.length > 0;
  // ... save to DB
}

function createAdmin(data) {
  const emailValid = validateEmail(data.email);  // lặp!
  const nameValid = data.name.length > 0;        // lặp!
  // ... save to DB
}

function createModerator(data) {
  const emailValid = validateEmail(data.email);  // lặp!
  const nameValid = data.name.length > 0;        // lặp!
  // ... save to DB
}

// Sau này đổi rule email → phải sửa 3 chỗ → dễ quên 1 chỗ → bug.

✅ GOOD — Abstract hóa logic chung
function validateUserData(data) {
  return {
    email: validateEmail(data.email),
    name: data.name.length > 0
  };
}

function createUser(data)     { saveWithRole(data, 'user'); }
function createAdmin(data)    { saveWithRole(data, 'admin'); }
function createModerator(data){ saveWithRole(data, 'moderator'); }
```

---

## 📊 Các Loại Code Duplication

Không phải "lặp code" nào cũng giống nhau. Phân loại giúp quyết định đúng cách xử lý:

```
┌─────────────────────┬──────────────────────────┬────────────────────────┐
│ Loại                │ Dấu hiệu                 │ Cách xử lý             │
├─────────────────────┼──────────────────────────┼────────────────────────┤
│ Copy-paste code     │ Cùng hàm copy từ file    │ Extract thành function │
│                     │ này sang file khác       │ hoặc shared module     │
├─────────────────────┼──────────────────────────┼────────────────────────┤
│ Near-duplicate      │ 2 hàm giống 80%          │ Extract common part,   │
│ logic               │ (thừa/thiếu 1 branch)    │ parameterize diff part │
├─────────────────────┼──────────────────────────┼────────────────────────┤
│ Structural duplicate│ Cùng structure ở nhiều   │ DRY quá mức — giữ      │
│                     │ module khác nhau         │ nguyên nếu domains     │
│                     │ (ví dụ: cùng format      │ khác nhau. Áp dụng     │
│                     │ log cho 3 service)      │ chỉ khi share 1 logic  │
├─────────────────────┼──────────────────────────┼────────────────────────┤
│ Temporal duplicate  │ Cùng logic ở 2 thời      │ Có thể chấp nhận được; │
│                     │ điểm (legacy vs mới)     │ refactor khi có chance │
└─────────────────────┴──────────────────────────┴────────────────────────┘
```

---

## ⚠️ Khi Nào KHÔNG Nên DRY?

DRY blind làAnti-pattern phổ biến. 4 tình huống nên chấp nhận repetition:

```
❌ Đừng DRY khi:

1. Logic thực sự khác nhau về ngữ nghĩa
   if (role === 'admin') { /* admin logic — quyền đặc biệt */ }
   if (role === 'user')  { /* user logic — quyền cơ bản */ }
   // Hai branch khác nhau → đừng gộp thành 1 hàm — sẽ phải thêm flag

2. Thay đổi abstraction phức tạp hơn code gốc
   // Trước: 2 dòng đơn giản
   const discount = price * 0.1;
   // Sau: 3 class + interface + decorator
   // → Không worth it, chi phí hiểu > lợi ích

3. Code đang trong giai đoạn discovery
   // Protoype, MVP → code nhanh, lặp lại chấp nhận được
   // Refactor sau khi domain ổn định, không phải trước

4. Hai thứ giống nhau về hình thức nhưng khác bản chất
   // formatDate(date) và formatPhoneNumber(phone)
   // Cùng pattern regex nhưng domain khác nhau → đặt tên riêng
```

**Test "Two Wrongs" làm quy tắc:** nếu bạn phải viết **two separate implementations** để express two different ideas, đừng gộp chúng chỉ vì cùng syntax.

---

## 🔧 Refactoring Examples

### Extract Function

```typescript
// ❌ Before — repeated logic inline 3 lần
const userScore = calculateScore(user.stats) * user.multiplier;
const teamScore = calculateScore(team.stats) * team.multiplier;
const orgScore  = calculateScore(org.stats)  * org.multiplier;

// ✅ After — extracted, 1 source of truth
function calcWeightedScore(stats: Stats, multiplier: number): number {
  return calculateScore(stats) * multiplier;
}

const userScore = calcWeightedScore(user.stats, user.multiplier);
const teamScore = calcWeightedScore(team.stats, team.multiplier);
const orgScore  = calcWeightedScore(org.stats,  org.multiplier);
```

### Extract Class

```typescript
// ❌ Before — God class làm 5 việc
class UserService {
  findUser(id: string)      { /* ... */ }
  sendEmail(to, body)       { /* ... */ }
  logActivity(userId, act)  { /* ... */ }
  calculateScore(stats)     { /* ... */ }
  formatOutput(data)        { /* ... */ }
}

// ✅ After — mỗi class 1 trách nhiệm
class UserService   { findUser(id: string) { /* ... */ } }
class EmailService  { sendEmail(to: string, body: string) { /* ... */ } }
class Logger        { logActivity(userId: string, action: string) { /* ... */ } }
class ScoreService  { calculateScore(stats: Stats) { /* ... */ } }
class OutputFormatter { formatOutput(data: any) { /* ... */ } }
```

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế | Lý do |
|----------|-------------|-------|
| DRY quá mức (over-abstract) | Chỉ DRY khi có 2+ lần lặp thực sự | Abstraction không có caller đủ → dead code |
| Abstract mọi thứ thành function | Đôi khi inline rõ ràng hơn | Function call overhead + indirection cost |
| Generic wrapper function | Giữ cụ thể cho domain | `processData(data)` không rõ bằng `validateEmail(email)` |
| Duplicate code trong prototype | Refactor sau khi validate ý tưởng | Trừu tượng hóa quá sớm lãng phí thời gian |
| "DRY" một dòng code | Để nguyên, đừng tạo abstraction cho 1 lần dùng | Abstraction cần ≥ 2 caller để justified |

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "DRY = không lặp code" | DRY = không lặp **knowledge**. Code giống nhưng knowledge khác → repetition allowed |
| "Nếu viết 1 lần thì đủ" | 1 lần viết ≠ đủ. Nhưng nếu chỉ 1 caller thì abstraction không justified |
| "DRY luôn giảm bug" | DRY sai chỗ tạo single point of failure — 1 sửa = break nhiều caller không ngờ tới |
| "Code repetition = bad" | Repetition có chủ đích (explicit over implicit) thường tốt hơn abstract nhầm |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Abtract khi lặp lại 2+ lần thực sự | DRY cho lần đầu tiên |
| Đặt tên abstract phù hợp ngữ cảnh | Đặt tên quá chung chung |
| Refactor khi phát hiện duplication | Cố tình giữ duplicate |
| Chấp nhận WET khi complex > benefit | DRY mù quáng |
| Hỏi "cùng knowledge hay cùng syntax?" | Chỉ nhìn hình thức |

---

## 📚 Tài liệu

- 📖 [The DRY Principle — Wikipedia](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- 📖 [Clean Code: Functions — Robert C. Martin, Chapter 5]
- 📖 [Wrong Wrong Wrong — Refactoring.guru on DRY](https://refactoring.guru/smells/duplicate-code)

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 14-clean-code/14.5-dry-principle
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [14.6 Refactoring Techniques](../14.6-refactoring-techniques/README.md)
