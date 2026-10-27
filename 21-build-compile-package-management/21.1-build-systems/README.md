# 🛠️ 21.1 Build Systems (Hệ Thống Build)

> **Build system = bảng triển khai lệnh "đầu vào nào đổi thì chạy bước nào".**
> Tốt: chỉ biên dịch lại phần thay đổi (incremental build). Tồi: build lại tất cả
> mỗi lần lưu file — 45 phút chờ đợi mỗi vòng lặp dev.

> Liên quan: `18.5-compilers-interpreters` (compiler là 1 bước trong build),
> `19-frontend-performance` (bundler ảnh hưởng tốc độ tải), `21.2-package-managers`.

---

## 🎯 Vấn Đề

Project lớn = hàng nghìn file nguồn, mỗi file phụ thuộc một số file khác.
Build lại tất cả mỗi lần? Chậm chết. Bỏ sót file? Chạy code cũ. Build system
giải quyết bài toán **dependency graph + incremental + cache**:

```
main.o   ← main.c + main.h
utils.o  ← utils.c + utils.h        Nếu chỉ main.c đổi:
app     ← main.o + utils.o              → chỉ biên dịch main.o, link lại
                                        → tiết kiệm 90% thời gian
```

---

## 🧠 Phân Loại Build Systems

```
1. MAKEFILE QUỐC TẾ     : make, CMake (C/C++), GNU Make
   └─ declarative: "target: dependencies, recipe"
2. LANGUAGE-NATIVE      : Cargo (Rust), go build, npm scripts (JS), Gradle (JVM)
   └─ hiểu ngôn ngữ, quản dependency luôn
3. JS BUNDLERS          : webpack (cấu hình nặng), Vite/esbuild (nhanh, ESM-first),
                          Rollup (library), esbuild (Go, cực nhanh), Turbopack
4. MONOREPO BUILD       : Nx, Turborepo, Bazel — build cache giữa các team
```

---

## 💻 Code Ví Dụ

```makefile
# ===== Makefile: dự án C++ kinh điển =====
CXX = g++
CXXFLAGS = -Wall -O2 -std=c++20

app: main.o utils.o          # target: dependencies
	$(CXX) main.o utils.o -o app   # TAB, không phải space!

main.o: main.cpp utils.h
	$(CXX) $(CXXFLAGS) -c main.cpp

utils.o: utils.cpp utils.h
	$(CXX) $(CXXFLAGS) -c utils.cpp

clean:
	rm -f *.o app

.PHONY: clean  # clean không phải file thật
```

```json
// ===== npm scripts — build của JS world =====
{
  "scripts": {
    "dev": "vite",                       // dev server, HMR
    "build": "tsc -b && vite build",     // typecheck rồi bundle
    "lint": "eslint src --max-warnings 0",
    "test": "vitest run",
    "precommit": "npm run lint && npm test"
  }
}
// npm life-cycle: prebuild → build → postbuild chạy tự động
```

```yaml
# ===== Turborepo: cache build ở monorepo =====
# turbo.json — hash input (file + env) → nếu trùng lần trước, dùng cache
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["build"] }
  }
}
# Đổi 1 package → chỉ package đó và cái phụ thuộc nó build lại
```

---

## ⚖️ So Sánh Bundler JS

| Công cụ | Tốc độ | Cấu hình | Phù hợp |
|---|---|---|---|
| webpack | chậm | phức tạp | legacy, cấu hình sâu |
| Vite | rất nhanh (dev) | ít | SPA hiện đại |
| esbuild | nhanh nhất | ít | build library |
| Rollup | nhanh | trung bình | thư viện (tree-shaking tốt) |
| Turbopack/Rspack | nhanh | như webpack | Next.js, dự án lớn |

---

## ⚠️ Bẫy Thường Gặp

1. **Build không tái lập được (non-hermetic)** — phụ thuộc giờ hệ thống, env local → cache sai. Build phải deterministic.
2. **Quên `.PHONY` trong Makefile** — nếu có file tên `clean` thì `make clean` vô tác dụng.
3. **Tab vs space trong Makefile** — lỗi "missing separator" kinh điển.
4. **Cache key thiếu env** — đổi biến môi trường nhưng build cache vẫn trả artifact cũ.
5. **Commit build artifact** (`dist/`, `*.o`) vào git — luôn thêm vào `.gitignore`.
6. **Bundler bỏ código bằng dead-code elimination** — nhưng dùng `eval`/`new Function` thì tree-shaking vô dụng.

---

## 📝 Bài Tập Tự Vấn

1. Vì sao incremental build cần hash input chứ không chỉ mtime file?
2. Tại sao Vite dev server nhanh mà build prod vẫn cần bundling?
3. Monorepo 50 package: thiết kế cache để CI build từ 45 phút xuống < 5 phút.

---

*Leaf thuộc [Lớp 21 — Build, Compile & Package Management](../README.md)*
