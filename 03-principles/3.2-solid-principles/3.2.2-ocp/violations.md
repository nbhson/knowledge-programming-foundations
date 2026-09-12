# 🚫 OCP - Vi phạm & Cách xử lý

## Tình huống 1: Thêm tính năng mới phải sửa code cũ

**Vi phạm:**

```typescript
// ❌ BAD: Thêm payment type mới phải sửa hàm có sẵn
function calculateDiscount(order: Order, paymentType: string): number {
  let discount = 0;

  if (paymentType === "credit_card") {
    discount = order.total * 0.05;
  } else if (paymentType === "bank_transfer") {
    discount = order.total * 0.02;
  } else if (paymentType === "cod") {
    discount = 0;
  }
  // Thêm "crypto" → phải sửa hàm này!

  return discount;
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: thêm payment mới = thêm class mới, không sửa code cũ
interface DiscountStrategy {
  calculate(order: Order): number;
}

class CreditCardDiscount implements DiscountStrategy {
  calculate(order: Order) { return order.total * 0.05; }
}

class BankTransferDiscount implements DiscountStrategy {
  calculate(order: Order) { return order.total * 0.02; }
}

class CodDiscount implements DiscountStrategy {
  calculate(order: Order) { return 0; }
}

// Thêm crypto → thêm class mới, không động vào code cũ
class CryptoDiscount implements DiscountStrategy {
  calculate(order: Order) { return order.total * 0.1; }
}
```

---

## Tình huống 2: IF/ELSE chain cho nhiều loại report

**Vi phạm:**

```typescript
// ❌ BAD: Thêm report type mới = sửa function hiện tại
function generateReport(reportType: string, data: any) {
  if (reportType === "pdf") {
    return generatePdfReport(data);
  } else if (reportType === "csv") {
    return generateCsvReport(data);
  } else if (reportType === "excel") {
    return generateExcelReport(data);
  }
  // Thêm "html" → phải sửa function này!
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: Strategy pattern — mỗi reporter là class riêng
interface ReportGenerator {
  generate(data: any): string;
}

class PdfReportGenerator implements ReportGenerator {
  generate(data: any) { return generatePdfReport(data); }
}

class CsvReportGenerator implements ReportGenerator {
  generate(data: any) { return generateCsvReport(data); }
}

// Thêm HTML → thêm class mới
class HtmlReportGenerator implements ReportGenerator {
  generate(data: any) { return generateHtmlReport(data); }
}
```

---

## Tình huống 3: Notification service dùng switch-case

**Vi phạm:**

```typescript
// ❌ BAD: Thêm channel mới phải sửa switch-case
class NotificationService {
  send(channel: string, message: string, recipient: string) {
    switch (channel) {
      case "email":
        this.sendEmail(recipient, message);
        break;
      case "sms":
        this.sendSms(recipient, message);
        break;
      case "push":
        this.sendPush(recipient, message);
        break;
      // Thêm "telegram" → phải sửa switch này!
    }
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: mỗi channel là implementation riêng
interface NotificationChannel {
  send(to: string, message: string): void;
}

class EmailChannel implements NotificationChannel {
  send(to: string, message: string) { /* email logic */ }
}

class SmsChannel implements NotificationChannel {
  send(to: string, message: string) { /* SMS logic */ }
}

// Thêm Telegram → thêm class mới
class TelegramChannel implements NotificationChannel {
  send(to: string, message: string) { /* telegram logic */ }
}
```

---

## Tình huống 4: Tax calculator dùng if/else theo country

**Vi phạm:**

```typescript
// ❌ BAD: Thêm country mới = sửa code cũ
function calculateTax(amount: number, country: string): number {
  if (country === "VN") return amount * 0.1;
  if (country === "US") return amount * 0.08;
  if (country === "JP") return amount * 0.1;
  // ... 20 countries
  throw new Error("Unknown country");
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: TaxStrategy per country
interface TaxStrategy {
  calculate(amount: number): number;
}

class VNTaxStrategy implements TaxStrategy {
  calculate(amount: number) { return amount * 0.1; }
}

class USTaxStrategy implements TaxStrategy {
  calculate(amount: number) { return amount * 0.08; }
}

// Thêm country mới → thêm class mới
class JPTaxStrategy implements TaxStrategy {
  calculate(amount: number) { return amount * 0.1; }
}
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm OCP | Cách xử lý |
|---------------------|------------|
| Thêm tính năng mới phải sửa code cũ | Dùng strategy/interface pattern |
| IF/ELSE chain dài theo type | Thay bằng polymorphism |
| Switch-case cho nhiều case | Mỗi case là class riêng |
| Hardcode logic cho từng trường hợp | Abstraction + implementation tách biệt |