/**
 * 10.1 SQL Basics — Mô phỏng bảng users/orders in-memory
 *
 * Minh họa:
 * - Bảng users & orders dạng in-memory
 * - Viết câu truy vấn dạng STRING và "thực thi" qua một mini-engine tự viết
 *   (hỗ trợ SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT)
 * - JOIN và GROUP BY (COUNT) mô phỏng bằng hàm
 *
 * ⚠️ Mini-engine chỉ hiểu một tập nhỏ cú pháp để dạy SQL, không phải DB thật.
 */

// ─────────────────────────────── Types ─────────────────────────────────────
type SqlCell = number | string | boolean;

type SqlRow = Record<string, SqlCell>;

// ─────────────────────── Mini SQL engine (hàm tự viết) ─────────────────────
class SqlMiniEngine {
  private tables: Record<string, SqlRow[]> = {};

  registerTable(name: string, rows: SqlRow[]): void {
    this.tables[name] = rows.map((r) => ({ ...r }));
  }

  // So khớp một mệnh đề WHERE đơn giản: col op value [AND col op value ...]
  private matchesWhere(row: SqlRow, whereClause: string): boolean {
    const conditions = whereClause.split(/\s+AND\s+/i);
    return conditions.every((cond) => this.evalCondition(row, cond));
  }

  private evalCondition(row: SqlRow, cond: string): boolean {
    const match = /^(\w+)\s*(=|>|<|>=|<=|!=)\s*'?([^' ]+)'?$/i.exec(
      cond.trim()
    );
    if (!match) return false;
    const [, col, op, rawValue] = match;
    const cell = row[col];
    if (cell === undefined) return false;

    // Ép kiểu so sánh dựa trên giá trị trong bảng
    const cellNum = typeof cell === "number" ? cell : Number(cell);
    const valueNum = Number(rawValue);
    if (!Number.isNaN(cellNum) && !Number.isNaN(valueNum)) {
      switch (op) {
        case "=": return cellNum === valueNum;
        case ">": return cellNum > valueNum;
        case "<": return cellNum < valueNum;
        case ">=": return cellNum >= valueNum;
        case "<=": return cellNum <= valueNum;
        case "!=": return cellNum !== valueNum;
      }
    }
    const cellStr = String(cell);
    return op === "=" ? cellStr === rawValue : cellStr !== rawValue;
  }

  // Hỗ trợ: SELECT [cols|*] FROM table [WHERE ...] [ORDER BY col ASC|DESC] [LIMIT n]
  execute(query: string): SqlRow[] {
    const regex =
      /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i;
    const m = regex.exec(query.trim());
    if (!m) throw new Error(`Chưa hỗ trợ câu lệnh: ${query}`);

    const [, selectPart, tableName, whereClause, orderCol, orderDir, limitStr] = m;
    const table = this.tables[tableName];
    if (!table) throw new Error(`Bảng '${tableName}' không tồn tại`);

    let rows = table.slice();
    if (whereClause) rows = rows.filter((r) => this.matchesWhere(r, whereClause));
    if (orderCol) {
      const dir = (orderDir ?? "ASC").toUpperCase() === "DESC" ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const av = a[orderCol];
        const bv = b[orderCol];
        return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
      });
    }
    const limit = limitStr ? Number(limitStr) : rows.length;

    // Project (chọn cột)
    return rows.slice(0, limit).map((row) => {
      if (selectPart.trim() === "*") return row;
      const cols = selectPart.split(",").map((c) => c.trim());
      const projected: SqlRow = {};
      for (const col of cols) projected[col] = row[col];
      return projected;
    });
  }
}

// ─────────────────────────── JOIN + GROUP BY ───────────────────────────────
interface SqlJoinResult {
  id: number;
  user_id: number;
  total: number;
  status: string;
  username: string;
}

