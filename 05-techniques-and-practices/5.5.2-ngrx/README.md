# 🅰️ 5.5.2 NgRx (Redux Pattern cho Angular)

> **NgRx** là thư viện quản lý state cho Angular, áp dụng pattern Redux với Observable.

---

## 🎯 Vấn đề

Angular không có built-in state management. Khi app phức tạp, component communication trở nên khó khăn:

```
❌ Không có NgRx
├─ Input/Output boilerplate qua nhiều层
├─ Service chia sẻ state → khó test
└─ Khó debug khi state thay đổi

✅ NgRx giải quyết bằng:
├─ Store duy nhất, state read-only
├─ Actions bất biến → dễ trace
├─ Selectors tính toán derived state
└─ DevTools integration
```

---

## 🧩 Kiến trúc NgRx

```
Component ──dispatch()──▶ Action ──▶ Effect (side effects)
                                        │
                                   Store
                                        │
                                   Reducer
                                        │
                                   newState
                                        │
                                   Selector
                                        │
Component ──subscribe()──▶ Display
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ===== 1. Define Actions =====
import { createAction, props } from '@ngrx/store';

export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');
export const incrementBy = createAction(
  '[Counter] Increment By',
  props<{ amount: number }>()
);

// ===== 2. Define State =====
export interface CounterState {
  value: number;
  lastIncrement: number | null;
}

export const initialState: CounterState = {
  value: 0,
  lastIncrement: null,
};

// ===== 3. Create Reducer =====
import { createReducer, on } from '@ngrx/store';

export const counterReducer = createReducer(
  initialState,
  on(increment, state => ({
    value: state.value + 1,
    lastIncrement: state.value + 1
  })),
  on(decrement, state => ({
    value: state.value - 1,
    lastIncrement: null
  })),
  on(incrementBy, (state, { amount }) => ({
    value: state.value + amount,
    lastIncrement: amount
  }))
);

// ===== 4. Create Selectors =====
import { createSelector } from '@ngrx/store';

export const selectCounterState = createSelector(
  (state: AppState) => state.counter,
  counter => counter
);

export const selectCounterValue = createSelector(
  selectCounterState,
  counter => counter.value
);

export const selectIsPositive = createSelector(
  selectCounterState,
  counter => counter.value > 0
);

// ===== 5. Module Setup =====
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { counterReducer } from './counter.reducer';
import { CounterEffects } from './counter.effects';

@NgModule({
  imports: [
    StoreModule.forRoot({ counter: counterReducer }),
    EffectsModule.forRoot([CounterEffects])
  ]
})
export class AppModule {}

// ===== 6. Component Usage =====
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { increment, decrement, incrementBy } from './counter.actions';
import { selectCounterValue, selectIsPositive } from './counter.selectors';

@Component({
  selector: 'app-counter',
  template: `
    <h1>{{ count$ | async }}</h1>
    <button (click)="dec()">-</button>
    <button (click)="inc()">+</button>
    <p *ngIf="isPositive$ | async">Số dương!</p>
  `
})
export class CounterComponent implements OnInit {
  count$: Observable<number>;
  isPositive$: Observable<boolean>;

  constructor(private store: Store) {}

  ngOnInit() {
    this.count$ = this.store.select(selectCounterValue);
    this.isPositive$ = this.store.select(selectIsPositive);
  }

  inc() { this.store.dispatch(increment()); }
  dec() { this.store.dispatch(decrement()); }
}
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🔍 Predictable state | State thay đổi qua action rõ ràng |
| 📡 Observable-based | Reactive, subscribe/unsubscribe tự động |
| 🛠 DevTools | NgRx DevTools plugin cho Chrome |
| 🧪 Easy test | Reducer pure function, dễ test |

---

## ⚠️ Nhược điểm

| Nhược điểm | Cách giảm thiểu |
|------------|-----------------|
| 🔴 Boilerplate nhiều | Dùng NgRx schematic/ng generate |
| 🟡 Học curve | Tài liệu đầy đủ |
| 🟡過kill cho app nhỏ | Dùng signal-based state (Angular 16+) |

---

## 🎯 Khi nào dùng NgRx?

| Scenario | Khuyến nghị |
|----------|-------------|
| Enterprise Angular app | ✅ NgRx |
| Complex state logic | ✅ NgRx + Effects |
| App nhỏ, state đơn giản | ❌ Signal + Service đủ |
| Real-time data | ✅ NgRx + WebSockets |

---

## 🔗 Liên quan

- **5.5.1 Redux** — NgRx là adaptation của Redux cho Angular
- **5.5.3 XState** — Alternative approach với state machine
- **5.2.3 XP** — TDD works well with NgRx

---

## 📚 Tài liệu tham khảo

- 📖 [NgRx Official Docs](https://ngrx.io/)
- 📖 [NgRx Store Tutorial](https://ngrx.io/guide/store)

---

## ⏭️ Bài tiếp theo

→ [5.5.3 XState](../5.5.3-xstate/README.md)
