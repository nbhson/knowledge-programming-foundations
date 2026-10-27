# 🔓 3.2.2 OCP — Open/Closed Principle

> **Mở rộng được, đóng sửa đổi.**
> Thêm tính năng mới bằng code mới, không sửa code cũ. Đây là nguyên tắc quan trọng nhất cho maintainability.

---

## 🎯 Vấn đề

Mỗi lần thêm tính năng phải sửa code cũ:

- **Rủi ro vỡ** — sửa code đang chạy tốt, có thể introduces bug
- **Khó test** — phải test lại toàn bộ module liên quan
- **Vi phạm SRP** — class phình to vì thêm nhánh mới
- **Khó mở rộng** — mỗi tính năng mới = sửa nhiều chỗ
- **Không an toàn** — code production bị sửa, regressions dễ xảy ra

```
❌ VI PHẠM OCP                              ✅ TUÂN THỦ OCP
┌─────────────────────┐                    ┌─────────────────────┐
│ PaymentProcessor    │                    │ PaymentProcessor    │
│  if (type == "card")│                    │  └─ interface       │
│  if (type == "cash")│   ──OCP──▶        │     ├─ CardPayment  │
│  if (type == "bank")│                    │     ├─ CashPayment  │
│  // thêm mới = sửa │                     │     └─ BankPayment  │
│  // code cũ         │                    │  // thêm mới = thêm │
└─────────────────────┘                    │  // class mới       │
                                           └─────────────────────┘
```

> 📌 **Quy tắc kiểm tra:** "Thêm tính năng mới có phải sửa code cũ không?" Nếu có → vi phạm OCP.

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ❌ BAD: thêm payment mới phải sửa if/else
function processPayment(type: string, amount: number) {
  if (type === "card") {
    console.log(`💳 Card: charged ${amount} VND`);
  } else if (type === "cash") {
    console.log(`💵 Cash: received ${amount} VND`);
  }
  // thêm "bank" → phải sửa hàm này → vi phạm OCP
}

// ✅ GOOD: thêm payment mới = thêm class mới
interface PaymentMethod {
  pay(amount: number): void;
}
class CardPayment implements PaymentMethod { pay(amount: number) { /* ... */ } }
class CashPayment implements PaymentMethod { pay(amount: number) { /* ... */ } }
// thêm "bank" → thêm class BankPayment, không sửa code cũ
```

---

## 🔍 Phân tích chi tiết

### Dấu hiệu vi phạm OCP

| Dấu hiệu | Giải thích | Cách khắc phục |
|----------|------------|----------------|
| Nhiều `if/else` theo type | Mỗi nhánh là 1 loại khác nhau | Dùng polymorphism |
| Sửa class hiện có khi thêm feature | Không mở rộng được | Thêm class/interface mới |
| Class có tính năng hardcode | Khó customize | Dùng strategy pattern |
| Test phải chạy lại toàn bộ khi thêm tính năng | Code cũ dễ break | Mỗi class test riêng |

### Ví dụ thực tế: vi phạm OCP

```typescript
// ❌ BAD: ReportService vi phạm OCP
class ReportService {
  generate(type: string, data: any): string {
    if (type === "pdf") return this.toPdf(data);
    if (type === "csv") return this.toCsv(data);
    if (type === "excel") return this.toExcel(data);
    // thêm type mới = sửa class này
    throw new Error(`Unknown report type: ${type}`);
  }
}

// ✅ GOOD: tuân thủ OCP
interface ReportFormatter {
  format(data: any): string;
}

class PdfReportFormatter implements ReportFormatter {
  format(data: any): string { return this.toPdf(data); }
  private toPdf(data: any): string { /* ... */ }
}

class CsvReportFormatter implements ReportFormatter {
  format(data: any): string { return this.toCsv(data); }
  private toCsv(data: any): string { /* ... */ }
}

