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
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

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
npx ts-node examples/index.ts
```

Demo: fuzzer chạy 5000 vòng tìm crash parser → in input gây crash + minimize → biến crash thành regression seed.

---

## ⏭️ Bài tiếp theo

→ [7.11 Chaos Testing](../7.11-chaos-testing/README.md)
