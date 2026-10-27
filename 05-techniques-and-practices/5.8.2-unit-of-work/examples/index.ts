/**
 * 5.8.2 Unit of Work — Demo
 *
 * Gộp NHIỀU thao tác dữ liệu thành MỘT nhóm (unit):
 *   commit()  → áp dụng toàn bộ (hoặc hoàn tác toàn bộ nếu 1 bước lỗi)
 *   rollback() → hủy nhóm, không áp dụng gì
 * Tránh tình trạng "order được tạo nhưng kho không trừ" khi dữ liệu mất nhất quán.
 */

type UwProduct = { id: string; name: string; qty: number };

class UwDataStore {
  private rows = new Map<string, UwProduct>();

  seed(product: UwProduct): void {
    this.rows.set(product.id, product);
  }

  insert(product: UwProduct): void {
    if (this.rows.has(product.id)) throw new Error(`Trùng id '${product.id}'`);
    this.rows.set(product.id, product);
  }

  upsert(product: UwProduct): void {
    if (product.qty < 0) throw new Error(`Kho không cho phép số lượng âm: '${product.name}'`);
    this.rows.set(product.id, product);
  }

  remove(id: string): void {
    this.rows.delete(id);
  }

  find(id: string): UwProduct | undefined {
    return this.rows.get(id);
  }

  snapshot(): Map<string, UwProduct> {
    return new Map(this.rows);
  }

  restore(savepoint: Map<string, UwProduct>): void {
    this.rows = new Map(savepoint);
  }

  list(): UwProduct[] {
    return [...this.rows.values()];
  }
}

type UwOperation =
  | { kind: "insert"; product: UwProduct }
  | { kind: "upsert"; product: UwProduct }
  | { kind: "remove"; id: string };

class UwUnitOfWork {
  private pending: UwOperation[] = [];

  constructor(private readonly store: UwDataStore) {}

  registerNew(product: UwProduct): void {
    this.pending.push({ kind: "insert", product });
  }

  registerChanged(product: UwProduct): void {
    this.pending.push({ kind: "upsert", product });
  }

  registerDeleted(id: string): void {
    this.pending.push({ kind: "remove", id });
  }

  pendingCount(): number {
    return this.pending.length;
  }

  commit(): void {
    if (this.pending.length === 0) {
      console.log("     ⚡ Không có gì để commit");
      return;
    }
    const savepoint = this.store.snapshot();
    try {
      for (const op of this.pending) {
        if (op.kind === "insert") this.store.insert(op.product);
        else if (op.kind === "upsert") this.store.upsert(op.product);
        else this.store.remove(op.id);
      }
      this.pending = [];
    } catch (error) {
      this.store.restore(savepoint);
      this.pending = [];
      throw error;
    }
  }

  rollback(): void {
    this.pending = [];
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== Unit of Work Demo ===");
console.log("");

const uwStore = new UwDataStore();
uwStore.seed({ id: "p1", name: "Laptop", qty: 10 });
uwStore.seed({ id: "p2", name: "Chuột", qty: 5 });

console.log("1️⃣ COMMIT THÀNH CÔNG — một nhóm thao tác: tạo order + trừ kho + ghi log:");
const uw1 = new UwUnitOfWork(uwStore);
uw1.registerNew({ id: "ord-1", name: "Đơn hàng #1", qty: 1 });
uw1.registerChanged({ id: "p1", name: "Laptop", qty: 8 });
uw1.registerNew({ id: "log-1", name: "Log đặt hàng #1", qty: 0 });
console.log(`  Pending: ${uw1.pendingCount()} thao tác → commit()`);
uw1.commit();
console.log(
  `  Sau commit: ${uwStore.list().map((p) => `${p.id}(${p.qty})`).join(" · ")}`
);
console.log("  → Cả 3 thay đổi được áp dụng đồng bộ (order mới + kho Laptop 10→8 + log)");
console.log("");

console.log("2️⃣ COMMIT LỖI → ROLLBACK toàn bộ, không để dữ liệu nửa vời:");
const uw2 = new UwUnitOfWork(uwStore);
uw2.registerChanged({ id: "p2", name: "Chuột", qty: 3 });
uw2.registerChanged({ id: "p1", name: "Laptop", qty: -1 });
console.log("  Pending: trừ Chuột 5→3 (hợp lệ), trừ Laptop thành -1 (VI PHẠM, upsert sẽ ném lỗi)");
try {
  uw2.commit();
} catch (error) {
  console.log(`  💥 commit() ném lỗi: ${(error as Error).message}`);
}
console.log(
  `  Sau lỗi, store vẫn nguyên: ${uwStore.list().map((p) => `${p.id}(${p.qty})`).join(" · ")}`
);
console.log("  → Bước 1 thành công nhưng bước 2 lỗi → Unit of Work HOÀN TÁC cả nhóm về savepoint");
console.log("");

console.log("3️⃣ ROLLBACK CHỦ ĐỘNG — hủy nhóm chưa commit:");
const uw3 = new UwUnitOfWork(uwStore);
uw3.registerDeleted("p2");
console.log(`  pendingCount=${uw3.pendingCount()}, rollback() → `);
uw3.rollback();
console.log(`  pendingCount=${uw3.pendingCount()} — Chuột vẫn còn: ${uwStore.find("p2")?.name}`);

console.log("");
console.log("✅ Unit of Work: commit áp dụng cả nhóm / lỗi thì rollback hết — dữ liệu luôn nhất quán");
console.log("");

export {};