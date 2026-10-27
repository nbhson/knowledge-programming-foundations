/**
 * 5.8 Data Handling — Demo tổng quan
 *
 * Ba pattern quản lý dữ liệu (bản đầy đủ ở từng leaf 5.8.1 → 5.8.3):
 *   1. Repository Pattern — tách truy xuất dữ liệu, service không biết DB
 *   2. Unit of Work       — thao tác theo nhóm: commit tất cả hoặc rollback
 *   3. DTO                — che field nhạy cảm khi truyền ra ngoài
 */

// ────────── 1. REPOSITORY (mini) ──────────
type DhUser = { id: string; name: string; email: string };

interface DhUserStore {
  findById(id: string): DhUser | null;
  save(user: DhUser): void;
}

class DhInMemoryUserStore implements DhUserStore {
  private rows = new Map<string, DhUser>();
  save(user: DhUser): void {
    this.rows.set(user.id, user);
  }
  findById(id: string): DhUser | null {
    return this.rows.get(id) ?? null;
  }
}

class DhPostgresUserStore implements DhUserStore {
  private rows = new Map<string, DhUser>();
  save(user: DhUser): void {
    console.log(`     📦 [PostgreSQL] INSERT INTO users ... (${user.email}) — thật ra là query SQL`);
    this.rows.set(user.id, user);
  }
  findById(id: string): DhUser | null {
    console.log(`     📦 [PostgreSQL] SELECT * FROM users WHERE id = '${id}'`);
    return this.rows.get(id) ?? null;
  }
}

class DhUserManager {
  constructor(private store: DhUserStore) {}
  register(id: string, name: string, email: string): DhUser {
    const user = { id, name, email };
    this.store.save(user);
    return user;
  }
  find(id: string): DhUser | null {
    return this.store.findById(id);
  }
}

// ────────── 2. UNIT OF WORK (mini) ──────────
class DhBatch {
  private ops: Array<() => void> = [];
  add(description: string, run: () => void): void {
    this.ops.push(() => {
      run();
      console.log(`     ✅ ${description}`);
    });
  }
  commit(): void {
    for (const op of this.ops) op();
    this.ops = [];
  }
  rollback(): void {
    this.ops = [];
  }
  size(): number {
    return this.ops.length;
  }
}

// ────────── 3. DTO (mini) ──────────
class DhAccountEntity {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly passwordHash: string,
    readonly createdAt: Date
  ) {}
}

class DhAccountPublicDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: Date;

  private constructor(account: DhAccountEntity) {
    this.id = account.id;
    this.name = account.name;
    this.email = account.email;
    this.createdAt = account.createdAt;
  }

  static fromEntity(account: DhAccountEntity): DhAccountPublicDto {
    return new DhAccountPublicDto(account);
  }

  toJson(): string {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
    });
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Data Handling Demo (tổng quan) ===");
console.log("");

console.log("1️⃣ REPOSITORY — service chỉ phụ thuộc interface DhUserStore:");
const dhMem = new DhUserManager(new DhInMemoryUserStore());
const dhPg = new DhUserManager(new DhPostgresUserStore());
dhMem.register("u1", "Son", "son@dev.com");
dhPg.register("u1", "Son", "son@dev.com");
console.log(`  In-memory findById → ${dhMem.find("u1")?.name ?? "?"} | Postgres findById → ${dhPg.find("u1")?.name ?? "?"}`);
console.log("     💬 ĐỔI DB (memory ↔ PostgreSQL) mà DhUserManager không cần sửa 1 dòng");
console.log("");

console.log("2️⃣ UNIT OF WORK — commit cả nhóm / rollback bỏ hết:");
const dhBatch = new DhBatch();
dhBatch.add("Tạo order #1", () => {});
dhBatch.add("Trừ kho", () => {});
dhBatch.add("Ghi order_items", () => {});
console.log(`  Đang chờ commit: ${dhBatch.size()} thao tác`);
dhBatch.commit();
console.log("  → commit(): tất cả áp dụng, hoặc dùng rollback() để hủy cả nhóm khi 1 bước lỗi");
console.log("");

console.log("3️⃣ DTO — entity với passwordHash vs DTO public:");
const dhEntity = new DhAccountEntity("u1", "Son", "son@dev.com", "5f4dcc3b5aa765d61d8327deb882cf99", new Date());
console.log(`  ❌ Entity JSON:      ${JSON.stringify(dhEntity)}`);
console.log(`  ✅ DTO JSON:         ${DhAccountPublicDto.fromEntity(dhEntity).toJson()}`);
console.log("     💬 passwordHash bị DTO cắt — không bao giờ lọt ra ngoài");
console.log("");
console.log("✅ Data Handling: Repository tách DB, Unit of Work gom transaction, DTO chặn dữ liệu nhạy cảm");
console.log("");

export {};