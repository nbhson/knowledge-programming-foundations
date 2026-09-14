/**
 * 10.3 Prisma ORM — schema.prisma + mô phỏng PrismaClient CRUD
 *
 * Minh họa:
 * - Chuỗi schema.prisma (model + relations) như file thật
 * - Mô phỏng PrismaClient: findUnique / create / update / findMany (include)
 * - $transaction mô phỏng thao tác atomic
 *
 * ⚠️ Không phải Prisma thật — chỉ mô hình hóa API để hiểu cách dùng.
 */

// ─────────────────────────── schema.prisma (string) ─────────────────────────
const PRISMA_SCHEMA = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  role      String    @default("user")
  posts     Post[]
  createdAt DateTime  @default(now())
}

model Post {
  id        String   @id @default(cuid())
  title     String
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
`;

// ─────────────────────────────── Types ─────────────────────────────────────
interface PrismaUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface PrismaPost {
  id: string;
  title: string;
  published: boolean;
  authorId: string;
}

// ──────────────────── Mô phỏng PrismaClient ────────────────────────────────
class SimPrismaClient {
  private users: PrismaUser[] = [];
  private posts: PrismaPost[] = [];

  constructor() {
    this.users.push({
      id: "clc1g0001",
      email: "alice@test.com",
      name: "Alice",
      role: "admin",
    });
    this.users.push({
      id: "clc1g0002",
      email: "bob@test.com",
      name: "Bob",
      role: "user",
    });
    this.posts.push({
      id: "p1",
      title: "Hello Prisma",
      published: true,
      authorId: "clc1g0001",
    });
  }

  // ===== model user =====
  user = {
    create: (data: { email: string; name?: string; role?: string }): PrismaUser => {
      const newUser: PrismaUser = {
        id: `clu${Math.random().toString(36).slice(2, 10)}`,
        email: data.email,
        name: data.name ?? null,
        role: data.role ?? "user",
      };
      this.users.push(newUser);
      return { ...newUser };
    },

    findUnique: (
      where: { id?: string; email?: string },
      opts?: { include?: { posts?: boolean } }
    ): { user: PrismaUser; posts: PrismaPost[] } | null => {
      const user = this.users.find(
        (u) => u.id === where.id || u.email === where.email
      );
      if (!user) return null;
      const posts = opts?.include?.posts
        ? this.posts.filter((p) => p.authorId === user.id)
        : [];
      return { user: { ...user }, posts };
    },

    update: (
      where: { id: string },
      data: { name?: string; role?: string }
    ): PrismaUser | null => {
      const user = this.users.find((u) => u.id === where.id);
      if (!user) return null;
      if (data.name !== undefined) user.name = data.name;
      if (data.role !== undefined) user.role = data.role;
      return { ...user };
    },
  };

  // ===== model post =====
  post = {
    create: (data: { title: string; authorId: string; published?: boolean }): PrismaPost => {
      const newPost: PrismaPost = {
        id: `clp${Math.random().toString(36).slice(2, 10)}`,
        title: data.title,
        published: data.published ?? false,
        authorId: data.authorId,
      };
      this.posts.push(newPost);
      return { ...newPost };
    },

    findMany: (opts?: { where?: { published?: boolean } }): PrismaPost[] => {
      let rows = this.posts;
      if (opts?.where?.published !== undefined) {
        rows = rows.filter((p) => p.published === opts.where?.published);
      }
      return rows.map((p) => ({ ...p }));
    },
  };

  // ===== transaction =====
  async $transaction(
    ops: (tx: SimPrismaClient) => Array<Promise<unknown>>
  ): Promise<unknown[]> {
    // Back-up trạng thái để rollback nếu có lỗi (mô phỏng atomicity)
    const usersBackup = this.users.map((u) => ({ ...u }));
    const postsBackup = this.posts.map((p) => ({ ...p }));
    try {
      return await Promise.all(ops(this));
    } catch (err) {
      this.users = usersBackup;
      this.posts = postsBackup;
      throw err;
    }
  }

  count(): { users: number; posts: number } {
    return { users: this.users.length, posts: this.posts.length };
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Prisma ORM Demo ===");
console.log("");

console.log("1️⃣ schema.prisma (minh họa model + relation):");
console.log("   " + PRISMA_SCHEMA.trim().split("\n").slice(0, 12).join("\n   "));
console.log("   … (model Post đang minh họa 1-to-many User ↔ Post)");
console.log("");

const prisma = new SimPrismaClient();

console.log("2️⃣ CREATE — prisma.user.create:");
const dave = prisma.user.create({ email: "dave@test.com", name: "Dave" });
console.log(`   ✅ Tạo user ${dave.id} (role=${dave.role})`);
console.log("");

console.log("3️⃣ READ — prisma.user.findUnique + include posts:");
const alice = prisma.user.findUnique(
  { email: "alice@test.com" },
  { include: { posts: true } }
);
console.log(`   → Alice posts: ${alice?.posts.map((p) => p.title).join(", ") ?? "(none)"}`);
console.log("");

console.log("4️⃣ UPDATE — prisma.user.update:");
prisma.user.update({ id: dave.id }, { role: "moderator" });
console.log(`   ✅ Dave nâng cấp → tìm lại: ${prisma.user.findUnique({ id: dave.id })?.user.role}`);
console.log("");

console.log("5️⃣ CREATE post + findMany theo filter:");
prisma.post.create({ title: "Prisma trong 10 phút", authorId: dave.id, published: true });
const publishedPosts = prisma.post.findMany({ where: { published: true } });
console.log(`   ✅ Published posts: ${publishedPosts.map((p) => p.title).join(" | ")}`);
console.log("");

console.log("6️⃣ $transaction — tạo user + post trong 1 transaction:");
void prisma
  .$transaction((tx) => [
    Promise.resolve(tx.user.create({ email: "eve@test.com", name: "Eve" })),
    Promise.resolve(
      tx.post.create({ title: "Bài đầu của Eve", authorId: "eve@test.com" })
    ),
  ])
  .then(() => {
    console.log(
      `   ✅ Commit thành công — users=${prisma.count().users}, posts=${prisma.count().posts}`
    );
    console.log("");
    console.log("✅ Prisma: schema = nguồn chân lý (single source of truth), client type-safe sinh tự động, relations đi kèm tự động. Giữ schema + migrate cùng code.");
  });
export {};