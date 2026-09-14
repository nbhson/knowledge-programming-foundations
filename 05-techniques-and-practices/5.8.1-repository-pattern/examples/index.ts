/**
 * 5.8.1 Repository Pattern — Demo
 *
 * Repository = lớp trừu tượng hóa truy xuất dữ liệu.
 * Service chỉ biết INTERFACE, không biết đó là InMemory hay PostgreSQL.
 * → Đổi DB, thêm cache, mock cho test đều không chạm vào business logic.
 */

type RpUser = { id: string; name: string; email: string; role: "admin" | "member" };
type RpRole = RpUser["role"];

interface RpUserRepository {
  findById(id: string): RpUser | null;
  findByEmail(email: string): RpUser | null;
  all(): RpUser[];
  save(user: RpUser): RpUser;
  remove(id: string): void;
}

// ✅ Implementation 1 — InMemory (cho demo/test)
class RpInMemoryUserRepository implements RpUserRepository {
  protected rows = new Map<string, RpUser>();

  findById(id: string): RpUser | null {
    return this.rows.get(id) ?? null;
  }

  findByEmail(email: string): RpUser | null {
    for (const user of this.rows.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  all(): RpUser[] {
    return [...this.rows.values()];
  }

  save(user: RpUser): RpUser {
    this.rows.set(user.id, user);
    return user;
  }

  remove(id: string): void {
    this.rows.delete(id);
  }
}

// ✅ Implementation 2 — "PostgreSQL" (giả lập, chỉ minh họa contract)
class RpPostgresUserRepository extends RpInMemoryUserRepository {
  override save(user: RpUser): RpUser {
    console.log(`  📦 [PostgreSQL] INSERT INTO users (id, name, email, role) VALUES ('${user.id}', '${user.name}', '${user.email}', '${user.role}')`);
    this.rows.set(user.id, user);
    return user;
  }

  override findById(id: string): RpUser | null {
    console.log(`  📦 [PostgreSQL] SELECT * FROM users WHERE id = '${id}'`);
    return this.rows.get(id) ?? null;
  }
}

// ✅ Service — chỉ biết interface, hoàn toàn không quan tâm DB nào
class RpUserService {
  constructor(private readonly repo: RpUserRepository) {}

  signUp(name: string, email: string, role: RpRole): RpUser {
    if (this.repo.findByEmail(email)) {
      throw new Error(`Email ${email} đã tồn tại`);
    }
    const user: RpUser = { id: `u-${name.toLowerCase()}`, name, email, role };
    return this.repo.save(user);
  }

  promoteToAdmin(id: string): RpUser {
    const user = this.findByIdOrThrow(id);
    const updated: RpUser = { ...user, role: "admin" };
    return this.repo.save(updated);
  }

  findByIdOrThrow(id: string): RpUser {
    const user = this.repo.findById(id);
    if (!user) throw new Error(`Không tìm thấy user ${id}`);
    return user;
  }

  countMembers(): number {
    return this.repo.all().filter((u) => u.role === "member").length;
  }

  listUsers(): RpUser[] {
    return this.repo.all();
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Repository Pattern Demo ===");
console.log("");

console.log("🟢 Service chạy trên InMemory repository (test/development):");
const rpInMem = new RpUserService(new RpInMemoryUserRepository());
rpInMem.signUp("Son", "son@dev.com", "member");
rpInMem.signUp("Nga", "nga@dev.com", "member");
rpInMem.promoteToAdmin("u-son");
console.log("  → findByEmail(\"son@dev.com\"): " + rpInMem.findByIdOrThrow("u-son").name + " (role: " + rpInMem.findByIdOrThrow("u-son").role + ")");
console.log(`  → Danh sách users: ${rpInMem.listUsers().map((u) => `${u.name}(${u.role})`).join(", ")}`);
console.log("");

console.log("🟢 Service chạy trên 'PostgreSQL' repository (production) — KHÔNG đổi code service:");
const rpPg = new RpUserService(new RpPostgresUserRepository());
rpPg.signUp("Son", "son@dev.com", "member");
console.log(`  → findByEmail("son@dev.com"): ${rpPg.findByIdOrThrow("u-son").email} — vẫn ra đúng user`);
console.log("");

console.log("❌ Service KHÔNG gọi `SELECT...` trực tiếp — nó chỉ gọi repo.findById/findByEmail/save");
console.log("✅ Mọi query SQL gói gọn trong repository → đổi DB chỉ viết thêm 1 repo mới, zero đụng service");
console.log("");

export {};