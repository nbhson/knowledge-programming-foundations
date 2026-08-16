# 🧱 2.2 Structural Patterns (Mẫu Cấu Trúc)

> Giải quyết vấn đề: **Kết hợp các đối tượng và classes thành cấu trúc lớn hơn** trong khi vẫn giữ cấu trúc linh hoạt và hiệu quả.

---

## 🎯 Vấn đề chung

Khi hệ thống lớn, các object cần **kết hợp với nhau** theo nhiều cách. Nếu kết hợp trực tiếp, code bị **cứng nhắc** — thêm tính năng phải sửa class gốc, interface không khớp phải sửa cả 2 bên.

```
❌ Kết hợp trực tiếp — cứng nhắc
┌──────────┐    ┌──────────┐
│  Client  │───▶│  Legacy  │  ← interface cũ, không khớp
└──────────┘    └──────────┘

✅ Dùng Structural Pattern — linh hoạt
┌──────────┐    ┌──────────────┐    ┌──────────┐
│  Client  │───▶│   Adapter    │───▶│  Legacy  │
└──────────┘    └──────────────┘    └──────────┘
```

Structural patterns giúp **kết hợp object** mà không phá vỡ cấu trúc hiện có.

---

## 📚 Các pattern trong nhóm

| # | Pattern | Mục đích | Khi nào dùng |
|---|---------|----------|--------------|
| [2.2.1](2.2.1-adapter/README.md) | **Adapter** | Chuyển interface này sang interface khác | Dùng thư viện cũ, interface không khớp |
| [2.2.2](2.2.2-decorator/README.md) | **Decorator** | Thêm hành vi động, không sửa class gốc | Logging, caching, auth cho method |
| [2.2.3](2.2.3-facade/README.md) | **Facade** | Interface đơn giản cho subsystem phức tạp | API wrapper, ẩn chi tiết phức tạp |
| [2.2.4](2.2.4-proxy/README.md) | **Proxy** | Đại diện kiểm soát truy cập | Lazy load, access control, caching |
| [2.2.5](2.2.5-composite/README.md) | **Composite** | Cấu trúc cây, xử lý đồng nhất | File system, UI tree, org chart |
| [2.2.6](2.2.6-bridge/README.md) | **Bridge** | Tách abstraction khỏi implementation | Đa nền tảng, đa loại thiết bị |

---

## 🧭 Chọn pattern nào?

```
BẠN CẦN KẾT HỢP OBJECT NHƯ THẾ NÀO?
│
├─ Interface cũ không khớp interface mới? → Adapter
│
├─ Thêm chức năng động, không muốn sửa class gốc?
│   ├─ Bọc thêm hành vi (log, cache)? → Decorator
│   └─ Kiểm soát truy cập / lazy load? → Proxy
│
├─ Subsystem phức tạp, muốn interface đơn giản? → Facade
│
├─ Cấu trúc cây, xử lý đồng nhất leaf & composite? → Composite
│
└─ Tách abstraction khỏi implementation (đa nền tảng)? → Bridge
```

---

## 🆚 So sánh các pattern dễ nhầm lẫn

```
┌─────────────────────────────────────────────────────────────┐
│  ADAPTER vs FACADE vs PROXY vs DECORATOR                    │
│                                                             │
│  Adapter   : đổi interface cho KHỚP (2 interface khác nhau) │
│  Facade    : đơn giản hóa interface PHỨC TẠP (1 interface)  │
│  Proxy     : cùng interface, KIỂM SOÁT truy cập             │
│  Decorator : cùng interface, THÊM hành vi                   │
│                                                             │
│  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐         │
│  │Adapter │   │Facade  │   │ Proxy  │   │Decorator│        │
│  │đổi khớp│   │đơn giản│   │kiểm soát│   │thêm hành│        │
│  └────────┘   └────────┘   └────────┘   └────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu trúc thư mục

```
2.2-structural/
├── README.md                    # File này
├── 2.2.1-adapter/
│   ├── README.md
│   └── examples/index.ts
├── 2.2.2-decorator/
├── 2.2.3-facade/
├── 2.2.4-proxy/
├── 2.2.5-composite/
└── 2.2.6-bridge/
```

---

## ⏭️ Bài tiếp theo

→ [2.3 Behavioral Patterns](../2.3-behavioral/README.md)