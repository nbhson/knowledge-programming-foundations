# 🎲 7.10 Fuzz Testing (Kiểm Thử Ngẫu Nhiên)

> **Fuzz testing** ném hàng nghìn input ngẫu nhiên/biến dị vào chương trình để tìm crash, hang, exception — những chỗ test viết tay không bao giờ nghĩ tới.

---

## 🎯 Vấn đề

Test viết tay chỉ cover input "đẹp" mà developer nghĩ ra. Thực tế attacker/user gửi đủ thứ quái dị: chuỗi 10MB, emoji, số âm, JSON lồng 500 tầng:

```
parseUserInput('{"name": "Alice"}')  ✅ pass mọi unit test
parseUserInput('{"name": "\u0000..."}')  💥 crash production!
```

Fuzzer tự sinh input ngẫu nhiên + coverage-guided mutation (AFL, libFuzzer, fast-check) để đào crash.

---

## 💻 Code ví dụ

Mô phỏng fuzzer: sinh input ngẫu nhiên, ném vào parser, ghi lại input gây crash + rút gọn (minimize).

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

interface FuzzResult { crashes: string[]; runs: number }

// Parser "có bug": crash khi gặp byte NUL hoặc ngoặc không đóng
function parseConfig(input: string): string {
  if (input.includes("\u0000")) throw new Error("NUL byte crash!");
  let depth = 0;
  for (const ch of input) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth < 0) throw new Error("unbalanced brace");
  }
  if (depth !== 0) throw new Error("unclosed brace");
  return "ok";
}

// Fuzzer: seed corpus + random mutation × N vòng
function fuzz(seeds: string[], rounds: number): FuzzResult {
  const crashes = new Set<string>();
  for (let i = 0; i < rounds; i++) {
    const input = mutate(pick(seeds));
    try { parseConfig(input); } catch { crashes.add(input); }
  }
  return { crashes: [...crashes], runs: rounds };
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Tìm bug "không tưởng" | Crash từ input mà không developer nào viết tay được |
| Rẻ sau setup | Viết harness 1 lần, chạy hàng triệu input tự động (CI nightly) |
| Bảo mật | Fuzzer tìm ra lỗi parser/decoder trước attacker (Heartbleed-style) |

---

## ⚠️ Lưu Ý

- Fuzzing cần **harness**: hàm nhận `string/Buffer` và chạy nhanh (< ms) — không fuzz cả server khởi động 10s.
- Seed corpus tốt quyết định 80% hiệu quả: bắt đầu từ input hợp lệ thật, mutate dần.
- Crash phải **reproducible**: lưu input gây crash vào corpus (regression test) để không tái phát.
- Giới hạn thời gian + memory: fuzzer có thể treo máy nếu target leak.

---

## 🎯 Khi nào dùng

- Parser/decoder: JSON, CSV, URL, file format, protocol, regex, validation input.
- Thư viện dùng bởi nhiều người (attack surface rộng).
- Không dùng thay unit test: fuzz tìm crash, không kiểm tra logic đúng/sai (kết hợp property-based test như fast-check cho invariants).

---

## 🚀 Đi Sâu Thêm

**Fuzzing an toàn cho API — Schemathesis & Dredd:**

| Công cụ | Cách hoạt động | Input |
|---|---|---|
| **Schemathesis** | Đọc OpenAPI/GraphQL schema → sinh hàng nghìn request hợp lệ + biến dị theo type → gửi vào server thật | OpenAPI 3.x, GraphQL |
| **Dredd** | Chạy test suite từ API spec (HTTP requests theo spec) — phát hiện spec không khớp implementation | OpenAPI, API Blueprint |

- Schemathesis: chạy `schemathesis run https://api.example.com/openapi.yaml` → tự sinh test case, phát hiện 500, timeout, schema violation mà không cần viết test case tay. Khuyến khích: đặt base URL staging trong CI nightly.
- Dredd: chạy "CI contract test" từ spec — nhưng vì phát sinh từ spec chứ không phải consumer, nên nó gần provider-driven contract testing hơn.

**Coverage-guided vs dumb fuzzing:**

| Loại | Cách sinh input | Ưu điểm | Ví dụ |
|---|---|---|---|
| **Dumb** | Random thuần túy | Đơn giản | Fuzzilli (JS), basic fuzz cho parser đơn giản |
| **Coverage-guided** | Dựa trên edge coverage (khối code đã đi qua) | Tìm crash sâu hơn, nhanh hơn 10–100× | AFL++, libFuzzer, Honggfuzz |

- Dumb fuzzer vẫn có ích cho: regex, parser đơn giản, input size nhỏ.
- Coverage-guided cần corpus seed tốt (tập input hợp lệ thật) — seed quyết định phần lớn hiệu quả.

**OSS-Fuzz — continuous fuzzing cho open-source (Google):**
Hỗ trợ: C/C++/Go/Rust/Python/Java/Kotlin/Swift/... — miễn phí cho dự án open-source có significance. Submit qua https://issues.oss-fuzz.com, CI chạy 24/7, crash được tự động report vào OSS-Fuzz bug tracker. Nhiều CVE (Heartbleed, stdlibc++, ...) được phát hiện qua OSS-Fuzz.

---

## 🔗 Liên quan

- **7.1 Unit Testing** — mỗi crash fuzzer tìm ra nên thành 1 unit regression test.
- **7.11 Chaos Testing** — fuzz ở tầng input, chaos ở tầng hạ tầng.
- **9.1 OWASP Top 10** — injection chính là input độc mà fuzzing giúp phát hiện sớm.

---

## 📚 Tài liệu

- Fuzzing Book — https://www.fuzzingbook.org/
- fast-check (property-based JS) — https://github.com/dubzzz/fast-check
- AFL++ — https://aflplus.plus/

---

## ▶️ Chạy ví dụ

```bash
cd 07-testing/7.10-fuzz-testing
npx tsx examples/index.ts
```

Demo: fuzzer chạy 5000 vòng tìm crash parser → in input gây crash + minimize → biến crash thành regression seed.

---

## ⏭️ Bài tiếp theo

→ [7.11 Chaos Testing](../7.11-chaos-testing/README.md)
