/**
 * 10.4 Database Migrations — Mô phỏng migration runner (up/down, versioned)
 *
 * Minh họa:
 * - Migration = danh sách có version, mỗi bản có up() và down()
 * - Runner chỉ áp dụng các migration CHƯA chạy, ghi lại "state"
 * - Hỗ trợ rollback migration gần nhất (down)
 *
 * ⚠️ Đây là mô phỏng schema giả (bảng + cột) để hiểu quy trình,
 * không phải Prisma/Knex/Flyway thật.
 */

// ─────────────────────────────── Types ─────────────────────────────────────
interface SchemaDefinition {
  name: string;
  columns: string[];
}

type DbSchema = SchemaDefinition[];

interface MigrationDefinition {
  version: number;
  name: string;
  up: (schema: DbSchema) => void;
  down: (schema: DbSchema) => void;
}

// ─────────────────────────── Migration Runner ──────────────────────────────
class MigrationRunner {
  private applied: number[] = []; // version đã áp dụng (state)
  private schema: DbSchema = [];

  constructor(private migrations: MigrationDefinition[]) {
    this.migrations = [...migrations].sort((a, b) => a.version - b.version);
  }

  getAppliedVersions(): number[] {
    return [...this.applied];
  }

  getSchema(): DbSchema {
    return this.schema.map((t) => ({ name: t.name, columns: [...t.columns] }));
  }

  // Áp dụng toàn bộ migration chưa chạy, theo thứ tự version
  migrateUp(): void {
    console.log("   ── Running migrations ──");
    for (const m of this.migrations) {
      if (this.applied.includes(m.version)) continue;
      console.log(`   ▶ ${m.version.toString().padStart(3)} | up   : ${m.name}`);
      m.up(this.schema);
      this.applied.push(m.version);
    }
    console.log("   ✅ Tất cả migration đã áp dụng (state: " + this.applied.join(", ") + ")");
  }

  // Rollback migration gần nhất (LIFO)
  migrateDown(): void {
    const lastVersion = this.applied[this.applied.length - 1];
    if (lastVersion === undefined) {
      console.log("   ℹ️ Không có migration nào để rollback");
      return;
    }
    const mig = this.migrations.find((m) => m.version === lastVersion);
    if (!mig) return;
    console.log(`   ◀ ${lastVersion.toString().padStart(3)} | down : ${mig.name}`);
    mig.down(this.schema);
    this.applied.pop();
  }

  // Trạng thái nào đang pending
  pendingVersions(): number[] {
    return this.migrations
      .map((m) => m.version)
      .filter((v) => !this.applied.includes(v));
  }
}

// ──────────────────────── Định nghĩa các migration ─────────────────────────
const MIGRATIONS: MigrationDefinition[] = [
  {
    version: 1,
    name: "create_users_table",
    up: (s) => s.push({ name: "users", columns: ["id", "email"] }),
    down: (s) => s.splice(s.findIndex((t) => t.name === "users"), 1),
  },
  {
    version: 2,
    name: "add_name_to_users",
    up: (s) => {
      const users = s.find((t) => t.name === "users");
      if (users) users.columns.push("name");
    },
    down: (s) => {
      const users = s.find((t) => t.name === "users");
      if (users) users.columns = users.columns.filter((c) => c !== "name");
    },
  },
  {
    version: 3,
    name: "create_orders_table",
    up: (s) => s.push({ name: "orders", columns: ["id", "user_id", "total"] }),
    down: (s) => s.splice(s.findIndex((t) => t.name === "orders"), 1),
  },
];

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Database Migrations Demo ===");
console.log("");

const runner = new MigrationRunner(MIGRATIONS);

console.log("1️⃣ Khởi tạo — chưa có migration nào chạy:");
console.log(`   Pending versions: ${runner.pendingVersions().join(", ")}`);
console.log(`   Schema          : ${JSON.stringify(runner.getSchema())}`);
console.log("");

console.log("2️⃣ migrateUp() — áp dụng tuần tự theo version:");
runner.migrateUp();
console.log("");
console.log("   Schema sau khi migrate:");
for (const t of runner.getSchema()) {
  console.log(`   ✅ Table ${t.name} (${t.columns.join(", ")})`);
}
console.log("");
console.log("   Pending versions: " + (runner.pendingVersions().length ? runner.pendingVersions().join(", ") : "(không còn)"));
console.log("");

console.log("3️⃣ Chạy lại migrateUp() — không re-run migration đã áp dụng:");
runner.migrateUp();
console.log("");

console.log("4️⃣ Rollback 1 bước (migrateDown):");
runner.migrateDown();
console.log("   Schema sau rollback:");
for (const t of runner.getSchema()) {
  console.log(`   → Table ${t.name} (${t.columns.join(", ")})`);
}
console.log("");

console.log("5️⃣ Rollback thêm để tạo migration mới (thay vì sửa file cũ):");
runner.migrateDown();
runner.migrateDown();
const orderCols = runner.getSchema().find((t) => t.name === "users");
console.log(`   Schema users còn: ${orderCols ? orderCols.columns.join(", ") : "(không còn)"}`);
console.log("");

console.log("✅ Migration = schema được version hóa: mỗi thay đổi là 1 file có version + up/down, run theo thứ tự, record vào state — rollback chỉ cần chạy ngược (down). Không bao giờ sửa migration đã chạy.");
export {};