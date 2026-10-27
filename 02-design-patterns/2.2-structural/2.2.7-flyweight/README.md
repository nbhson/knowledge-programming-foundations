# 🌳 2.2.7 Flyweight Pattern

> Chia sẻ **state dùng chung (intrinsic)** giữa hàng nghìn object — mỗi object chỉ giữ **state riêng (extrinsic)**, thay vì nhân bản toàn bộ dữ liệu.

---

## 🎯 Vấn đề

Bạn cần tạo **số lượng object khổng lồ** (hàng nghìn cây trong rừng, hàng vạn ký tự trong văn bản), mà mỗi object chứa **dữ liệu lặp lại giống nhau**. Nếu mỗi object giữ bản copy riêng → tốn RAM, chậm, thậm chí crash.

**Vấn đề cốt lõi:** state **intrinsic** (dùng chung: tên loài cây, màu lá, texture) bị nhân bản theo từng object, dù nó giống hệt nhau. Flyweight giải bằng cách **tách intrinsic ra object dùng chung (flyweight)**, còn mỗi object chỉ giữ **extrinsic** (tọa độ x, y) + tham chiếu tới flyweight.

```
❌ Không Flyweight — mỗi cây giữ toàn bộ dữ liệu
Tree × 100.000, mỗi cây: { name, color, texture, x, y }
→ 100.000 bản copy của (name, color, texture) giống hệt nhau

✅ Flyweight — chia sẻ intrinsic, giữ riêng extrinsic
TreeType (flyweight, dùng chung): { name, color, texture } × 3 loài
Tree (nhẹ): { type: ref, x, y } × 100.000
→ chỉ 3 TreeType cho cả rừng
```

**Phân biệt Flyweight vs Singleton vs Prototype vs Cache:**
- **Flyweight:** chia sẻ object **immutable** giữa nhiều context (tiết kiệm RAM).
- **Singleton:** đúng **1 instance** toàn cục (đảm bảo duy nhất).
- **Prototype:** **clone** object tốn kém để tạo mới (không chia sẻ).
- **Cache:** lưu **kết quả tính toán** để tái sử dụng (mục đích tốc độ, không phải cấu trúc object).

---

## 🧩 Cấu trúc

```
┌──────────────────────────────────────────────────┐
│  Flyweight (TreeType)                             │
│  ─ intrinsic state: name, color, texture          │
│  ─ immutable, dùng chung                          │
│                                                   │
│  FlyweightFactory                                  │
│  ─ Map<key, TreeType>                             │
│  ─ getTreeType(name, color, texture): TreeType    │
│    (có rồi → trả về chung, chưa → tạo mới)        │
│                                                   │
│  Context (Tree)                                   │
│  ─ extrinsic state: x, y                          │
│  ─ ref tới Flyweight: type                        │
│                                                   │
│  Client (Forest)                                  │
│  ─ List<Tree>, plantTree(x, y, type...)           │
└──────────────────────────────────────────────────┘
```

### Luồng hoạt động

```
Client: forest.plantTree(x, y, "Oak", "green", "...")
        → factory.getTreeType("Oak", ...) // có rồi → dùng chung
        → new Tree(x, y, sharedType)      // chỉ lưu tọa độ + ref
        → tree.render() // dùng type.draw(x, y)
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// Flyweight — state intrinsic dùng chung (immutable)
class TreeType {
  constructor(
    readonly name: string,
    readonly color: string,
    readonly texture: string,
  ) {}

  draw(x: number, y: number): void {
    console.log(`🌳 ${this.name} (${this.color}) tại (${x}, ${y})`);
  }
}

// Factory — đảm bảo mỗi intrinsic chỉ có 1 instance
class TreeTypeFactory {
  private types = new Map<string, TreeType>();

  getTreeType(name: string, color: string, texture: string): TreeType {
    const key = `${name}_${color}`;
    let type = this.types.get(key);
    if (!type) {
      type = new TreeType(name, color, texture);
      this.types.set(key, type);
    }
    return type;
  }

  count(): number { return this.types.size; }
}

// Context — chỉ giữ extrinsic + ref tới flyweight
class Tree {
  constructor(
    private x: number,
    private y: number,
    private type: TreeType,
  ) {}

  render(): void { this.type.draw(this.x, this.y); }
}

// Client
const factory = new TreeTypeFactory();
const forest: Tree[] = [];
forest.push(new Tree(10, 20, factory.getTreeType('Oak', 'green', 'oak.png')));
forest.push(new Tree(30, 40, factory.getTreeType('Oak', 'green', 'oak.png')));
console.log(factory.count()); // 1 — dùng chung dù 2 cây
```

**Real-world example — TextStyle trong editor:**

