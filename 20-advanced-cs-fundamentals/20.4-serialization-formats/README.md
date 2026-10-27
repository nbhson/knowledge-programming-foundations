# 📦 20.4 Serialization Formats (Định Dạng Serialize)

> **Dữ liệu trong RAM ≠ dữ liệu di chuyển được.** Object, struct, class chỉ tồn tại
> trong process. Muốn lưu file, gửi qua network, hay cache — phải "đóng gói" thành
> byte. Serialization format là hợp đồng giữa 2 hệ thống: chọn sai format là mất
> hiệu năng, mất schema versioning, hoặc mất cả dữ liệu.

> Liên quan: `11-networking-apis` (REST/GraphQL dùng JSON), `20.3-floating-point-precision`
> (precision qua serialize), `12-concurrency` (backpressure khi transfer lớn).

---

## 🎯 Vấn Đề

Service Go gửi struct sang service TS: field tên gì? số là int hay float? null hay
thiếu field? ngày tháng là ISO string hay epoch ms? Không có quy ước rõ = dữ liệu
lệch im lặng. Mỗi format là một bài trade-off:

```
Đọc được người (JSON, YAML)  ⇄  Nhỏ & nhanh (Protobuf, Avro)
Có schema chặt (Avro, Protobuf)  ⇄  Linh hoạt (JSON, YAML)
Human-friendly debug (JSON)      ⇄  Binary compact (Protobuf ~3-10x nhỏ hơn)
```

---

## 🧠 Sơ Đồ Bức Tranh

```
┌────────────────────────────────────────────────────────────┐
│                  SERIALIZATION FORMATS                     │
├────────────────────────────────────────────────────────────┤
│  TEXT (đọc được):                                          │
│    JSON ── API, config, log           (de facto)           │
│    XML  ── SOAP, legacy enterprise    (rườm rà)            │
│    YAML ── Docker, K8s, CI config     (dễ ghi, dễ lỗi)     │
│    TOML ── Cargo, pyproject           (cân bằng)           │
│                                                            │
│  BINARY (nhanh, nhỏ):                                      │
│    Protobuf ── gRPC, microservices   (schema .proto)       │
│    Avro   ── Kafka stream            (schema registry)     │
│    MessagePack ── thay JSON khi cần nhỏ (không schema)     │
└────────────────────────────────────────────────────────────┘
```

---

## 💻 Code Ví Dụ

```typescript
// ===== JSON: đơn giản nhưng có 3 bẫy =====
const data = {
  createdAt: new Date("2026-01-01"),   // Date → serialize thành STRING
  id: 9007199254740993n,               // BigInt → JSON.stringify CRASH!
  meta: undefined,                      // undefined → bị MẤT
  fn: () => 1,                          // function → bị bỏ
};
// JSON.stringify(data) → TypeError: Do not know how to serialize a BigInt

// Cách đúng: tự chuyển kiểu trước
const safe = {
  ...data,
  createdAt: data.createdAt.toISOString(),
  id: data.id.toString(),
};
const json = JSON.stringify(safe); // OK
// Bẫy round-trip: JSON.parse(json) mất thông tin kiểu — createdAt giờ là string!
// (JSON.parse có "reviver", JSON.stringify có "replacer" để xử lý)

// ===== JSON.stringify third argument: pretty print =====
console.log(JSON.stringify(safe, null, 2));

// ===== Bảo mật: prototype pollution khi parse input không tin cậy =====
const evil = '{"__proto__": {"admin": true}}';
const obj = JSON.parse(evil);
// "__proto__" của object không phải field bình thường — một số parser cũ merge đúp
// → GLOBAL prototype bị đổi! Luôn dùng JSON.parse mặc định (an toàn),
// không dùng eval, và validate schema đầu vào (xem 23.5-json-schema-validation)

// ===== Kiểm soát field qua replacer =====
const user = { name: "Sơn", password: "secret", email: "a@b.c" };
const safeJson = JSON.stringify(user, ["name", "email"]); // không leak password

// ===== Cấu trúc so sánh: cùng dữ liệu 3 format =====
// JSON      : {"name":"Bob","age":30}     → 23 bytes, đọc được, không schema
// XML       : <person><name>Sơn</name>... → 60+ bytes, namespace
// Protobuf  : [binary ~10 bytes]          → schema .proto bắt buộc, nhanh nhất
```

---

## ⚖️ So Sánh Các Định Dạng

| Định dạng | Kích thước | Tốc độ | Schema | Dùng cho |
|---|---|---|---|---|
| JSON | lớn | chậm | không bắt buộc | API web, config đơn giản |
| XML | lớn nhất | chậm | XSD | SOAP, ngân hàng legacy |
| YAML | trung bình | chậm | không | K8s, Docker, CI |
| TOML | trung bình | nhanh | không | Cargo, pyproject |
| Protobuf | nhỏ nhất | nhanh nhất | bắt buộc (.proto) | gRPC, mobile → server |
| Avro | nhỏ | nhanh | bắt buộc, registry | Kafka stream |
| MessagePack | nhỏ | nhanh | không | cache, game |

---

## ⚠️ Bẫy Thường Gặp

1. **Date/BigInt qua JSON** — mất kiểu. Chuẩn hóa: ISO 8601 string cho ngày, string cho số > 2^53.
2. **Circular reference** — `JSON.stringify` ném TypeError. Dùng `superjson`/`flatted` hoặc phá vòng tham chiếu.
3. **`undefined` vs `null` khi serialize** — object field undefined bị xóa, null được giữ → schema API lệch.
4. **Float key** — `JSON.stringify({1: "a"})` → `{"1":"a"}` (key về string).
5. **Forward compatibility** — Protobuf: chỉ thêm field mới với số tag mới, KHÔNG tái dùng tag cũ (dữ liệu cũ hiểu nhầm).
6. **Đổi schema không backward-compat** — middleware ăn message cũ chết hàng loạt. Luôn kiểm tra từ consumer.

---

## 📝 Bài Tập Tự Vấn

1. Serialize Date qua JSON an toàn và parse ngược được (reviver).
2. Tại sao gRPC dùng Protobuf thay vì JSON? 3 lý do định lượng.
3. Schema evolution: thêm field bắt buộc vào Protobuf mà không phá consumer cũ — làm sao?

---

*Leaf thuộc [Lớp 20 — Advanced CS Fundamentals](../README.md)*
