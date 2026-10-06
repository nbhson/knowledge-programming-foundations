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

## ❌ BAD — thêm 1 case: commit từng phần, lỗi giữa chừng vẫn "xong một nửa"

```typescript
// ❌ BAD — không có ranh giới unit: bước 2 lỗi thì order mồ côi
async function checkoutBad(cart: Cart): Promise<void> {
  await orderRepo.save(toOrder(cart));      // ✅ xong
  await stockRepo.decrement(cart.items);    // ❌ lỗi ở đây...
  await auditRepo.log("checkout", cart);    // ...bước này không bao giờ chạy, order mồ côi
}

// ✅ GOOD — gom vào 1 unit: 1 bước lỗi → hoàn tác toàn bộ về savepoint
const uow = new UnitOfWork(store);
uow.registerNew(toOrder(cart));
uow.registerChanged(decrementedStock(cart));
uow.registerNew(auditEntry(cart));
uow.commit(); // all-or-nothing
```

> Dấu hiệu thiếu UoW: hàm service có **≥ 2 lần ghi** mà không có điểm rollback chung. 1 lần ghi → không cần UoW.

---

## ⚖️ Trade-off: unit of work vs các lựa chọn khác

| Lựa chọn | Khi nào hơn UoW | Khi nào thua |
|----------|-----------------|--------------|
| **DB transaction trực tiếp** (`BEGIN/COMMIT`) | Stack đã có ORM hỗ trợ transaction sẵn | Business logic dính API transaction của DB cụ thể |
| **Saga** (5.6.3, bù trừ từng bước) | Microservices, transaction phân tán không 2PC được | Phức tạp hơn nhiều; nội bộ 1 DB thì UoW đủ |
| **Ghi từng bước + reconcile job** | Hệ legacy không refactor được | Nhất quán cuối (eventual) — không dùng được cho tiền/kho |
| **Không UoW (ghi đơn)** | Chỉ 1 aggregate/1 lần ghi | Từ lần ghi thứ 2 trở đi là cần ranh giới unit |

---

## ⚠️ Pitfalls thường gặp

| Pitfall | Hậu quả | Cách tránh |
|---------|---------|------------|
| Unit quá to (ôm cả chục aggregate) | Commit nặng, lock lâu, conflict cao | 1 unit = 1 use-case, giữ nhỏ |
| Quên `rollback()` ở nhánh catch | Pending ops rò sang lần commit sau → ghi thừa | `try { commit } catch { rollback; throw }` thành idiom cố định |
| Đọc dữ liệu "tươi" giữa unit chưa commit | Logic quyết định trên dữ liệu nửa vời | Đọc qua UoW (thấy pending) hoặc cấm đọc giữa chừng |
| Lồng UoW trong UoW (nested commit) | Commit trong làm commit ngoài nửa chừng | 1 service call = 1 UoW ngoài cùng; bên trong chỉ register |

---

## ✅ Checklist khi review

- [ ] Mọi đường đi lỗi đều dẫn tới rollback (không đường nào "quên")?
- [ ] Commit là all-or-nothing có test chứng minh (fail giữa chừng → store nguyên vẹn)?
- [ ] Unit đủ nhỏ (1 use-case, không ôm cả thế giới)?
- [ ] Không lồng commit (chỉ UoW ngoài cùng được commit)?
- [ ] Sau commit/rollback, pending rỗng (không rò sang lần sau)?

---

## ▶️ Chạy ví dụ

```bash
cd 05-techniques-and-practices/5.8.2-unit-of-work
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo

→ [5.8.3 DTO](../5.8.3-dto/README.md)