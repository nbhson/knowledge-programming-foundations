# 🏗️ 10.3 Prisma ORM

> **Prisma** là ORM type-safe hiện đại cho TypeScript, tự động generate client từ schema. Nhưng quan trọng hơn: Prisma là **bridge** giữa TypeScript type system và database schema — khi bạn đổi schema.prisma và chạy migrate, TypeScript compiler sẽ báo lỗi ngay tại compile time nếu code cũ reference field đã rename. Đó là lợi thế lớn nhất: **compile-time safety cho database operations**.

---

## 🎯 Prisma là gì và tại sao chọn nó?

ORM (Object-Relational Mapper) là lớp trừu tượng giữa code và SQL. Prisma khác ORM truyền thống ở 3 điểm:

1. **Type generation**: `prisma generate` tạo `PrismaClient` với types từ schema.prisma — mọi query có autocompletion + compile-time error.
2. **Schema-first**: Database schema được định nghĩa trong `.prisma` file, không phải SQL migration thủ công.
3. **Query builder DSL**: Method chaining (`where`, `orderBy`, `include`) thay vì string interpolation.

**Vấn đề Prisma giải quyết:**
- **Type drift**: schema database đổi nhưng TypeScript type không update → runtime error
- **SQL injection**: raw query không type-safe (dù Prisma cố gắng mitigate)
- **N+1 queries**: developer vô ý viết loop query thay vì eager loading
- **Migration chaos**: không có version control cho schema changes

**Vấn đề Prisma KHÔNG giải quyết (hoặc giải quyết kém):**
- Complex analytical queries (window functions, recursive CTEs, stored procedures)
- Schema evolution với zero-downtime (cần hiểu generated SQL)
- Multi-database support (PostgreSQL, MySQL, SQLite, SQL Server, MongoDB — nhưng mỗi DB có feature khác nhau)
- Raw SQL escape hatch (dùng `$queryRaw` phải tự type annotate)

---

## 📐 Schema Basics — Định nghĩa structure

```prisma
// schema.prisma — source of truth cho database schema
// Đây là file quan trọng nhất trong dự án Prisma — mọi thứ sinh ra từ đây

generator client {
  provider = "prisma-client-js"   // Generated client library
}

datasource db {
  provider = "postgresql"         // or "mysql", "sqlite", "sqlserver", "mongodb"
  url      = env("DATABASE_URL")  // Read from .env file at runtime
}

// Enums — mapped to PostgreSQL ENUM type (efficient, type-safe)
enum UserRole {
  USER
  MODERATOR
  ADMIN
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// Model = table, Field = column
model User {
  id        String   @id @default(cuid())   // cuid() generates unique ID (cXXXXX format)
  email     String   @unique               // UNIQUE constraint, auto-indexed
  username  String   @unique               // Unique username
  name      String?                          // Nullable field
  role      UserRole @default(USER)         // Enum with default
  createdAt DateTime @default(now())       // Auto-set on create
  updatedAt DateTime @updatedAt             // Auto-updated on every change
  deletedAt DateTime?                      // Soft delete column

  // Relations — foreign keys defined implicitly via relation field
  posts     Post[]          @relation("UserPosts")   // 1-to-Many: User has many Posts
  profile   Profile?        @relation("UserProle")   // 1-to-1: optional profile
  orders    Order[]
  comments  Comment[]
  followers Followings[]    @relation("Follower")    // Many-to-Many junction
  following Followings[]    @relation("Followee")

  @@index([email])                           // Explicit index (auto for @unique already)
  @@index([createdAt])                       // Index for sorting by creation date
  @@map("users")                             // Custom table name (defaults to model name pluralized)
}

model Profile {
  id        String   @id @default(cuid())
  bio       String?
  avatar    String?
  website   String?
  userId    String   @unique                 // 1-to-1: each profile belongs to 1 user
  user      User     @relation("UserProle", fields: [userId], references: [id])

  @@map("profiles")
}

model Post {
  id           String      @id @default(cuid())
  title        String
  slug         String      @unique            // SEO-friendly URL slug
  content      String?                        // Nullable — draft posts may not have content
  published    Boolean     @default(false)
  status       PostStatus  @default(DRAFT)
  viewCount    Int         @default(0)
  authorId     String
  author       User        @relation("UserPosts", fields: [authorId], references: [id])
  categories   CategoryOnPost[]
  comments     Comment[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([authorId, createdAt])              // Composite: fetch author's posts sorted
  @@index([slug])                             // Fast slug lookup for routing
  @@index([status, published])                // Filter by status + published flag
  @@map("posts")
}

model Category {
  id        String             @id @default(cuid())
  name      String             @unique
  slug      String             @unique
  description String?
  posts     CategoryOnPost[]
  createdAt DateTime           @default(now())

  @@map("categories")
}

// Many-to-Many junction table — explicit junction for extra fields
model CategoryOnPost {
  categoryId String     @db.Uuid
  postId     String     @db.Uuid
  createdAt  DateTime   @default(now())

  category Category @relation(fields: [categoryId], references: [id])
  post     Post     @relation(fields: [postId], references: [id])

  @@id([categoryId, postId])         // Composite primary key
  @@map("category_posts")            // Junction table name
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  authorId  String
  author    User     @relation("UserPosts", fields: [authorId], references: [id])
  parentId  String?  // Self-referencing for threaded comments
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  createdAt DateTime @default(now())

  @@index([postId, createdAt])        // Fetch comments for a post, sorted
  @@index([authorId])                 // Fetch all comments by an author
}

model Order {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  total       Decimal     @db.Decimal(10, 2)   // Precision for currency
  status      String      @default("pending")
  createdAt   DateTime    @default(now())

  items       OrderItem[]

  @@index([userId, createdAt])
  @@map("orders")
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  productId   String
  quantity    Int      @default(1)
  priceAtBuy  Decimal  @db.Decimal(10, 2)   // Snapshot price — don't join products.price

  @@index([orderId])
  @@map("order_items")
}
```

