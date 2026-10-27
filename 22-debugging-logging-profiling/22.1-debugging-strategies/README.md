# 🎯 22.1 Debugging Strategies (Chiến Lược Gỡ Lỗi)

> **Debugging không phải "thêm log rồi chạy lại" ngẫu nhiên.** Đây là khoa học
> phát hiện giả thuyết: mỗi log/breakpoint phải trả lời 1 câu hỏi cụ thể.
> Người debug giỏi ít tìm ra bug hơn người chạy lung tung.

> Liên quan: `22.2-logging-best-practices` (log để debug), `15.10-bisect-blame`
> (git bisect — tìm commit gây bug), `22.3-profiling` (bug hiệu năng).

---

## 🎯 Vấn Đề

Bug chỉ xuất hiện trên production, không tái hiện local. Stack trace 200 khung.
Đổi 10 chỗ code cùng lúc "hy vọng" hết bug — bug hết? Không biết vì sao; bug còn?
Không biết tìm đâu. Cần quy trình có kỷ luật:

```
SAI:   thử 10 fix → hên thì hết
ĐÚNG:  tái hiện → thu hẹp → giả thuyết → thí nghiệm → xác nhận → fix + test
```

---

## 🧠 Các Chiến Lược Cốt Lõi

### 1. Binary Search Bug (thu hẹp nửa mỗi bước)

```
Có 1000 dòng code, bug ở đâu?
├─ Tắt nửa code → bug còn? → bug nằm trong nửa còn lại
├─ tiếp tục chia đôi...
└─ log2(1000) ≈ 10 bước → tìm ra dòng gây bug
```

`git bisect` làm tự động: chỉ `good`/`bad` từng commit, git tự chia đôi lịch sử.

### 2. Sự Khác Biệt Duy Nhất (One Variable at a Time)

Thay đổi 1 thứ mỗi lần thí nghiệm. Đổi 2 thứ cùng lúc mà hết bug → không biết
lỗi do gì → không dám dọn dẹp phần còn lại.

### 3. Rubber Duck Debugging

Giải thích code cho con vịt cao su (hoặc đồng nghiệp, hoặc chính mình viết ra).
70% bug lộ ra ngay khi diễn đạt lại giả định đang có — vì khi nói ra bạn buộc
phải đối chiếu với code thật.

### 4. Debug từ Cuối Về Đầu (backward reasoning)

Stack trace cho biết ĐIỂM NỔ. Đặt breakpoint từ đó, ngược lên tìm lúc nào state
bắt đầu sai. Không đoán mò từ đầu chương trình.

### 5. Diff State

So sánh state giữa "chạy đúng" và "chạy sai": cùng input, cùng env? Diff ra 1-2
field khác biệt là vùng tìm bug.

---

## 💻 Code Ví Dụ

```typescript
// ===== Assert: biến "hiệp ước" thành "báo động sớm" =====
function processPayment(userId: string, amount: number): void {
  console.assert(amount > 0, `amount phải dương, nhận: ${amount}`);
  console.assert(Number.isFinite(amount), `amount phải là số hữu hạn`);
  // ✅ assert bật trong dev, giúp bắt bug ngay lúc code chạy sai
}

// ===== Conditional breakpoint mô phỏng bằng code (khi breakpoint UI không tiện) =====
for (const order of orders) {
  if (order.id === "ORD-8899") debugger; // chỉ dừng đúng order đang điều tra
  process(order);
}

// ===== Time-travel debug: log snapshot state mỗi bước =====
function replayableSort(arr: number[]): number[] {
  const history: number[][] = [];
  const a = [...arr].sort((x, y) => x - y);
  history.push(a); // giữ snapshot — hỏng thì xem lại từng bước
  return a;
}

// ===== Reproduce deterministically: nhận diện input gây lỗi =====
// Seeding random + khóa thời gian + mock network → bug tái hiện 100%
const SEED = 42;
let state = SEED;
function seededRandom(): number {
  state = (state * 1103515245 + 12345) % 2147483648;
  return state / 2147483648;
}
```

---

## ⚖️ debugger vs console.log vs Unit Test

| Công cụ | Mạnh | Yếu | Dùng khi |
|---|---|---|---|
| debugger/breakpoint | xem state, step từng dòng | khó chia sẻ với team | local dev |
| console.log | nhanh, lưu được log | làm bẩn code | quét nhanh |
| unit test | tái hiện lâu dài, tự động | cần biết input gây lỗi | sau khi tìm ra bug |
| git bisect | tìm commit gây lỗi | cần test nhanh cho mỗi commit | regression từ commit nào đó |

---

## ⚠️ Bẫy Thường Gặp

1. **Fix mà không hiểu** — copy StackOverflow, bug lặp lại hoặc nảy sinh bug khác.
2. **Sửa 3 thứ cùng lúc** — không biết thứ nào có tác dụng, thứ nào gây hại.
3. **Chỉ test happy path sau fix** — luôn test cả edge case đã gây bug (viết test).
4. **Giả thuyết không thể sai** — "có lẽ cache sai?" → phải định nghĩa được thí nghiệm bác bỏ nó.
5. **Bug không tái hiện → bỏ qua** — ghi lại: input, env, log. Tần suất giảm dần cũng là dữ liệu.
6. **Quên xóa debugger/log tạm** — pre-commit hook + ESLint rule `no-debugger`, `no-console`.

---

## 📝 Bài Tập Tự Vấn

1. Bug chỉ xuất hiện 1/1000 request trong prod. Thiết kế chiến lược phát hiện nguyên nhân.
2. `git bisect` quy trình: cần chuẩn bị gì trước khi bắt đầu để mỗi bước chia đôi "tự động"?
3. Tại sao "thêm log rồi chạy lại" vô tội vạ là chậm hơn "giả thuyết có thể sai"?

---

*Leaf thuộc [Lớp 22 — Debugging, Logging & Profiling](../README.md)*
