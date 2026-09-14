/**
 * 10.2 MongoDB — Mô phỏng document, CRUD và aggregation pipeline
 *
 * Minh họa (toàn bộ chạy trên array bằng hàm tự viết):
 * - Collection lưu document (object thuần)
 * - CRUD: insertOne / findOne / find / updateOne ($set) / deleteOne
 * - Aggregation: $match → $group → $sort ($limit) — như pipeline thật
 *
 * ⚠️ Không phải MongoDB thật — mô hình nhưng đủ để hiểu ý tưởng.
 */

// ─────────────────────────────── Types ─────────────────────────────────────
type MongoValue = string | number | boolean | undefined;

interface MongoDocument {
  _id: string;
  [key: string]: MongoValue;
}

interface MongoUpdateDoc {
  $set?: Partial<Record<string, MongoValue>>;
}

// ─────────────────────── Collection mô phỏng ───────────────────────────────
class MongoCollection {
  private docs: MongoDocument[] = [];

  constructor(public name: string, seed: MongoDocument[] = []) {
    this.docs = seed.map((d) => ({ ...d }));
  }

  private nextId(): string {
    return Math.random().toString(36).slice(2, 12);
  }

  // So khớp filter đơn giản: bằng nhau theo từng field
  private matches(doc: MongoDocument, filter: Partial<Record<string, MongoValue>>): boolean {
    return Object.entries(filter).every(([key, value]) => doc[key] === value);
  }

  // ── CREATE ───────────────────────────────────────────
  insertOne(doc: Record<string, MongoValue>): string {
    const newDoc: MongoDocument = { _id: this.nextId(), ...doc };
    this.docs.push(newDoc);
    return newDoc._id;
  }

  // ── READ ─────────────────────────────────────────────
  findOne(filter: Partial<Record<string, MongoValue>>): MongoDocument | null {
    return this.docs.find((d) => this.matches(d, filter)) ?? null;
  }

  find(filter: Partial<Record<string, MongoValue>>): MongoDocument[] {
    return this.docs.filter((d) => this.matches(d, filter)).map((d) => ({ ...d }));
  }

  // ── UPDATE ($set) ────────────────────────────────────
  updateOne(
    filter: Partial<Record<string, MongoValue>>,
    update: MongoUpdateDoc
  ): { matched: number; modified: number } {
    const doc = this.docs.find((d) => this.matches(d, filter));
    if (!doc) return { matched: 0, modified: 0 };

    const setFields = update.$set ?? {};
    let modified = 0;
    for (const [key, value] of Object.entries(setFields)) {
      if (doc[key] !== value) {
        doc[key] = value;
        modified++;
      }
    }
    return { matched: 1, modified };
  }

  // ── DELETE ───────────────────────────────────────────
  deleteOne(filter: Partial<Record<string, MongoValue>>): number {
    const idx = this.docs.findIndex((d) => this.matches(d, filter));
    if (idx === -1) return 0;
    this.docs.splice(idx, 1);
    return 1;
  }

