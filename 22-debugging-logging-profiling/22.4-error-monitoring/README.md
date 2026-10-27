# 🚨 22.4 Error Monitoring (Giám Sát Lỗi)

> **Người dùng là hệ thống báo lỗi tốt nhất — nếu bạn nghe được.** Sentry/crash
> reporting bắt lỗi trước khi khách complaint, gom stack + context + tần suất.
> Không có nó = bạn chỉ biết app lỗi khi khách tweet.

> Liên quan: `22.2-logging-best-practices` (log ngữ cảnh), `08.10-sre-slo`
> (SLO quyết định khi nào alert), `14.3-error-handling` (đẩy lỗi đúng cách).

---

## 🎯 Vấn Đề

```
Bug xảy ra trên máy user:
  ├─ không có log local   → bạn không thấy gì
  ├─ không có stack trace  → không biết chết ở đâu
  ├─ user không báo       → âm thầm mất khách
  └─ báo "không rõ"       → không tái hiện được

Error monitoring giải quyết: capture 24/7, gom nhóm (grouping),
đếm tần suất, gắn release tag, cảnh báo khi vượt ngưỡng.
```

---

## 🧠 Vòng Đời Một Lỗi

```
LỖI XẢY RA (client/server)
    │
    ▼
CAPTURE ── Sentry SDK bắt lỗi chưa xử lý + stack trace + breadcrumbs
    │
    ▼
ENRICH ── gắn context: userId, release version, env, request info
    │
    ▼
GROUP ── gộp lỗi giống nhau (fingerprint) — 1 triệu lần crash = 1 issue
    │
    ▼
ALERT ── quá ngưỡng/hàng loạt lỗi mới → Slack/PagerDuty
    │
    ▼
FIX → DEPLOY → SDK tự resolve theo release version
```

---

## 💻 Code Ví Dụ

```typescript
// ===== Sentry: setup cơ bản =====
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.GIT_COMMIT_SHA,       // tag release — biết lỗi của bản nào
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,                     // 10% request được trace (giảm chi phí)
  beforeSend(event) {
    if (event.request?.data) delete event.request.data.password; // redact
    return event;
  },
});

// ===== Breadcrumbs: hành trình dẫn đến lỗi =====
// SDK tự ghi: navigation, console, network call... 50 sự kiện gần nhất
// → khi lỗi nổ, Sentry cho biết: user click gì, gọi API nào trước đó

// ===== Đa tầng catch: không nuốt lỗi =====
process.on("unhandledRejection", (reason) => {
  Sentry.captureException(normalize(reason));
});
process.on("uncaughtException", (err) => {
  Sentry.captureException(err);
  process.exit(1); // state không xác định → thoát để supervisor restart
});

// ===== Error boundary (React) — lỗi UI không trắng màn hình =====
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }
  render() { return this.state.hasError ? <FallbackUI/> : this.props.children; }
}

// ===== Alert thông minh: báo khi ĐÁNG báo, không báo khi noise =====
// ❌ alert mỗi lỗi 404 → spam → team tắt thông báo → chết thật khi có sự cố
// ✅ alert theo TỶ LỆ: error rate > 2% trong 5 phút (xem 8.10-sre-slo)
```

---

## ⚖️ Tự Xây vs Dùng Sentry

| Tiêu chí | Tự xây | Sentry/glitchtip |
|---|---|---|
| Chi phí ban đầu | thấp | phí dịch vụ |
| Stack trace đẹp (minified) | phải tự làm sourcemap | ✓ sẵn |
| Grouping, dedup | tự viết, khó | ✓ |
| Release tracking | tự làm | ✓ |
| Khuyến nghị | học mà làm | production dùng |

---

## ⚠️ Bẫy Thường Gặp

1. **Nuốt lỗi (swallow):** `catch (e) {}` — lỗi biến mất không dấu vết. Ít nhất cũng phải capture.
2. **Log lỗi lặp hàng nghìn lần** — same error mỗi request → issue tràn. Grouping + rate limit.
3. **Không gắn release version** — không biết bug thuộc bản deploy nào, không biết fix chưa.
4. **Log PII vào error report** — vi phạm quy định dữ liệu. beforeSend phải redact.
5. **Chỉ báo lỗi frontend mà không có release mapping** — không biết ảnh hưởng người dùng bản nào.
6. **Alert quá nhạy** — đội ngũ tắt notifications → lỗi thật bị bỏ qua. Alert theo SLO, không theo mỗi lỗi.

---

## 📝 Bài Tập Tự Vấn

1. Thiết kế alert: lỗi thanh toán > 1% trong 5 phút → báo ngay, nhưng lỗi 1 request không báo.
2. Source map đã upload Sentry nhưng stack trace vẫn minified — thiếu bước nào?
3. Lỗi xuất hiện sau deploy → Sentry cho biết bản nào gây lỗi, quy trình rollback?

---

*Leaf thuộc [Lớp 22 — Debugging, Logging & Profiling](../README.md)*
