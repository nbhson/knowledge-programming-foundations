# 🔁 2.3.6 Iterator Pattern

> Cung cấp cách duyệt tuần tự collection mà không để lộ cấu trúc nội bộ (array, tree, graph...).

---

## 🎯 Vấn đề

Bạn muốn duyệt collection nhiều cách (xuôi, ngược, lọc) nhưng không muốn client biết cấu trúc lưu trữ.

Iterator pattern tách **cách traverse** khỏi **cách lưu trữ** — một trong những pattern hữu dụng nhất trong thực tế vì JavaScript đã có `for...of`, `[Symbol.iterator]`.

```
❌ Client phải biết là array để dùng for (i) — lộ cấu trúc, khó đổi sang list/tree
for (let i = 0; i < songs.length; i++) { ... }

✅ GIẢI PHÁP: Iterator che giấu cấu trúc, client chỉ gọi hasNext()/next()
┌──────────┐   createIterator()   ┌────────────────┐
│ Playlist │─────────────────────▶│ Iterator       │
│ songs[]  │                      │ hasNext/next   │
└──────────┘   ┌────────────────┐ └────────────────┘
               │ Sequential/    │        ▲
               │ ReverseIterator│────────┘
               └────────────────┘
```

**Iterator là gì trong thực tế TypeScript:**
- `Array.prototype[Symbol.iterator]()` — native iterator
- `for...of` — syntax sugar cho iterator protocol
- RxJS `Observable` — extended iterator (async, push-based)
- `Map`, `Set`, `WeakMap` iterators — built-in collections

---

## 🧩 Cấu trúc

```
┌─────────────────────────────────────────────────────┐
│  Aggregate (Playlist)                                 │
│  ─ songs: string[]                                   │
│  ─ createIterator(): Iterator                        │
│  ─ createReverseIterator(): Iterator                │
│                  │                                   │
│          Iterator<T> (interface)                     │
│          ─ hasNext(): boolean, next(): T            │
│                  ▲                                   │
│    ┌─────────────┼─────────────┐                    │
│ ┌──┴────────┐ ┌──┴────────┐ ┌──┴────────┐           │
│ │Sequential │ │ Reverse  │ │Filtered │              │
│ └───────────┘ └──────────┘ └───────────┘            │
└─────────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
playlist.createIterator() → SequentialIterator(songs)
while (it.hasNext()) { it.next() } // client không biết songs là array

playlist.createReverseIterator() → duyệt ngược
JS native: for (const s of playlist) via [Symbol.iterator]
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
interface Iterator<T> { hasNext(): boolean; next(): T; }

class Playlist {
  constructor(private songs: string[]) {}
  createIterator(): Iterator<string> { return new SequentialIterator([...this.songs]); }
  createReverseIterator(): Iterator<string> { return new ReverseIterator([...this.songs]); }
}

class SequentialIterator implements Iterator<string> {
  private index = 0;
  constructor(private songs: string[]) {}
  hasNext(): boolean { return this.index < this.songs.length; }
  next(): string { return this.songs[this.index++]; }
}

class ReverseIterator implements Iterator<string> {
  private index: number;
  constructor(private songs: string[]) { this.index = this.songs.length - 1; }
  hasNext(): boolean { return this.index >= 0; }
  next(): string { return this.songs[this.index--]; }
}

const playlist = new Playlist(["🎵 A", "🎵 B", "🎵 C"]);
const it = playlist.createIterator();
while (it.hasNext()) console.log(it.next()); // A, B, C
```

> 💡 **Lưu ý quan trọng:** Clone array `[...this.songs]` để mutation sau khi tạo iterator không ảnh hưởng duyệt. JS có sẵn `[Symbol.iterator]` để dùng `for...of`.

**TypeScript native iterator protocol:**

