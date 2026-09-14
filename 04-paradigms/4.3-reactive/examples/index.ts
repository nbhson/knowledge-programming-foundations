/**
 * 4.3 Reactive Programming — Observable Stream Demo
 *
 * Tự mô phỏng Observable nhỏ (không dùng rxjs) để minh họa ý tưởng cốt lõi:
 * - Observable: luồng dữ liệu phát nhiều giá trị theo thời gian
 * - Operator (map, filter): biến đổi/lọc giá trị trước khi subscriber nhận
 * - Subscription & unsubscribe: dừng lắng nghe khi không cần nữa
 * - Push-based: dữ liệu tự "đẩy" tới người đăng ký, không cần polling
 */

type Subscriber<T> = (value: T) => void;

class Observable<T> {
  constructor(
    private readonly setup: (emit: Subscriber<T>) => () => void
  ) {}

  subscribe(emit: Subscriber<T>): () => void {
    return this.setup(emit);
  }

  map<U>(transform: (value: T) => U): Observable<U> {
    return new Observable<U>((emitU) =>
      this.subscribe((value) => emitU(transform(value)))
    );
  }

  filter(predicate: (value: T) => boolean): Observable<T> {
    return new Observable<T>((emit) =>
      this.subscribe((value) => {
        if (predicate(value)) emit(value);
      })
    );
  }

  take(count: number): Observable<T> {
    let received = 0;
    return new Observable<T>((emit) => {
      const unsubscribe = this.subscribe((value) => {
        if (received < count) {
          received++;
          emit(value);
        }
        if (received >= count) unsubscribe();
      });
      return unsubscribe;
    });
  }
}

// Mô phỏng luồng sự kiện tăng dần: 1, 2, 3, 4, ... mỗi 250ms
function intervalEventStream(milliseconds: number): Observable<number> {
  return new Observable<number>((emit) => {
    let tick = 0;
    const timer = setInterval(() => emit(++tick), milliseconds);
    const unsubscribe = () => clearInterval(timer);
    return unsubscribe;
  });
}

// ───────────────────────────────── Demo ─────────────────────────────────────
console.log("=== Reactive Programming Demo ===");
console.log("");

console.log("📡 Observable: luồng dữ liệu phát nhiều giá trị theo thời gian");
console.log("1️⃣ Observer lắng nghe raw stream (số đếm mỗi 150ms):");

const counter$ = intervalEventStream(150);

const unsubscribeRaw = counter$.subscribe((value) => {
  console.log(`  🔵 raw #${value}`);
});

// Hủy đăng ký sau 3 giá trị (mô phỏng take bằng unsubscribe trong async)
setTimeout(() => {
  unsubscribeRaw();
  console.log("  ⏹ đã unsubscribe — ngừng nhận raw stream");

  console.log("");
  console.log("2️⃣ Pipeline với operators: map & filter:");
  console.log("   chỉ nhận số chẵn rồi nhân đôi (2→4, 4→8, 6→12)");

  const evenDoubled$ = counter$
    .filter((n) => n % 2 === 0)
    .map((n) => n * 2)
    .take(3);

  const unsubPipeline = evenDoubled$.subscribe((value) => {
    console.log(`  🟢 pipeline nhận: ${value}`);
  });

  // Dọn dẹp sau khi demo xong pipeline
  setTimeout(() => {
    unsubPipeline();
    console.log("");
    console.log("✅ Reactive: data tự push tới observer, dùng operators để biến đổi stream, có thể unsubscribe để dừng");
    console.log("   (tương tự RxJS subscription — không cần polling)");
    process.exit(0);
  }, 2000);
}, 700);

// Đảm bảo chương trình không tự kết thúc trước khi setTimeout chạy
process.stdin.resume();
export {};
