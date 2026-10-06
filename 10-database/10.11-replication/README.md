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
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

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
npx ts-node examples/index.ts
```

Demo: sync vs async (latency/mất data) → đọc dính stale → fix bằng read-your-writes.

---

## ⏭️ Bài tiếp theo

→ [10.12 Vector DB](../10.12-vector-db/README.md)