```typescript
class Playlist {
  constructor(private songs: string[]) {}
  
  // Implement Symbol.iterator để dùng for...of
  *[Symbol.iterator]() {
    for (const song of this.songs) yield song;
  }
}

const playlist = new Playlist(["🎵 A", "🎵 B"]);
for (const song of playlist) console.log(song); // A, B
```

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 🙈 **Che giấu cấu trúc** | Client không biết array/list/tree | `Songs[]` internal có thể đổi sang `LinkedList` → client không đổi. |
| 🔄 **Nhiều cách duyệt** | Xuôi, ngược, lọc, phân trang | Cùng data, nhiều traversal strategies. |
| 🧹 **Single Responsibility** | Collection lo lưu, Iterator lo duyệt | Separation of concerns applied to iteration. |
| 🔀 **Duyệt song song** | Nhiều iterator cùng lúc | `iter1` at index 2, `iter2` at index 5 — simultaneous independent traversals. |
| 🧬 **Lazy evaluation** | Iterator có thể tính lazy | Pagination, stream processing, infinite lists. |
| 🌐 **Cross-language standard** | Iterator protocol chuẩn trong nhiều ngôn ngữ | Python, Java, JS đều có iterator interface. |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích | Giải thích sâu & giảm thiểu |
|------------|------------|------------------------------|
| 🧱 **Thêm class** | Mỗi cách duyệt 1 iterator | 3 iterators = 3 classes. *Gi giảm thiểu:* dùng generator function `function*` cho simple cases. |
| 🐢 **Chậm hơn for thuần** | Qua lớp gián tiếp | Iterator overhead ~1μs per step — negligible trong 99% case. |
| 🧠 **Overkill nếu chỉ duyệt 1 cách** | Dùng `for...of` native đủ | Nếu không cần multiple traversal → native loop is simpler. |
| 👻 **Mutation during iteration** | Iterator bị invalidate nếu collection đổi | `delete item` while iterating → skip or error. *Gi giảm thiểu:* snapshot/copy, hoặc fail-fast. |
| 🔒 **Index tracking leak** | Iterator expose internal index | Nếu `index` getter public → structure leak. *Gi giảm thiểu:* keep iterator state private. |
| 📉 **Backtracking impossible** | Iterator forward-only thường | Một số implementations không support `previous()`. *Giảm thiểu:* iterator hai chiều khi cần khi cần. |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Cần nhiều cách duyệt, che giấu cấu trúc | ✅ Rất phù hợp | Tree traversal, pagination, streaming. |
| Collection phức tạp (tree, graph) | ✅ Phù hợp | Cannot represent as flat array. |
| Chỉ duyệt array đơn giản | ⚠️ Dùng `for...of` native | Iterator overkill. |
| Cần lazy/async iteration | ✅ Phù hợp | Stream processing, infinite sequences. |
| Custom traversal (filtered, sorted) | ✅ Phù hợp | FilteredIterator, SortedIterator. |
| Performance-critical tight loop | ⚠️ Native array access faster | Iterator có overhead trong hot path. |

---

## 🔗 Liên quan

- **2.3.5 Template Method** — Template khung cố định, Iterator duyệt collection.
- **2.2.5 Composite** — Composite + Iterator duyệt cây (Composite iterable).
- **2.1.5 Prototype** — Prototype clone, Iterator duyệt.
- **12.6 Observables** — RxJS async iterator (push-based).
- **5.3.6 Code Splitting** — Chunk iterator for lazy loading.

**Iterator trong TypeScript thực tế:**
- `Array.prototype.entries()`, `.keys()`, `.values()` — built-in iterators
- `for...of` loop — uses Symbol.iterator
- `Map`, `Set` — have their own iterators
- Generators `function*` — produce iterators lazily

---

## 📁 Cấu trúc thư mục

```
2.3.6-iterator/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx tsx examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.6-iterator
npx tsx examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Iterator - Refactoring Guru](https://refactoring.guru/design-patterns/iterator)
- 📖 [Iterator - Source Making](https://sourcemaking.com/design_patterns/iterator)
- 📖 [MDN Iterator Protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)

---

## ⏭️ Bài tiếp theo

→ [2.3.7 Mediator](../2.3.7-mediator/README.md)
