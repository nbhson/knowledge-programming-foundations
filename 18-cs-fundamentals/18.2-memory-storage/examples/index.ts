/**
 * 18.2 Memory & Storage — demo stack/heap khái niệm, cache locality (row vs column),
 * dịch địa chỉ ảo (paging) + mô phỏng rò rỉ bộ nhớ. Thuần TypeScript.
 */

export {};

/** Stack minh họa: frame tự hủy khi return — a/b biến mất sau gọi hàm */
function stackFrame(a: number, b: number): number {
  const sum = a + b;
  return sum;
}

/** Row-major (đúng locality): ô kế tiếp đã nằm trong cache line */
function sumRowMajor(matrix: number[][], n: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) sum += matrix[i][j];
  }
  return sum;
}

/** Column-major (sai locality): nhảy xa mỗi lần đọc → cache miss nhiều */
function sumColMajor(matrix: number[][], n: number): number {
  let sum = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) sum += matrix[i][j];
  }
  return sum;
}

/** Dịch địa chỉ ảo → vật lý qua bảng trang; null = page fault */
function translateAddress(
  virtualAddr: number,
  pageSize: number,
  pageTable: Map<number, number>,
): { physical: number } | null {
  const page = Math.floor(virtualAddr / pageSize);
  const offset = virtualAddr % pageSize;
  const frame = pageTable.get(page);
  if (frame === undefined) return null;
  return { physical: frame * pageSize + offset };
}

/** Mô phỏng leak: cache không giới hạn phình mãi — bản fix dùng Map + giới hạn */
class LeakyCache {
  private store = new Map<string, number[]>();
  set(k: string, v: number[]): void {
    this.store.set(k, v);
  }
  size(): number {
    return this.store.size;
  }
}

class BoundedCache {
  private store = new Map<string, number[]>();
  constructor(private readonly limit: number) {}
  set(k: string, v: number[]): void {
    if (this.store.size >= this.limit) {
      const oldest = this.store.keys().next().value as string;
      this.store.delete(oldest); // evict FIFO đơn giản
    }
    this.store.set(k, v);
  }
  size(): number {
    return this.store.size;
  }
}

function main(): void {
  console.log("=== 18.2 Memory & Storage Demo ===");
  console.log("");

  console.log(`1. Stack frame: stackFrame(3, 4) = ${stackFrame(3, 4)} (a/b bị hủy khi return)`);
  console.log("");

  const N = 400;
  const matrix: number[][] = [];
  for (let i = 0; i < N; i++) {
    matrix.push(new Array(N).fill(1));
  }
  const t1 = Date.now();
  const sRow = sumRowMajor(matrix, N);
  const rowMs = Date.now() - t1;
  const t2 = Date.now();
  const sCol = sumColMajor(matrix, N);
  const colMs = Date.now() - t2;
  console.log(`2. Cache locality (${N}x${N}, tổng=${sRow}/${sCol}):`);
  console.log(`   row-major: ${rowMs}ms | col-major: ${colMs}ms (đúng locality thường nhanh hơn)`);
  console.log("");

  console.log("3. Virtual memory paging (pageSize=4096):");
  const pageTable = new Map<number, number>([
    [0, 7],
    [1, 3],
  ]);
  const hit = translateAddress(5000, 4096, pageTable);
  const miss = translateAddress(9000, 4096, pageTable);
  console.log(`   VA=5000 → page=1, frame=3 → PA=${hit === null ? "PAGE FAULT" : hit.physical}`);
  console.log(`   VA=9000 → page=2 (chưa nạp) → ${miss === null ? "PAGE FAULT" : miss.physical}`);
  console.log("");

  console.log("4. Leak vs bounded cache (1000 inserts):");
  const leaky = new LeakyCache();
  const bounded = new BoundedCache(100);
  for (let i = 0; i < 1000; i++) {
    leaky.set(`k${i}`, [i]);
    bounded.set(`k${i}`, [i]);
  }
  console.log(`   leaky size=${leaky.size()} (phình mãi) | bounded size=${bounded.size()} (giới hạn)`);
  console.log("");
  console.log("✅ Stack/heap, locality, paging, leak-demo hoạt động");
}

main();
