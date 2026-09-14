/**
 * 10.5 Database Indexes — Full-scan vs Index lookup (đếm bước)
 *
 * Minh họa:
 * - Tập dữ liệu 100.000 user trong mảng
 * - Tìm theo email bằng FULL SCAN (duyệt từng phần tử) → đếm bước
 * - Xây "index" dạng Map (giống Hash/B-tree index) → lookup O(1) → đếm bước
 * - Cho thấy chi phí phải trả khi INSERT/UPDATE (duy trì index)
 *
 * 🎯 Mục tiêu: hiểu tại sao index nhanh nhưng tốn chi phí write.
 */

// ─────────────────────────────── Types ─────────────────────────────────────
interface IndexUser {
  id: number;
  email: string;
  name: string;
}

// ─────────────────────── Bảng users trong "database" ───────────────────────
class IndexTable {
  private rows: IndexUser[] = [];

  // Bảng "không index" — chứa dữ liệu gốc theo thứ tự chèn
  private emailIndex: Map<string, number> | null = null;
  private steps = 0;

  constructor(private useIndex: boolean) {}

  seedUserCount(count: number, emailBase: string): void {
    for (let i = 1; i <= count; i++) {
      this.rows.push({ id: i, email: `${emailBase}${i}@example.com`, name: `User ${i}` });
    }
    if (this.useIndex) this.buildIndex();
  }

  // ✅ CREATE INDEX — xây Map<email, id_row> (giống index thật)
  private buildIndex(): void {
    const map = new Map<string, number>();
    for (const row of this.rows) map.set(row.email, row.id);
    this.emailIndex = map;
    console.log(`   🛠 Đã tạo index trên cột email (${map.size} entry)`);
  }

  getStepCount(): number {
    return this.steps;
  }

  // ❌ Full Table Scan — so khớp từng dòng
  findByEmailFullScan(email: string): IndexUser | null {
    this.steps = 0;
    for (const row of this.rows) {
      this.steps++; // mỗi lần so sánh = 1 bước
      if (row.email === email) return { ...row };
    }
    return null;
  }

  // ✅ Index Lookup — Map.get() là O(1)
  findByEmailIndex(email: string): IndexUser | null {
    this.steps = 0;
    if (!this.emailIndex) return null;
    this.steps++; // 1 lần hash/lookup vào index
    const rowId = this.emailIndex.get(email);
    if (rowId === undefined) return null;
    this.steps++; // 1 lần lấy dữ liệu theo row pointer
    const row = this.rows[rowId - 1];
    return row ? { ...row } : null;
  }

  // INSERT kèm chi phí duy trì index
  insert(user: IndexUser, maintainIndex: boolean): void {
    this.rows.push(user);
    if (maintainIndex && this.emailIndex) {
      // index phải được cập nhật đồng bộ → 1 bước ghi index
      this.steps = 1;
    }
  }
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Database Indexes Demo ===");
console.log("");

const COUNT = 100_000;
const targetEmail = "user50000@example.com";
console.log(`Dataset: ${COUNT.toLocaleString("en-US")} users`);

console.log("");
console.log("1️⃣ KHÔNG index — Full Table Scan:");
const tableNoIndex = new IndexTable(false);
tableNoIndex.seedUserCount(COUNT, "user");
const foundScan = tableNoIndex.findByEmailFullScan(targetEmail);
console.log(`   🔍 Tìm ${targetEmail}`);
console.log(`   -> Kết quả: ${foundScan ? foundScan.name : "không thấy"}`);
console.log(`   🔢 Số bước: ${tableNoIndex.getStepCount().toLocaleString("en-US")}`);
console.log("");

console.log("2️⃣ CÓ index — Index Lookup (giả lập Hash/B-tree):");
const tableWithIndex = new IndexTable(true);
tableWithIndex.seedUserCount(COUNT, "user");
const foundIndex = tableWithIndex.findByEmailIndex(targetEmail);
console.log(`   🔍 Tìm ${targetEmail}`);
console.log(`   -> Kết quả: ${foundIndex ? foundIndex.name : "không thấy"}`);
console.log(`   🔢 Số bước: ${tableWithIndex.getStepCount()}`);
console.log("");

const ratio = tableNoIndex.getStepCount() / tableWithIndex.getStepCount();
console.log(`   📊 Index nhanh gấp ~${ratio.toLocaleString("en-US")}x lần so với full scan`);
console.log("");

console.log("3️⃣ Trường hợp index bỏ phí (WHERE trên cột KHÔNG có index):");
const scanByName = tableWithIndex.findByEmailFullScan("User 99999@example.com");
console.log(`   🔍 Tìm theo name khi chỉ có index email → ${scanByName ? "tìm thấy" : "không thấy"}`);
console.log(`   🔢 Số bước: ${tableWithIndex.getStepCount().toLocaleString("en-US")} (vẫn full scan!)`);
console.log("");

console.log("4️⃣ Chi phí write khi có index:");
// Không có index → insert xong ngay, không phải duy trì gì thêm (ngoài append)
tableNoIndex.insert({ id: COUNT + 1, email: "newuser@example.com", name: "New User" }, false);
console.log("   ✅ INSERT trên bảng KHÔNG index: chỉ ghi file data (1 bước)");
// Có index → phải cập nhật Map kèm theo
tableWithIndex.insert({ id: COUNT + 1, email: "newuser@example.com", name: "New User" }, true);
console.log("   ⚠️ INSERT trên bảng CÓ index  : ghi data + cập nhật index (thêm 1 bước)");
console.log("");

console.log("5️⃣ Prime 2 index chiến lược:");
console.log("   → WHERE email = ?  → index email (hash/btree)");
console.log("   → JOIN trên user_id → index user_id (foreign key)");
console.log("   → ORDER BY created_at → index created_at");
console.log("");

console.log("✅ Index = cấu trúc phụ (Map/B-Tree) đánh dấu vị trí: lookup nhanh hơn hàng chục nghìn lần nhưng phải trả phí ghi (UPDATE/INSERT/DELETE chậm hơn) và tốn bộ nhớ. Index đúng cột = query nhanh; index thừa = write chậm.");
export {};