### Prisma Schema Annotations — Quick reference

```
@id          → Primary key
@default(...) → Default value (cuid(), uuid(), now(), db.PostgresGenDefault())
@unique      → UNIQUE constraint (auto-creates index)
@updatedAt   → Auto-update timestamp on any model update
@@index([...])  → Manual index
@@unique([...]) → Composite unique constraint
@@id([...])     → Composite primary key
@@map("name")   → Custom table name (avoids reserved keyword conflicts)
@relation(...)  → Explicit relation definition with named relations
@db.Type      → Map to specific DB type (e.g., @db.Uuid, @db.Decimal(p,s), @db.Text)
```

---

## 🔗 Relations — Types & Examples

```
┌─────────────────────────────────────────────────────────────┐
│           RELATIONSHIP TYPES                              │
├───────────────────┬─────────────────────────────────────────┤
│ 1-to-1           │ Profile ↔ User (each user has 0 or 1 profile) │
│ 1-to-Many        │ User → Many Posts (author relationship) │
│ Many-to-Many     │ Post ↔ Many Categories (via CategoryOnPost) │
│ Self-referencing │ Comment → Comment (threaded replies)    │
└───────────────────┴─────────────────────────────────────────┘
```

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── 1-to-1: User ↔ Profile ──────────────────────────────
// Find user with profile (eager load)
const user = await prisma.user.findUnique({
  where: { email: 'alice@test.com' },
  include: { profile: true },     // JOIN profile table
});
// user.profile có thể là null (optional relation)

// Upsert profile — create if not exists, update if exists
await prisma.user.update({
  where: { id: userId },
  data: {
    profile: {
      upsert: {
        create: { bio: 'Hello world', avatar: 'https://...' },
        update: { bio: 'Updated bio', avatar: 'https://...' },
      },
    },
  },
});

// ── 1-to-Many: User → Posts ─────────────────────────────
// Find user with all posts (eager load)
const userWithPosts = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: {
      orderBy: { createdAt: 'desc' },
      take: 10,                      // Pagination within relation
      select: { id: true, title: true, viewCount: true },  // Only needed fields
    },
    _count: { select: { posts: true } },  // Get count without loading posts
  },
});

// Create post with categories (nested write)
await prisma.post.create({
  data: {
    title: 'New Post',
    slug: 'new-post',
    content: 'Content here...',
    authorId: userId,
    // Nested create cho Many-to-Many
    categories: {
      connect: [
        { id: 'cat-tech' },
        { id: 'cat-coding' },
      ],
    },
  },
  include: { categories: true },  // Return created post with categories
});

// ── Many-to-Many: Post ↔ Categories ─────────────────────
// Add category to existing post
await prisma.post.update({
  where: { id: postId },
  data: {
    categories: {
      connect: [{ id: 'cat-new' }],
    },
  },
});

