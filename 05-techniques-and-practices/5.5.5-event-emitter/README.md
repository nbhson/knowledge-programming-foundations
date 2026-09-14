# 📡 5.5.5 EventEmitter Pattern (Publish-Subscribe)

> **EventEmitter** là pattern quan sát viên — đối tượng phát sự kiện, đối tượng khác lắng nghe và phản hồi.

---

## 🎯 Vấn đề

```
❌ Không có EventEmitter
├─ Component phải biết nhau trực tiếp (tight coupling)
├─ Khó mở rộng khi thêm listener mới
└─ Khó test vì phụ thuộc lẫn nhau

✅ EventEmitter giải quyết bằng:
├─ Decoupled: publisher không biết subscriber
├─ Dễ mở rộng: thêm/bớt listener mà không sửa publisher
└─ Easy to test: mock events
```

---

## 🧩 Kiến trúc

```
┌──────────────────────────────────────────────┐
│              EventEmitter                    │
│                                              │
│  Events:  │  'user:login'  │ Listeners: [fn] │
│           │  'user:logout' │ Listeners: [fn] │
│           │  'data:ready'  │ Listeners: [fn] │
└───────────┬──────────────────────────────────┘
            │ emit()
    ┌───────┼────────┬──────────┐
    ▼       ▼        ▼          ▼
 Listener1 Listener2 Listener3  ...
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class EventEmitter {
  private events = new Map<string, Function[]>();

  // Đăng ký lắng nghe
  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  // Hủy đăng ký
  off(event: string, listener: Function): void {
    const listeners = this.events.get(event) || [];
    this.events.set(
      event,
      listeners.filter(l => l !== listener)
    );
  }

  // Phát sự kiện
  emit(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(listener => listener(...args));
  }

  // Lắng nghe 1 lần rồi tự động hủy
  once(event: string, listener: Function): void {
    const wrap = (...args: any[]) => {
      this.off(event, wrap);
      listener(...args);
    };
    this.on(event, wrap);
  }
}

// ===== USAGE =====
const emitter = new EventEmitter();

// Logger listener
emitter.on('user:login', (user) => {
  console.log(`User logged in: ${user.name}`);
});

// Analytics listener
emitter.on('user:login', (user) => {
  trackAnalytics('login', user.id);
});

// Phát sự kiện
emitter.emit('user:login', { id: '1', name: 'John' });
// Output:
// User logged in: John
// (Analytics tracked)
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔗 Decoupled | Publisher không biết subscriber |
| 📈 Scalable | Thêm listener dễ dàng |
| 🧪 Testable | Mock events, isolate logic |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Memory leak | Gỡ listener khi unmount |
| 🟡 Debug khó | Event trace/logging |
| 🟡 Không có order | Xác định rõ sequence |

---

## 🎯 Khi nào dùng EventEmitter?

| Scenario | Khuyến nghị |
|----------|-------------|
| Cross-component communication | ✅ EventEmitter |
| Event-driven architecture | ✅ EventEmitter |
| Plugin system | ✅ EventEmitter |
| Simple parent-child | ❌ Props/callback đủ |

---

## 🔗 Liên quan

- **2.3.2 Observer** — EventEmitter là implementation của Observer
- **5.5.4 Flux** — Dispatcher dùng EventEmitter pattern

---

## 📚 Tài liệu tham khảo

- 📖 [Node.js EventEmitter](https://nodejs.org/api/events.html)
- 📖 [Pub/Sub Pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern)

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.5.5-event-emitter
npx ts-node examples/index.ts
```

---

## ⏭️ Bạn đã hoàn thành 5.5 State Management!

→ [5.6 Error Handling Techniques](../5.6-error-handling-techniques/README.md)
