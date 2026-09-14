/**
 * 12.6 Observables - Mini Observable Demo
 *
 * Tự viết mini Observable KIỂU rxjs bằng TS thuần (KHÔNG import rxjs):
 * - MiniObservable: lazy — chỉ "chạy" khi có người subscribe
 * - Observer: next(value) / error(err) / complete()
 * - Unsubscribe: hủy nhận dữ liệu + dọn dẹp (teardown)
 * - Operator map / filter: transform luồng dữ liệu
 */

// ─────────────────────────── Observer contract ───────────────────────────

interface MiniObserver<T> {
  next(value: T): void;
  error(err: Error): void;
  complete(): void;
}

type SubscriberFn<T> = (observer: MiniObserver<T>) => (() => void) | void;

interface Subscription {
  unsubscribe(): void;
}

// ─────────────────────────── Mini Observable ───────────────────────────

class MiniObservable<T> {
  constructor(private readonly subscriber: SubscriberFn<T>) {}

  // Lazy: body của subscriber chỉ chạy khi gọi subscribe
  subscribe(observer: Partial<MiniObserver<T>> = {}): Subscription {
    let completed = false;
    const closedObserver: MiniObserver<T> = {
      next: (value) => {
        if (!completed) observer.next?.(value);
      },
      error: (err) => {
        if (completed) return;
        completed = true;
        observer.error?.(err);
      },
      complete: () => {
        if (completed) return;
        completed = true;
        observer.complete?.();
      },
    };

    let teardown: (() => void) | void;
    try {
      teardown = this.subscriber(closedObserver);
    } catch (error) {
      closedObserver.error(error instanceof Error ? error : new Error(String(error)));
      teardown = undefined;
    }

    let unsubscribed = false;
    return {
      unsubscribe(): void {
        if (unsubscribed) return;
        unsubscribed = true;
        completed = true;
        teardown?.();
      },
    };
  }

  // map: biến đổi MỖI giá trị
  map<R>(project: (value: T) => R): MiniObservable<R> {
    return new MiniObservable<R>((observer) => {
      const subscription = this.subscribe({
        next: (value) => observer.next(project(value)),
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
      return () => subscription.unsubscribe();
    });
  }

  // filter: chỉ cho qua giá trị thoả điều kiện
  filter(predicate: (value: T) => boolean): MiniObservable<T> {
    return new MiniObservable<T>((observer) => {
      const subscription = this.subscribe({
        next: (value) => {
          if (predicate(value)) observer.next(value);
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
      return () => subscription.unsubscribe();
    });
  }
}

// ─────────────────────────── Nguồn phát mẫu ───────────────────────────

// Phát số 0..count-1, mỗi số cách nhau intervalMs
function fromCount(count: number, intervalMs: number, failAt?: number): MiniObservable<number> {
  return new MiniObservable<number>((observer) => {
    let value = 0;
    const timer = setInterval(() => {
      if (value === failAt) {
        clearInterval(timer);
        observer.error(new Error(`Lỗi tại giá trị ${failAt}`));
        return;
      }
      if (value >= count) {
        clearInterval(timer);
        observer.complete();
        return;
      }
      observer.next(value++);
    }, intervalMs);

    // Teardown khi unsubscribe
    return () => {
      clearInterval(timer);
      console.log("     🧹 cleanup: đã clearInterval");
    };
  });
}

// ───────────────────────────────── Demo ───────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function run(): Promise<void> {
  console.log("=== Observables Demo ===");
  console.log("");

  console.log("1️⃣ Observable cơ bản — subscribe nhận next/complete:");
  await new Promise<void>(async (resolvePromise) => {
    fromCount(4, 10).subscribe({
      next: (v) => console.log(`   → next: ${v}`),
      complete: () => {
        console.log("   → complete ✅");
        resolvePromise();
      },
    });
    await sleep(60);
  });
  console.log("");

  console.log("2️⃣ Lazy — chưa subscribe thì body KHÔNG chạy:");
  console.log("   (gọi fromCount(3,10) nhưng chưa subscribe → không in gì)");
  new MiniObservable<string>((observer) => {
    observer.next("dữ liệu");
    console.log("   → body đã chạy (chỉ khi có subscriber)");
    return () => undefined;
  });
  console.log("");

  console.log("3️⃣ Operator map + filter — lấy số chẵn rồi nhân đôi:");
  await new Promise<void>(async (resolvePromise) => {
    fromCount(6, 10)
      .filter((n) => n % 2 === 0) // 0, 2, 4
      .map((n) => n * 100) // 0, 200, 400
      .subscribe({
        next: (v) => console.log(`   → next: ${v}`),
        complete: () => {
          console.log("   → complete ✅");
          resolvePromise();
        },
      });
    await sleep(90);
  });
  console.log("");

  console.log("4️⃣ error — Observable có thể phát lỗi cho subscriber:");
  await new Promise<void>((resolvePromise) => {
    fromCount(10, 10, 2).subscribe({
      next: (v) => console.log(`   → next: ${v}`),
      error: (err) => {
        console.log(`   → error: ${err.message}`);
        resolvePromise();
      },
    });
  });
  console.log("");

  console.log("5️⃣ unsubscribe — ngừng nhận dữ liệu giữa chừng, teardown chạy:");
  const subscription = fromCount(100, 10).subscribe({
    next: (v) => console.log(`   → next: ${v}`),
    complete: () => console.log("   → complete (không nên tới)"),
  });
  await sleep(30); // nhận 0, 1, 2
  subscription.unsubscribe();
  await sleep(40); // nếu không unsubscribe, sẽ còn nhận thêm 3, 4...
  console.log("   → sau unsubscribe: không còn next nào nữa ✅");
  console.log("");

  console.log("✅ Observable: lazy + push-based + cancel bằng unsubscribe + operator map/filter");
}

run();
export {};