# 🏗️ Lớp 13: System Design (Thiết Kế Hệ Thống)

> **System Design** là nghệ thuật thiết kế kiến trúc hệ thống lớn — cân bằng giữa hiệu suất, độ sẵn sàng, khả năng mở rộng và chi phí.
> Không có giải pháp tối ưu duy nhất，只有 trade-off。

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm |
|---|--------|----------|
| 13.1 | [Load Balancer](13.1-load-balancer/README.md) | Cân bằng tải L4/L7 |
| 13.2 | [Caching Strategies](13.2-caching-strategies/README.md) | Cache-aside, write-through |
| 13.3 | [CDN](13.3-cdn/README.md) | Content Delivery Network |
| 13.4 | [Sharding](13.4-sharding/README.md) | Chia nhỏ database |
| 13.5 | [CAP Theorem](13.5-cap-theorem/README.md) | Consistency vs Availability |
| 13.6 | [Scalable Architecture](13.6-scalable-arch/README.md) | Scale-up vs Scale-out |

---

## 🎯 Core Principles

### 1. Horizontal vs Vertical Scaling

```
Vertical Scaling (Scale-Up):
┌─────────────────┐
│   CPU: 8 → 64   │
│   RAM: 32G→256G │
│   单点故障风险    │
└─────────────────┘

Horizontal Scaling (Scale-Out):
┌─────┐  ┌─────┐  ┌─────┐
│ App │←→│ App │←→│ App │  Load Balancer
└─────┘  └─────┘  └─────┘
```

### 2. Statelessness

```
✅ Stateless:
   - 无 session 存储
   - 任何实例可处理任何请求
   - 易于水平扩展

❌ Stateful:
   - Session 绑定特定实例
   - 会话丢失导致用户登出
   - 扩容困难
```

### 3. Asynchronous Communication

```
Synchronous (RPC/HTTP):
  Client ──▶ Server ──▶ Client
  (等待, 同步阻塞)

Asynchronous (Message Queue):
  Client ──▶ Queue ──▶ Server ──▶ Response
  (非阻塞, 解耦, 可扩展)
```

---

## 📊 Design Decision Framework

```
                    你的系统？
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      读多写少        强一致性      高并发实时
          │             │             │
          ▼             ▼             ▼
    Read Cache      SQL+Replica   Redis + MQ
    (Cache-Aside)   (Strong)      (Eventual)
```

---

## 🔗 关联章节

- **13.1 Load Balancer** — 流量分发
- **13.2 Caching Strategies** — 缓存策略
- **13.3 CDN** — 内容分发
- **13.4 Sharding** — 数据分片
- **13.5 CAP Theorem** — 一致性理论
- **13.6 Scalable Architecture** — 整体架构

---

## 📚 参考资料

- 📖 [Designing Data-Intensive Applications — Martin Kleppmann](https://dataintensive.net/)
- 📖 [System Design Primer (GitHub)](https://github.com/donnemartin/system-design-primer)
- 📖 [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

## ⏭️ 开始学习

→ [13.1 Load Balancer](13.1-load-balancer/README.md)
