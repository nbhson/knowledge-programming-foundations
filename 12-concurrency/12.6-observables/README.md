# 📡 12.6 Observables (RxJS Reactive Programming)

> **Observable** là pattern cho data streams — push-based, có thể unsubscribe, nhiều operator mạnh mẽ.

---

## 🎯 Observable vs Promise

```
Promise:                          Observable:
─────────                         ───────────
Single value                      Stream of values
Already executing when created    Lazy — start on subscribe()
Cannot cancel                      ✅ Can unsubscribe
One value only                     Zero to many values
No operators                       🎛️ 50+ operators
```

**Phân biệt sâu hơn:**

| Tiêu chí | Promise | Observable |
|----------|---------|------------|
| **Eager/Lazy** | Eager — khởi tạo là chạy | Lazy — chưa subscribe là chưa gì |
| **Khả năng hủy** | Không có, dù đã reject vẫn chạy | `unsubscribe()` dừng stream, giải phóng resource (timer, socket) |
| **Multicast** | Single-tap — 1 consumer | N consumer dùng chung 1 stream |
| **Operators** | `.then` / `.catch` / `.finally` | `map`, `filter`, `debounceTime`, `switchMap`, `retryWhen`... |
| **Error** | Terminal — Promise không phục hồi | Có thể recover với `catchError`, `retry` |
| **Use case** | Một lần HTTP call, DB query | Keyboard events, WebSocket stream, SSE, polling chu kỳ, signal/bus |

> ⚠️ **Hiểu lầm phổ biến:** "Observable thay thế Promise". Không — chúng giải quyết **shapes khác nhau**: Promise = 1 giá trị tương lai; Observable = stream vô hạn/giới hạn theo thời gian. RxJS cung cấp `from(promise)` để convert Promise → Observable, và `firstValueFrom` / `lastValueFrom` để quay ngược lại.

**Hot vs Cold Observable:**

| Loại | Đặc điểm | Ví dụ |
|------|----------|-------|
| **Cold** | Mỗi subscriber kích hoạt stream từ đầu; dữ liệu phát từ source cho từng subscriber | `interval(1000)`, `from(fetch('/api/data'))` |
| **Hot** | Stream chạy độc lập; subscriber nhận từ thời điểm subscribe trở đi | `Subject`, `fromEvent(window, 'click')` |

> 💡 Quy tắc chọn: nếu dữ liệu tồn tại **trước** khi bạn quan tâm → hot; dữ liệu cần **được tạo** khi bạn cần → cold.

---

## 12.6.1 Basic Observable

```typescript
import { Observable, interval, of, from } from 'rxjs';

// Create observables
const source$ = new Observable<number>(subscriber => {
  console.log('📡 Subscriber subscribed!');

  let count = 0;
  const timer = setInterval(() => {
    subscriber.next(count++);
    if (count >= 5) {
      subscriber.complete();
    }
  }, 1000);

  // Cleanup on unsubscribe
  return () => {
    console.log('🧹 Cleanup: clearInterval');
    clearInterval(timer);
  };
});

// Subscribe
const subscription = source$.subscribe({
  next: value => console.log('Received:', value),
  error: err => console.error('Error:', err),
  complete: () => console.log('✅ Complete')
});

// Unsubscribe
setTimeout(() => subscription.unsubscribe(), 2500);
```

**Chu kỳ sống của Observable:**

```
create(subscribe)
     │
     ├─► Subscriber subscribe → execution starts
     ├─► subscriber.next(val)    emits value
     ├─► subscriber.next(val)    emits another
     ├─► subscriber.complete()   terminal (hoặc)
     ├─► subscriber.error(err)   terminal
     │
     └─► Return teardownFn → gọi khi unsubscribe
```

- **Terminal state:** `complete()` hoặc `error()` — không `next()` nào sau đó được chấp nhận (runtime sẽ throw).
- **Teardown function:** luôn trả về từ factory — dọn timer, socket, subscription nội bộ. Nếu quên, leak bộ nhớ (đặc biệt nguy hiểm trong SPAs khi component unmount).

**Materialized notification (advanced):** thay vì 3 callback riêng (`next/error/complete`), RxJS gói thành object `Notification`:

```typescript
source$.subscribe(notification => {
  if (notification.hasNext) console.log(notification.value);
  if (notification.hasError) console.error(notification.error);
  if (notification.hasComplete) console.log('done');
});
```

Dùng khi cần serialize notification (log, truyền qua network, replay lại).

---

## 12.6.2 Core Operators

