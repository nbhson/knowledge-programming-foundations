# 🔵 8.8 Blue-Green & Canary (Chiến Lược Triển Khai)

> **Blue-Green** chạy 2 môi trường song song rồi đảo traffic tức thì; **Canary** rò rỉ version mới cho % nhỏ user rồi mở dần — cả hai đều nhằm **zero-downtime + rollback nhanh**.

---

## 🎯 Vấn đề

Deploy kiểu recreate (tắt cũ → bật mới): downtime + nếu bản mới lỗi thì rollback chậm:

```
v1 đang chạy → stop all → start v2 (lỗi!) → 10 phút downtime 💥
```

Rolling đỡ hơn nhưng rollback vẫn phải rolling ngược. Blue-green/canary giải quyết bằng traffic shifting có kiểm soát.

---

## 💻 Code ví dụ

Mô phỏng traffic shifting + so sánh error rate để auto promote/rollback.

```typescript
// Xem đầy đủ trong examples/index.ts — Chạy: npx tsx examples/index.ts

type Strategy = "blue-green" | "canary";

interface Release { stable: string; candidate: string; trafficToCandidate: number }

// Canary: tăng dần 5% → 25% → 50% → 100%, mỗi bước check error budget
function nextCanaryStep(current: number): number {
  const steps = [5, 25, 50, 100];
  return steps.find((s) => s > current) ?? 100;
}

// Blue-green: switch 0 → 100 một lần, rollback = đảo lại LB
function blueGreenSwitch(): { before: string; after: string } {
  return { before: "100% blue (v1)", after: "100% green (v2)" };
}
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---|---|
| Zero downtime | Traffic chỉ chuyển khi bản mới healthy (health check pass) |
| Rollback tức thì | Blue-green: đảo LB về (< 1s). Canary: set traffic về 0% |
| Giảm blast radius | Canary: lỗi chỉ ảnh hưởng 5% user thay vì 100% |

---

## ⚠️ Lưu Ý

- Blue-green tốn **gấp đôi tài nguyên** trong lúc switch; DB migration phải backward-compatible (không xóa cột bản cũ đang đọc).
- Canary cần **traffic splitting** (LB weights / service mesh) + metrics theo version — không đo được là canary mù.
- Session/state: sticky session hoặc shared store, kẻo user nhảy giữa 2 version mất giỏ hàng.
- Feature flags là "canary ở tầng code": toggle không cần redeploy, nhưng sinh flag debt nếu không dọn.

---

## 🎯 Khi nào dùng

| Strategy | Khi nào |
|---|---|
| Rolling | Mặc định K8s, tài nguyên hạn chế, thay đổi nhỏ |
| Blue-Green | Cần rollback tức thì, đủ tài nguyên ×2, release lớn |
| Canary | Muốn giảm rủi ro tối đa, có metrics tốt, traffic lớn |
| Feature flag | Release logic độc lập version, A/B test |

---

## 🚀 Đi Sâu Thêm

**Progressive delivery = canary/blue-green được điều phối + phân tích tự động:**

| Công cụ | Cách hoạt động | Auto rollback |
|---|---|---|
| Argo Rollouts | CRD `Rollout` thay `Deployment`, traffic shifting qua service mesh/LB | `AnalysisTemplate` query Prometheus; metric vượt ngưỡng → abort ngay |
| Flagger | Annotate Deployment, tự sinh canary + VirtualService/Ingress weights | Canary analysis từng bước, metric xấu → rollback không cần người |

- **Metric-based auto rollback:** mỗi bước canary (5% → 25% → 50%) chạy analysis trong window (vd 2 phút): error rate > 1% hoặc p99 > ngưỡng SLO → tăng dừng, traffic về 0%, alert Slack. Người chỉ review sau, không đứng canh.

**Chi phí blue-green = 2× hạ tầng:** trong lúc switch cả 2 version chạy song song đủ capacity. Canary chỉ cần +10–25% (1 replica mới), rolling gần như 0. → Blue-green chỉ đáng tiền khi rollback tức thì là bắt buộc (release lớn, batch không chia được).

**Feature flags kết hợp canary:**
- Canary kiểm soát *traffic tới version mới* (tầng hạ tầng); flag kiểm soát *code path bên trong* (tầng app).
- Pattern "dark launch": deploy version mới nhận 100% traffic nhưng flag tắt với 99% user → test thật không rủi ro, rollout = bật flag dần, rollback = tắt flag (giây) thay vì redeploy (phút).
- Đặt deadline xóa flag ngay khi tạo — flag sống mãi thành debt và nhánh code chết.

---

## 🔗 Liên quan

- **8.7 GitOps ArgoCD** — Argo Rollouts điều phối canary/blue-green tự động.
- **8.10 SRE/SLO** — canary analysis dựa trên SLO (error rate, p99).
- **8.9 Observability** — metrics theo version là mắt của canary.

---

## 📚 Tài liệu

- Argo Rollouts — https://argoproj.github.io/argo-rollouts/
- *Continuous Delivery* — Jez Humble & Dave Farley
- Martin Fowler: CanaryRelease — https://martinfowler.com/bliki/CanaryRelease.html

---

## ▶️ Chạy ví dụ

```bash
cd 08-devops-cicd/8.8-blue-green-canary
npx tsx examples/index.ts
```

Demo: so sánh 4 strategies → canary tăng dần và auto-rollback khi error vượt ngưỡng → blue-green switch tức thì.

---

## ⏭️ Bài tiếp theo

→ [8.9 Observability](../8.9-observability/README.md)
