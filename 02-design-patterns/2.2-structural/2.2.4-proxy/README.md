# 🕵️ 2.2.4 Proxy Pattern

> Cung cấp **đối tượng thay thế** (surrogate) kiểm soát truy cập đến đối tượng thật. Cùng interface với đối tượng thật.

---

## 🎯 Vấn đề

Đối tượng thật **tốn kém** (tải từ network, quyền cao) hoặc cần **kiểm soát truy cập**. Client gọi trực tiếp → lãng phí, mất an toàn.

**Phân biệt Proxy vs Decorator vs Adapter:**

| Pattern | Interface | Mục đích chính |
|---------|-----------|----------------|
| **Proxy** | **Giữ nguyên** với RealSubject | Kiểm soát truy cập (lazy load, auth, cache) |
| **Decorator** | **Giữ nguyên** interface | Thêm behavior mới |
| **Adapter** | **Đổi** interface | Chuyển đổi sang interface khác |

**4 loại Proxy** — mỗi loại giải quyết vấn đề khác nhau, thực tế thường kết hợp:

| Loại | Mục đích | Ví dụ thực tế |
|------|----------|---------------|
| **Virtual** | Lazy load — chỉ tạo object khi thực sự cần | Image lazy-load, ORM lazy loading |
| **Protection** | Kiểm tra quyền trước khi gọi | Admin only features, role-based access |
| **Caching** | Lưu kết quả, tránh gọi lại | API response cache, DB query cache |
| **Remote** | Đại diện cho object ở máy khác | gRPC stub, RPC client |

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

**Proxy vs Repository (5.8.1) — phân biệt quan trọng:**
- **Repository:** abstraction over persistence — client không biết DB.
- **Proxy:** control over object access — client biết có object nhưng proxy kiểm soát khi nào nó được init.

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

### Luồng hoạt động

```
Client gọi proxy.play()
         │
         ▼
Proxy: if (!realVideo) realVideo = new RealVideo()  ← lazy init
         │
         ▼
Proxy: realVideo.play()
         │
         ▼
RealSubject xử lý thật
```

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

**Protection Proxy — kiểm tra quyền:**

```typescript
class AdminPanelProxy implements AdminPanel {
  constructor(
    private real: AdminPanel,
    private user: User,
  ) {}
  
  deleteAccount(userId: string) {
    if (!this.user.isAdmin)
      throw new UnauthorizedError('Admin only');
    this.real.deleteAccount(userId);
  }
}
```

**ORM lazy loading (proxy thực tế nhất):**

```typescript
// Prisma/Hibernate tạo proxy khi load entity
const user = await prisma.user.findUnique({ where: { id } });
// user.orders là Proxy — chưa load từ DB
// Khi truy cập user.orders[0] → proxy fetch từ DB lúc đó
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 💾 **Lazy load** | Object tốn kém chỉ tạo khi cần | Tiết kiệm memory + thời gian khởi tạo. |
| 🔒 **Kiểm soát** | Chặn truy cập trái phép | Protection proxy enforce authorization. |
| 🚀 **Cache** | Giảm gọi lại, tăng hiệu năng | Response cache proxy giảm DB/network call. |
| 🧩 **Trong suốt** | Client không cần biết có proxy | Cùng interface → thay proxy ↔ real transparent. |
| 🛡️ **Access control** | Kiểm tra quyền/trạng thái | Proxy có thể reject/allow trước khi forwarding. |
| 🧬 **Resource management** | Proxy có thể close/destroy real object | Virtual proxy manage lifecycle. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Thêm lớp** | Phức tạp, thêm 1 class | Proxy + Real = 2 object cho 1 logic. *Giảm thiểu:* document rõ khi nào cần proxy. |
| 🐢 **Overhead** | Thêm 1 bước gọi gián tiếp | ~1μs per call — thường không đáng kể. |
| 🔀 **State synchronization** | Proxy và Real state phải đồng bộ | Khi Real đổi, Proxy phải biết → race condition risk. *Gi giảm thiểu:* immutability or single-writer. |
| 🧨 **Memory leak** | Proxy giữ reference Real | Reference chain giữ object alive lâu hơn cần. *Gi giảm thiểu:* WeakReference khi appropriate. |
| 🎭 **Debug difficulty** | Stack trace qua nhiều proxy layer | Nhiều proxy lồng nhau → traceback dài. *Gi giảm thiểu:* log proxy entry/exit. |
| 👻 **Proxy sprawl** | (Failure mode) | Nhiều proxy types cho 1 class → maintenance nightmare. *Gi giảm thiểu:* consolidated proxy strategy per class. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Lazy load image/video nặng | ✅ Rất phù hợp | Virtual proxy, reduce initial load time. |
| Access control (admin/user) | ✅ Phù hợp | Protection proxy enforce permissions at boundary. |
| Caching API response | ✅ Phù hợp | Cache proxy avoid redundant network calls. |
| ORM lazy loading (Hibernate, Prisma) | ✅ Phù hợp | Industry standard lazy-loading implementation. |
| Remote object (network transparent) | ✅ Phù hợp | Remote proxy hide network complexity. |
| Real object không tồn tại lúc khởi tạo | ✅ Phù hợp | Real object created asynchronously. |
| Performance-critical hot path | ⚠️ Cân nhắc bypass | Hot path should avoid proxy overhead. |
| Simple object, cheap creation | ❌ Overhead không worth | `new RealObject()` nhanh hơn `Proxy → Real`. |

---

## 🔗 Liên quan

- **2.2.2 Decorator** — Decorator thêm hành vi, Proxy kiểm soát truy cập.
- **2.2.3 Facade** — Facade interface khác, Proxy cùng interface.
- **5.8.1 Repository Pattern** — Repository + Proxy cho lazy load entity graph.
- **5.3.1 Caching** — Cache proxy pattern cho API response.

**Proxy trong TypeScript thực tế:**
- `Proxy` object (native JavaScript) — meta-programming proxy
- ORM lazy-loading proxies
- Dependency injection container proxies (mock for testing)
- Network request interceptors (Axios interceptors)

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
- 📖 [JavaScript Proxy MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

---

## ⏭️ Bài tiếp theo

→ [2.2.5 Composite](../2.2.5-composite/README.md)
