# 📦 21.2 Package Managers (Quản Lý Gói)

> **Phần mềm hiện đại = code bạn + hàng trăm package người khác.** Package manager
> là người "download, kiểm tra, lắp ráp" tất cả — và cũng là con đường malware
> (typosquatting, supply chain attack) đi vào code bạn.

> Liên quan: `21.1-build-systems` (build sau khi cài), `09-security` (dependency vulnerability),
> `15-version-control/15.9-monorepo` (nhiều package trong 1 repo).

---

## 🎯 Vấn Đề

Cài package A, A cần B phiên bản ≥2, C cần B phiên bản 1.x — "dependency hell".
Package manager giải quyết bằng **resolution** + **lockfile** + **semver**.
Nhưng mỗi giải pháp mở ra câu hỏi mới: flat tree (npm) hay symlink (pnpm)?
Lockfile có đáng tin? Phân phối code ai kiểm tra?

```
"Works on my machine" ⇄ "Chưa commit package-lock.json"
Phantom dependency    ⇄  Dùng package không khai báo, nhờ cài lét từ package khác
Left-pad 2016         ⇄  11 dòng code bị gỡ → cả internet build fail
```

---

## 🧠 Resolution & Semver

```
SEMVER: MAJOR.MINOR.PATCH  (2.14.3)
  MAJOR  : breaking change
  MINOR  : thêm tính năng, tương thích ngược
  PATCH  : sửa bug

^2.14.0  → cho phép 2.x.x (khoá MAJOR)
~2.14.0  → cho phép 2.14.x (khoá MINOR)

RESOLUTION STRATEGIES (npm vs pnpm vs yarn):
  npm  : flat node_modules (hoisting) → phantom dependency
  pnpm : symlink về store global → CHỈ package khai báo mới import được
  yarn : flat + yarn.lock + workspaces
```

---

## 💻 Code Ví Dụ

```bash
# ===== npm / pnpm ngày thường =====
npm install express          # thêm dependency (prod)
npm install -D vitest        # devDependency — không đi vào production bundle
npm ci                       # cài ĐÚNG như lockfile (CI dùng, không resolve lại)
npm ls left-pad              # dependency tree — ai đang kéo nó vào?
npm audit                    # CVE check
npm dedupe                   # giảm duplicate trong tree

# ===== Lockfile = nguồn sự thật (commit vào git) =====
# package.json  : "express": "^4.18.0"  (khoảng cho phép)
# package-lock  : "express": "4.18.2" + integrity hash  (KHÓA chính xác)

# ===== pnpm: tiết kiệm disk, chống phantom =====
pnpm add express
# node_modules/.pnpm — store nội dung Dedup hard-link: 100 project dùng cùng
# express không tốn 100 lần bộ nhớ
```

```json
// ===== workspaces: monorepo trong 1 npm project =====
{
  "workspaces": ["apps/*", "packages/*"]
}
// import không cần publish lên npm — link nội bộ
```

```bash
# ===== Python: pip + venv (mỗi project 1 môi trường) =====
python -m venv .venv && source .venv/bin/activate
pip install requests==2.31.0
pip freeze > requirements.txt    # lock
```

---

## ⚖️ npm vs pnpm vs yarn

| Tiêu chí | npm | pnpm | yarn |
|---|---|---|---|
| Disk dùng | duplicate nhiều | hard-link store (tiết kiệm nhất) | flat |
| Phantom dependency | có | không | có |
| Tốc độ cài | trung bình | nhanh | nhanh |
| Lockfile | package-lock | pnpm-lock | yarn.lock |
| Monorepo | workspaces | tốt nhất | berry |

---

## ⚠️ Bẫy Thường Gặp

1. **Không commit lockfile** — mỗi người cài 1 kiểu, "works on my machine" kinh điển. Lockfile LUÔN commit.
2. **Phantom dependency** — dùng package chưa khai báo (chỉ nhờ hoisting). pnpm khử được.
3. **Peer dependency phiên bản lệch** — warning đỏ nhưng vẫn cài, runtime nổ bí ẩn.
4. **Supply chain attack** — package mới upload "sạch" rồi update bản sau cài malicious script. Giải: lockfile + audit + review dependency mới.
5. **Cài global để giải quyết vấn đề project** — môi trường team lệch nhau. Dùng lockfile + CI cài lại từ đầu.
6. **NaN version range ("latest")** — không lặp lại được build. Luôn lock exact cho production.

---

## 📝 Bài Tập Tự Vấn

1. Tại sao `npm ci` nhanh và an toàn hơn `npm install` trong CI?
2. Phantom dependency là gì? pnpm chặn nó bằng cách nào?
3. DevDep chứa malicious postinstall script — cơ chế nào hạn chế thiệt hại? (gợi ý: `--ignore-scripts`, allowlist)

---

*Leaf thuộc [Lớp 21 — Build, Compile & Package Management](../README.md)*
