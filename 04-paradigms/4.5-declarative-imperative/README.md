# 🧠 4.5 Declarative vs Imperative (Khai Báo vs Thủ Tục)

> **Declarative** mô tả **CÁI GÌ** cần đạt được. **Imperative** mô tả **CÁCH LÀM** từng bước.

---

## Imperative (Thủ Tục)

**Chỉ cách làm** — tell the computer HOW to do it.

```typescript
// Imperative: tính tổng số chẵn nhân đôi
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const result: number[] = [];

for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    result.push(numbers[i] * 2);
  }
}
// result = [4, 8, 12, 16, 20]
```

**Đặc điểm:**
- Control flow rõ ràng: for, while, if, else
- State thay đổi qua các biến
-程序员 quyết định từng bước

---

## Declarative (Khai Báo)

**Mô tả cái gì** — let the computer figure out HOW.

```typescript
// Declarative: cùng kết quả, gọn hơn
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const result = numbers
  .filter(n => n % 2 === 0)   // chọn số chẵn
  .map(n => n * 2);           // nhân đôi
// result = [4, 8, 12, 16, 20]
```

**Đặc điểm:**
- Tập trung vào kết quả mong muốn
- Ít state mutation
- Dễ đọc, dễ maintain

---

## So Sánh Trực Quan

| Khía Cạnh | Imperative | Declarative |
|-----------|------------|-------------|
| Focus | HOW (cách làm) | WHAT (kết quả) |
| Code length | Dài hơn | Ngắn gọn hơn |
| Readability | Cần đọc kỹ | Dễ hiểu ý định |
| Mutation | Thường có | Tránh mutation |
| Parallelize | Khó | Dễ hơn |

### Ví Dụ SQL

```sql
-- Declarative: nói CÁI GÌ cần
SELECT name, email FROM users WHERE active = true ORDER BY name;

-- Imperative equivalent (pseudo-code)
result = []
for user in all_users:
    if user.active:
        result.append({name: user.name, email: user.email})
result.sort(by=name)
```

### Ví Dụ React JSX

```tsx
// Declarative: mô tả UI muốn hiển thị
function Greeting({ name }: { name: string }) {
  return <h1>Xin chào, {name}!</h1>;
}

// Imperative equivalent
function Greeting(name: string) {
  const h1 = document.createElement('h1');
  h1.textContent = `Xin chào, ${name}!`;
  document.body.appendChild(h1);
}
```

---

## Khi Nào Dùng Gì?

| Scenario | Khuyến Nghị |
|----------|-------------|
| Thuật toán phức tạp, cần control từng bước | ✅ Imperative |
| Data transformation, filtering | ✅ Declarative |
| UI description (React, HTML) | ✅ Declarative |
| Performance-critical code | ✅ Imperative (dễ optimize) |
| Quick scripts | ✅ Imperative |

---

## Kết Hợp Cả Hai

Thực tế thường kết hợp cả hai:

```typescript
// Imperative control flow
function processUsers(users: User[]): Report {
  const report: Report = { total: 0, active: 0 };
  
  // Declarative data transformation
  const activeUsers = users
    .filter(u => u.isActive)
    .map(u => ({ name: u.name, score: calculateScore(u) }));
  
  // Imperative aggregation
  for (const user of activeUsers) {
    report.total += user.score;
    report.active++;
  }
  
  return report;
}
```

---

## 🔗 Liên Quan

- **4.4 Procedural** — Procedural thường imperative
- **4.2 Functional** — FP thường declarative
- **SQL** — ngôn ngữ declarative điển hình

---

## 📚 Tài Liệu Tham Khảo

- 📖 [Declarative vs Imperative Programming](https://www.freecodecamp.org/news/imperative-vs-declarative-programming/)
- 📖 [React Docs - Declarative vs Imperative](https://react.dev/learn/describing-the-ui)

---

## ⏭️ Bài Tiếp Theo

→ [4.6 Concurrent & Parallel Programming](../4.6-concurrent-parallel/README.md)
