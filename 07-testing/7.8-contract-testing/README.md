# 🤝 7.8 Contract Testing (Kiểm Thử Hợp Đồng)

> **Contract testing** đảm bảo consumer và provider **nói cùng một ngôn ngữ API** — consumer định nghĩa kỳ vọng (Pact), provider xác minh mình đáp ứng được, không cần deploy cả hai cùng lúc.

---

## 🎯 Vấn đề

Trong microservices, service A gọi service B qua API. Khi team B đổi response (xóa field, đổi type), team A vỡ mà không ai biết cho tới production:

```
OrderService ──GET /users/1──▶ UserService
  kỳ vọng: { id, name, email }
  thực tế sau deploy: { id, fullName }  → 💥 OrderService crash!
```

E2E test cả hệ thống thì chậm, flaky. Unit test riêng lẻ thì không phát hiện lệch contract.

---

## 💻 Code ví dụ

Mô phỏng Pact consumer-driven: consumer định nghĩa pact, provider verify bằng matching rules.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

interface PactInteraction {
  description: string;
  request: { method: string; path: string };
  response: { status: number; body: Record<string, unknown> };
}

// Consumer định nghĩa kỳ vọng (pact file)
const pact: PactInteraction = {
  description: "lấy user để tạo order",
  request: { method: "GET", path: "/users/1" },
  response: { status: 200, body: { id: 1, name: "Alice", email: "a@b.com" } },
};

// Provider verify: so khớp type + required fields, bỏ qua field thừa
function verify(actual: unknown, expected: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const [k, v] of Object.entries(expected)) {
    if (!(k in (actual as object))) errors.push(`thiếu field "${k}"`);
    else if (typeof (actual as Record<string, unknown>)[k] !== typeof v)
      errors.push(`sai type field "${k}"`);
  }
  return errors; // [] = pass
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Phát hiện breaking change sớm | Provider CI chạy `pact verify` trước khi merge — biết ngay nếu xóa field consumer cần |
| Không cần môi trường tích hợp | Consumer test với mock, provider test với pact file — deploy độc lập |
| Tài liệu sống | Pact file chính là spec API mà cả hai bên đồng ý |

---

## ⚠️ Lưu Ý

- Contract test **không thay** E2E: nó chỉ check shape/contract, không check business logic end-to-end.
- Pact broker cần versioning: mỗi consumer version publish pact riêng; provider verify ma trận tương thích.
- Tránh contract quá chặt (exact body match): dùng matching rules (type-based) để provider được thêm field mới mà không vỡ.

---

## 🎯 Khi nào dùng

- Microservices ≥ 2 team sở hữu service khác nhau gọi nhau qua HTTP/message.
- Muốn deploy độc lập từng service mà không họp "đồng bộ API" mỗi sprint.
- Không dùng khi: monolith 1 team, hoặc API public cho bên thứ ba (dùng OpenAPI + versioning thay vì Pact).

---

## 🔗 Liên quan

- **7.2 Integration Testing** — contract test nằm giữa unit và integration trong testing sphinx.
- **11.2 REST API** — contract chính là REST resource shape + versioning.
- **8.2 GitHub Actions** — chạy `pact verify` trong CI của provider.

---

## 📚 Tài liệu

- Pact Docs — https://docs.pact.io/
- Pact Specification — https://github.com/pact-foundation/pact-specification
- *Growing Object-Oriented Software, Guided by Tests* — Freeman & Pryce (mock/contract roots)

---

## ▶️ Chạy ví dụ

```bash
cd 07-testing/7.8-contract-testing
npx ts-node examples/index.ts
```

Demo: consumer định nghĩa pact → provider pass → provider đổi field (vỡ contract) → sửa bằng matching rule linh hoạt.

---

## ⏭️ Bài tiếp theo

→ [7.9 Snapshot Testing](../7.9-snapshot-testing/README.md)
