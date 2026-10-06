# 🏊 10.10 Connection Pooling (Hồ Kết Nối)

> Mở connection DB mới tốn 50–200ms (TCP + TLS + auth). **Pool** giữ sẵn N connections tái sử dụng — app mượn, dùng, trả — kèm công thức sizing và hàng đợi khi quá tải.

---

## 🎯 Vấn đề

Không pool: mỗi request mở connection mới → latency +200ms, DB gục ở vài trăm connections đồng thời:

```
1000 req/s × mở mới 100ms = 100 connections "đang mở" mọi lúc + TIME_WAIT 💥
```

Pool quá nhỏ: request xếp hàng chờ. Pool quá lớn: DB context-switch chết.

---

## 💻 Code ví dụ

Mô phỏng pool: mượn/trả, queue khi hết, timeout khi chờ quá lâu.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

class Pool {
  private free: Conn[]; private queue: ((c: Conn) => void)[] = [];
  constructor(size: number) { this.free = Array.from({ length: size }, newConn); }

  async acquire(timeoutMs: number): Promise<Conn> {
    const c = this.free.pop();
    if (c) return c; // còn slot → lấy ngay
    return new Promise((resolve, reject) => { // hết → xếp hàng
      const t = setTimeout(() => reject(new Error("pool timeout")), timeoutMs);
      this.queue.push((conn) => { clearTimeout(t); resolve(conn); });
    });
  }
  release(c: Conn): void {
    const waiter = this.queue.shift();
    if (waiter) waiter(c); else this.free.push(c);
  }
}

// Công thức sizing (Postgres): connections ≈ ((cores × 2) + disk) — trừ slot cho replica/admin
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Giảm latency | Mượn pool ~µs thay vì mở mới ~100ms |
| Bảo vệ DB | Giới hạn connections đồng thời — quá tải thì queue/timeout có kiểm soát thay vì sập DB |
| Đo được | Pool stats (active/idle/waiting) cho biết app thiếu pool hay DB yếu |

---

## ⚠️ Lưu Ý

- Sizing: bắt đầu `((core×2)+disk)` cho 1 DB; chia nhỏ khi nhiều app instances (10 instances × 20 = 200 connections!).
- Transaction giữ connection tới khi commit — transaction dài = chiếm pool lâu = chờ dây chuyền.
- Statement timeout + pool acquire timeout bắt buộc, kẻo request treo theo DB treo.
- Serverless (scale 0–1000): dùng pooler ngoài (PgBouncer transaction mode) vì mỗi function 1 pool riêng sẽ nổ connections.

---

## 🎯 Khi nào dùng

- Mọi app quan hệ DB qua network — luôn dùng pool (driver nào cũng có sẵn).
- Không tự viết pool production: dùng pg-pool/HikariCP/PgBouncer; demo ở đây để hiểu nguyên lý.

---

## 🔗 Liên quan

- **10.9 N+1** — N+1 nhân số connection cần thiết lên N lần.
- **10.11 Replication** — pool tách read (replica) / write (primary).
- **11.5 REST Clients** — pooling HTTP (keep-alive agent) cùng nguyên lý.

---

## 📚 Tài liệu

- HikariCP: Pool Sizing — https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing
- PgBouncer — https://www.pgbouncer.org/
- Postgres connections — https://wiki.postgresql.org/wiki/Number_Of_Database_Connections

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.10-connection-pooling
npx ts-node examples/index.ts
```

Demo: pool 3 + 6 jobs (3 chạy, 3 xếp hàng) → release đánh thức queue → timeout khi DB treo.

---

## ⏭️ Bài tiếp theo

→ [10.11 Replication](../10.11-replication/README.md)