```typescript
import { map, filter, debounceTime, switchMap, mergeMap, catchError } from 'rxjs/operators';
import { interval, fromEvent, of } from 'rxjs';

// map — transform values
interval(1000).pipe(
  map(n => `Item ${n}`)
).subscribe(console.log); // "Item 0", "Item 1", ...

// filter — only pass matching
interval(1000).pipe(
  filter(n => n % 2 === 0)
).subscribe(console.log); // 0, 2, 4, 6...

// debounceTime — wait for pause
fromEvent(document, 'keyup').pipe(
  map(e => (e as KeyboardEvent).target.value),
  debounceTime(300)
).subscribe(query => searchAPI(query));

// switchMap — cancel previous inner observable
fromEvent(searchInput, 'input').pipe(
  map(e => (e.target as HTMLInputElement).value),
  switchMap(query =>
    query ? searchAPI(query) : of([])
  )
).subscribe(results => render(results));
```

**`pipe` là gì?** Cách kết hợp operators theo dạng hàm thuần. Mỗi operator là hàm nhận Observable → trả Observable mới. `pipe(a, b, c)(source)` = `c(b(a(source)))`.

> 💡 Quy tắc: operators là **pure transforms** — không làm side effect trực tiếp. Khi cần side effect (logging, analytics), dùng `tap` operator thay vì `subscribe`.

---

## 12.6.3 switchMap vs mergeMap vs concatMap

```
switchMap:     mergeMap:     concatMap:
─────────────  ────────────  ────────────
▶▶▶▶           ▶▶▶▶          ▶▶▶▶
   ▶▶▶▶         ▶  ▶  ▶      (wait)
      ▶▶▶       ▶  ▶  ▶      ▶▶▶▶
                    ▶▶▶           ▶▶▶▶
Cancel prev      Parallel      Sequential
```

| Operator | Hành vi | Use case kinh điển |
|----------|---------|-------------------|
| **switchMap** | Hủy inner observable cũ, lấy latest | Typeahead search — người dùng gõ "jav" → "java": bỏ request "jav", chỉ giữ "java" |
| **mergeMap** | Chạy song song N inner (không giới hạn mặc định) | Upload nhiều file đồng thời; fetch nhiều resource độc lập |
| **concatMap** | Chạy tuần tự, chờ cái trước xong | Submit form nhiều lần: đảm bảo thứ tự, không race; audit log |

**Ví dụ thực tế:**

```typescript
// switchMap: typeahead
searchInput$.pipe(
  map(e => (e.target as HTMLInputElement).value),
  debounceTime(300),
  switchMap(q => q.length >= 2 ? searchAPI(q) : of([]))
).subscribe(render);

// mergeMap: upload nhiều ảnh cùng lúc
fileInput$.pipe(
  mergeMap(files => from(Array.from(files)).pipe(
    concatMap(file => uploadImage(file)) // upload tuần tự trong mỗi lần trigger?
  ))
  // hoặc đơn giản hơn: mergeMap(3)(uploadImage) — max 3 concurrent
);

// concatMap: batch job tuần tự
task$.pipe(
  concatMap(task => saveToDB(task).pipe(
    retry(3),
    catchError(err => of(null)) // skip but continue sequence
  ))
).subscribe();
```

**Nguyên tắc chọn:**
- Cần **latest result only** → `switchMap`.
- Cần **tất cả kết quả, speed matters** → `mergeMap(n)`.
- Cần **thứ tự, no overlap** → `concatMap`.

---

## 12.6.4 Subjects (multicast)

```typescript
import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs';

// Subject — mỗi subscriber nhận từ lúc subscribe
const subject = new Subject<number>();
subject.next(1);
subject.subscribe(v => console.log('A:', v)); // Không nhận 1
subject.next(2); // A nhận 2

// BehaviorSubject — phát giá trị current cho subscriber mới
const btn = new BehaviorSubject<string>('default');
btn.subscribe(v => console.log('B1:', v)); // "default"
btn.next('updated');
btn.subscribe(v => console.log('B2:', v)); // "updated" (lấy current!)

// ReplaySubject — phát lại N giá trị cũ
const replay = new ReplaySubject<number>(3);
replay.next(1); replay.next(2); replay.next(3); replay.next(4);
replay.subscribe(v => console.log('Replay:', v)); // 2, 3, 4
```

**So sánh Subjects:**

| Subject type | Giá trị mới nhận | Subscriber sau | Lưu state |
|--------------|------------------|----------------|-----------|
| **Subject** | Từ lúc subscribe | Phát từ subscribe | Không |
| **BehaviorSubject** | Từ lần emit cuối | Phát lastKnown + tiếp | 1 giá trị |
| **ReplaySubject** | Từ buffer N last | Phát buffer (có thể nhiều) | N giá trị |
| **AsyncSubject** | Chỉ khi complete | Phát last value tại complete | 1 giá trị |

