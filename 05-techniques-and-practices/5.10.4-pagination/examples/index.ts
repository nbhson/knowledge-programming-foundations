/**
 * 5.10.4 Pagination — Offset vs Cursor Demo
 *
 * So sánh 2 kiểu phân trang:
 *   - Offset : page/limit, tính offset = (page-1)*limit, skip càng sâu càng tốn công
 *   - Cursor : encode vị trí (base64), mỗi trang chỉ đi tiếp từ cursor — ổn định với
 *              dữ liệu thay đổi (thêm/xóa item không làm lệch trang)
 *
 * KHÔNG dùng lib ngoài — mô phỏng bằng TS thuần.
 */

// ─────────────────────────── Dữ liệu mẫu ───────────────────────────

interface PaginatedItem {
  id: number;
  amount: number;
  label: string;
}

function makeItems(count: number): PaginatedItem[] {
  const items: PaginatedItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: i + 1, amount: (i + 1) * 1000, label: `order-${i + 1}` });
  }
  return items;
}

// ─────────────────────────── Offset Pagination ───────────────────────────

interface OffsetPage {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  offset: number;
  data: PaginatedItem[];
}

class OffsetPagination {
  constructor(private readonly all: readonly PaginatedItem[]) {}

  // steps = số item phải bỏ qua (skip) — đo "công sức" của offset
  fetch(page: number, limit: number): OffsetPage {
    const total = this.all.length;
    const offset = (page - 1) * limit;
    const data = this.all.slice(offset, offset + limit);
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      offset,
      data: [...data],
    };
  }

  static stepsToReach(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}

// ─────────────────────────── Cursor Pagination ───────────────────────────

const CURSOR_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encodeCursor(id: number): string {
  // base64 đơn giản (không dùng Buffer): chuyển số → chuỗi qua bảng alphabet
  let n = id;
  let out = "";
  while (n > 0) {
    out = CURSOR_ALPHABET[n % CURSOR_ALPHABET.length] + out;
    n = Math.floor(n / CURSOR_ALPHABET.length);
  }
  return out === "" ? CURSOR_ALPHABET[0] : out;
}

function decodeCursor(cursor: string): number {
  let out = 0;
  for (const ch of cursor) {
    out = out * CURSOR_ALPHABET.length + CURSOR_ALPHABET.indexOf(ch);
  }
  return out;
}

interface CursorPage {
  data: PaginatedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

class CursorPagination {
  constructor(private readonly all: readonly PaginatedItem[]) {}

  fetch(afterId: number | null, limit: number): CursorPage {
    // Lấy đúng limit item NGAY SAU afterId — không cần skip quá nhiều
    const start = afterId === null ? 0 : this.all.findIndex((i) => i.id === afterId) + 1;
    const data = this.all.slice(start, start + limit);
    const hasMore = start + limit < this.all.length;
    const last = data[data.length - 1];
    return {
      data: [...data],
      nextCursor: hasMore ? encodeCursor(last.id) : null,
      hasMore,
    };
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────

function run(): void {
  console.log("=== Pagination Demo ===");
  console.log("");

  const all = makeItems(1000);
  console.log(`📦 Dataset: ${all.length} items (id 1..1000)`);
  console.log("");

  console.log("1️⃣ OFFSET pagination — page/limit:");
  const offset = new OffsetPagination(all);
  const p3 = offset.fetch(3, 10);
  console.log(`  GET /api/items?page=3&limit=10`);
  console.log(`  → offset=${p3.offset}, data=[${p3.data[0].id}..${p3.data[p3.data.length - 1].id}], total=${p3.total}, totalPages=${p3.totalPages}`);
  console.log("");

  console.log("2️⃣ OFFSET càng sâu càng tốn công (skip nhiều item):");
  for (const page of [1, 10, 100, 1000]) {
    const steps = OffsetPagination.stepsToReach(page, 10);
    console.log(`  page=${page}, limit=10 → phải skip ${steps} items`);
  }
  console.log("");

  console.log("3️⃣ CURSOR pagination — chỉ làm việc từ cursor trở đi:");
  const cursor = new CursorPagination(all);
  const c1 = cursor.fetch(null, 10);
  console.log(`  GET /api/items?limit=10 → data=[${c1.data[0].id}..${c1.data[c1.data.length - 1].id}], cursor='${c1.nextCursor}'`);
  const firstCursor = c1.nextCursor as string;
  const decoded = decodeCursor(firstCursor);
  console.log(`  decode cursor '${firstCursor}' → id=${decoded} (bước theo dõi nhỏ, không skip)`);
  console.log("");

  const c2 = cursor.fetch(decoded, 10);
  console.log(`  GET /api/items?cursor=${c2.nextCursor} → data=[${c2.data[0].id}..${c2.data[c2.data.length - 1].id}], hasMore=${c2.hasMore}`);
  const mid = cursor.fetch(500, 10);
  console.log(`  cursor giữa dòng (sau id 500) → data=[${mid.data[0].id}..${mid.data[mid.data.length - 1].id}]`);
  console.log("");

  console.log("4️⃣ CURSOR ổn định khi dữ liệu thay đổi:");
  const mutated = makeItems(1005); // thêm 5 item
  const stableCursor = new CursorPagination(mutated);
  const afterChange = stableCursor.fetch(decoded, 10);
  console.log(`  Dataset thêm 5 item → vẫn lấy đúng 10 item sau cursor=[${afterChange.data[0].id}..${afterChange.data[afterChange.data.length - 1].id}]`);
  console.log("");

  console.log("✅ Pagination: offset đơn giản nhưng sâu-thì-chậm; cursor ổn định với feed động");
}

run();
export {};