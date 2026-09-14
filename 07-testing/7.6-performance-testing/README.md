# 🧪 7.6 Performance Testing (Kiểm Thử Hiệu Năng)

> **Performance Test** đo lường tốc độ, độ trễ, khả năng chịu tải của hệ thống dưới các điều kiện khác nhau — để tìm nút cổ chai trước khi vào production.

---

## 🎯 Performance Testing Là Gì?

Khác với functional test (kiểm tra đúng/sai), performance test kiểm tra **hệ thống chạy nhanh/chậm thế nào** và **chịu được bao nhiêu người dùng cùng lúc**.

```
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE TESTING TYPES                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Load Testing     — Tải bình thường, hệ thống ổn    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Stress Testing   — Tăng tải quá giới hạn, tìm điểm │  │
│  │                     break                            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Spike Testing    — Tăng đột ngột rồi giảm          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Soak/Endurance   — Chạy dài giờ/ngày, leak mem     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Scalability      — Scale up/down có ổn không      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Khi nào cần Performance Test?

| Tình huống | Tại sao cần perf test |
|------------|----------------------|
| Ứng dụng sắp launch public | Tìm bottlenecks trước khi user thật đến |
| Black Friday / flash sale chuẩn bị | Đảm bảo system chịu được 10x traffic spike |
| API bị complaint "chậm" | Đo latency thực tế, identify slow queries |
| Architecture change (microservice split) | So sánh perf trước/sau refactor |
| Database scale up decision | Biết giới hạn current DB để plan migration |

> 💡 **Misconception:** "Performance test chỉ cần cho high-traffic apps." — Sai. Ngay cả internal tool với 50 users có thể có query O(n²) gây timeout khi data grows. Perf test **phát hiện vấn đề tiềm tàng** trước khi nó thành incident.

---

## 📊 Key Metrics (Chỉ Số Chính)

| Metric | Mô tả | Đơn vị | Mục tiêu tốt |
|--------|-------|--------|--------------|
| **RPS** | Requests per second — số request/giây | req/s | > 100 cho API đơn giản |
| **Latency** | Thời gian respond một request | ms | < 200ms p95 |
| **Throughput** | Tổng lượng data xử lý/giây | MB/s | Tùy hệ thống |
| **Error Rate** | Tỷ lệ request lỗi | % | < 0.1% |
| **Concurrency** | Số user cùng lúc | users | Tùy kiến trúc |
| **p95/p99 Latency** | 95%/99% request dưới ngưỡng này | ms | p95 < 500ms |

```
Latency Distribution Example:
─────────────────────────────────────────────
  p50 (median):  45ms   ← 50% request ≤ 45ms
  p90:          120ms  ← 90% request ≤ 120ms
  p95:          250ms  ← 5% request chậm hơn
  p99:          800ms  ← 1% request rất chậm (tail latency)
  max:         5000ms  ← request chậm nhất
─────────────────────────────────────────────
→ Tập trung tối ưu p95/p99, không chỉ average!
```

> 📌 **Tại sao p95/p99 quan trọng hơn average?** Average bị che bởi outliers. 99% users experience 45ms latency nhưng 1% users chờ 5 giây — đó là những user giận dữ sẽ leave app. Tối ưu p99 = cải thiện trải nghiệm cho minority đang suffer.

---

## 🚀 k6 Example

### Cài đặt

```bash
npm install -g k6
# hoặc Docker
docker run -i grafana/k6 run - <script.js
```

### Basic Load Test

```javascript
// load-tests/basic.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  // Script chạy 30 giây
  duration: "30s",
  // Tăng dần từ 0 → 50 virtual users
  stages: [
    { duration: "10s", target: 50 },  // ramp-up
    { duration: "10s", target: 50 },  // hold steady
    { duration: "10s", target: 0 },   // ramp-down
  ],
};

export default function () {
  const res = http.get("http://localhost:3000/api/products");

  // Check: mỗi request phải status 200 và response < 500ms
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "has products array": (r) => Array.isArray(JSON.parse(r.body)),
  });

  sleep(1); // simulated think time between requests
}
```

### Chạy và Xem Result

```bash
k6 run load-tests/basic.js

# Output:
#  ✓  status is 200           = 100.00%
#  ✓  response time < 500ms  =  98.50%
#  ✓  has products array     = 100.00%
#
#  checks.....................: 99.50% ✓ 19890      ✗ 95
#  http_req_duration..........: avg=85ms   min=12ms   med=78ms  max=1200ms
#  p(90)........................: 145ms
#  p(95)........................: 180ms
#  http_reqs..................: 3200     106.7/s
```

### Stress Test — Tìm Breaking Point

```javascript
// load-tests/stress.js
import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 100 },
    { duration: "10s", target: 500 },
    { duration: "10s", target: 1000 },
    { duration: "10s", target: 2000 }, // ← xem khi nào hỏng
    { duration: "10s", target: 0 },
  ],
};

export default function () {
  const res = http.get("http://localhost:3000/api/products");
  check(res, {
    "status ok": (r) => r.status < 500, // không tính 5xx là ok
  });
}
```

### Soak Test — Chạy Dài Hạn

```javascript
// load-tests/soak.js
export const options = {
  duration: "2h", // chạy 2 giờ
  vUs: 20,        // 20 user liên tục
};