function innerJoinUsersOrders(
  users: SqlRow[],
  orders: SqlRow[]
): SqlJoinResult[] {
  const results: SqlJoinResult[] = [];
  for (const u of users) {
    for (const o of orders) {
      if (u.id === o.user_id) {
        results.push({
          id: Number(o.id),
          user_id: Number(u.id),
          total: Number(o.total),
          status: String(o.status),
          username: String(u.username),
        });
      }
    }
  }
  return results;
}

interface SqlGroupCount {
  role: string;
  total_users: number;
}

function groupUsersByRole(users: SqlRow[]): SqlGroupCount[] {
  const counts = new Map<string, number>();
  for (const u of users) {
    const role = String(u.role);
    counts.set(role, (counts.get(role) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([role, total]) => ({ role, total_users: total }))
    .sort((a, b) => b.total_users - a.total_users);
}

// ─────────────────────────── Seed dữ liệu ──────────────────────────────────
const sqlUsers: SqlRow[] = [
  { id: 1, username: "alice", role: "admin", active: true },
  { id: 2, username: "bob", role: "user", active: true },
  { id: 3, username: "carol", role: "user", active: false },
  { id: 4, username: "dave", role: "moderator", active: true },
];

const sqlOrders: SqlRow[] = [
  { id: 101, user_id: 1, total: 250, status: "completed" },
  { id: 102, user_id: 2, total: 90, status: "completed" },
  { id: 103, user_id: 1, total: 40, status: "pending" },
  { id: 104, user_id: 4, total: 500, status: "completed" },
];

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== SQL Basics Demo ===");
console.log("");

const engine = new SqlMiniEngine();
engine.registerTable("users", sqlUsers);
engine.registerTable("orders", sqlOrders);

console.log("1️⃣ SELECT có WHERE:");
console.log(`   📝 ${"SELECT id, username FROM users WHERE role = 'user'"}`);
const usersRole = engine.execute("SELECT id, username FROM users WHERE role = 'user'");
console.log(`   → ${JSON.stringify(usersRole)}`);
console.log("");

console.log("2️⃣ WHERE + ORDER BY + LIMIT:");
console.log(`   📝 ${"SELECT * FROM orders ORDER BY total DESC LIMIT 2"}`);
const topOrders = engine.execute("SELECT * FROM orders ORDER BY total DESC LIMIT 2");
for (const o of topOrders) console.log(`   → total=${o.total} (user_id=${o.user_id})`);
console.log("");

console.log("3️⃣ So điều kiện số — đơn hàng > 100:");
console.log(`   📝 ${"SELECT id, total FROM orders WHERE total > 100"}`);
const bigOrders = engine.execute("SELECT id, total FROM orders WHERE total > 100");
console.log(`   → ${JSON.stringify(bigOrders)}`);
console.log("");

console.log("4️⃣ INNER JOIN users ↔ orders (mô phỏng):");
console.log(`   📝 SELECT u.username, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id`);
const joined = innerJoinUsersOrders(sqlUsers, sqlOrders);
for (const row of joined) console.log(`   → ${row.username}: ${row.total} VND (${row.status})`);
console.log("");

console.log("5️⃣ GROUP BY + COUNT (mô phỏng aggregation):");
console.log(`   📝 SELECT role, COUNT(*) FROM users GROUP BY role`);
const grouped = groupUsersByRole(sqlUsers);
for (const g of grouped) console.log(`   → role=${g.role}: ${g.total_users} user`);
console.log("");

console.log("6️⃣ Nối chuỗi input người dùng = SQL injection (xem 9.1):");
try {
  engine.execute("SELECT * FROM users WHERE username = 'a' OR '1'='1'");
  console.log("   ⚠️ Mini-engine vẫn xử lý (không an toàn với input thật)");
} catch {
  console.log("   ❌ Câu lệnh lạ bị từ chối");
}
console.log("");

console.log("✅ SQL query string được truyền qua mini-engine tự viết: SELECT/WHERE/ORDER/LIMIT, JOIN và GROUP BY — nắm cú pháp này để đọc được mọi SQL thật.");
export {};