```typescript
// Intrinsic: font, size, màu (vài chục style) — dùng chung
// Extrinsic: vị trí ký tự (hàng vạn ký tự) — giữ riêng
class TextStyle {
  constructor(readonly font: string, readonly size: number) {}
}

class Character {
  constructor(private char: string, private style: TextStyle) {}
  renderAt(x: number, y: number): void { /* vẽ char với style */ }
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích | Giải thích sâu |
|---------|------------|----------------|
| 💾 **Tiết kiệm RAM** | Intrinsic chỉ lưu 1 lần, chia sẻ N object | 100.000 cây × 3 loài → từ 100.000 bản copy còn 3 TreeType. |
| ⚡ **Khởi tạo nhanh** | Tái dùng object có sẵn, ít allocation | Factory trả về ngay nếu đã có — không `new` lại. |
| 📦 **Mở rộng số lượng** | Thêm object rẻ (chỉ extrinsic) | Render rừng, map tile, particle — scale lên hàng triệu. |
| 🧩 **Tách intrinsic/extrinsic** | Ranh giới dữ liệu rõ ràng | Buộc thiết kế phân biệt cái gì chung, cái gì riêng. |
| 🔒 **Immutable an toàn** | Flyweight không đổi → share không sợ side-effect | Nhiều context đọc chung, không ai sửa được. |

---

## ⚠️ Lưu Ý

| Lưu ý | Giải thích | Giảm thiểu |
|-------|------------|------------|
| 🧠 **Phải tách được intrinsic/extrinsic** | Không phải bài toán nào cũng tách được | Nếu mọi field đều riêng biệt → Flyweight vô nghĩa. Chỉ dùng khi intrinsic lặp lại nhiều. |
| 🔒 **Flyweight phải immutable** | 1 object dùng chung mà bị sửa → hỏng toàn bộ | Dùng `readonly`, không expose setter; extrinsic truyền qua tham số method. |
| 🧵 **Thread-safety của Factory** | Nhiều luồng tạo flyweight cùng lúc → trùng lặp | Dùng lock / concurrent map khi tạo trong factory. |
| 🗺️ **Quản lý extrinsic** | Extrinsic nằm ngoài flyweight → client phải tự giữ | Document rõ: context giữ gì, flyweight giữ gì. |
| 📝 **Phức tạp hóa** | Thêm Factory + 2 loại state | Vài chục object → `new` thẳng đơn giản hơn. Chỉ dùng khi số lượng lớn + đo được tốn RAM. |

---

## 🎯 Khi nào dùng

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|---------|
| Hàng nghìn object có state lặp lại (cây, ký tự, tile, particle) | ✅ Rất phù hợp | Use case kinh điển của Flyweight. |
| Game: đạn, quái, hiệu ứng dùng chung sprite/model | ✅ Phù hợp | Intrinsic = asset, extrinsic = vị trí/máu. |
| Text editor: ký tự dùng chung TextStyle | ✅ Phù hợp | Vài chục style cho hàng vạn ký tự. |
| String interning, connection pool (ý tưởng tương tự) | ✅ Phù hợp | Chia sẻ resource tốn kém. |
| Số lượng object ít (< vài trăm) | ⚠️ Không cần | Overhead factory không đáng. |
| Mọi object đều khác nhau hoàn toàn | ❌ Không dùng | Không có intrinsic để chia sẻ. |
| Flyweight cần mutable theo từng context | ❌ Không dùng | Vi phạm immutable → bug lan toàn hệ thống. |

---

## 🔗 Liên quan

- **2.2.5 Composite** — Composite + Flyweight thường đi cùng: node lá dùng chung flyweight (ví dụ ký tự trong cây document).
- **2.2.6 Bridge** — Bridge tách 2 chiều hierarchy, Flyweight chia sẻ state lặp lại.
- **2.1.5 Prototype** — Prototype clone object tốn kém; Flyweight tránh tạo mới bằng cách chia sẻ.
- **2.1.1 Singleton** — Factory của Flyweight thường là Singleton (1 nơi quản lý pool).
- **5.x Caching** — Cache lưu kết quả tính toán; Flyweight lưu object dùng chung (ý tưởng tái sử dụng giống nhau).

**Flyweight trong TypeScript thực tế:**
- String interning của JS engine (string literal giống nhau dùng chung vùng nhớ)
- React: props/style object dùng chung giữa nhiều component
- Game engine: `THREE.InstancedMesh` (1 geometry + N transform)

---

## 📁 Cấu trúc thư mục

```
2.2.7-flyweight/
├── README.md           # File này
└── examples/
    └── index.ts        # Demo (chạy: npx ts-node examples/index.ts)
```

---

## ▶️ Chạy ví dụ

```bash
cd 02-design-patterns/2.2-structural/2.2.7-flyweight
npx ts-node examples/index.ts
```

---

## 📚 Tài liệu

- 📖 [Flyweight - Refactoring Guru](https://refactoring.guru/design-patterns/flyweight)
- 📖 [Flyweight - Source Making](https://sourcemaking.com/design_patterns/flyweight)
- 📖 [Design Patterns - GoF (Flyweight chapter)](https://en.wikipedia.org/wiki/Flyweight_pattern)

---

## ⏭️ Bài tiếp theo

→ [2.3 Behavioral Patterns](../../2.3-behavioral/README.md)
