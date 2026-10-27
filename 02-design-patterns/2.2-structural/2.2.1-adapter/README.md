# 🔌 2.2.1 Adapter Pattern

> Chuyển **interface của một class** sang **interface khác** mà client mong đợi. Giúp các class không tương thích làm việc được với nhau.

---

## 🎯 Vấn đề

Bạn có class cũ (legacy) hoạt động tốt nhưng **interface không khớp** với code mới — và bạn **không thể sửa class cũ** (third-party library, legacy system, API đang dùng).

**2 loại Adapter khác nhau** — phân biệt kỹ vì mỗi loại giải quyết vấn đề khác nhau:

| | **Class Adapter** (object adapter) | **Interface Adapter** (default method) |
|---|---|---|
| Khi nào dùng | Adaptee là **class**, cần extend + override | Adaptee là **interface**, cần subset các methods |
| Cơ chế | Extend adaptee, override target methods | Implement target interface, delegates to adaptee |
| Đa kế thừa | Được (nhưng TS/Java không hỗ trợ) | Không cần |
| Ví dụ thực tế | Legacy DB class → modern Repository | Third-party PaymentAPI → your PaymentProcessor |

**Phân biệt Adapter vs Facade vs Proxy** — 3 pattern structural dễ nhầm:

| Pattern | Mục đích | Interface | Số component |
|---------|----------|-----------|--------------|
| **Adapter** | Làm cho class cũ "khớp" với client | **Đổi** target interface | 2 (adaptee + adapter) |
| **Facade** | Đơn giản hóa hệ thống phức tạp | **Giữ nguyên** nhưng ẩn detail | N+1 (many → 1) |
| **Proxy** | Kiểm soát truy cập đến object | **Giữ nguyên** interface | 2 (proxy + real) |

```
❌ KHÔNG KHỚP: Client cần XML, Legacy chỉ trả JSON
┌──────────┐         ┌──────────┐
│  Client  │───???──▶│  Legacy  │
│ cần XML  │         │ trả JSON │
└──────────┘         └──────────┘

✅ GIẢI PHÁP: Adapter đứng giữa, chuyển đổi
┌──────────┐   ┌──────────────┐   ┌──────────┐
│  Client  │──▶│   Adapter    │──▶│  Legacy  │
│ cần XML  │   │ JSON → XML   │   │ trả JSON │
└──────────┘   └──────────────┘   └──────────┘
```

**Thực tế phổ biến nhất:** Adapter tích hợp third-party SDK vào kiến trúc của bạn. VD: Stripe SDK có `stripe.charge(amount)` — bạn cần `PaymentGateway.charge(vnd)` → Adapter chuyển đổi currency + gọi interface chuẩn.

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────────────┐
│  Client ──▶ Target (interface mong đợi)             │
│                  ▲                                  │
│                  │ implements                       │
│            ┌─────┴──────┐                           │
│            │  Adapter   │  ← chuyển đổi             │
│            └─────┬──────┘                           │
│                  │ wraps                            │
│            ┌─────┴──────┐                           │
│            │  Adaptee   │  ← class cũ, không khớp   │
│            └────────────┘                           │
└─────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Client gọi target.method()
         │
         ▼
Adapter.method() ── chuyển đổi tham số ──▶ Adaptee.oldMethod()
         ▲                                        │
         └──────── chuyển đổi kết quả ◀───────────┘
```

**Adaptor có thể làm 3 việc:**
1. **Translate tên method** (`charge()` → `sendPayment()`)
2. **Translate data format** (VND → USD, JSON → XML)
3. **Translate behavior** (return boolean → throw exception on error)

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Target — interface client mong đợi
interface PaymentProcessor {
  pay(amount: number): void;
}

// Adaptee — class cũ, interface khác
class LegacyPayPalAPI {
  sendPayment(amountInUSD: number): void {
    console.log(`💸 PayPal: charged $${amountInUSD}`);
  }
}

// Adapter — chuyển đổi interface
class PayPalAdapter implements PaymentProcessor {
  constructor(private legacyAPI: LegacyPayPalAPI) {}

  pay(amount: number): void {
    // Chuyển đổi: VND → USD (giả định 1 USD = 25,000 VND)
    const amountInUSD = amount / 25000;
    this.legacyAPI.sendPayment(amountInUSD);
  }
}

// Client chỉ biết PaymentProcessor
const processor: PaymentProcessor = new PayPalAdapter(new LegacyPayPalAPI());
processor.pay(50000); // 💸 PayPal: charged $2
```

**Thực tế phổ biến — Adapter thư viện bên thứ 3:**

