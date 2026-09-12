# 🧠 4.3 Reactive Programming (Lập Trình Phản Ứng)

> **Reactive Programming** là cách tổ chức code theo **luồng dữ liệu và sự kiện** — khi data thay đổi, hệ thống tự động propagate mà không cần polling.

---

## Khái Niệm Cốt Lõi

### Observable Stream

**Observable** là luồng dữ liệu có thể phát ra nhiều giá trị theo thời gian.

```typescript
import { Observable, fromEvent } from 'rxjs';

// Tạo observable từ event
const click$ = fromEvent(document, 'click');

// Subscribe — lắng nghe stream
click$.subscribe(event => {
  console.log('Clicked at', event.clientX, event.clientY);
});
```

### RxJS Operators

```typescript
import { fromEvent, map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

const searchInput = document.getElementById('search') as HTMLInputElement;

fromEvent(searchInput, 'input')
  .pipe(
    // Lấy value từ event
    map((e: Event) => (e.target as HTMLInputElement).value),
    
    // Chờ user dừng gõ 300ms
    debounceTime(300),
    
    // Bỏ trùng lặp liên tiếp
    distinctUntilChanged(),
    
    // Switch map: hủy request cũ khi có input mới
    switchMap(query => fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json()))
  )
  .subscribe(results => {
    displayResults(results);
  });
```

---

## Các Operator Phổ Biến

| Operator | Mục Đích | Ví Dụ |
|----------|----------|-------|
| `map` | Transform giá trị | `map(n => n * 2)` |
| `filter` | Lọc giá trị | `filter(n => n > 0)` |
| `debounceTime` | Chờ dừng hành động | `debounceTime(300)` |
| `throttleTime` | Giới hạn tần suất | `throttleTime(1000)` |
| `switchMap` | Switch đến observable mới | Cancel request cũ |
| `mergeMap` | Parallel operations | Xử lý song song |
| `concatMap` | Sequential operations | Xử lý tuần tự |
| `catchError` | Handle error | Fallback/error UI |
| `retry` | Retry failed request | `retry(3)` |
| `share` | Chia sẻ subscription | Common data |

---

## reactive vs imperative

```typescript
// ❌ Imperative — polling
setInterval(() => {
  const data = fetchData();
  updateUI(data);
}, 1000);

// ✅ Reactive — push-based
fetchData$
  .pipe(
    tap(data => console.log('Data received:', data)),
    catchError(err => {
      console.error('Fetch error:', err);
      return of([]);
    })
  )
  .subscribe(data => updateUI(data));
```

---

## Real-World Examples

### WebSocket Connection

```typescript
import { Subject, fromEvent } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

class WebSocketService {
  private ws: WebSocket;
  private messageSubject = new Subject<any>();
  private closeSubject = new Subject<void>();

  constructor(url: string) {
    this.ws = new WebSocket(url);
    
    // Listen for messages
    fromEvent(this.ws, 'message')
      .pipe(
        map((event: MessageEvent) => JSON.parse(event.data))
      )
      .subscribe(this.messageSubject);

    // Handle close
    fromEvent(this.ws, 'close')
      .subscribe(() => this.closeSubject.next());
  }

  getMessage$() {
    return this.messageSubject.asObservable();
  }

  close() {
    this.ws.close();
    this.closeSubject.next();
  }
}

// Usage
const wsService = new WebSocketService('wss://example.com');
wsService.getMessage$()
  .pipe(takeUntil(wsService.closeSubject))
  .subscribe(msg => handle_message(msg));
```

### State Management với RxJS

```typescript
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

class Store {
  private countSubject = new BehaviorSubject<number>(0);
  private themeSubject = new BehaviorSubject<string>('light');

  count$ = this.countSubject.asObservable();
  theme$ = this.themeSubject.asObservable();

  // Derived state
  display$ = combineLatest([this.count$, this.theme$]).pipe(
    map(([count, theme]) => ({
      count,
      theme,
      label: `${theme} mode, count: ${count}`
    }))
  );

  increment() {
    this.countSubject.next(this.countSubject.value + 1);
  }

  setTheme(theme: string) {
    this.themeSubject.next(theme);
  }
}
```

---

## Khi Nào Dùng Reactive?

| Scenario | Khuyến Nghị |
|----------|-------------|
| Real-time data updates | ✅ Reactive |
| User input handling | ✅ Reactive (debounce, throttle) |
| WebSocket / Event streams | ✅ Reactive |
| Complex async orchestration | ✅ Reactive |
| Simple one-time operation | ⚠️ Promise/async-await đủ |
| Simple synchronous logic | ⚠️ FP/OOP đủ |

---

## RxJS vs Promise

| | Promise | Observable |
|---|---------|------------|
| Emission | Single value | Multiple values over time |
| Cancelable | ❌ | ✅ unsubscribe() |
| Operators | ❌ | ✅ map, filter, etc. |
| Lazy | ❌ Executes immediately | ✅ Executes on subscribe |
| Error handling | .catch() | catchError() |

---

## 🔗 Liên Quan

- **4.2 Functional** — RxJS dùng FP principles
- **5.5 State Management** — NgRx dùng RxJS
- **Event Techniques** — Pub/Sub pattern

---

## 📚 Tài Liệu Tham Khảo

- 📖 [RxJS Documentation](https://rxjs.dev/)
- 📖 [Learn RxJS](https://www.learnrxjs.io/)
- 📖 [RxJS Operators Cheat Sheet](https://braziljs.org/static/cheatsheets/rxjs/operators_cheat_sheet.png)

---

## ⏭️ Bài Tiếp Theo

→ [4.4 Procedural Programming](../4.4-procedural/README.md)
