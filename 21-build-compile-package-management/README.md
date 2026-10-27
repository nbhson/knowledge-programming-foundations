# 🏗️ Lớp 21: Build, Compile & Package Management (Build & Đóng Gói)

> **Từ "viết code" đến "code chạy được" là cả một hành trình:** biên dịch, link,
> resolve dependency, đóng gói, quản lý cấu hình. Mỗi ngôn ngữ có hệ sinh thái riêng
> nhưng nguyên lý chung — hiểu nguyên lý thì nhảy ngôn ngữ nào cũng nhanh.

> Liên quan: `18.5-compilers-interpreters` (nó dịch code thế nào), `08-devops-cicd`
> (đưa build vào pipeline), `20.4-serialization-formats` (format lockfile).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 21.1 | Build Systems | Make, CMake, npm scripts, Vite, Gradle | [21.1-build-systems](21.1-build-systems/README.md) |
| 21.2 | Package Managers | npm/pnpm, pip, Cargo, dependency resolution | [21.2-package-managers](21.2-package-managers/README.md) |
| 21.3 | CLI & Shell Scripting | Bash, pipes, exit code, env vars | [21.3-cli-shell-scripting](21.3-cli-shell-scripting/README.md) |
| 21.4 | Configuration Management | ENV, config loading, validation, secrets | [21.4-configuration-management](21.4-configuration-management/README.md) |

---

## 📖 Tổng Quan

```
SOURCE CODE
    │
    ▼
BUILD SYSTEM (21.1) ── compiler, bundler, transpiler
    │                    node_modules? dist/?
    ▼
PACKAGE MANAGER (21.2) ── resolve + lock dependency
    │
    ▼
ARTIFACT (binary/bundle)
    │
    ▼
RUNTIME đọc CONFIG (21.4) ── env, flags, secrets
    │
    ▼
CLI/SHELL (21.3) ── nơi tất cả công cụ trên được gọi hàng ngày
```

---

## 🎯 Khi Nào Cần Đến Đây?

| Tình huống | Folder cần đọc |
|---|---|
| "Chạy được trên máy tôi" — khoác lác environment | 21.4 Configuration |
| `npm install` 20 phút vì dependency cài lung tung | 21.2 Package Managers |
| Build 45 phút, đổi 1 dòng cũng build lại cả | 21.1 Build Systems |
| Script bash tự chết giữa chừng, không rõ lỗi gì | 21.3 CLI & Shell |
| Build local OK nhưng CI failed | 21.4 (env diff) + 08-devops |

---

## 🔗 Liên Kết Chéo

- **Compiler hoạt động bên trong:** `18.5-compilers-interpreters`
- **CI/CD chạy build tự động:** `08-devops-cicd/8.2-github-actions`
- **Treo server do config sai:** `22-debugging-logging-profiling`

---

## 📖 Tài Nguyên Tham Khảo

- *The Pragmatic Programmer* — chương build automation
- Docs chính thức: npm/pnpm, Cargo Book, Maven, Gradle
- *Missing Semester of Your CS Education* (MIT) — shell, git, build tools
