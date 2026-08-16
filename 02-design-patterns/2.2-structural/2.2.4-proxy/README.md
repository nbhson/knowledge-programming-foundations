# 🕵️ 2.2.4 Proxy Pattern

> Cung cấp **đối tượng thay thế** (surrogate) kiểm soát truy cập đến đối tượng thật. Cùng interface với đối tượng thật.

---

## 🎯 Vấn đề

Đối tượng thật **tốn kém** (tải từ network, quyền cao) hoặc cần **kiểm soát truy cập**. Client gọi trực tiếp → lãng phí, mất an toàn.

```
❌ Gọi trực tiếp — tải tốn kém mỗi lần
Client ──▶ ExpensiveService (tải lớn, không kiểm soát ai gọi)

✅ Proxy — kiểm soát trước khi gọi thật
Client ──▶ Proxy ──▶ RealService
             │
             ├─ lazy load (chỉ tạo khi cần)
             ├─ access control (kiểm tra quyền)
             └─ caching (trả kết quả đã lưu)
```

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────┐
│  Subject (interface)                        │
│      ▲          ▲                           │
│      │          │                           │
│  RealSubject  Proxy (cùng interface)        │
│  (thật)         │                           │
│                 └─ kiểm soát → gọi RealSubject│
└─────────────────────────────────────────────┘
```

### Các loại Proxy

| Loại | Mục đích |
|------|----------|
| **Virtual** | Lazy load — chỉ tạo object khi thực sự cần |
| **Protection** | Kiểm tra quyền trước khi gọi |
| **Caching** | Lưu kết quả, tránh gọi lại |
| **Remote** | Đại diện cho object ở máy khác |

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface Video {
  play(): void;
}

// RealSubject — tốn kém
class YouTubeVideo implements Video {
  constructor(private id: string) {
    console.log(`⬇️ Downloading video ${id}...`); // tốn băng thông
  }
  play(): void { console.log(`▶️ Playing ${this.id}`); }
}

// Proxy — lazy load + caching
class VideoProxy implements Video {
  private realVideo: YouTubeVideo | null = null;

  constructor(private id: string) {}

  play(): void {
    if (!this.realVideo) {
      this.realVideo = new YouTubeVideo(this.id); // chỉ tải lần đầu
    }
    this.realVideo.play();
  }
}

// Client — không biết mình đang dùng Proxy
const video: Video = new VideoProxy("abc123");
video.play();  // ⬇️ Downloading... ▶️ Playing
video.play();  // ▶️ Playing (không tải lại — cached)
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 💾 **Lazy load** | Object tốn kém chỉ tạo khi cần |
| 🔒 **Kiểm soát** | Chặn truy cập trái phép |
| 🚀 **Cache** | Giảm gọi lại, tăng hiệu năng |
| 🧩 **Trong suốt** | Client không cần biết có proxy |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Thêm lớp** | Phức tạp, thêm 1 class |
| 🐢 **Overhead** | Thêm 1 bước gọi gián tiếp |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Lazy load image/video nặng | ✅ Phù hợp |
| Access control (admin/user) | ✅ Phù hợp |
| Caching API response | ✅ Phù hợp |
| ORM lazy loading (Hibernate, Prisma) | ✅ Phù hợp |

---

## 🔗 Liên quan

- **2.2.2 Decorator** — Decorator thêm hành vi, Proxy kiểm soát truy cập
- **2.2.3 Facade** — Facade interface khác, Proxy cùng interface

---

## 📁 Cấu trúc thư mục

```
2.2.4-proxy/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.2-structural/2.2.4-proxy
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Proxy - Refactoring Guru](https://refactoring.guru/design-patterns/proxy)
- 📖 [Proxy - Source Making](https://sourcemaking.com/design_patterns/proxy)

---

## ⏭️ Bài tiếp theo

→ [2.2.5 Composite](../2.2.5-composite/README.md)