  // ── AGGREGATION PIPELINE (match → group → sort → limit) ──
  aggregate<TRecord extends object>(
    stages: {
      $match?: Partial<Record<string, MongoValue>>;
      $group?: { _id: string; [key: string]: unknown };
      $sort?: Record<string, -1 | 1>;
      $limit?: number;
    }[]
  ): TRecord[] {
    let current: Record<string, unknown>[] = this.docs.map((d) => ({ ...d }));

    for (const stage of stages) {
      if (stage.$match) {
        current = current.filter((doc) =>
          Object.entries(stage.$match ?? {}).every(([k, v]) => doc[k] === v)
        );
      } else if (stage.$group) {
        const groupDef = stage.$group;
        const idRef = String(groupDef._id);
        // "$userId" trong pipeline thật = tham chiếu field `userId`
        const idField = idRef.startsWith("$") ? idRef.slice(1) : idRef;
        const groups = new Map<string, Record<string, unknown>>();
        for (const doc of current) {
          const keyVal = doc[idField];
          const key = String(keyVal);
          const acc = groups.get(key) ?? { _id: keyVal };
          groups.set(key, acc);
          for (const [field, spec] of Object.entries(groupDef)) {
            if (field === "_id") continue;
            const instr = spec as { $sum?: unknown } | undefined;
            if (instr && typeof instr === "object" && "$sum" in instr) {
              const operand = instr.$sum;
              const currentVal = typeof operand === "string" && operand.startsWith("$")
                ? Number(doc[operand.slice(1)] ?? 0)
                : Number(operand);
              acc[field] = Number(acc[field] ?? 0) + currentVal;
            }
          }
        }
        current = [...groups.values()];
      } else if (stage.$sort) {
        const [col, dir] = Object.entries(stage.$sort)[0];
        const factor = (dir ?? 1) as number;
        current = [...current].sort((a, b) => {
          const av = a[col] as number;
          const bv = b[col] as number;
          return (av - bv) * factor;
        });
      } else if (stage.$limit) {
        current = current.slice(0, stage.$limit);
      }
    }

    return current as TRecord[];
  }

  count(): number {
    return this.docs.length;
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== MongoDB Demo ===");
console.log("");

const usersCol = new MongoCollection("users", [
  { _id: "u1", name: "Alice", role: "admin" },
  { _id: "u2", name: "Bob", role: "user" },
  { _id: "u3", name: "Carol", role: "user" },
]);

const ordersCol = new MongoCollection("orders", [
  { _id: "o1", userId: "u1", amount: 120, status: "completed" },
  { _id: "o2", userId: "u2", amount: 80, status: "completed" },
  { _id: "o3", userId: "u1", amount: 60, status: "pending" },
  { _id: "o4", userId: "u3", amount: 200, status: "completed" },
  { _id: "o5", userId: "u2", amount: 30, status: "pending" },
]);

console.log("1️⃣ CREATE — insertOne user mới:");
const newId = usersCol.insertOne({ name: "Dave", role: "user" });
console.log(`   ✅ Inserted _id = ${newId} (documents: ${usersCol.count()})`);
console.log("");

console.log("2️⃣ READ — findOne / find với filter:");
const alice = usersCol.findOne({ name: "Alice" });
console.log(`   findOne({ name: 'Alice' }) → ${JSON.stringify(alice)}`);
const userRole = usersCol.find({ role: "user" });
console.log(`   find({ role: 'user' }) → ${userRole.map((u) => u.name).join(", ")}`);
console.log("");

console.log("3️⃣ UPDATE — updateOne với $set:");
const upd = ordersCol.updateOne(
  { _id: "o3" },
  { $set: { status: "completed", amount: 70 } }
);
console.log(`   ✅ Đổi order o3 sang completed → matched=${upd.matched}, modified=${upd.modified}`);
console.log("");

console.log("4️⃣ DELETE — deleteOne:");
const removed = ordersCol.deleteOne({ _id: "o5" });
console.log(`   ✅ Đã xóa o5 → deleted=${removed} (còn ${ordersCol.count()} orders)`);
console.log("");

console.log("5️⃣ AGGREGATION — match completed → group theo userId → sort giảm dần:");
console.log("   db.orders.aggregate([ { $match: ... }, { $group: ... }, { $sort: ... } ])");
const result = ordersCol.aggregate<{ _id: string; total: number }>([
  { $match: { status: "completed" } },
  { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
]);
for (const r of result) {
  const userName = usersCol.findOne({ _id: String(r._id) })!.name;
  console.log(`   → ${userName} (${r._id}): tổng ${r.total} VND`);
}
console.log("");

console.log("✅ MongoDB: document linh hoạt, CRUD qua filter đơn giản, aggregation pipeline xử lý tuần tự: match → group → sort → limit. Nắm pipeline là nắm 80% sức mạnh MongoDB.");
export {};