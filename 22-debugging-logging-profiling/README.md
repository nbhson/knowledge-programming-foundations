# 🐛 Lớp 22: Debugging, Logging & Profiling (Gỡ Lỗi & Quan Sát)

> **Code sai là chuyện bình thường — không BIẾT nó sai ở đâu mới là chuyện to.**
> Debugging là khoa học phát hiện giả thuyết; logging là trái tim của observability;
> profiling là chỉ ra vân tay của CPU/memory.

> Liên quan: `08.9-observability` (metric/tracing ở mức hệ thống), `14.3-error-handling`
> (xử lý lỗi đúng để debug dễ), `21.4-configuration-management` (config sai = nguyên nhân phổ biến).

---

## 📚 Mục Lục

| # | Chủ Đề | Trọng Tâm | Link |
|---|--------|----------|------|
| 22.1 | Debugging Strategies | Giả thuyết, binary search bug, rubber duck | [22.1-debugging-strategies](22.1-debugging-strategies/README.md) |
| 22.2 | Logging Best Practices | Level, structured log, correlation ID | [22.2-logging-best-practices](22.2-logging-best-practices/README.md) |
| 22.3 | Profiling | CPU, memory, flame graph | [22.3-profiling](22.3-profiling/README.md) |
| 22.4 | Error Monitoring | Sentry, alerting, crash report | [22.4-error-monitoring](22.4-error-monitoring/README.md) |

---

## 📖 Tổng Quan

```
BUG XẢY RA
    │
    ▼
NGƯỜI DÙNG BÁO? ──► 22.4 Error Monitoring bắt lỗi tự động (Sentry)
    │
    ▼
ĐỌC LOG (22.2) ── structured, có correlation ID
    │
    ▼
REPRODUCE + DEBUG (22.1) ── debugger, breakpoint, git bisect
    │
    ▼
CHẬM? ──► 22.3 Profiling ── đo trước, sửa sau
```

---

## 🎯 Quy Trình Săn Bug Chuẩn

```
1. REPRODUCE      — làm bug xuất hiện lại 100% (không tái hiện = không sửa được)
2. ISOLATE        — thu hẹp phạm vi: module nào? commit nào? input nào?
3. HYPOTHESIS     — đặt giả thuyết CÓ THỂ SAI (nếu không thể sai → không phải giả thuyết)
4. EXPERIMENT     — log/breakpoint chứng minh/thất bại giả thuyết
5. FIX + TEST     — sửa + viết test chặn bug này không quay lại
```

---

## 🔗 Liên Kết Chéo

- **Log/metric/tracing tổng thể:** `08-devops-cicd/8.9-observability`
- **Xử lý lỗi đúng cách:** `14-clean-code/14.3-error-handling`
- **Circuit breaker, retry:** `05.6-error-handling-techniques`

---

## 📖 Tài Nguyên Tham Khảo

- *Debugging: The 9 Indispensable Rules* — David Agans
- *Systems Performance* — Brendan Gregg (profiling)
- Chrome DevTools / VS Code debugger docs, Flame Graphs (Brendan Gregg)
