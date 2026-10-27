/**
 * 6.5 Dynamic Programming — Quy Hoạch Động
 * Demo: đếm số lần gọi fib naive vs memo vs tab,
 * giải 0/1 knapsack và tính LCS của 2 chuỗi.
 */

export {};

const fibCalls = { naive: 0, memo: 0 };

function fibNaive(n: number): number {
  fibCalls.naive++;
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

function fibMemo(n: number, memo: Map<number, number> = new Map()): number {
  fibCalls.memo++;
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!;
  const value = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, value);
  return value;
}

function fibTab(n: number): number {
  if (n <= 1) return n;
  let prev = 0;
  let curr = 1;
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}

function knapsack(weights: number[], values: number[], capacity: number): number {
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(capacity + 1).fill(0)
  );
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][capacity];
}

function lcs(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function main(): void {
  console.log("=== 6.5 Dynamic Programming Demo ===");
  console.log("");

  // 1. Fibonacci: naive vs memo vs tab
  const n = 20;
  fibCalls.naive = 0;
  fibCalls.memo = 0;
  const rNaive = fibNaive(n);
  const rMemo = fibMemo(n);
  const rTab = fibTab(n);
  console.log(`📌 fib(${n}) — cùng kết quả, khác số lần gọi:`);
  console.log(`   naive = ${rNaive}, calls = ${fibCalls.naive} (O(2ⁿ), tăng hàm mũ)`);
  console.log(`   memo  = ${rMemo}, calls = ${fibCalls.memo} (O(n), mỗi state 1 lần)`);
  console.log(`   tab   = ${rTab}, vòng lặp O(n), space O(1), không recursion`);
  console.log("");

  // Memo scale được tới n lớn, naive thì không
  const big = 40;
  fibCalls.memo = 0;
  const rBig = fibMemo(big);
  console.log(`📈 fib(${big}) bằng memo = ${rBig} với ${fibCalls.memo} calls (naive cần ~10⁸ calls — đừng thử!)`);
  console.log(`   fibTab(${big}) = ${fibTab(big)} (không tốn stack)`);
  console.log("");

  // 2. 0/1 Knapsack
  const weights = [2, 3, 4, 5];
  const values = [3, 4, 5, 6];
  const capacity = 8;
  console.log("🎒 0/1 Knapsack:");
  console.log(`   weights=[${weights}], values=[${values}], capacity=${capacity}`);
  console.log(`   max value = ${knapsack(weights, values, capacity)} (tối ưu: items 3kg+5kg → value 4+6=10)`);
  console.log(`   kiểm tra tay: {3kg:4, 5kg:6} = 10 là tối ưu với capacity 8`);
  console.log("");

  // 3. LCS
  const a = "ABCBDAB";
  const b = "BDCABA";
  console.log("🧬 LCS — Longest Common Subsequence:");
  console.log(`   a="${a}", b="${b}"`);
  console.log(`   LCS length = ${lcs(a, b)} (vd: "BCBA", ứng dụng diff/DNA)`);
  console.log(`   lcs("kitten","sitting") = ${lcs("kitten", "sitting")} (gợi ý edit distance)`);
  console.log("");

  console.log("✅ Kết luận: memo prototype nhanh, tab chạy production; overlapping subproblems là dấu hiệu dùng DP.");
}

main();
