# 🏗️ 10.3 Prisma ORM

> **Prisma** là ORM type-safe hiện đại cho TypeScript, tự động generate client từ schema.

```
┌─────────────────────────────────────────────────────────────┐
│           PRISMA ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   TypeScript Code                                           │
│      │                                                      │
│      ▼                                                      │
│   prisma.client.xxx()  ← Type-safe auto-generated          │
│      │                                                      │
│      ▼                                                      │
│   Prisma Client (generated)                                 │
│      │                                                      │
│      ▼                                                      │
│   SQL Query Builder (tự động generate)                      │
│      │                                                      │
│      ▼                                                      │
│   Database (PostgreSQL / MySQL / SQLite / ...               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 Schema Basics

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  posts     Post[]
  profile   Profile?
  orders    Order[]
}

model Profile {
  id        String   @id @default(cuid())
  bio       String?
  avatar    String?
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  categories CategoryOnPost[]
  createdAt DateTime @default(now())
}

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  posts     CategoryOnPost[]
}

// Many-to-Many junction table
model CategoryOnPost {
  category Category @relation(fields: [categoryId], references: [id])
  post     Post    @relation(fields: [postId], references: [id])
  createdAt DateTime @default(now())

  @@id([categoryId, postId])
}
```

---

## 🔗 Relations

```
┌─────────────────────────────────────────────────────────────┐
│           RELATIONSHIP TYPES                              │
├───────────────────┬─────────────────────────────────────────┤
│ 1-to-1           │ Profile ↔ User                          │
│ 1-to-Many        │ User → Many Posts                       │
│ Many-to-Many     │ Post ↔ Many Categories                  │
└───────────────────┴─────────────────────────────────────────┘
```

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── 1-to-1: User ↔ Profile ──────────────────────────────
const user = await prisma.user.findUnique({
  where: { email: 'alice@test.com' },
  include: { profile: true },  // join Profile
});

await prisma.user.update({
  where: { id: userId },
  data: { profile: { upsert: { create: { bio: 'Hello' }, update: { bio: 'Updated' } } } },
});

// ── 1-to-Many: User → Posts ─────────────────────────────
const userWithPosts = await prisma.user.findUnique({
  where: { id: userId },
  include: { posts: true },
});

await prisma.post.create({
  data: {
    title: 'New Post',
    authorId: userId,
    categories: { connect: [{ id: catId1 }, { id: catId2 }] },
  },
});

// ── Many-to-Many: Post ↔ Categories ─────────────────────
const postWithCategories = await prisma.post.findUnique({
  where: { id: postId },
  include: { categories: true },
});

await prisma.post.update({
  where: { id: postId },
  data: {
    categories: { connect: [{ id: 'cat-1' }, { id: 'cat-2' }] },
  },
});
```

---

## 🚀 Migrations

```bash
# Tạo migration file từ schema thay đổi
npx prisma migrate dev --name add_users_table

# Áp dụng migration lên database
npx prisma migrate deploy

# Reset database (dev only!)
npx prisma migrate reset

# Generate client sau khi migrate
npx prisma generate
```

```sql
-- Migration file tự động tạo (ví dụ)
CREATE TABLE "User" (
  "id" VARCHAR(255) PRIMARY KEY NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255),
  "role" VARCHAR(255) NOT NULL DEFAULT E'user',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_email_unique" UNIQUE("email")
);
```

---

## ✅ Best Practices

| Thực hành | Lý do |
|-----------|-------|
| Dùng `include` thay vì manual join | Type-safe, dễ đọc |
| Dùng `select` để chỉ chọn cột cần | Giảm payload |
| Always handle null | Prisma có thể return null |
| Dùng `$transaction` cho atomic ops | Tránh race condition |
| Migration tên rõ ràng | Dễ rollback, track changes |

```typescript
// ✅ Select only needed fields
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true },
});

// ✅ Transaction
await prisma.$transaction(async (tx) => {
  await tx.post.create({ data: { title: '...', authorId } });
  await tx.user.update({ where: { id: authorId }, data: { postCount: { increment: 1 } } });
});

// ⚠️ Never do this
const raw = await prisma.$queryRawUnsafe(`SELECT * FROM users`);
```

---

⏭️ Bài tiếp theo → [10.4 Migrations](../10.4-migrations/README.md)
