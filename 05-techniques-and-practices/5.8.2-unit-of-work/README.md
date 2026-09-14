# 🔄 5.8.2 Unit of Work

> Gộp NHIỀU thao tác dữ liệu thành MỘT nhóm (unit): `commit()` áp dụng toàn bộ hoặc hoàn tác toàn bộ khi 1 bước lỗi; `rollback()` hủy nhóm. Tránh "order được tạo nhưng kho không trừ".

---

## 🎯 Vấn đề

```
❌ Từng thao tác ghi rời rạc:
   1. insert order       ✅ thành công
   2. decrement kho      ❌ lỗi
   → order tồn tại nhưng kho không trừ — dữ liệu mất nhất quán

✅ Unit of Work:
   registerNew(order) → registerChanged(stock) → registerNew(log)
   commit(): áp dụng cả nhóm, hoặc hoàn tác cả nhóm về savepoint
```

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
class UnitOfWork {
  private pending: Operation[] = [];
  constructor(private readonly store: DataStore) {}

  registerNew(product: Product): void { this.pending.push({ kind: "insert", product }); }
  registerChanged(product: Product): void { this.pending.push({ kind: "upsert", product }); }
  registerDeleted(id: string): void { this.pending.push({ kind: "remove", id }); }

  commit(): void {
    const savepoint = this.store.snapshot();
    try {
      for (const op of this.pending) { /* áp dụng từng op */ }
      this.pending = [];
    } catch (error) {
      this.store.restore(savepoint); // hoàn tác toàn bộ
      this.pending = [];
      throw error;
    }
  }

  rollback(): void { this.pending = []; }
}
```

---

## ✅ Lợi ích

| Lợi ích | Giải thích |
|---------|------------|
| 🧱 **Atomicity** | Cả nhóm thành công hoặc không gì xảy ra |
| 🧠 **Dễ dùng** | Service đăng ký thao tác, không quản lý transaction thủ công |
| 🐞 **Ít lỗi nhất quán** | Không còn "ghép 1 nửa" khi có bước fail |

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.8.2-unit-of-work
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.8.3 DTO](../5.8.3-dto/README.md)