// Remove category from post
await prisma.post.update({
  where: { id: postId },
  data: {
    categories: {
      disconnect: [{ id: 'cat-old' }],
    },
  },
});

// Toggle category (connect if not present, disconnect if present)
await prisma.post.update({
  where: { id: postId },
  data: {
    categories: {
      connectOrCreate: [
        {
          where: { id_category: 'cat-tech' },  // Composite key for junction
          create: { category: { connect: { id: 'cat-tech' } } },
        },
      ],
    },
  },
});
```

### Nested Select/Include — Avoid over-fetching

```typescript
// ✅ GOOD: select only needed fields (reduces payload)
const summary = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    _count: { select: { posts: true, orders: true } },  // Count without loading
  },
});
// Result: { id, name, email, _count: { posts: 12, orders: 3 } }

// ✅ GOOD: nested select — control depth
const postDetail = await prisma.post.findUnique({
  where: { id: postId },
  include: {
    author: {
      select: { id: true, name: true, avatar: true },  // Don't load full user
    },
    comments: {
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    },
  },
});

// ⚠️ AVOID: include everything (over-fetching)
const wasteful = await prisma.post.findUnique({
  where: { id: postId },
  include: { author: true, comments: true, categories: true },
  // Loads full user (password, email...), all comments, all categories
});
```

---

## 🚀 Migrations — Schema version control

```bash
# Development: create + apply migration + generate client
npx prisma migrate dev --name add_users_table
# Creates: prisma/migrations/YYYYMMDDHHMMSS_add_users/migration.sql
# Applies to DATABASE_URL
# Regenerates PrismaClient with new types

# Production: apply only (no generate, no dev DB)
npx prisma migrate deploy
# Reads migration files, applies pending ones, marks applied in _Migration table

# Reset database (DEV ONLY — destroys all data!)
npx prisma migrate reset
# Rolls back all migrations, re-applies from scratch
# Use with caution — irreversible without backup

# Generate client manually (after migrate deploy in production)
npx prisma generate
# Regenerates @prisma/client types from schema.prisma
# Required after schema changes in production
```

```sql
-- Generated migration file example (PostgreSQL)
-- File: prisma/migrations/20240115000000_add_users/migration.sql

BEGIN;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM('USER', 'MODERATOR', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "username" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191),
    "role" "UserRole" NOT NULL DEFAULT E'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

COMMIT;
```

### Migration file rules

```
✅ DO:
• Name migrations descriptively: add_email_to_users, create_orders_table
• Commit migration files WITH code changes (same PR)
• Test migration on staging before production
• Review generated SQL before applying to production
• Keep migration files immutable — never edit after apply

❌ DON'T:
• Edit migration files after they've been applied to any environment
• Delete applied migration files — breaks migration history
• Run migrate reset in production — destroys all data
• Mix data migrations (INSERT seed data) with schema migrations
```

---

## ✅ Best Practices — Quy tắc thực hành

| Thực hành | Lý do | Mức độ quan trọng |
|-----------|-------|-------------------|
| Dùng `select` thay vì `include` cho read-only queries | Giảm payload, tăng network speed | ★★★ Essential |
| Dùng `_count` thay vì `include` khi chỉ cần số lượng | Tránh load large relations | ★★★ Essential |
| Always handle null for optional relations | Prisma returns `null` not `undefined` | ★★★ Essential |
| Dùng `$transaction` cho atomic multi-model ops | Guarantees ACID across tables | ★★★ Essential |
| Migration names clear and descriptive | Easy rollback, audit trail | ★★☆ Important |
| Use `@@map` for reserved keywords | Avoid SQL syntax errors | ★★☆ Important |
| Batch writes when possible | Reduce round-trips | ★★☆ Important |
| Monitor Prisma query logging in prod | Catch N+1, slow queries | ★★☆ Important |
| Avoid raw SQL when Prisma supports it | Type safety, portability | ★☆☆ Good habit |
| Keep schema.prisma as single source of truth | Avoid drift between code and DB | ★★★ Essential |

### Transaction patterns — Atomic operations

```typescript
// Pattern 1: Basic transaction
await prisma.$transaction(async (tx) => {
  await tx.post.create({ data: { title: '...', authorId } });
  await tx.user.update({
    where: { id: authorId },
    data: { postCount: { increment: 1 } },  // Atomic increment
  });
});

