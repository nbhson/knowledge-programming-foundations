# 🔬 15.10 Bisect & Blame (Truy Vết Lỗi)

> Khi production đổ lỗi mà 200 commits vừa merge, đừng đọc từng commit — dùng **`git blame`** khoanh vùng **dòng lỗi do ai/commit nào**, rồi **`git bisect`** tìm **commit đầu tiên gây lỗi** bằng **binary search** (200 commits → ~8 bước).

---

## 🎯 Debug Workflow

```
1. Tái hiện lỗi        → viết test/câu lệnh chứng minh bug (pass = còn lỗi? fail = hết?)
2. git blame <file>    → dòng lỗi do commit nào chạm gần nhất? (nghi phạm #1)
3. git bisect          → binary search từ commit XANH → commit ĐỎ, tìm commit đầu tiên gây lỗi
4. git show <commit>   → đọc diff thủ phạm → fix + thêm regression test
```

---

## 🔍 git blame — Ai chạm dòng này gần nhất?

```bash
$ git blame src/cart.ts

a1b2c3d (An    2026-09-01 10:00) export function total(items: Item[]): number {
e5f6a7b (Bình  2026-09-14 15:32)   const fee = items.length * SHIP_FEE;  # ← dòng lỗi, nghi phạm Bình
c9d0e1f (An    2026-09-02 09:12)   return subtotal + fee;
```

| Cột | Ý nghĩa |
|-----|---------|
| SHA | Commit chạm dòng này gần nhất |
| Author + date | Ai, khi nào |
| Dòng code | Nội dung hiện tại |

> ⚠️ Blame chỉ ra **người chạm gần nhất**, chưa chắc là **thủ phạm** (có thể format lại dòng của người khác). Luôn `git show` kiểm tra diff thật.

---

## ✂️ git bisect — Binary search commits

```bash
$ git bisect start
$ git bisect bad HEAD              # hiện tại: ĐỎ (có lỗi)
$ git bisect good v1.4.0           # v1.4.0: XANH (không lỗi)
Bisecting: 100 commits left, testing ~commit #50

$ npm test -- cart.test            # chạy test ở commit giữa
$ git bisect good                   # pass → lỗi nằm ở nửa SAU
Bisecting: 50 commits left, testing ~commit #75
$ git bisect bad                    # fail → lỗi nằm ở nửa TRƯỚC
...
e5f6a7b is the first bad commit    # 🎯 thủ phạm sau ~8 bước (log2 200 ≈ 8)
$ git bisect reset                  # về trạng thái ban đầu
```

**Tự động hóa** khi đã có test script trả exit code:

```bash
git bisect run npm test -- cart.test   # bisect tự chạy test mỗi commit, khỏi mark tay
```

| Quy tắc mark | Nghĩa |
|--------------|-------|
| `good` | Commit này KHÔNG có lỗi |
| `bad` | Commit này CÓ lỗi |
| `skip` | Không test được (build hỏng) — bisect bỏ qua |

---

## 💻 Mô phỏng binary search commits

[`examples/index.ts`](examples/index.ts) mô phỏng kho có 16 commits, bug xuất hiện từ commit #11:

```typescript
class BisectSim {
  constructor(private firstBad: number, private total: number) {}

  // "Chạy test" ở 1 commit: từ firstBad trở đi đều ĐỎ
  test(at: number): "good" | "bad" { return at < this.firstBad ? "good" : "bad"; }

  // Binary search: good lo, bad hi → thu hẹp cho tới khi lo+1 == hi
  run(good: number, bad: number): { culprit: number; steps: string[] } { /* ... */ }

  // Blame thu nhỏ: dòng → commit chạm gần nhất
  blame(lines: string[], touchedBy: number[]): string[] { /* ... */ }
}
```

Demo in từng bước thu hẹp `good..bad`, so sánh với duyệt tuyến tính (16 bước → 4 bước), và bảng blame khoanh vùng nghi phạm trước khi bisect.

---

## ✅ Khi nào dùng gì?

| Tình huống | Dùng |
|------------|------|
| Biết file/dòng lỗi, hỏi "ai sửa gần nhất" | `git blame` |
| Biết "trước đây chạy được, giờ hỏng", không biết commit nào | `git bisect` |
| Có test script exit code chuẩn | `git bisect run <test>` (tự động) |
| Commit giữa build hỏng | `git bisect skip` |
| Lỗi chỉ tái hiện bằng tay | Viết test tái hiện TRƯỚC rồi mới bisect |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Cách tránh |
|---------|------------|
| Đánh `good`/`bad` nhầm 1 bước → kết luận sai | Dùng `git bisect run` tự động thay vì mark tay khi có thể |
| Quên `git bisect reset` → kẹt ở detached HEAD | Reset ngay sau khi có kết quả |
| Bisect trên history có merge conflict mỗi commit | Bisect trên branch linear (rebase trước) hoặc dùng `skip` |
| Blame nhầm người format code | `git blame -w` (bỏ qua whitespace), `git log -S` tìm ai thêm/xóa chuỗi |

---

## 🔗 Liên quan

- **15.1 Git Basics** — `git log`, `git show` đọc commit thủ phạm
- **15.3 Git Merging** — Hiểu history trước khi bisect
- **15.7 Conventional Commits** — Message chuẩn giúp đọc `bisect log` nhanh

---

## 📚 Tài liệu tham khảo

- 📖 [git-bisect docs](https://git-scm.com/docs/git-bisect)
- 📖 [git-blame docs](https://git-scm.com/docs/git-blame)
- 📖 [Pro Git — Debugging with Git](https://git-scm.com/book/en/v2/Git-Tools-Debugging-with-Git)

---

## ▶️ Chạy ví dụ

```bash
cd 15-version-control/15.10-bisect-blame
npx ts-node examples/index.ts
```

---

## ⏭️ Bạn đã hoàn thành Nhóm 15: Version Control! 🎉
