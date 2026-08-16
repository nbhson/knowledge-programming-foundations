# 🌉 2.2.6 Bridge Pattern

> Tách **abstraction** (cái gì) khỏi **implementation** (làm như thế nào) — để cả 2 phát triển độc lập.

---

## 🎯 Vấn đề

Có 2 chiều thay đổi: loại remote (TV, Radio) và loại control (Basic, Advanced). Nếu dùng kế thừa → bùng nổ tổ hợp class.

```
❌ Kế thừa — tổ hợp bùng nổ
BasicTVRemote, AdvancedTVRemote, BasicRadioRemote, AdvancedRadioRemote...

✅ Bridge — 2 interface riêng, kết hợp lúc runtime
Remote (abstraction) ──has-a──▶ Device (implementation)
  ├─ BasicRemote ──▶ TV, Radio
  └─ AdvancedRemote ──▶ TV, Radio
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────┐
│  Abstraction (Remote)                       │
│    ▲                                        │
│    ├─ Refined Abstraction (Basic, Advanced) │
│    └─ kết hợp với Implementation            │
│                                            │
│  Implementation (Device)                   │
│    ▲         ▲                             │
│    │         │                             │
│  TV       Radio                            │
└─────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Client: new AdvancedRemote(new TV())
        → remote.setVolume() → device.setVolume()
        → TV đáp ứng / đổi Radio không đổi remote
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Implementation — thiết bị
interface Device {
  setVolume(percent: number): void;
}

class TV implements Device {
  setVolume(percent: number): void {
    console.log(`📺 TV volume: ${percent}%`);
  }
}

class Radio implements Device {
  setVolume(percent: number): void {
    console.log(`📻 Radio volume: ${percent}%`);
  }
}

// Abstraction — remote
abstract class Remote {
  constructor(protected device: Device) {}
  abstract volumeUp(): void;
  abstract volumeDown(): void;
}

class BasicRemote extends Remote {
  volumeUp(): void { this.device.setVolume(20); }
  volumeDown(): void { this.device.setVolume(5); }
}

class AdvancedRemote extends Remote {
  volumeUp(): void { this.device.setVolume(50); }
  volumeDown(): void { this.device.setVolume(0); }
}

// Client — kết hợp bất kỳ remote × device
const tvRemote = new AdvancedRemote(new TV());
tvRemote.volumeUp();   // 📺 TV volume: 50%
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🧩 **Độc lập** | Abstraction và implementation phát triển riêng |
| ➗ **Tránh bùng nổ class** | Thay vì N×M class, chỉ N + M |
| 🔄 **Đổi implementation** | Runtime không đổi abstraction |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Phức tạp** | Nhiều interface, nhiều lớp gián tiếp |
| 🎯 **Chỉ cần khi 2 chiều** | 1 chiều thay đổi → kế thừa đơn giản hơn |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| 2 chiều thay đổi độc lập (device × control) | ✅ Phù hợp |
| Driver cho nhiều nền tảng (Windows/Mac/Linux) | ✅ Phù hợp |
| UI theme × widget | ✅ Phù hợp |

---

## 🔗 Liên quan

- **2.2.1 Adapter** — Adapter làm interface khớp nhau, Bridge tách 2 chiều
- **2.2.5 Composite** — Composite cấu trúc cây, Bridge cấu trúc 2 chiều

---

## 📁 Cấu trúc thư mục

```
2.2.6-bridge/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.2-structural/2.2.6-bridge
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Bridge - Refactoring Guru](https://refactoring.guru/design-patterns/bridge)
- 📖 [Bridge - Source Making](https://sourcemaking.com/design_patterns/bridge)

---

## ⏭️ Bài tiếp theo

→ [2.3 Behavioral Patterns](../README.md)