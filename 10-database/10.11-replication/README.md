# 🔁 10.11 Replication (Nhân Bản & Lag)

> **Replication**: primary nhận writes, replicas phục vụ reads. Giá phải trả là **lag** (replica chậm hơn primary vài ms–giây) — đọc ngay sau ghi có thể thấy data cũ. Fix bằng **read-your-writes** (đọc sau ghi đi về primary).

---

## 🎯 Vấn đề

Scale read bằng replica nhưng user đổi email xong load lại thấy email cũ:

```
T=0.0s: UPDATE users SET email='new' → primary ✅
T=0.1s: SELECT email → replica (chưa kịp sync) → 'old' 💥 user tưởng mất update
```

Async nhanh nhưng eventual; sync chắc nhưng write chậm.

---

## 💻 Code ví dụ

Mô phỏng primary + replica lag + router read-your-writes.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

class Primary { data = new Map<string, string>(); version = 0; }
class Replica {
  constructor(private primary: Primary, private lagVersions = 1) {}
  read(key: string, primaryVersion: number): string | undefined {
    // replica chỉ thấy data tới version (primaryVersion - lag)
    return this.visibleVersion() >= primaryVersion ? this.primary.data.get(key) : "STALE";
  }
}

// Router: sau write, reads của cùng user trong 2s → primary (read-your-writes)
function route(key: string, justWrote: boolean): "primary" | "replica" {
  return justWrote ? "primary" : "replica";
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Scale reads | 3 replicas ≈ 3–4x read throughput, primary nhẹ để lo writes |
| HA + backup | Primary chết → promote replica (failover); replica còn phục vụ PITR |
| Lag kiểm soát được | Monitor lag (giây/bytes); read-your-writes che lag khỏi UX |

---

## ⚠️ Lưu Ý

- Sync: không mất data nhưng write đợi replica (chậm, primary chết vẫn có data). Async: nhanh nhưng failover có thể mất vài transaction cuối. Semi-sync: ít nhất 1 replica confirm — cân bằng phổ biến.
- Đừng đọc critical (số dư sau chuyển tiền) từ replica — luôn primary.
- Lag spike khi replica chạy báo cáo nặng/VACUUM: tách replica OLAP riêng khỏi replica phục vụ app.
- Failover cần fencing (STONITH) kẻo 2 primary (split-brain).

---

## 🔄 Sync vs Semi-Sync vs Async (Trade-off)

| Chế độ | Write latency | Data an toàn | Replica lag | Phổ biến khi |
|---|---|---|---|---|
| **Sync** | Cao (đợi 1–N replicas confirm) | R = N — không mất data khi primary chết | 0 lag | Tài chính, compliance, dữ liệu quan trọng |
| **Semi-sync** | Trung bình (đợi ≥1 replica confirm) | R = 1 — chắc chắn đủ để restore | ~0–10ms | Cân bằng mặc định nhiều DB (Postgres streaming rep mặc định semi) |
| **Async** | Thấp (ghi primary xong return) | R = 0 — failover có thể mất transaction cuối | 10ms–giây | Read-scale, cross-region, analytics replica |
| **Quorum (Raft/Paxos)** | Cao nhất (đợi majority) | R = majority — chịu được minority crash | 0 lag (nếu đọc từ quorum) | Consensus DB (etcd, CockroachDB, TiDB) |

> **Quy tắc**: `W + R > N` → đọc luôn thấy write. W = số replicas confirm, R = số replicas đọc.

---

## 🧠 Split-Brain & Quorum

**Split-brain**: Mạng chia đôi → cả 2 bên đều nghĩ mình là primary → 2 writable → data conflict:

- **Giải pháp**: **fencing** (STONITH) + **quorum** (bỏ phiếu majority). Replica có quorum mới được phép write.
- **Raft**: `N = 2F + 1` → chịu được F crash. 3 node → chịu 1 fail; 5 node → chịu 2 fail.
- **Cảnh báo**: 2 replicas cùng quorum khi network partition → vẫn split-brain được nếu không có fencing.

---

## ⚠️ Failover tự động: rủi ro thường bị bỏ qua

| Rủi ro | Hệ quả | Giảm thiểu |
|---|---|---|
| Failover khi primary chưa sync hết | Mất transaction cuối (async/semi-sync) | Dùng sync cho data quan trọng; kiểm tra `pg_last_wal_receive_lsn()` trước promote |
| Ảnh hưởng sóng (cascading failure) | Nhiều replicas cùng lag/spike → failover liên tục | Health check có độ trễ, không failover khi lag > X |
| Old primary hồi phục | Old primary tự ghi tiếp nếu không có STONITH → 2 primaries | Fencing kill old primary; dùng patroni/Consul đủ fencing |
| App không handle reconnect | Connection error sau failover | Retry với exponential backoff; connection pool tự refresh |

---

## 📊 Đo Replica Lag: Metrics nào?

| Metric | Nguồn (Postgres) | Ý nghĩa |
|---|---|---|
| `pg_stat_replication.lag_bytes` | `pg_stat_replication` view | Số byte replica chậm sau primary |
| `pg_stat_replication.lag_secs` | Postgres 13+ | Thời gian (giây) replica chậm |
| `application_name` + `state` | `pg_stat_replication` | Biết app nào lag nào (OLAP vs OLTP replica) |
| `wal_lsn_diff()` | SQL | So sánh LSN bằng SQL (độ trễ chính xác nhất) |
| Replication slot lag | `pg_replication_slots` | Lag của slot (giữ WAL để standby kết nối lại) — slot chặn vacuum xóa WAL |

**Alert**: lag > 30s → alert ngay; lag > 5min → paging on-call.

---

## 🎯 Khi nào dùng

- Read-heavy (80%+ reads): tách reads sang replica.
- Không dùng khi: write-heavy thuần (replica không giúp), hoặc app không chịu được stale read nào (đọc hết từ primary).

---

## 🔗 Liên quan

- **10.8 ACID & Isolation** — stale read của replica là "isolation ở tầng infra".
- **10.10 Connection Pooling** — pool tách read/write endpoints.
- **8.5 Kubernetes** — StatefulSet + operator vận hành Postgres HA.

---

## 📚 Tài liệu

- Postgres Streaming Replication — https://www.postgresql.org/docs/current/warm-standby.html
- *Designing Data-Intelligent Applications* ch.5 — Kleppmann (replication modes)

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.11-replication
npx tsx examples/index.ts
```

Demo: sync vs async (latency/mất data) → đọc dính stale → fix bằng read-your-writes.

---

## ⏭️ Bài tiếp theo

→ [10.12 Vector DB](../10.12-vector-db/README.md)
