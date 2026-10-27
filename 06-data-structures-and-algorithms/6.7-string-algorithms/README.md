# 🔤 6.7 String Algorithms (Thuật Toán Chuỗi)

> **Mọi app đều xử lý text** — search box, autocomplete, DNA, log parsing. Thuật toán chuỗi quyết định gõ 1 ký tự là nhanh hay treo cả trang.

---

## 🎯 Vấn đề

Xử lý chuỗi trông đơn giản (`includes`, `indexOf`) nhưng scale rất tệ nếu dùng naive:

- Tìm pattern dài m trong text dài n bằng 2 vòng lặp lồng → **O(n·m)**. Với log file 10MB và pattern 100 ký tự → ~1 tỷ so sánh.
- Đếm từ, tìm chuỗi con dài nhất không lặp, kiểm tra anagram bằng sort mỗi lần → O(n log n) cho việc O(n) làm được.
- So sánh chuỗi sinh học (DNA hàng triệu base) bằng naive diff → không bao giờ xong.

Bài này hệ thống 4 vũ khí: **naive vs KMP**, **Rabin-Karp**, **sliding-window**, **two-pointer** — kèm bài toán ví dụ cho từng pattern.

---

## 💻 Code ví dụ

### Naive vs KMP (khái niệm + code naive, ý tưởng KMP)

```typescript
// Naive search: O(n·m) — thử mọi vị trí, lùi lại khi mismatch
function naiveSearch(text: string, pattern: string): number {
  for (let i = 0; i <= text.length - pattern.length; i++) {
    let j = 0;
    while (j < pattern.length && text[i + j] === pattern[j]) j++;
    if (j === pattern.length) return i;
  }
  return -1;
}
```

**KMP (Knuth-Morris-Pratt) — O(n+m):** tiền xử lý pattern thành bảng **LPS** (longest prefix = suffix) để khi mismatch **không lùi con trỏ text**, chỉ trượt pattern. Ví dụ pattern `ABABC`: mismatch ở ký tự 5 thì LPS cho biết prefix `AB` đã khớp → nhảy tiếp thay vì quay về từ đầu. Dùng khi **tìm 1 pattern trong text siêu dài** (log, genome). Không cần nhớ code LPS thuộc lòng — nhớ **ý tưởng "không bao giờ lùi text"** và độ phức tạp.

### Rabin-Karp — rolling hash, tìm nhiều pattern cùng lúc

```typescript
// Ý tưởng: hash từng cửa sổ độ dài m, lăn hash O(1) mỗi bước → O(n+m) trung bình
// text "ABABD", pattern "ABD": hash cửa sổ [ABA]→[BAB]→[ABD] khớp → verify trực tiếp chống collision.
function rabinKarpCount(text: string, pattern: string): { index: number; hashes: number } {
  const base = 256, mod = 101;
  const m = pattern.length, n = text.length;
  let pHash = 0, tHash = 0, h = 1, hashes = 0;
  for (let i = 0; i < m - 1; i++) h = (h * base) % mod;
  for (let i = 0; i < m; i++) { pHash = (base * pHash + pattern.charCodeAt(i)) % mod; tHash = (base * tHash + text.charCodeAt(i)) % mod; }
  for (let i = 0; i <= n - m; i++) {
    hashes++;
    if (pHash === tHash && text.slice(i, i + m) === pattern) return { index: i, hashes };
    if (i < n - m) tHash = (base * (tHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % mod;
  }
  return { index: -1, hashes };
}
// Mạnh nhất khi tìm NHIỀU pattern (plagiarism, antivirus signatures). Worst O(n·m) nếu hash collision liên tục.
```

### Sliding-Window — cửa sổ trượt O(n)

```typescript
// Bài toán ví dụ: độ dài chuỗi con dài nhất KHÔNG lặp ký tự
function longestUniqueSubstring(s: string): number {
  const last = new Map<string, number>();
  let best = 0, start = 0;
  for (let end = 0; end < s.length; end++) {
    if (last.has(s[end]) && last.get(s[end])! >= start) start = last.get(s[end])! + 1;
    last.set(s[end], end);
    best = Math.max(best, end - start + 1);
  }
  return best;
}
// longestUniqueSubstring("abcabcbb") = 3 ("abc"). Window [start..end] luôn giữ invariant "không lặp".
```

### Two-Pointer — 2 con trỏ O(n), O(1) space

```typescript
// Bài toán ví dụ: palindrome (bỏ qua ký tự đặc biệt, không phân biệt hoa thường)
function isPalindrome(s: string): boolean {
  let l = 0, r = s.length - 1;
  while (l < r) {
    while (l < r && !/[a-z0-9]/i.test(s[l])) l++;
    while (l < r && !/[a-z0-9]/i.test(s[r])) r--;
    if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
    l++; r--;
  }
  return true;
}
// Bài toán ví dụ 2: two-sum trên mảng đã sort (xem 6.4) cũng là two-pointer.
```

