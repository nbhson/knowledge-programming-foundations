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
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

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

## ⚙️ Pool Size: Công thức & Real-world Sizing

**HikariCP guidance (Postgres, nguồn: brettwooldridge/HikariCP wiki):**

```
pool_size = ((core_count × 2) + effective_spindle_count)
```

| Môi trường | Cores | Spindles (HDD/SSD) | Pool size khuyến nghị |
|---|---|---|---|
| Dev laptop (8 cores, SSD) | 8 | 1 | ~17 connections |
| Production (16 cores, SSD NVMe) | 16 | 1 | ~33 connections |
| Production (32 cores, SAN) | 32 | 1 | ~65 connections |
| Multi-instance (10 app pods) | Chia số instances | — | 33 / 10 ≈ 3 mỗi pod (không cộng dồn!) |

**Real-world adjustments:**
- Đừng tăng pool lên quá số connections DB cho phép (`max_connections` Postgres).
- Giữ 1–2 slot trống cho admin/DBA connect (không đụng app pool).
- Monitor: active ≥ pool_size × 80% → pool đang quá tải, tăng size hoặc giảm request.

---

## 🚨 Pool Exhaustion: Triệu chứng & Debug

| Triệu chứng | Nguyên nhân thường | Debug |
|---|---|---|
| "pool timeout" error ở request ngẫu nhiên | Long-running transaction giữ connection | `pg_stat_activity` — tìm state = 'idle in transaction' lâu |
| Latency tăng đều tất cả request | Pool gần full, request xếp hàng | Pool stats: active/waiting/timeout trending |
| Connection leak (pool count tăng không về) | Không `release()` trong finally/catch | Leak detection (HikariCP: `leakDetectionThreshold`) |
| DB CPU thấp nhưng app timeout | App đang chờ pool, DB rảnh | Query `pg_stat_activity` + pool waiting count |

**Leak detection:** HikariCP: `leakDetectionThreshold=60s` → log stacktrace khi connection bị rò > 60s.

---

## 🔀 Transaction Pooling vs Session Pooling (PgBouncer modes)

| Mode | Cách hoạt động | Dùng khi | Hạn chế |
|---|---|---|---|
| **Session mode** | Giữ session suốt khi client connected | Legacy app, prepared statements, `SET` per session | Ít tiết kiệm connections |
| **Transaction mode** | Mượn connection chỉ trong transaction, trả ngay khi commit | Hầu hết app (HikariCP ↔ PgBouncer transaction) | Không dùng `SET`/`PREPARE` cross-transaction |
| **Statement mode** | Mỗi statement 1 connection | Load test, ETL nặng | Không hỗ trợ transactions |

**PgBouncer recommended config (transaction mode):**
```ini
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
```

---

## ☁️ Serverless + Pooler (PgBouncer / RDS Proxy)

**Vấn đề serverless:** Lambda cold start + warm instance = mỗi invocation có thể là 1 new connection → Postgres gục ở 500 connections tiềm năng:

```
100 Lambda × 5 concurrent = 500 potential connections 💥
```

**Giải pháp:**
- **RDS Proxy / Aurora I/O-Optimized**: quản lý pool ngoài, Lambdas dùng shared proxy endpoint.
- **PgBouncer transaction mode**: 1 Lambda instance = 1 connection PgBouncer → PgBouncer dùng pool nhỏ (20) đến DB.
- **Aurora Serverless v2**: tự scale connection count, không cần PgBouncer.
- **Prisma Data Proxy / PlanetScale**: managed connection pooler cho serverless.

> Rule: mỗi Lambda concurrency = 1 connection tiềm năng. Luôn đi qua pooler nếu Lambda × concurrency > `max_connections / 2`.

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
npx tsx examples/index.ts
```

Demo: pool 3 + 6 jobs (3 chạy, 3 xếp hàng) → release đánh thức queue → timeout khi DB treo.

---

## ⏭️ Bài tiếp theo

→ [10.11 Replication](../10.11-replication/README.md)
