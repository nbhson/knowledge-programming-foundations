# 🧬 4.8 Generic Programming (Lập Trình Tổng Quát)

> **Generic Programming** viết code **một lần, dùng cho mọi kiểu** — container, thuật toán, repository hoạt động với `T` trừu tượng, compiler kiểm tra kiểu **ngay lúc biên dịch** thay vì crash lúc runtime.

---

## 🎯 Vấn đề

Không generics, bạn có 2 lựa chọn tệ:

```
❌ Copy-paste cho từng kiểu:
   class StringStack { push(s: string) ... }
   class NumberStack { push(n: number) ... }   // logic giống hệt, nhân đôi code

❌ Dùng any — mất an toàn kiểu:
   class LooseStack { push(x: any) ... }
   const s = stack.pop(); s.toFixed(2);  // 💥 crash nếu phần tử là string
```

```typescript
// ✅ Generic — 1 class, mọi kiểu, vẫn type-safe
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
}

const names = new Stack<string>();
names.push("ann");       // ✅
names.push(42);          // ❌ lỗi biên dịch — bắt được ngay, không đợi runtime
```

---

## 📚 Generics Cốt Lõi Trong TS

### 1. Type parameter + constraints

```typescript
// T bị ràng buộc: phải có field id (extends = "ít nhất có hình dạng này")
interface Entity { id: string; }

function findById<T extends Entity>(items: T[], id: string): T | undefined {
  return items.find((i) => i.id === id);
}

// keyof — key phải là key thật của T (chống typo "nmae")
function getField<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
getField({ name: "a" }, "name");  // ✅
getField({ name: "a" }, "nmae");  // ❌ lỗi biên dịch
```

### 2. Generic repository — ví dụ thực tế nhất

```typescript
// 1 interface kho chứa cho MỌI entity có id
interface Repository<T extends Entity, ID = string> {
  save(entity: T): T;
  findById(id: ID): T | undefined;
  findAll(): T[];
  delete(id: ID): void;
}

// Cài đặt InMemory dùng chung cho User, Product, Order...
class InMemoryRepository<T extends Entity> implements Repository<T> {
  private store = new Map<string, T>();
  save(e: T): T { this.store.set(e.id, e); return e; }
  findById(id: string): T | undefined { return this.store.get(id); }
  findAll(): T[] { return [...this.store.values()]; }
  delete(id: string): void { this.store.delete(id); }
}

const users = new InMemoryRepository<User>();       // kho User
const products = new InMemoryRepository<Product>(); // kho Product — 0 dòng logic mới
```

---

## 📐 Variance — Khi Nào `Box<Cat>` Là `Box<Animal>`?

**Variance** trả lời: quan hệ kế thừa của `T` có "lan" sang container `C<T>` không?

| Variance | Nghĩa | Ví dụ TS |
|----------|-------|----------|
| **Covariant** ✅ lan theo | `Cat extends Animal` → `C<Cat>` gán được cho `C<Animal>` | `Array<Cat>` → `Array<Animal>` (TS cho phép — nhưng **không an toàn**, push Dog vào mảng Cat!) |
| **Contravariant** 🔄 lan ngược | `C<Animal>` gán được cho `C<Cat>` | Tham số hàm dưới `strictFunctionTypes`: `(a: Animal) => void` gán được cho `(c: Cat) => void` ✅ (hàm nhận Animal chắc chắn xử lý được Cat) |
| **Invariant** 🔒 không lan | Phải đúng kiểu y hệt | `(c: Cat) => void` KHÔNG gán được cho `(a: Animal) => void` ❌ (hàm chỉ biết Cat có thể fail với Animal) |

```typescript
class Animal { constructor(public name = "") {} }
class Cat extends Animal { meow(): string { return "meow"; } }

// ❌ NGUY HIỂM nhưng TS cho qua (array covariant):
const cats: Cat[] = [new Cat()];
const animals: Animal[] = cats;   // TS ok
animals.push(new Animal());       // 💥 mảng "cats" giờ chứa Animal không biết meow!

// ✅ AN TOÀN — hàm là contravariant ở tham số (strict mode):
let handleCat: (c: Cat) => void = (a: Animal) => console.log(a.name); // ✅ nhận Animal xử lý được Cat
// let handleAnimal: (a: Animal) => void = (c: Cat) => c.meow();       // ❌ lỗi biên dịch đúng đắn
```

> 💡 Bài học thực tế: **đọc từ container ra** → muốn covariance; **ghi vào container / nhận tham số** → muốn contravariance. Nhầm lẫn = bug runtime mà compiler không bắt.

---

## 💻 Demo Trong Examples

[`examples/index.ts`](examples/index.ts) chạy 3 phần:

1. **`Stack<T>` generic** — push/pop type-safe cho `string` và `Order`, kèm hàm `lastOrThrow<T>` + `getField` với `keyof`.
2. **`InMemoryRepository<T extends Entity>`** — cùng 1 class làm kho cho `User` và `Product`; service chỉ phụ thuộc interface.
3. **Variance runtime** — tái hiện bug array-covariant (push Animal vào mảng Cat) và kiểm tra contravariance của handler an toàn.

---

## ✅ Ưu điểm

| Ưu điểm | Giải thích |
|---------|------------|
| ♻️ **Viết 1 lần** | Stack/Repository/sort dùng cho mọi kiểu |
| 🛡️ **Type-safe** | Sai kiểu báo lúc biên dịch, không crash runtime |
| 📖 **Tự tài liệu** | `Repository<User>` nói rõ chứa gì hơn `Repository` |
| ⚡ **Zero-cost (TS)** | Generics bị xóa khi compile — không tốn runtime |

## ⚠️ Nhược điểm

| Nhược điểm | Giải thích |
|------------|------------|
| 🧠 **Variance khó** | Array covariant gây bug lén (xem ví dụ trên) |
| 📜 **Error message rối** | Lỗi generic lồng nhau khó đọc |
| 🚫 **Không phải vạn năng** | Logic phụ thuộc kiểu cụ thể vẫn cần overload/narrowing |

---

## 🔗 Liên quan

- **4.1 OOP** — Generics + inheritance + interface = combo repository/stack
- **5.8.1 Repository Pattern** — Ứng dụng generics trực tiếp
- **5.12.5 Function Composition** — `pipe`/`compose` cũng generic

---

## 📚 Tài liệu tham khảo

- 📖 [TS Handbook — Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- 📖 [Variance — Wikipedia](https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science))

---

## ▶️ Chạy ví dụ

```bash
cd 04-paradigms/4.8-generic-programming
npx ts-node examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [6.1 Time Complexity](../../06-data-structures-and-algorithms/6.1-time-complexity/README.md)
