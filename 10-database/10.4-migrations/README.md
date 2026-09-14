# 🔄 10.4 Database Migrations

> **Migrations** là cơ chế quản lý version cho schema database, cho phép thay đổi cấu trúc một cách có kiểm soát — giống như git cho database schema. Không có migration, mỗi lần thêm cột là một manual ALTER TABLE Risky trên production, không có rollback plan, không có audit trail.

---

## 🎯 Tại sao cần migration?

```
┌─────────────────────────────────────────────────────────────┐
│           WHY MIGRATIONS?                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ KHÔNG có migrations — Real-world horror stories:       │
│  • Developer A thêm cột email trên local, Developer B        │
│    xóa bảng orders trên production — không ai biết schema    │
│    thực tế là gì                                             │
│  • Production DB khác local 3 tháng → "works on my机"       │
│  • Rollback: phải nhớ tay từng ALTER, DROP, RENAME lệnh      │
│  • Audit: không biết ai thêm cột này khi nào                 │
│  • CI/CD: deploy pipeline không thể tự động migrate          │
│                                                             │
│  ✅ Có migrations — Structured, auditable, repeatable:       │
│  • Schema được version control (git-tracked)                 │
│  • Team đồng bộ dễ dàng: `git pull && npx prisma migrate     │
│    deploy`                                                   │
│  • Deploy tự động: CI/CD chạy migration trước app deploy     │
│  • Rollback: known good state, not guesswork                 │
│  • Audit trail: ai commit migration file nào, khi nào        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Migration là immutability principle áp dụng cho database:** mỗi migration file là một **snapshot của thay đổi**, không bao giờ sửa sau khi commit. Nếu bạn cần rollback, tạo migration mới (ngược lại), không chỉnh sửa migration cũ.

---

## 📐 Migration Lifecycle — Workflow chuẩn

```
┌─────────────────────────────────────────────────────────────┐
│          MIGRATION WORKFLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: Local Development                                 │
│  ──────────────────────────                                 │
│  1. Dev thay đổi schema.prisma (hoặc viết SQL migration)     │
│       │                                                     │
│       ▼                                                     │
│  2. Tạo migration file                                      │
│     npx prisma migrate dev --name add_email_to_users        │
│       │                                                     │
│       ▼                                                     │
│  3. Migration file được lưu trong /prisma/migrations/       │
│     └── 20240115000000_add_email_to_users/                  │
│         └── migration.sql                                   │
│         └── migration_lock.toml  ← lock file               │
│       │                                                     │
│       ▼                                                     │
│  4. Áp dụng lên Local DB (dev database)                     │
│     — Migration runner tự động execute SQL                  │
│     — Ghi lại đã apply vào _prisma_migrations table         │
│       │                                                     │
│       ▼                                                     │
│  5. Commit migration file + schema.prisma vào git           │
│     → PR review → merge                                    │
│                                                             │
│  Phase 2: Production Deployment                             │
│  ──────────────────────────                                 │
│  6. CI/CD pipeline:                                         │
│     a. Chạy migration file lên Staging DB                   │
│     b. Run integration tests với schema mới                 │
│     c. Chạy migration file lên Production DB                │
│     d. Deploy application code (sau migration xong)         │
│                                                             │
│  Rule quan trọng: Migration chạy TRƯỚC app code deploy      │
│  — App mới cần schema mới, nhưng schema cũ vẫn works với   │
│    app cũ (backward compatible)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Quy tắc deploy quan trọng nhất:** migration luôn chạy TRƯỚC application code deploy. Lý do:
- App code mới dùng schema mới → cần schema có sẵn
- App code cũ vẫn works với schema cũ → schema mới phải backward compatible
- Thứ tự sai = downtime hoặc error

---

## 🛠️ Migration Tools — Comparison

| Tool | Ngôn ngữ | Điểm mạnh | Limitation |
|------|----------|-----------|------------|
| **Prisma Migrate** | TypeScript | Type-safe, auto-gen từ schema, developer experience tốt | Kém với complex SQL migrations, raw SQL hạn chế |
| **Knex Migrate** | JavaScript | Flexible SQL, phổ biến trong Node ecosystem | Không type-safe, phải viết SQL thủ công |
| **Laravel Migrator** | PHP | Tích hợp framework, CLI đẹp | PHP-only |
| **Flyway** | Java/SQL | Enterprise-grade, nhiều DB, CI/CD tích hợp sẵn | Java-centric, verbose config |
| **Alembic** | Python | ORM-independent, SQLAlchemy ecosystem | Python-only |
| **Goose** | Go | Đơn giản, lightweight, single binary | Ít tính năng advance |
| **dbmate** | Go | Multi-DB (Postgres, MySQL, SQLite...), no dependencies | Less popular |

> 💡 **Lựa chọn:** Nếu dự án TypeScript + Prisma → dùng Prisma Migrate. Nếu dự án vanilla SQL + TypeScript → dùng Knex hoặc dbmate. Nếu enterprise Java → Flyway. Không có "best tool" — chỉ có "right tool cho stack".

---

## 📝 Migration File Structure

```
prisma/
└── migrations/
    ├── 20240101000000_init/
    │   └── migration.sql          ← Up + Down statements
    ├── 20240115000000_add_email_to_users/
    │   └── migration.sql
    ├── 20240201000000_create_orders/
    │   └── migration.sql
    ├── 20240301000000_add_index_orders_user_id/
    │   └── migration.sql
    └── migration_lock.toml        ← Lock file, DO NOT edit manually
         │
         └── 20240101000000_init
             ├── migration.sql (up)
             └── migration.sql (down)
```

