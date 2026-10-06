# 📏 8.10 SRE & SLO (SLI, SLO, Error Budget)

> **SRE** biến độ tin cậy thành số liệu: **SLI** (đo gì), **SLO** (mục tiêu bao nhiêu), **error budget** (được phép hỏng bao nhiêu) — hết budget thì dừng feature, ưu tiên stability.

---

## 🎯 Vấn đề

"Site phải nhanh và ổn định" là mục tiêu mơ hồ: nhanh là bao nhiêu? ổn định với ai? Kết quả: dev muốn ship nhanh, ops muốn chặn release, cãi nhau bằng cảm tính:

```
dev: "chỉ 1% lỗi, release đi!"
ops: "1% của 10M request = 100k user lỗi, không release!" 💥
```

SLO + error budget biến tranh cãi thành chính sách số học.

---

## 💻 Code ví dụ

Tính error budget còn lại và quyết định release/hold.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx ts-node examples/index.ts

interface SloWindow { goodEvents: number; totalEvents: number; slo: number }

// Error budget = (1 - SLO) × total. Còn lại = budget - bad events.
function errorBudget(w: SloWindow): { budget: number; consumed: number; remaining: number; okToRelease: boolean } {
  const budget = Math.floor((1 - w.slo) * w.totalEvents);
  const consumed = w.totalEvents - w.goodEvents;
  const remaining = budget - consumed;
  return { budget, consumed, remaining, okToRelease: remaining > 0 };
}

// Ví dụ: SLO 99.9% trên 1M request → budget 1000 lỗi
errorBudget({ goodEvents: 999_500, totalEvents: 1_000_000, slo: 0.999 });
// → budget=1000, consumed=500, remaining=500, okToRelease=true ✅
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Quyết định bằng số | Hết budget → freeze feature, chỉ fix reliability. Còn nhiều → ship tự tin |
| Kỳ vọng thống nhất | Product, dev, business cùng nhìn 1 con số thay vì "cảm thấy chậm" |
| Ưu tiên đúng | Budget cháy nhanh ở đâu → đầu tư reliability đúng chỗ đau nhất |

---

## ⚠️ Lưu Ý

- SLI phải đo **trải nghiệm user** (success/total request ở load balancer), không phải CPU nội bộ.
- SLO 100% là phản pattern: chi phí từ 99.9% → 99.99% tăng gấp nhiều lần, user không cảm nhận được.
- Window quan trọng: SLO 30 ngày rolling, alert nhanh (1h burn rate) + alert chậm (6h) để vừa phản ứng vừa tránh nhiễu.
- Mới bắt đầu: SLO lỏng (99%) rồi siết dần — SLO quá chặt ngay đầu chỉ tạo alert fatigue.

---

## 🎯 Khi nào dùng

- Mọi user-facing service: availability SLO (2xx/total) + latency SLO (p99 < X).
- Dùng error budget làm cổng release/canary analysis.
- Không dùng khi: prototype chưa có user (đo làm gì), batch job (dùng success rate + deadline thay vì latency SLO).

---

## 🔗 Liên quan

- **8.9 Observability** — SLI lấy từ metrics RED (rate/errors/duration).
- **8.8 Blue-Green/Canary** — canary auto-promote/rollback dựa trên burn rate.
- **8.2 GitHub Actions** — chặn deploy khi budget cạn (policy check trong pipeline).

---

## 📚 Tài liệu

- Google SRE Book — https://sre.google/sre-book/table-of-contents/
- SRE Workbook (Alerting on SLOs) — https://sre.google/workbook/table-of-contents/
- SLOConf talks — https://www.sloconf.com/

---

## ▶️ Chạy ví dụ

```bash
cd 08-devops-cicd/8.10-sre-slo
npx ts-node examples/index.ts
```

Demo: tính budget SLO 99.9% → còn budget (release) → cháy budget (freeze + alert) → so sánh burn nhanh/chậm.

---

## ⏭️ Bài tiếp theo

Hoàn thành nhóm DevOps — tiếp tục Security:

→ [9.1 OWASP Top 10](../../09-security/9.1-owasp-top10/README.md)
