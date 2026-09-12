# 🔄 10.4 Database Migrations

> **Migrations** là cơ chế quản lý version cho schema database, cho phép thay đổi cấu trúc một cách có kiểm soát.

```
┌─────────────────────────────────────────────────────────────┐
│           WHY MIGRATIONS?                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ KHÔNG có migrations:                                    │
│  - Developer A thêm cột, Developer B xóa bảng               │
│  - Production DB khác với local                             │
│  - Không biết schema hiện tại là gì                         │
│  - Rollback khó khăn                                        │
│                                                             │
│  ✅ Có migrations:                                          │
│  - Schema được version control                              │
│  - Team đồng bộ dễ dàng                                     │
│  - Deploy tự động                                          │
│  - Rollback được                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 Migration Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│          MIGRATION WORKFLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Dev thay đổi schema.prisma (hoặc SQL)                   │
│        │                                                    │
│        ▼                                                    │
│  2. Tạo migration file                                      │
│     npx prisma migrate dev --name add_users_table           │
│        │                                                    │
│        ▼                                                    │
│  3. Migration file được lưu trong /migrations/              │
│        │                                                    │
│        ▼                                                    │
│  4. Apply lên Local DB                                      │
│     npx prisma migrate deploy                               │
│        │                                                    │
│        ▼                                                    │
│  5. Commit migration file + schema.prisma                   │
│        │                                                    │
│        ▼                                                    │
│  6. CI/CD áp dụng lên Staging → Production                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Migration Tools Comparison

| Tool | Ngôn ngữ | Điểm mạnh |
|------|----------|-----------|
| **Prisma Migrate** | TypeScript | Type-safe, auto-gen từ schema |
| **Knex Migrate** | JavaScript | Flexible SQL, phổ biến |
| **Laravel Migratior** | PHP | Tích hợp framework |
| **Flyway** | Java/SQL | Enterprise, nhiều DB |
| **Alembic** | Python | ORM-independent |
| **Goose** | Go | Đơn giản, lightweight |

---

## 📝 Migration File Structure

```
prisma/
└── migrations/
    ├── 20240101000000_init/
    │   └── migration.sql
    ├── 20240115000000_add_users/
    │   └── migration.sql
    └── migration_lock.toml  ← lock file, không edit tay
```

```sql
-- migration.sql example
-- Up: apply changes
ALTER TABLE "User" ADD COLUMN "role" VARCHAR(255) NOT NULL DEFAULT 'user';

-- Down: rollback (tùy tool)
-- ALTER TABLE "User" DROP COLUMN "role";
```

---

## ⚠️ Migration Best Practices

```
┌─────────────────────────────────────────────────────────────┐
│           MIGRATION RULES                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ LUÔN làm:                                               │
│  • Commit migration file cùng với code                      │
│  • Đặt tên migration rõ ràng                              │
│  • Test migration trên staging trước                       │
│  • Backup database trước khi migrate production            │
│  • Dùng transaction cho nhiều ALTER                       │
│                                                             │
│  ❌ KHÔNG bao giờ:                                          │
│  • Edit migration file sau khi deploy                       │
│  • Xóa migration file đã apply                              │
│  • Chạy migration khi có người dùng active                 │
│  • Hardcode data trong migration (trừ seed)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Rollback Strategies

```typescript
// Prisma — rollback migration cuối cùng
npx prisma migrate resolve --rolled-back "20240115000000_add_users"

// Knex — rollback tất cả
npx knex migrate:rollback

// Flyway — rollback N lần gần nhất
flyway undo -baselineVersion=1 -target=3
```

```
┌─────────────────────────────────────────────────────────────┐
│           ROLLBACK STRATEGIES                             │
├───────────────────┬─────────────────────────────────────────┤
│ Rollback 1 step   │ npx prisma migrate revert              │
│ Rollback to version│ prisma migrate resolve --rolled-back  │
│ Manual fix        │ Edit migration SQL (up only!)         │
│ Data recovery     │ Restore from backup                   │
└───────────────────┴─────────────────────────────────────────┘
```

---

## 🎯 Production Checklist

```
□ Migration file đã được review
□ Test migration trên staging
□ Backup database trước khi deploy
□ Migration file KHÔNG bị sửa sau commit
□ Rollback plan đã chuẩn bị
□ Monitor sau khi migrate
□ Team được thông báo maintenance window
```

---

⏭️ Bài tiếp theo → [10.5 Indexes](../10.5-indexes/README.md)