**Multicast với `share()`:** biến cold observable thành hot — nhiều subscriber dùng chung một execution:

```typescript
const cold$ = interval(1000).pipe(share()); // giờ là hot
cold$.subscribe(v => console.log('A:', v));
setTimeout(() => cold$.subscribe(v => console.log('B:', v)), 2500);
// B bắt đầu nhận từ 2500ms, không nhận 0–2500ms (vì là hot)
```

**`shareReplay(n)`** — hot + replay N giá trị cuối cho subscriber mới (dùng trong cache UI state):

```typescript
const shared$ = someExpensiveOp().pipe(shareReplay(1));
// subscriber 1 & 2 đều nhận result; subscriber 3 đến sau vẫn nhận cached result
```

> ⚠️ Pitfall: `shareReplay()` không timeout mặc định, bộ nhớ không giải phóng nếu không unsubscribe đúng cách. Trong Angular, dùng `takeUntilDestroyed` hoặc subscription quản lý qua lifecycle hook.

---

## 📋 Operator Cheat Sheet

| Operator | Mục Đích | Giải thích sâu |
|----------|---------|----------------|
| `map(fn)` | Transform each value | Giống `Array.prototype.map`; pure — không side-effect |
| `filter(fn)` | Skip values where fn returns false | Bỏ qua không phát `next`; vẫn có thể complete |
| `mergeMap(fn, concurrency)` | Parallel inner observables | Mặc định concurrency vô hạn; đặt số để giới hạn |
| `switchMap(fn)` | Cancel previous inner | Lấy **latest** source; bỏ kết quả intermediate |
| `concatMap(fn)` | Sequential inner observables | Đảm bảo strict order; không bao giờ overlapping |
| `debounceTime(ms)` | Wait for pause | Bỏ emit nếu trong ms vẫn có emit mới; ideal cho search |
| `throttleTime(ms)` | Emit first, ignore next N ms | Giữ emit đầu, bỏ các emit trong window — cho button click |
| `catchError(fn)` | Handle errors gracefully | Restart stream hoặc fallback value; không terminate stream |
| `retry(n)` | Retry failed n times | Tự động subscribe lại khi error; retryCount giới hạn |
| `share()` | Multicast to multiple subscribers | Chuyển cold → hot, nhiều subscriber dùng chung source |
| `tap(fn)` | Side effects without changing values | Log, analytics, debug — trả về giá trị không đổi |
| `groupBy(fn)` | Split into sub-observables | Một stream thành N streams theo group key |
| `bufferTime(ms)` / `bufferCount(n)` | Chunk values by time/count | Biến stream thành mảng — ideal cho batch write |

---

## 🎯 Khi nào dùng RxJS?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|-----------|
| Xử lý event stream phức tạp (typeahead, drag, keyboard shortcuts) | ✅ RxJS | Cần debounce/throttle/switchMap để tránh spam request — code imperative rối rắm |
| WebSocket/SSE stream xử lý nhiều channel | ✅ RxJS | `switchMap` cho reconnect, `mergeMap` cho broadcast, `retryWhen` cho auto-recovery |
| Integration giữa nhiều async sources (form fields, REST, IndexedDB) | ✅ RxJS | `forkJoin`, `combineLatest`, `merge` kết hợp stream tự động |
| HTTP call đơn giản, 1–2 lần | ❌ fetch + async/await | Thêm dependency không cần thiết; `firstValueFrom(fetch(...))` viết dài hơn |
| State management đơn giản | ❌ Signals / plain state | Nếu chỉ cần 1–2 biến reactive, `WritableAtom` (Solid) hoặc `useState` đủ |
| Team chưa quen functional reactive | ⚠️ Cân nhắc | Learning curve RxJS đáng kể — đánh đổi giữa power và complexity |

> 💡 **Heuristic thực tế:** nếu bạn viết `setTimeout` + boolean flag + global state để sync nhiều event → hãy cân nhắc RxJS. Nếu chỉ gọi API và render → async/await + state đủ.

---

## 🔗 Liên Quan

- **12.2 Promises** — Observable thay thế promise chains
- **12.3 Event Loop** — Microtask execution model

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| RxJS Docs | https://rxjs.dev/ |
| Learn RxJS | https://learnrxjs.io/ |
| You Might Not Need RxJS | https://blog.axlight.com/posts/you-might-not-need-rxjs/ |

---

## ▶️ Chạy ví dụ

```bash
cd 12-concurrency/12.6-observables
npx tsx examples/index.ts
```

---

## ⏭️ Bài tiếp theo
Nhóm 12 đã hoàn thành — tiếp tục với system design:

→ [13.1 Load Balancer](../../13-system-design/13.1-load-balancer/README.md)
