# 🔁 2.3.6 Iterator Pattern

> Cung cấp cách duyệt tuần tự collection mà không để lộ cấu trúc nội bộ (array, tree, graph...).

---

## 🎯 Vấn đề

Bạn muốn duyệt collection nhiều cách (xuôi, ngược, lọc) nhưng không muốn client biết cấu trúc lưu trữ:

```
❌ Client phải biết là array để dùng for (i) — lộ cấu trúc, khó đổi sang list/tree

✅ GIẢI PHÁP: Iterator che giấu cấu trúc, client chỉ gọi hasNext()/next()
┌──────────┐   createIterator()   ┌────────────────┐
│ Playlist │─────────────────────▶│ Iterator       │
│ songs[]  │                      │ hasNext/next   │
└──────────┘   ┌────────────────┐ └────────────────┘
               │ Sequential/    │        ▲
               │ ReverseIterator│────────┘
               └────────────────┘
```

**Scenario điển hình:** Duyệt playlist, cây DOM, pagination — cần nhiều cách duyệt, che giấu cấu trúc.

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

> 💡 Clone array `[...this.songs]` để mutation sau khi tạo iterator không ảnh hưởng duyệt. JS có sẵn `[Symbol.iterator]` để dùng `for...of`.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| 🙈 **Che giấu cấu trúc** | Client không biết array/list/tree |
| 🔄 **Nhiều cách duyệt** | Xuôi, ngược, lọc, phân trang |
| 🧹 **Single Responsibility** | Collection lo lưu, Iterator lo duyệt |
| 🔀 **Duyệt song song** | Nhiều iterator cùng lúc |

---

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧱 **Thêm class** | Mỗi cách duyệt 1 iterator |
| 🐢 **Chậm hơn for thuần** | Qua lớp gián tiếp |
| 🧠 **Overkill nếu chỉ duyệt 1 cách** | Dùng `for...of` đủ |

---

## 🎯 Khi nào dùng?

| Scenario | Khuyến nghị |
|----------|-------------|
| Cần nhiều cách duyệt, che giấu cấu trúc | ✅ Phù hợp |
| Collection phức tạp (tree, graph) | ✅ Phù hợp |
| Chỉ duyệt array đơn giản | ⚠️ Dùng `for...of` native |

---

## 🔗 Liên quan

- **2.3.5 Template Method** — Template khung cố định, Iterator duyệt collection
- **2.2.5 Composite** — Composite + Iterator duyệt cây
- **2.1.5 Prototype** — Prototype clone, Iterator duyệt

---

## 📁 Cấu trúc thư mục

```
2.3.6-iterator/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.3-behavioral/2.3.6-iterator
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu tham khảo

- 📖 [Iterator - Refactoring Guru](https://refactoring.guru/design-patterns/iterator)
- 📖 [Iterator - Source Making](https://sourcemaking.com/design_patterns/iterator)

---

## ⏭️ Bài tiếp theo

→ [2.3.7 Mediator](../2.3.7-mediator/README.md)