```typescript
// Stripe SDK (không thể sửa)
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY);

// Interface chuẩn của hệ thống bạn
interface PaymentGateway {
  charge(userId: string, amountVND: number): Promise<ChargeResult>;
  refund(transactionId: string): Promise<void>;
}

// Adapter — translate Stripe SDK sang interface của bạn
class StripeAdapter implements PaymentGateway {
  async charge(userId: string, amountVND: number): Promise<ChargeResult> {
    const usd = amountVND / 25000;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { unit_amount: usd * 100, currency: 'usd' } }],
      mode: 'payment',
    });
    return { transactionId: session.id, status: 'created' };
  }
  
  async refund(transactionId: string): Promise<void> {
    await stripe.refunds.create({ payment_intent: transactionId });
  }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🔌 **Tương thích** | Class cũ dùng được với code mới | Không phải viết lại legacy system — chỉ wrap adapter. |
| 🧩 **Single Responsibility** | Adapter chỉ lo chuyển đổi | Mỗi adapter giải quyết 1 sự khác biệt interface cụ thể. |
| 🔄 **Open/Closed** | Thêm adapter mới, không sửa class cũ | Stripe adapter, PayPal adapter, Momo adapter — thêm bất kỳ, không đụng code hiện tại. |
| 🚀 **Tái sử dụng** | Legacy code không phải viết lại | Hệ thống cũ 10 năm vẫn dùng được — chi phí maintain giảm mạnh. |
| 🛡️ **Isolation of changes** | Thay đổi library = chỉ đổi adapter | Khi Stripe SDK đổi API v2 → sửa adapter, không sửa business logic. |
| 🧪 **Testable** | Test adapter riêng, mock adaptee | Adapter là thin layer, unit test dễ. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Nhiều class** | Thêm 1 lớp gián tiếp | 1 legacy = +1 adapter class. *Giảm thiểu:* khi legacy quan trọng → worth it. |
| 🐢 **Overhead** | Chuyển đổi thêm 1 bước | Adapter call → adaptee call = 1 hop thêm. Thường không đáng kể (< 1ms). |
| 🎭 **Che giấu** | Có thể che lấp vấn đề thiết kế gốc | Adapter đôi khi là "băng dán" cho kiến trúc yếu. *Giảm thiểu:* document rõ ràng, comment "vì sao cần adapter". |
| 🧨 **Translation bugs** | Convert sai type/currency/encoding | Bug adapter khó phát hiện vì "code chạy được, kết quả sai". *Gi giảm thiểu:* test suite đầy đủ cho mỗi adapter. |
| 👻 **Adapter sprawl** | (Failure mode) | 20 adapter classes cho 20 APIs = maintenance nightmare. *Giảm thiểu:* quy tắc "mỗi adapter phải có business case rõ ràng". |
| 📉 **Abstraction leak** | Client vẫn biết Adaptee qua Adapter | Nếu adapter expose `LegacyPayPalAPI` methods → client phụ thuộc vào legacy. *Gi giảm thiểu:* adapter chỉ expose Target interface. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Dùng thư viện cũ, interface không khớp | ✅ Phù hợp | Library không thể đổi → adapter là giải pháp duy nhất. |
| Migrate dần từ hệ thống cũ sang mới | ✅ Rất phù hợp | Từng bước thay thế legacy bằng adapter, không đổi lớn. |
| Tích hợp API bên thứ 3 | ✅ Phù hợp | Stripe, PayPal, Momo — mỗi cái 1 adapter, client ko biết khác biệt. |
| Có thể sửa class gốc | ⚠️ Sửa trực tiếp đơn giản hơn | Nếu bạn kiểm soát được class → sửa trực tiếp để fit target. |
| Nhiều class cùng adaptee | ❌ Composite Adapter / facade | Cần pattern khác để nhóm nhiều adapter. |
| Performance-critical path | ⚠️ Cân nhắc inline | Adapter overhead ~1μs có thể chấp nhận được trong 99% case. |

---

## 🔗 Liên quan

- **2.2.3 Facade** — Facade đơn giản hóa, Adapter đổi interface cho khớp.
- **2.2.4 Proxy** — Proxy giữ nguyên interface, Adapter đổi interface.
- **2.2.6 Bridge** — Bridge thiết kế từ đầu, Adapter vá sau.
- **5.8.1 Repository Pattern** — `PostgresUserRepository` là Adapter từ SQL interface sang domain interface.
- **1.5 Hexagonal Architecture** — Adapter-driven port implementation = Adapter pattern trong kiến trúc.

**Adapter trong TypeScript phổ biến:** TypeORM entity ↔ Domain model là adapter pattern (translation giữa persistence model và domain model).

---

## 📁 Cấu trúc thư mục

```
2.2.1-adapter/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.2-structural/2.2.1-adapter
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Adapter - Refactoring Guru](https://refactoring.guru/design-patterns/adapter)
- 📖 [Adapter - Source Making](https://sourcemaking.com/design_patterns/adapter)
- 📖 [Refactoring to Adapters - Martin Fowler](https://martinfowler.com/books/refactoring.html)

---

## ⏭️ Bài tiếp theo

→ [2.2.2 Decorator](../2.2.2-decorator/README.md)
