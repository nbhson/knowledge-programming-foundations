# 🌉 2.2.6 Bridge Pattern

> Tách **abstraction** (cái gì) khỏi **implementation** (làm như thế nào) — để cả 2 phát triển độc lập.

---

## 🎯 Vấn đề

Có **2 chiều thay đổi** — mỗi chiều là một hierarchy riêng. Nếu dùng kế thừa (inheritance) → bùng nổ tổ hợp class.

**Vấn đề cốt lõi:** inheritance theo chiều duy nhất. Khi có N × M biến thể, bạn cần N×M class con. Bridge pattern giải bằng cách **tách 2 chiều thành 2 class hierarchy riêng**, kết hợp lúc runtime.

```
❌ Kế thừa — tổ hợp bùng nổ
BasicTVRemote, AdvancedTVRemote, BasicRadioRemote, AdvancedRadioRemote...
(4 class cho 2×2)

✅ Bridge — 2 interface riêng, kết hợp lúc runtime
Remote (abstraction) ──has-a──▶ Device (implementation)
  ├─ BasicRemote ──▶ TV, Radio
  └─ AdvancedRemote ──▶ TV, Radio
(khiến ta có 4 combination với chỉ 4 class)
```

**Phân biệt Bridge vs Strategy vs Adapter:**
- **Bridge:** tách abstraction khỏi implementation từ đầu (thiết kế).
- **Strategy:** thay algorithm tại runtime (behavior).
- **Adapter:** làm cho interface cũ khớp interface mới (interoperability).

Bridge **thường** kết hợp với Strategy — abstraction dùng Strategy trong implementation, hoặc implementation được inject vào abstraction.

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

**Real-world example — UI framework:**

```typescript
// Abstraction: Widget
interface Widget { render(): string; }

// Implementations: different renderers (HTML, SVG, Canvas)
class HtmlRenderer { render(widget: Widget): string { return `<div>${widget.content}</div>`; } }
class SvgRenderer  { render(widget: Widget): string { return `<svg>${widget.content}</svg>`; } }

// Refined Abstraction: Button, Checkbox, v.v.
class Button implements Widget {
  constructor(private renderer: Renderer) {}
  render(): string { return this.renderer.render(this); }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🧩 **Độc lập** | Abstraction và implementation phát triển riêng | Team A build Remote, team B build Device — merge sau. |
| ➗ **Tránh bùng nổ class** | Thay vì N×M class, chỉ N + M | Scaling: thêm 1 device = +1 class, không +N classes. |
| 🔄 **Đổi implementation** | Runtime không đổi abstraction | `new AdvancedRemote(new TV())` → `new AdvancedRemote(new Radio())` không đổi code remote. |
| 🌐 **Portability** | Abstraction chạy trên nhiều implementation | Same API, different platforms. |
| 🧪 **Testability** | Test abstraction với mock implementation | Unit test Remote với fake Device. |
| 🔌 **Open/Closed** | Thêm device mới không sửa Remote | Device interface ổn định, thêm class mới. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Phức tạp** | Nhiều interface, nhiều lớp gián tiếp | 2 hierarchy + connections = nhiều class. *Gi giảm thiểu:* dùng khi thực sự cần 2 chiều; 1 chiều → inheritance đơn giản hơn. |
| 🎯 **Chỉ cần khi 2 chiều** | 1 chiều thay đổi → kế thừa đơn giản hơn | Bridge over-engineering nếu chỉ có Device variant (không có Remote variant). *Gi giảm thiểu:* quy tắc "2 chiều thay đổi + cần independent evolution". |
| 🔀 **Coupling qua interface** | Abstraction biết Implementation interface | `Remote` phụ thuộc `Device` interface. *Gi giảm thiểu:* interface nhỏ, precise. |
| 👻 **Debug difficulty** | Object structure phức tạp hơn | `remote.device` là indirection. *Gi giảm thiểu:* document architecture rõ. |
| 📝 **Boilerplate** | Nhiều class + interfaces | 4 class cho example trên (TV, Radio, Remote, BasicRemote, AdvancedRemote). *Gi giảm thiểu:* factory/registry pattern giảm boilerplate. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| 2 chiều thay đổi độc lập (device × control, platform × feature) | ✅ Rất phù hợp | Đây là use case kinh điển của Bridge. |
| Driver cho nhiều nền tảng (Windows/Mac/Linux) | ✅ Phù hợp | Platform-specific implementation, same abstraction. |
| UI theme × widget | ✅ Phù hợp | Same widgets, different themes (dark/light). |
| ORM query builder ( abstraction: Query, impl: SQL/GraphQL) | ✅ Phù hợp | One interface, many backends. |
| Plugin system (2 axes: plugin type × target environment) | ✅ Phù hợp | Independent evolution. |
| Chỉ có 1 chiều thay đổi | ⚠️ Inheritance đơn giản hơn | Bridge overkill. |
| Abstraction và Implementation tightly coupled | ❌ Don't separate | Nếu implementation phụ thuộc nhiều vào abstraction internals → không nên Bridge. |

---

## 🔗 Liên quan

- **2.2.1 Adapter** — Adapter làm interface khớp nhau, Bridge tách 2 chiều từ đầu.
- **2.2.5 Composite** — Composite cấu trúc cây, Bridge cấu trúc 2 chiều.
- **2.3.2 Strategy** — Strategy thay algorithm runtime; Bridge tách abstraction từ implementation.
- **1.3 Clean Architecture** — Clean layers ≈ Bridge pattern (Application Services ↔ Domain Entities).
- **5.8.1 Repository** — Repository = Bridge giữa Application và Infrastructure.

**Bridge trong TypeScript thực tế:**
- TypeORM `Connection` × `Entity` (bridge-like)
- React `Component` × `Renderer` (native/web)
- Test doubles: `TestDatabase` × `QueryBuilder`

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
- 📖 [Design Patterns - GoF (Bridge chapter)](https://en.wikipedia.org/wiki/Bridge_pattern)

---

## ⏭️ Bài tiếp theo

→ [2.3 Behavioral Patterns](../../2.3-behavioral/README.md)