### 📊 Bảng Complexity

| Thuật toán | Time | Space | Dùng khi |
|------------|------|-------|----------|
| Naive search | O(n·m) | O(1) | Text ngắn, code 5 dòng là đủ |
| KMP | O(n+m) | O(m) bảng LPS | 1 pattern, text rất dài |
| Rabin-Karp | O(n+m) avg, O(n·m) worst | O(1) | Nhiều pattern / multi-search |
| Sliding-window | O(n) | O(k) ký tự trong window | Chuỗi con tối ưu (longest/distinct/min-window) |
| Two-pointer | O(n) | O(1) | Palindrome, two-sum sorted, merge |
| Sort để check anagram | O(n log n) | O(n) | Ít dùng — nên đếm tần suất O(n) bằng Map |

---

## ✅ Lợi Ích

- **Nhanh hơn hàng nghìn lần trên text lớn:** KMP/Rabin-Karp biến O(n·m) thành O(n+m) — log 10MB search trong ms thay vì giây.
- **Nhận diện pattern phỏng vấn:** "chuỗi con tối ưu" → sliding-window; "đối xứng / cặp đầu-cuối" → two-pointer; "tìm pattern" → KMP/Rabin-Karp.
- **Nền tảng tính năng thật:** search box (Rabin-Karp/Trie), diff (LCS ở 6.5), autocomplete + spell check (edit distance + Trie).

---

## ⚠️ Lưu Ý

- **Đừng optimize sớm:** `String.includes` / `indexOf` (engine đã tối ưu bằng BMH/Tuned naive) đủ nhanh cho 99% UI. Chỉ cần KMP/Rabin-Karp khi text MB+ hoặc nhiều pattern.
- **Rabin-Karp có false positive:** hash trùng ≠ chuỗi trùng — bắt buộc verify `slice` trực tiếp khi hash khớp, và chọn mod đủ lớn.
- **Sliding-window chỉ đúng khi tính chất đơn điệu:** mở rộng window không phá invariant (vd: "không lặp" giữ được khi trượt start). Bài cần co giãn 2 chiều tùy ý → DP (6.5).
- **Unicode:** `s.length` đếm UTF-16 code units, emoji 👨‍👩‍👧 bị cắt đôi. Xử lý emoji → iterate bằng `[...s]` hoặc `Intl.Segmenter`.

---

## 🎯 Khi nào dùng

| Vấn đề | Thuật toán gợi ý | Ví dụ |
|--------|------------------|-------|
| Tìm 1 pattern trong text ngắn/vừa | Naive / `includes` | Validate form, filter list |
| Tìm 1 pattern trong text khổng lồ | KMP | Scan log, genome |
| Tìm nhiều pattern cùng lúc | Rabin-Karp (+ set hash) | Plagiarism, antivirus, multi-keyword filter |
| Chuỗi con dài nhất không lặp / min-window / max-sum k phần tử | Sliding-window | `abcabcbb` → 3; max sum subarray size k |
| Palindrome / two-sum sorted / gom màu (sort colors) | Two-pointer | O(n), O(1) space |
| Anagram / hoán vị của chuỗi trong text | Sliding-window + đếm tần suất | `s1` là hoán vị của substring `s2`? |
| So sánh 2 chuỗi (diff, DNA alignment) | LCS / Edit Distance (DP, xem 6.5) | `git diff`, DNA |

---

## 🔗 Liên quan

- **6.4 Sorting & Searching** — binary search, two-sum sorted (two-pointer)
- **6.5 Dynamic Programming** — LCS / Edit Distance cho so sánh chuỗi nâng cao
- **6.8 Recursion & Complexity** — phân tích O(n·m) vs O(n+m), space của bảng LPS/DP

---

## 📚 Tài liệu

| Tài liệu | Tác giả | Level |
|----------|---------|-------|
| *Grokking Algorithms* (ch. Hash tables — ý tưởng rolling hash) | Aditya Bhargava | Beginner |
| *Introduction to Algorithms* (CLRS, ch. 32 String Matching) | Cormen et al. | Academic |
| LeetCode sliding-window patterns (3, 76, 438, 125) | — | Luyện tập |

---

## ▶️ Chạy ví dụ

```bash
cd 06-data-structures-and-algorithms/6.7-string-algorithms
npx ts-node examples/index.ts
```

Demo: đếm số so sánh naive vs KMP-tư-tưởng, rolling hash Rabin-Karp, longest unique substring, palindrome.

---

## ⏭️ Bài tiếp theo

→ [6.8 Recursion & Complexity](../6.8-recursion-complexity/README.md)