```sql
-- migration.sql — UP: apply changes
-- Luôn luôn có cả UP và DOWN để rollback possibility

-- UP: add new column
ALTER TABLE "User" ADD COLUMN "email" VARCHAR(255) NOT NULL DEFAULT '';

-- UP: create new table
CREATE TABLE "orders" (
  "id" VARCHAR(255) PRIMARY KEY NOT NULL,
  "user_id" VARCHAR(255) NOT NULL,
  "total" DECIMAL(10, 2) NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "User"("id") ON DELETE cascade ON UPDATE cascade
);

-- UP: create index
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- DOWN: rollback (reverse of up)
-- ALTER TABLE "User" DROP COLUMN "email";
-- DROP TABLE IF EXISTS "orders";
-- DROP INDEX IF EXISTS "orders_user_id_created_at_idx";
```

### Migration naming convention

```
✅ Tốt:
20240115000000_add_email_to_users.sql
20240201000000_create_orders_table.sql
20240301000000_add_index_orders_user_id.sql

❌ Tránh:
001.sql                          ← không descriptive
add_email.sql                    ← không timestamp, khó sort
fix_bug.sql                      ← vague
```

Timestamp prefix đảm bảo thứ tự apply đúng và dễ sort theo thời gian tạo.

---

## ⚠️ Migration Best Practices — Quy tắc bất di bất dịch

```
┌─────────────────────────────────────────────────────────────┐
│           MIGRATION RULES                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ LUÔN làm:                                               │
│  • Commit migration file CÙNG với code change trong 1 commit │
│  • Đặt tên migration rõ ràng, descriptive                    │
│  • Test migration trên staging DB trước production           │
│  • Backup database trước khi migrate production              │
│  • Dùng transaction cho nhiều ALTER (PostgreSQL hỗ trợ)     │
│  • Giữ migration file immutable — never edit after apply     │
│  • Write BOTH up và down statements                          │
│  • Test rollback plan trước khi deploy                       │
│                                                             │
│  ❌ KHÔNG bao giờ:                                          │
│  • Edit migration file sau khi deploy (hoặc commit)          │
│  • Xóa migration file đã apply                               │
│  • Chạy migration khi có người dùng active (trừ emergency)   │
│  • Hardcode data trong migration (trừ seed data script)     │
│  • ALTER TABLE DROP COLUMN trên production trực tiếp         │
│  • Bỏ qua review migration SQL trước apply                  │
│  • Dùng migration để chuyển đổi business logic data         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tại sao không được sửa migration file sau khi commit?** Vì migration history là **source of truth** cho database state. Nếu bạn sửa file sau khi đồng bộ giữa dev/staging/prod, các environment sẽ có schema khác nhau → inconsistency khó debug.

---

## 🔄 Rollback Strategies — Khimigration đi sai hướng

```typescript
// Prisma — rollback migration cuối cùng
npx prisma migrate resolve --rolled-back "20240115000000_add_users"
// Đánh dấu migration đã rollback mà không undo SQL

// Prisma — rollback ALL migrations (DEV ONLY!)
npx prisma migrate reset
// Destroy tất cả data, re-apply từ đầu

// Knex — rollback all or specific
npx knex migrate:rollback              // rollback latest
npx knex migrate:rollback --to 001_init // rollback to specific

// Flyway — undo N migrations
flyway undo -baselineVersion=1 -target=3
```

```
┌─────────────────────────────────────────────────────────────┐
│           ROLLBACK STRATEGIES                             │
├───────────────────┬─────────────────────────────────────────┤
│ Rollback 1 step   │ npx prisma migrate revert               │
│                   │ (chỉ trong dev, production dùng resolve)│
├───────────────────┼─────────────────────────────────────────┤
│ Rollback to ver.  │ prisma migrate resolve --rolled-back    │
│                   │ (đánh dấu đã rollback, không undo SQL)  │
├───────────────────┼─────────────────────────────────────────┤
│ Manual fix        │ Sửa migration SQL (UP only! never DOWN) │
│                   │ rồi tạo migration mới để fix             │
├───────────────────┼─────────────────────────────────────────┤
│ Data recovery     │ Restore từ backup                      │
│                   │ (last good state trước migration)       │
├───────────────────┼─────────────────────────────────────────┤
│ Zero-downtime     │ Xem section 9 ở README.md chính         │
│ rollback          │ pattern: dual-write + feature flag      │
└───────────────────┴─────────────────────────────────────────┘
```

> 📌 **Nguyên tắc rollback:** nếu migration đã apply lên production và gây lỗi, **không** xóa migration file — thay vào đó tạo migration mới reverse lại (ADD column → DROP column, CREATE table → DROP table). History phải nguyên vẹn.

---

## 🎯 Production Checklist — Trước khi deploy migration

```
□ Migration file đã được code review (peer review bắt buộc)
□ Migration test trên staging DB (identical schema to production)
□ Backup database trước khi deploy (full dump hoặc point-in-time)
□ Migration file KHÔNG bị sửa sau commit (git-blame kiểm tra)
□ Rollback plan đã chuẩn bị (test đã chạy rollback script)
□ Monitor sau khi migrate (slow query log, error rate, replication lag)
□ Team được thông báo maintenance window (nếu có downtime risk)
□ Feature flag set cho code mới (feature flags giúp rollback nhanh hơn schema rollback)
□ CI/CD pipeline: migration step chạy TRƯỚC app deploy step
```

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.4-migrations
npx ts-node examples/index.ts
```

Demo minh họa: tạo migration, apply migration, rollback migration, và kiểm tra migration status.

---

## ⏭️ Bài tiếp theo

→ [10.5 Indexes](../10.5-indexes/README.md)