// Pattern 2: Transaction with rollback on error
try {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({ data: { userId, total: 100 } });
    await tx.orderItem.createMany({
      data: [
        { orderId: order.id, productId: 'prod-1', quantity: 2, priceAtBuy: 50 },
        { orderId: order.id, productId: 'prod-2', quantity: 1, priceAtBuy: 0 },
      ],
    });
    await tx.inventory.updateMany({
      where: { productId: { in: ['prod-1', 'prod-2'] } },
      data: { stock: { decrement: 2 } },
    });
  });
  console.log('Order created successfully');
} catch (error) {
  console.error('Transaction failed, rolled back:', error);
  // All changes reverted automatically
}

// Pattern 3: Isolation level control
await prisma.$transaction([query1, query2], {
  isolationLevel: 'Serializable',  // Highest isolation
});

// Pattern 4: Transaction with custom timeout
await prisma.$transaction([query1, query2], {
  maxWait: 5000,      // 5s max wait for connection
  timeout: 10000,     // 10s total timeout
});
```

### Raw queries — When you need escape hatch

```typescript
// $queryRaw — typed result (infer from query)
const users = await prisma.$queryRaw<Type[]>`
  SELECT id, name, email
  FROM users
  WHERE created_at > ${startDate}
  ORDER BY created_at DESC
  LIMIT ${limit}
`;

// $executeRaw — returns affected rows count
const affected = await prisma.$executeRaw`
  UPDATE users SET role = 'admin' WHERE email LIKE '%@example.com'
`;
console.log(`${affected} rows updated`);

// ⚠️ NEVER interpolate user input directly — use template tag parameters
// ❌ BAD: prisma.$queryRaw(`SELECT * FROM users WHERE name = '${input}'`)
// ✅ GOOD: prisma.$queryRaw`SELECT * FROM users WHERE name = ${input}`
```

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.3-prisma-orm
npx tsx examples/index.ts
```

Demo bao gồm: CRUD operations, nested relations (user → posts → comments), transaction with rollback, and migration workflow. Chú ý cách TypeScript type inference làm việc với PrismaClient — autocomplete và compile-time checks.

---

## ⚠️ Cập nhật cho Prisma 7/8 (Breaking Changes — 11/2025+)

> **Lưu ý (2026):** Prisma 8 đã là bản `prisma@latest`. Prisma 7 vẫn được hỗ trợ đầy đủ (`prisma@prev`). Các breaking change dưới đây áp dụng từ Prisma 7 và giữ nguyên ở Prisma 8. ⚠️ **MongoDB không được hỗ trợ trong Prisma 7** — project MongoDB cần ở lại v6 hoặc kiểm tra [upgrade guide riêng cho MongoDB](https://www.prisma.io/docs/guides/upgrade-prisma-orm/mongodb).

> 📌 **Cập nhật 28/10/2026:** Prisma 8 GA đã sẵn sàng — `prisma@latest` = `8.0.0-rc.27` (23/10/2026), **GA dự kiến trong tháng 10/2026**. Timeline hỗ trợ:
> - **Prisma 6**: chỉ nhận security patches, kết thúc **19/11/2026**
> - **Prisma 7**: được hỗ trợ 18 tháng kể từ ngày Prisma 8 GA chính thức
> - Breaking changes riêng của v8 (SQL ORM client): collection method `apply` → `with`, `scope` → `fragment` (`db.orm.fragment(...)`, types `Scope` → `Fragment`)

### 1. Generator thay đổi

```prisma
// Prisma 7+
generator client {
  provider = "prisma-client"           // thay vì "prisma-client-js"
  output   = "../src/generated/client" // output path bắt buộc
}
```

### 2. Import path thay đổi

```typescript
// Prisma 7+ — import từ output path
import { PrismaClient } from '../src/generated/client'
// KHÔNG còn: import from '@prisma/client'
```

### 3. prisma.config.ts (Prisma 7+)

Schema path, migrations config chuyển vào file config TypeScript thay vì package.json. Prisma 7 cũng chuyển sang **ESM-first** (có thể chọn `moduleFormat = "cjs"`), dùng **driver adapters** và **load .env thủ công** (cần `dotenv`/`tsx`) thay vì tự load như v6.

### Khi nào nâng cấp?

- Project mới: dùng Prisma 7+ ngay
- Project cũ: đọc migration guide trước: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Lưu ý thêm cho Prisma 8: `.take(n)` / `.skip(n)` đổi thành `.limit(n)` / `.offset(n)`

Ref: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7

---

## ⏭️ Bài tiếp theo

→ [10.4 Migrations](../10.4-migrations/README.md)
