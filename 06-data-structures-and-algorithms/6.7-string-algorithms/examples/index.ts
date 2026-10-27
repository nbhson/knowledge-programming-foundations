/**
 * 6.7 String Algorithms — Thuật Toán Chuỗi
 * Demo: đếm comparisons naive search vs KMP-ý-tưởng,
 * rolling hash Rabin-Karp, sliding-window longest unique
 * substring, two-pointer palindrome.
 */

export {};

interface Counter {
  comparisons: number;
}

function naiveSearchCount(text: string, pattern: string, c: Counter): number {
  for (let i = 0; i <= text.length - pattern.length; i++) {
    let j = 0;
    while (j < pattern.length) {
      c.comparisons++;
      if (text[i + j] !== pattern[j]) break;
      j++;
    }
    if (j === pattern.length) return i;
  }
  return -1;
}

// KMP đơn giản: dùng bảng LPS để không lùi con trỏ text.
function buildLps(pattern: string): number[] {
  const lps = new Array<number>(pattern.length).fill(0);
  let len = 0;
  for (let i = 1; i < pattern.length; i++) {
    while (len > 0 && pattern[i] !== pattern[len]) len = lps[len - 1];
    if (pattern[i] === pattern[len]) len++;
    lps[i] = len;
  }
  return lps;
}

function kmpSearchCount(text: string, pattern: string, c: Counter): number {
  const lps = buildLps(pattern);
  let j = 0; // index trong pattern
  for (let i = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== pattern[j]) {
      c.comparisons++;
      j = lps[j - 1];
    }
    c.comparisons++;
    if (text[i] === pattern[j]) j++;
    if (j === pattern.length) return i - j + 1;
  }
  return -1;
}

function rabinKarp(text: string, pattern: string, c: Counter): number {
  const base = 256;
  const mod = 101;
  const m = pattern.length;
  const n = text.length;
  if (m > n) return -1;
  let pHash = 0;
  let tHash = 0;
  let h = 1;
  for (let i = 0; i < m - 1; i++) h = (h * base) % mod;
  for (let i = 0; i < m; i++) {
    pHash = (base * pHash + pattern.charCodeAt(i)) % mod;
    tHash = (base * tHash + text.charCodeAt(i)) % mod;
  }
  for (let i = 0; i <= n - m; i++) {
    c.comparisons++; // mỗi cửa sổ = 1 lần so hash
    if (pHash === tHash && text.slice(i, i + m) === pattern) return i;
    if (i < n - m) {
      tHash = (base * (tHash - (text.charCodeAt(i) * h) % mod) + text.charCodeAt(i + m)) % mod;
      if (tHash < 0) tHash += mod;
    }
  }
  return -1;
}

function longestUniqueSubstring(s: string): number {
  const last = new Map<string, number>();
  let best = 0;
  let start = 0;
  for (let end = 0; end < s.length; end++) {
    if (last.has(s[end]) && last.get(s[end])! >= start) {
      start = last.get(s[end])! + 1;
    }
    last.set(s[end], end);
    best = Math.max(best, end - start + 1);
  }
  return best;
}

function isPalindrome(s: string): boolean {
  let l = 0;
  let r = s.length - 1;
  while (l < r) {
    while (l < r && !/[a-z0-9]/i.test(s[l])) l++;
    while (l < r && !/[a-z0-9]/i.test(s[r])) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++;
    r--;
  }
  return true;
}

function main(): void {
  console.log("=== 6.7 String Algorithms Demo ===");
  console.log("");

  // Worst case cho naive: text toàn 'A', pattern 'AAAB'
  const text = "A".repeat(500) + "B";
  const pattern = "A".repeat(20) + "B";
  const cNaive: Counter = { comparisons: 0 };
  const cKmp: Counter = { comparisons: 0 };
  const cRk: Counter = { comparisons: 0 };
  const iNaive = naiveSearchCount(text, pattern, cNaive);
  const iKmp = kmpSearchCount(text, pattern, cKmp);
  const iRk = rabinKarp(text, pattern, cRk);
  console.log(`📌 Tìm pattern dài ${pattern.length} trong text dài ${text.length} (worst case naive):`);
  console.log(`   naive      → index ${iNaive}, ${cNaive.comparisons} comparisons (O(n·m))`);
  console.log(`   KMP        → index ${iKmp}, ${cKmp.comparisons} comparisons (O(n+m), không lùi text)`);
  console.log(`   Rabin-Karp → index ${iRk}, ${cRk.comparisons} hash checks (rolling hash O(1)/cửa sổ)`);
  console.log("");

  console.log("🪟 Sliding-window — longest substring không lặp ký tự (O(n)):");
  const samples = ["abcabcbb", "bbbbb", "pwwkew", "abcdef"];
  for (const s of samples) {
    console.log(`   "${s}" → ${longestUniqueSubstring(s)}`);
  }
  console.log("");

  console.log("↔️  Two-pointer — palindrome O(n), O(1) space:");
  const pals = ["A man, a plan, a canal: Panama", "racecar", "hello"];
  for (const s of pals) {
    console.log(`   "${s}" → ${isPalindrome(s)}`);
  }
  console.log("");

  console.log("✅ Kết luận: text ngắn dùng includes; text dài/nhiều pattern dùng KMP/Rabin-Karp; chuỗi con tối ưu dùng sliding-window; đối xứng dùng two-pointer.");
}

main();
