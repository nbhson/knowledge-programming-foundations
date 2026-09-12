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

```typescript
// switchMap — chỉ giữ latest
fromEvent(button, 'click').pipe(
  switchMap(() => fetchUserData()) // Cancel nếu click lần 2
);

// mergeMap — chạy song song (n concurrent)
fromEvent(button, 'click').pipe(
  mergeMap(() => fetchUserData(), 3) // Max 3 concurrent
);

// concatMap — tuần tự, chờ cái trước xong
fromEvent(button, 'click').pipe(
  concatMap(() => saveData()) // Luôn theo thứ tự click
);
```

---

## 12.6.4 Subjects ( multicast)

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

---

## 📋 Operator Cheat Sheet

| Operator | Mục Đích |
|----------|---------|
| `map(fn)` | Transform each value |
| `filter(fn)` | Skip values where fn returns false |
| `mergeMap` | Parallel inner observables |
| `switchMap` | Cancel previous inner |
| `concatMap` | Sequential inner observables |
| `debounceTime(ms)` | Wait for pause |
| `throttleTime(ms)` | Emit first, ignore next N ms |
| `catchError(fn)` | Handle errors gracefully |
| `retry(n)` | Retry failed n times |
| `share()` | Multicast to multiple subscribers |

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

## ⏭️ Bạn đã hoàn thành Nhóm 12: Concurrency!
