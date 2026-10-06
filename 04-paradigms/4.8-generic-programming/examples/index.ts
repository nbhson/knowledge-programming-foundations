/**
 * 4.8 Generic Programming — generics TS, constraints, variance + ví dụ
 * repository/stack generic
 *
 * Minh họa:
 * - Stack<T>: 1 class dùng cho mọi kiểu, vẫn type-safe
 * - Constraints (extends Entity) + keyof: bắt lỗi sai key lúc biên dịch
 * - InMemoryRepository<T>: cùng 1 class làm kho User lẫn Product
 * - Variance: array covariant gây bug runtime; function param contravariant an toàn
 *
 * Không deps ngoài — TS thuần.
 */

// ─────────────────────────── 1. Stack<T> generic ───────────────────────────

class GpStack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }
}

interface GpOrder {
  id: string;
  total: number;
}

/** Lấy phần tử cuối, throw nếu rỗng — generic function. */
function lastOrThrow<T>(arr: readonly T[]): T {
  const last = arr[arr.length - 1];
  if (last === undefined) throw new Error("Mảng rỗng");
  return last;
}

/** Đọc field theo key thật của T — typo key là lỗi biên dịch. */
function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ─────────────────── 2. Repository<T> generic ───────────────────

interface GpEntity {
  id: string;
}

interface GpRepository<T extends GpEntity> {
  save(entity: T): T;
  findById(id: string): T | undefined;
  findAll(): T[];
  delete(id: string): void;
}

/** Một cài đặt InMemory dùng chung cho MỌI entity có id. */
class InMemoryGpRepository<T extends GpEntity> implements GpRepository<T> {
  private store = new Map<string, T>();

  save(entity: T): T {
    this.store.set(entity.id, entity);
    return entity;
  }

  findById(id: string): T | undefined {
    return this.store.get(id);
  }

  findAll(): T[] {
    return [...this.store.values()];
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}

interface GpUser extends GpEntity {
  name: string;
  email: string;
}

interface GpProduct extends GpEntity {
  title: string;
  price: number;
}

// ─────────────────── 3. Variance ───────────────────

class GpAnimal {
  constructor(public name = "") {}
}

class GpCat extends GpAnimal {
  meow(): string {
    return `${this.name || "mèo"} kêu meo!`;
  }
}

// ─────────────────────────── main ───────────────────────────

function main(): void {
  console.log("=== Generic Programming Demo ===");
  console.log("");

  console.log("1️⃣ Stack<T> — 1 class, mọi kiểu, type-safe:");
  const names = new GpStack<string>();
  names.push("ann");
  names.push("bob");
  console.log(`  pop() = ${names.pop()} (còn ${names.size} phần tử)`);
  const orders = new GpStack<GpOrder>();
  orders.push({ id: "o1", total: 250000 });
  console.log(`  peek() order = ${JSON.stringify(orders.peek())}`);
  console.log(`  lastOrThrow([10, 20, 30]) = ${lastOrThrow([10, 20, 30])}`);
  console.log(`  getField(user, "name") thay vì typo "nmae" (keyof bắt lúc biên dịch)`);
  console.log(`  getField({ name: "ann" }, "name") = ${getField({ name: "ann" }, "name")}`);
  console.log("");

  console.log("2️⃣ InMemoryRepository<T extends Entity> — 1 class làm kho User + Product:");
  const users = new InMemoryGpRepository<GpUser>();
  users.save({ id: "u1", name: "An", email: "an@example.com" });
  users.save({ id: "u2", name: "Bình", email: "binh@example.com" });
  const products = new InMemoryGpRepository<GpProduct>();
  products.save({ id: "p1", title: "Bàn phím", price: 850000 });
  console.log(`  users.findById("u1") = ${JSON.stringify(users.findById("u1"))}`);
  console.log(`  users.findAll().length = ${users.findAll().length}, products.findAll().length = ${products.findAll().length}`);
  users.delete("u2");
  console.log(`  sau delete("u2"): users còn ${users.findAll().length} user`);
  console.log("");

  console.log("3️⃣ Variance — array covariant (nguy hiểm) vs function param contravariant (an toàn):");
  const cats: GpCat[] = [new GpCat()];
  const animals: GpAnimal[] = cats; // TS cho qua (covariant) — nhưng...
  animals.push(new GpAnimal("chỉ là animal")); // 💥 mảng "cats" giờ lẫn Animal không biết meow
  const broken = cats[1];
  console.log(`  cats[1] instanceof GpCat = ${broken instanceof GpCat} (bug lén từ covariance!)`);
  const handleCat: (c: GpCat) => void = (a: GpAnimal) => {
    console.log(`  handler nhận Animal xử lý Cat an toàn: name="${a.name || "(rỗng)"}"`);
  };
  handleCat(new GpCat());
  console.log("");

  console.log("✅ Generics: viết 1 lần cho mọi kiểu + compiler gác cổng; nhớ variance khi lồng kiểu.");
}

main();
export {};