// Thêm mới: ExcelReportFormatter — không sửa code cũ
class ExcelReportFormatter implements ReportFormatter {
  format(data: any): string { return this.toExcel(data); }
  private toExcel(data: any): string { /* ... */ }
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích | Ví dụ |
|---------|------------|-------|
| 🔧 **An toàn** | Code cũ không bị sửa, không vỡ | Fix bug ở class mới → không ảnh hưởng class cũ |
| 🚀 **Mở rộng nhanh** | Thêm tính năng = thêm class mới | Thêm PaymentMethod → thêm class |
| 🧪 **Dễ test** | Test class mới riêng, không đụng code cũ | Unit test BankPayment độc lập |
| 📖 **Dễ đọc** | Không if/else dài lê thê | Mỗi class 1 responsibility rõ ràng |
| 👥 **Parallel development** | Nhiều dev làm different classes | Team A: CardPayment, Team B: BankPayment |

---

## 🧠 OCP và các pattern liên quan

| Pattern | Cách áp dụng OCP |
|---------|------------------|
| **Strategy** | Hoán đổi algorithm tại runtime |
| **Decorator** | Thêm behavior mà không sửa class gốc |
| **Factory Method** | Tạo object theo interface, không hardcode type |
| **Template Method** | Định skeleton, subclass override steps |
| **Observer** | Thêm subscriber mới không sửa publisher |

---

## ⚠️ Khi nào KHÔNG nên dùng OCP?

| Tình huống | Khuyến nghị | Lý do |
|------------|-------------|-------|
| Code ổn định, ít thay đổi | ⚠️ Đừng over-engineer | Abstract hóa không cần thiết |
| Chỉ 1-2 loại cố định | ❌ Không cần abstraction | Simple is better than complex |
| Quick prototype / PoC | ❌ Bỏ qua OCP | Tốc độ quan trọng hơn maintainability |
| API versioning | ⚠️ Cân nhắc | Đôi khi cần sửa interface |

> 💡 **Quy tắc ngón tay cái:** "Chỉ trừu tượng hóa khi bạn biết sẽ có ít nhất 2 implementation khác nhau."

---

## 🔗 Mối quan hệ với các nguyên tắc khác

| Nguyên tắc | Mối quan hệ |
|-----------|-------------|
| **3.2.1 SRP** | OCP hiệu quả nhất khi kết hợp với SRP |
| **3.2.5 DIP** | Phụ thuộc abstraction giúp mở rộng dễ |
| **2.3.1 Strategy** | Pattern hoán đổi behavior, thực thi OCP |
| **2.2.2 Decorator** | Pattern thêm behavior không sửa class gốc |

---

## 🏭 Real-world Example

```typescript
// Notification System

// ❌ VI PHẠM OCP
class NotificationSender {
  send(channel: string, message: string) {
    if (channel === "email") this.sendEmail(message);
    if (channel === "sms") this.sendSms(message);
    if (channel === "push") this.sendPush(message);
  }
}

// ✅ TUÂN THỦ OCP
interface NotificationChannel {
  send(message: string): void;
}

class EmailChannel implements NotificationChannel {
  send(message: string) { /* email logic */ }
}

class SmsChannel implements NotificationChannel {
  send(message: string) { /* SMS logic */ }
}

class PushChannel implements NotificationChannel {
  send(message: string) { /* push notification logic */ }
}

// Khi cần thêm channel mới → thêm class mới
class SlackChannel implements NotificationChannel {
  send(message: string) { /* Slack webhook logic */ }
}
```

---

## 📁 Cấu trúc thư mục

```
3.2.2-ocp/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 03-principles/3.2-solid-principles/3.2.2-ocp
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Open/Closed Principle - Wikipedia](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle)
- 📖 [Refactoring.Guru — OCP](https://refactoring.guru/design-principles/open-closed-principle)
- 📘 *Clean Code* — Robert C. Martin, Chương 9: Unit Tests
- 📘 *Clean Architecture* — Robert C. Martin, Chương 5: Boundary Details

---

## ⏭️ Bài tiếp theo

→ [3.2.3 LSP — Liskov Substitution Principle](../3.2.3-lsp/README.md)
