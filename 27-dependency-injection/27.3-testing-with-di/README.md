# 🧪 27.3 Testing with DI (Test Với DI)

> **DI là nền tảng của test đáng tin cậy:** khi dependency là interface,
> test thay thế bằng mock — không cần database thật, không cần gửi email thật.
> Test nhanh (ms thay vì ms), deterministic, không phụ thuộc network/disk.

---

## 💻 Code Ví Dụ

```typescript
// ===== Mock đơn giản bằng tay =====
class MockDB implements IDatabase {
  private store = new Map<string, object>();
  findOne = vi.fn((id: string) => Promise.resolve(this.store.get(id)));
  insert  = vi.fn((data: object) => Promise.resolve());
}
class MockEmail implements IEmail {
  sent: Array<{to: string; body: string}> = [];
  send = vi.fn((to: string, body: string) => { this.sent.push({to, body}); });
}

const db = new MockDB();
db.store.set("ORD-1", { email: "son@example.com" });
const email = new MockEmail();
const svc = new OrderService(db, email);

await svc.place("ORD-1");

expect(db.findOne).toHaveBeenCalledWith("ORD-1");
expect(email.send).toHaveBeenCalledWith("son@example.com", expect.stringContaining("placed"));

// ===== Dùng DI để test integration cụ thể =====
test("OrderService thật + real DB", async () => {
  const realDb = new PostgresDB(process.env.TEST_DB_URL!);
  const email = new MockEmail(); // chỉ mock email, DB thật
  const svc = new OrderService(realDb, email);
  // test kịch bản khó mock: transaction, constraint...
});

// ===== Test fixture với DI container =====
const testContainer = baseContainer.register("db", () => new TestDB());
const svc = testContainer.get(OrderService);
```

---

## ⚖️ Mock vs Spy vs Stub vs Fake

| | Tạo giá trị? | Có logic? | Dùng khi |
|---|---|---|---|
| Stub | ✓ | ✗ | trả lời đầu vào cố định |
| Spy | ✓ | ✓ (ghi lại) | cần kiểm tra "có gọi không" |
| Mock | ✓ | có kỳ vọng | kỳ vọng rõ, dùng mock library |
| Fake | ✓ | ✓ (như thật) | impl đơn giản hóa (InMemoryDB) |

---

*Leaf thuộc [Lớp 27 — Dependency Injection](../README.md)*