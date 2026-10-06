# 🔒 10.8 ACID & Isolation Levels (Giao Dịch & Cô Lập)

> **ACID** (Atomicity, Consistency, Isolation, Durability) là cam kết của database cho transaction. **Isolation level** là núm vặn giữa **đúng tuyệt đối** (Serializable, chậm) và **nhanh** (Read Committed, chấp nhận anomaly).

---

## 🎯 Vấn đề

Hai transaction chạy song song đọc/ghi cùng rows sinh 3 anomaly:

```
dirty read:       đọc data chưa commit (rollback → đọc "ma") 👻
non-repeatable:   đọc 2 lần, kết quả khác (ai đó commit sửa giữa chừng)
phantom:          đếm 2 lần, số rows khác (ai đó insert thêm vào range)
```

Chọn level sai: hoặc mất tiền (banking dirty read) hoặc chậm không cần (đếm view cũng Serializable).

---

## 💻 Code ví dụ

Mô phỏng interleaving 2 transaction ở từng level, xem anomaly nào lọt qua.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

type Level = "READ_UNCOMMITTED" | "READ_COMMITTED" | "REPEATABLE_READ" | "SERIALIZABLE";

// Ma trận: level nào chặn anomaly nào
const MATRIX: Record<Level, { dirty: boolean; nonRepeatable: boolean; phantom: boolean }> = {
  READ_UNCOMMITTED: { dirty: false, nonRepeatable: false, phantom: false },
  READ_COMMITTED:   { dirty: true,  nonRepeatable: false, phantom: false },
  REPEATABLE_READ:  { dirty: true,  nonRepeatable: true,  phantom: false },
  SERIALIZABLE:     { dirty: true,  nonRepeatable: true,  phantom: true },
};
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Hiểu trade-off | Default Read Committed (Postgres) đủ cho 90% app; chỉ nâng level cho đoạn critical |
| Tránh bug tiền | Chuyển tiền, trừ kho: Repeatable Read/Serializable + retry khi serialization failure |
| Debug được | Gọi tên đúng anomaly (dirty/phantom) thay vì "lỗi kỳ lạ lúc đông user" |

---

## ⚠️ Lưu Ý

- Serializable có thể ném `serialization failure` — app PHẢI retry transaction, không phải bug.
- Postgres Repeatable Read vẫn có phantom (snapshot per-transaction); muốn hết phantom phải Serializable (predicate locking).
- Isolation cao + transaction dài = deadlock: giữ transaction ngắn, lock theo thứ tự cố định.
- Đừng đổi default toàn DB: dùng `SET TRANSACTION ISOLATION LEVEL` cho transaction cần thôi.

---

## 🎯 Khi nào dùng

| Level | Khi nào |
|---|---|
| Read Committed | Mặc định: CRUD, CMS, đa số API |
| Repeatable Read | Báo cáo cần đọc nhất quán trong 1 transaction |
| Serializable | Banking core, payment, trừ kho chính xác |
| Read Uncommitted | Gần như không dùng (Postgres còn không implement thật) |

---

## 🔗 Liên quan

- **10.4 Migrations** — migration DDL trong transaction (Postgres hỗ trợ).
- **12.5 Race Conditions** — race ở app layer vs anomaly ở DB layer, giải pháp khác nhau.
- **10.11 Replication** — replica lag là "stale read" ở tầng infra, tương tự tư duy isolation.

---

## 📚 Tài liệu

- PostgreSQL MVCC & Isolation — https://www.postgresql.org/docs/current/mvcc.html
- *Designing Data-Intensive Applications* ch.7 — Martin Kleppmann

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.8-acid-isolation
npx ts-node examples/index.ts
```

Demo: chạy cùng interleaving ở 4 levels → bảng anomaly lọt/chặn → demo retry khi serialization failure.

---

## ⏭️ Bài tiếp theo

→ [10.9 N+1 Query](../10.9-n-plus-one/README.md)
