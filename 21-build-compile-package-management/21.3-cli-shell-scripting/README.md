# 🐚 21.3 CLI & Shell Scripting (Dòng Lệnh & Script)

> **Shell là "glue" của mọi hệ thống:** deploy, backup, ETL, cron job — phần lớn
> là script bash. Viết shell kém = script chết nửa đường, exit code sai, pipeline
> CI im lặng báo xanh.

> Liên quan: `21.1-build-systems` (make gọi shell), `08-devops-cicd` (pipeline là shell),
> `24-file-systems-io` (redirect, descriptor).

---

## 🎯 Vấn Đề

```bash
# Script "dễ hiểu" này có 3 bug chết người — tìm ra chưa?
cd build
rm -rf $FILES
deploy $TARGET
```
1. `cd` fail (thư mục không tồn tại) → tiếp tục chạy ở sai chỗ → `rm -rf` nơi khác!
2. `$FILES` có space → tách 2 đối số → xóa nhầm
3. `deploy` fail → script vẫn exit 0 → CI báo xanh trong khi chưa deploy

---

## 🧠 Nguyên Tắc Vàng

```
set -euo pipefail   # mở đầu mọi script nghiêm túc
  -e : lệnh nào fail → thoát ngay (không im lặng chạy tiếp)
  -u : biến chưa khai báo → lỗi (thay vì rỗng êm đềm)
  -o pipefail : pipe fail nếu BẤT KỲ lệnh nào trong pipe fail
```

Mọi command trả exit code: `0` thành công, khác 0 thất bại. `$?` là code lệnh vừa chạy.
Exit code là **hợp đồng** giữa script và người gọi nó (CI, cron, systemd).

---

## 💻 Code Ví Dụ

```bash
#!/usr/bin/env bash
# ===== Template script production =====
set -euo pipefail
IFS=$'\n\t'   # chỉ newline/tab là phân tách — chống space trong tên file

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly BACKUP_DIR="/var/backups/myapp"

log()   { echo "[$(date '+%F %T')] $*" >&2; }  # log ra stderr, không làm bẩn stdout
die()   { log "ERROR: $*"; exit 1; }

[ -d "$SCRIPT_DIR" ] || die "Thư mục script không tồn tại"
[ -d "$BACKUP_DIR" ] || die "Backup dir $BACKUP_DIR không có"

# ===== Pipe: stdout lệnh trước → stdin lệnh sau =====
# cat = concatenate; grep lọc; sort sắp; uniq đếm trùng
grep -h "ERROR" /var/log/app/*.log | awk '{print $1}' | sort | uniq -c | sort -rn

# ===== xargs: chuyển stdin thành đối số =====
find . -name "*.tmp" -mtime +7 -print0 | xargs -0 rm -f   # -0 xử lý tên có space

# ===== Trap: dọn dẹp dù thành công hay crash =====
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT   # luôn chạy khi script thoát

# ===== Env vars: giá trị mặc định =====
: "${PORT:=3000}"              # PORT rỗng/chưa set → gán 3000
ENV="${ENVIRONMENT:-dev}"      # dùng tạm, không ghi đè

# ===== Hàm trả exit code + output =====
is_port_open() {
  nc -z localhost "$1" >/dev/null 2>&1   # output bỏ, chỉ nhìn exit code
}
is_port_open 3000 && log "Port 3000 mở" || log "Port 3000 đóng"
```

```typescript
// ===== Spawn process từ Node: exit code vẫn là hợp đồng =====
import { execSync, spawnSync } from "node:child_process";
try {
  const out = execSync("git rev-parse HEAD", { encoding: "utf8" });
  console.log("HEAD:", out.trim());
} catch (e) {
  console.error("Git command failed, exit:", (e as { status?: number }).status);
}
// spawnSync cho dữ liệu nhạy cảm: truyền env riêng, không dùng shell=true (xem 9-security)
```

---

## ⚖️ Bash vs Python/TS Script

| Tiêu chí | Bash | Python/TS |
|---|---|---|
| Glue lệnh hệ thống | ✓ tự nhiên | cần wrapper |
| Logic phức tạp | khổ sở | ✓ |
| Xử lý JSON | jq (thêm dep) | ✓ native |
| Tính di động | POSIX shell có sẵn | cần runtime |
| Khi nào dùng | < 100 dòng, gọi lệnh hệ | logic nhiều, có test |

---

## ⚠️ Bẫy Thường Gặp

1. **`rm -rf $VAR`** khi VAR rỗng → `rm -rf /`! Luôn quote: `"$VAR"`, và check biến có giá trị trước.
2. **Không có `set -e`** — lệnh giữa chừng fail, script vẫn "thành công".
3. **Pipe ẩn lỗi:** `grep x file | wc -l` — grep fail vẫn đi tiếp nếu không có pipefail.
4. **`$?` bị ghi đè** bởi lệnh ngay sau nó — lưu vào biến nếu cần dùng lại.
5. **Shebang sai:** `#!/bin/sh` nhưng dùng cú pháp bash → chạy trên dash (Debian) nổ. Dùng `#!/usr/bin/env bash`.
6. **eval input không tin cậy** — command injection. Tránh `eval` hoàn toàn.

---

## 📝 Bài Tập Tự Vấn

1. Viết script backup DB: dump, nén, giữ 7 bản gần nhất, log ra stderr, exit code đúng.
2. `set -e` không bắt được lỗi gì? (gợi ý: lệnh trong if, command trong pipe khi không pipefail)
3. Viết 1 dòng: đếm 10 IP bị chặn nhiều nhất trong nginx access log.

---

*Leaf thuộc [Lớp 21 — Build, Compile & Package Management](../README.md)*