export default function () {
  http.get("http://localhost:3000/api/products");
  http.get("http://localhost:3000/api/orders");
  sleep(2);
}
// ⚠️ Chạy dài → theo dõi memory leak, connection pool
```

---

## 🏎️ Artillery Example

```bash
npm install -g artillery
```

### Config File (`load-test.yml`)

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 30  # 30 giây
      arrivalRate: 10  # 10 req/s
    - duration: 60  # 60 giây giữ steady
      arrivalRate: 50
    - duration: 30  # ramp down
      arrivalRate: 0

scenarios:
  - flow:
      - get:
          url: "/api/products"
          expect:
            - statusCode: 200
            - headers:
                content-type: "application/json"
      - sleep: 1
      - get:
          url: "/api/orders"
          headers:
            Authorization: "Bearer {{token}}"
```

```bash
artillery run load-test.yml
```

---

## 📈 Interpret Results (Đọc Kết Quả)

```
k6 Output Breakdown:
═══════════════════════════════════════════════
Metric                  Value       Interpretation
───────────────────────────────────────────────
http_reqs               3,200       Tổng request trong 30s
http_req_duration{avg}  85ms        Trung bình — ok
http_req_duration{med}  78ms        Median — tốt hơn avg
http_req_duration{p95}  180ms       95% request < 180ms
http_req_duration{max}  1,200ms     outliers cần xem
checks{passed}          99.5%       Hầu hết ok
error_rate              0.5%        Cần điều tra 95 errors
vus                     50         峰值 concurrent users
═══════════════════════════════════════════════

⚠️ Nếu p95 > 500ms hoặc error_rate > 1% → cần optimize
```

### Đọc hiểu result chi tiết

| Metric | Giá trị | Đánh giá | Action nếu bad |
|--------|---------|----------|----------------|
| `http_reqs` | 3,200 | Total throughput | So sánh với target RPS |
| `avg` latency | 85ms | Trung bình | Look at p95/p99 — avg bị che outliers |
| `p95` latency | 180ms | 95% requests < 180ms | Target: < 500ms cho web API |
| `p99` latency | 800ms | 1% requests rất chậm | Investigate outliers — slow queries? |
| `error_rate` | 0.5% | 95 errors/3200 requests | > 1% = red flag, check logs |
| `vus` | 50 | Peak concurrent users | Compare with production traffic |

> 📌 **Baseline trước khi optimize:** Luôn chạy load test TRƯỚC khi optimize để có baseline. Sau khi optimize, chạy lại → đo improvement thực tế. Đừng optimize dựa trên intuition.

---

## ✅ Best Practices

| Thực hành | Giải thích |
|-----------|------------|
| **Test môi trường giống production** | Result không chính xác nếu config khác (CPU, RAM, DB size) |
| **Baseline trước khi optimize** | Đo trước/sau để biết improvement thực |
| **Theo dõi p95/p99** | Average bị che bởi outliers — p95 mới反映真实用户体验 |
| **Test gradual increase** | Ramp-up từ từ, không nhảy vọt → tìm breaking point chính xác |
| **Monitor resource** | CPU, memory, DB connections trong khi test — bottleneck có thể ở infrastructure |
| **Make it part of CI** | Chạy load test tự động mỗi deploy → phát hiện regression performance sớm |
| **Test real data** | Data thật (hoặc data replication) cho kết quả chính xác hơn test data giả |
| **Define SLA/SLO** | Trước khi test, định rõ target: "p95 < 200ms, error_rate < 0.1%" |

---

## 🔧 Common Performance Anti-Patterns

| Anti-Pattern | Vấn đề | Giải pháp |
|--------------|--------|-----------|
| **N+1 queries** | 1 query lấy list + N queries chi tiết | Batch query, eager loading, JOIN |
| **Missing index** | Full table scan trên large table | Thêm index, analyze query plan |
| **Sync blocking** | Blocking call trên event loop | Async/await, non-blocking I/O |
| **Unbounded result** | Return toàn bộ table không pagination | LIMIT/OFFSET, cursor-based pagination |
| **No caching** | Tính lại data đã có cache | Redis/Memcached, CDN, HTTP cache headers |
| **Synchronous external calls** | Chờ 3rd party API synchronously | Fire-and-forget, timeout, circuit breaker |

---

## ▶️ Chạy ví dụ

Chạy demo micro-benchmark so sánh thuật toán (không cần k6/Artillery):

```bash
cd 07-testing/7.6-performance-testing
npx ts-node examples/index.ts
```

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|----------|
| k6 Docs | https://k6.io/docs/ |
| Artillery Docs | https://docs.artillery.io/ |
| Load Testing Patterns | https://www.nginx.com/blog/load-testing-with-nginx-plus/ |
| SRE Book: Measured Confidence | Google |

---

## ⏭️ Bài tiếp theo → [7.7 Mocking, Stubbing & Faking](../7.7-mocking-stubbing/README.md)
