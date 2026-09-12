# 🔄 14.5 DRY Principle (Nguyên Tắc Không Lặp Lại)

> **DRY** — *Don't Repeat Yourself* — nhưng quan trọng hơn là **hiểu khi nào được phép lặp lại**.

---

## 🎯 DRY Là Gì?

```
❌ BAD — Cùng logic, viết 3 lần
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

✅ GOOD — Abstract hóa logic chung
function validateUserData(data) {
  return {
    email: validateEmail(data.email),
    name: data.name.length > 0
  };
}

function createUser(data) { saveWithRole(data, 'user'); }
function createAdmin(data) { saveWithRole(data, 'admin'); }
function createModerator(data) { saveWithRole(data, 'moderator'); }
```

---

## 📊 Các Loại Code Duplication

```
┌─────────────────────┬──────────────────────────┬──────────────┐
│ Loại                │ Ví dụ                    │ Cách xử lý   │
├─────────────────────┼──────────────────────────┼──────────────┤
│ Copy-paste code     │ Cùng hàm copy từ file này│ Abstract     │
│                     │ sang file khác            │ thành function│
├─────────────────────┼──────────────────────────┼──────────────┤
│ Near-duplicate logic│ 2 hàm giống 80%          │ Extract      │
│                     │                            │ common part  │
├─────────────────────┼──────────────────────────┼──────────────┤
│ Structural duplicate│ Cùng structure ở nhiều   │ DRY quá mức  │
│                     │ module khác nhau          │ — giữ nguyên │
├─────────────────────┼──────────────────────────┼──────────────┤
│ Temporal duplicate  │ Cùng logic ở 2 thời điểm │ Có thể chấp  │
│                     │ (legacy vs mới)           │ nhận được    │
└─────────────────────┴──────────────────────────┴──────────────┘
```

---

## ⚠️ Khi Nào KHÔNG Nên DRY?

```
❌ Đừng DRY khi:

1. Logic thực sự khác nhau về ngữ nghĩa
   if (role === 'admin') { /* admin logic */ }
   if (role === 'user')  { /* user logic */ }
   // Hai branch khác nhau → đừng gộp thành 1 hàm

2. Thay đổi abstraction phức tạp hơn code gốc
   // Trước: 2 dòng đơn giản
   // Sau: 3 class + interface + decorator
   // → Không worth it

3. Code đang trong giai đoạn discovery
   // Protoype, MVP → code nhanh, lặp lại chấp nhận được
   // Refactor sau khi ổn định

4. Hai thứ giống nhau về hình thức nhưng khác bản chất
   // formatDate(date) và formatPhoneNumber(phone)
   // Cùng pattern nhưng domain khác nhau
```

---

## 🔧 Refactoring Examples

### Extract Function

```typescript
// ❌ Before — repeated logic
const userScore = calculateScore(user.stats) * user.multiplier;
const teamScore = calculateScore(team.stats) * team.multiplier;
const orgScore = calculateScore(org.stats) * org.multiplier;

// ✅ After — extracted
function calcWeightedScore(stats: Stats, multiplier: number): number {
  return calculateScore(stats) * multiplier;
}

const userScore = calcWeightedScore(user.stats, user.multiplier);
const teamScore = calcWeightedScore(team.stats, team.multiplier);
```

### Extract Class

```typescript
// ❌ Before — God class
class UserService {
  findUser(id: string) { /* ... */ }
  sendEmail(to: string, body: string) { /* ... */ }
  logActivity(userId: string, action: string) { /* ... */ }
  calculateScore(stats: Stats) { /* ... */ }
  formatOutput(data: any) { /* ... */ }
}

// ✅ After — each class has one job
class UserService   { findUser(id: string) { /* ... */ } }
class EmailService  { sendEmail(to: string, body: string) { /* ... */ } }
class Logger        { logActivity(userId: string, action: string) { /* ... */ } }
class ScoreService  { calculateScore(stats: Stats) { /* ... */ } }
```

---

## 🚩 Anti-patterns

| ❌ Tránh | ✅ Thay thế |
|----------|-------------|
| DRY quá mức (over-abstract) | Chỉ DRY khi có 2+ lần lặp thực sự |
| Abstract mọi thứ thành function | Đôi khi inline rõ ràng hơn |
| Generic wrapper function | Giữ cụ thể cho domain |
| Duplicate code trong prototype | Refactor sau khi validate ý tưởng |

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Abtract khi lặp lại 2+ lần | DRY cho lần đầu tiên |
| Đặt tên abstract phù hợp ngữ cảnh | Đặt tên quá chung chung |
| Refactor khi phát hiện duplication | Cố tình giữ duplicate |
| Chấp nhận WET khi complex > benefit | DRY mù quáng |

---

## 📚 Tài liệu

- 📖 [The DRY Principle — Wikipedia](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- 📖 [Clean Code: Functions — Robert C. Martin, Chapter 5]

---

## ⏭️ Bài tiếp theo → [14.6 Refactoring Techniques](../14.6-refactoring-techniques/README.md)
