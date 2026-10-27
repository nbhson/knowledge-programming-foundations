/**
 * 5.12.1 Immutability — Mutable vs Immutable Demo
 *
 * So sánh cách cập nhật dữ liệu:
 *   - Mutable  : sửa trực tiếp object/array gốc → khó debug, lỗi tiềm ẩn
 *   - Immutable: tạo bản sao mới (spread, map/filter), giữ nguyên bản gốc
 *   - Object.freeze: khóa object khỏi mutation (shallow)
 *   - readonly tuple/`as const`: bất biến cấp type
 *
 * KHÔNG dùng lib ngoài — TS thuần + Node built-in.
 */

// ─────────────────────────── Mutable: sửa gốc ───────────────────────────

interface CartItem {
  name: string;
  qty: number;
}

class MutableCart {
  items: CartItem[] = [];

  add(item: CartItem): void {
    this.items.push(item); // mutation trực tiếp
  }

  changeQty(name: string, qty: number): void {
    const found = this.items.find((i) => i.name === name);
    if (found) found.qty = qty; // sửa object con gốc
  }
}

// ─────────────────────────── Immutable: trả bản mới ───────────────────────────

class ImmutableCart {
  constructor(readonly items: readonly CartItem[]) {}

  add(item: CartItem): ImmutableCart {
    return new ImmutableCart([...this.items, item]);
  }

  changeQty(name: string, qty: number): ImmutableCart {
    return new ImmutableCart(this.items.map((i) => (i.name === name ? { ...i, qty } : i)));
  }
}

// ─────────────────────────── Object.freeze ───────────────────────────

interface FrozenConfig {
  readonly apiUrl: string;
  readonly timeoutMs: number;
}

function makeConfig(apiUrl: string, timeoutMs: number): FrozenConfig {
  return Object.freeze({ apiUrl, timeoutMs });
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== Immutability Demo ===");
  console.log("");

  console.log("1️⃣ MUTABLE — sửa object gốc, lịch sử bị mất:");
  const mutable = new MutableCart();
  mutable.add({ name: "áo", qty: 1 });
  mutable.add({ name: "giày", qty: 1 });
  mutable.changeQty("áo", 3);
  console.log(`  Sau changeQty: ${JSON.stringify(mutable.items)} (giá trị cũ biến mất, không biết đã thay đổi qua từng bước)`);
  console.log("");

  console.log("2️⃣ IMMUTABLE — mỗi bước là 1 bản mới, bản cũ còn nguyên:");
  const cart0 = new ImmutableCart([]);
  const cart1 = cart0.add({ name: "áo", qty: 1 });
  const cart2 = cart1.add({ name: "giày", qty: 1 });
  const cart3 = cart2.changeQty("áo", 3);
  console.log(`  cart0: ${JSON.stringify(cart0.items)}`);
  console.log(`  cart1: ${JSON.stringify(cart1.items)}`);
  console.log(`  cart2: ${JSON.stringify(cart2.items)}`);
  console.log(`  cart3: ${JSON.stringify(cart3.items)}  ← chỉ cart3 thay đổi`);
  console.log(`  cart2 vẫn còn 'áo qty=1': ${JSON.stringify(cart2.items)}`);
  console.log("");

  console.log("3️⃣ Array immutability — map/filter trả array mới:");
  const nums = [1, 2, 3, 4, 5];
  const doubled = nums.map((n) => n * 2);
  const evens = nums.filter((n) => n % 2 === 0);
  console.log(`  gốc nums=[1,2,3,4,5] (không đổi), doubled=${JSON.stringify(doubled)}, evens=${JSON.stringify(evens)}`);
  console.log("");

  console.log("4️⃣ Object.freeze — khóa cấu hình:");
  const config = makeConfig("https://api.example.com", 3000);
  console.log(`  config.frozen = ${Object.isFrozen(config)}, apiUrl=${config.apiUrl}`);
  console.log(`  Object.isFrozen(config) → ${Object.isFrozen(config)}`);
  console.log(`  (gán lại config.apiUrl trong strict mode sẽ throw TypeError)`);
  console.log("");

  console.log("5️⃣ readonly/`as const` — bất biến cấp kiểu:");
  const roles = ["admin", "member"] as const;
  console.log(`  roles as const → ${roles.join(", ")} (không thể roles.push)`);
  console.log("");

  console.log("✅ Immutability: không sửa data gốc, tạo bản mới → dễ trace, dễ test, ít bug ẩn");
}

run();
export {};