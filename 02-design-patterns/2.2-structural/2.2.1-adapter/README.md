# 🔌 2.2.1 Adapter Pattern

> Chuyển **interface của một class** sang **interface khác** mà client mong đợi. Giúp các class không tương thích làm việc được với nhau.

---

## 🎯 Vấn đề

Bạn có class cũ (legacy) hoạt động tốt nhưng **interface không khớp** với code mới:

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

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔌 **Tương thích** | Class cũ dùng được với code mới |
| 🧩 **Single Responsibility** | Adapter chỉ lo chuyển đổi |
| 🔄 **Open/Closed** | Thêm adapter mới, không sửa class cũ |
| 🚀 **Tái sử dụng** | Legacy code không phải viết lại |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Nhiều class** | Thêm 1 lớp gián tiếp |
| 🐢 **Overhead** | Chuyển đổi thêm 1 bước |
| 🎭 **Che giấu** | Có thể che lấp vấn đề thiết kế gốc |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Dùng thư viện cũ, interface không khớp | ✅ Phù hợp |
| Migrate dần từ hệ thống cũ sang mới | ✅ Phù hợp |
| Tích hợp API bên thứ 3 | ✅ Phù hợp |
| Có thể sửa class gốc | ⚠️ Sửa trực tiếp đơn giản hơn |

---

## 🔗 Liên quan

- **2.2.3 Facade** — Facade đơn giản hóa, Adapter đổi interface cho khớp
- **2.2.4 Proxy** — Proxy giữ nguyên interface, Adapter đổi interface
- **2.2.6 Bridge** — Bridge thiết kế từ đầu, Adapter vá sau

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

---

## ⏭️ Bài tiếp theo

→ [2.2.2 Decorator](../2.2.2-decorator/README.md)