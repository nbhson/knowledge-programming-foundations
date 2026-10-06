# 🎯 13.11 Case Studies (Tình Huống Phỏng Vấn)

> **Case study** là nơi mọi mảnh ghép (LB, cache, queue, sharding, CAP, gateway, consensus) ráp thành một hệ thống hoàn chỉnh — phỏng vấn system design chấm **framework và trade-off**, không chấm đáp án duy nhất.

---

## 🎯 Vấn Đề

Biết từng building block chưa đủ — phỏng vấn yêu cầu **thiết kế end-to-end trong 45 phút**. Framework 6 bước (đã giới thiệu ở README nhóm 13):

```
1. Requirements (functional + non-functional) → 2. Capacity estimation →
3. API design → 4. Data model → 5. High-level architecture → 6. Deep dive
```

**Nguyên tắc chấm điểm:** số liệu phải tự tính (không đoán mò QPS), mỗi lựa chọn phải nêu trade-off + alternative bị loại, luôn hỏi lại yêu cầu mơ hồ trước khi thiết kế.

---

## 13.11.1 Case 1: URL Shortener (sho.rt)

**Requirements:** rút gọn URL dài → short link 6–8 ký tự; redirect nhanh (< 100ms p99); 1 URL dài rút gọn nhiều lần cho code khác nhau hoặc giống nhau (chọn 1, nêu rõ); TTL/analytics là mở rộng.

**Capacity estimation:**

| Tham số | Giả định | Kết quả |
|---------|----------|---------|
| DAU | 10M, mỗi user 2 shortens/ngày | 20M writes/ngày → **~230 avg QPS**, peak 5× ≈ **1.2k QPS** |
| Read:write | 10:1 (redirect nhiều hơn tạo) | ~2.3k read QPS avg |
| Storage/write 500B | 20M × 500B | ~10 GB/ngày → ~3.6 TB/năm |
| Không gian code | base62, 7 ký tự = 62⁷ ≈ 3.5 nghìn tỷ | Đủ cho hàng trăm năm ở tốc độ trên |

**API:**

```
POST /api/shorten { longUrl, ttl? } → { shortCode }   (201)
GET  /:shortCode → 302 redirect → longUrl             (cache 1 năm)
```

**Data model:** `urls(code PK, long_url, created_at, expires_at)` — code là khóa chính, lookup O(1); index `long_url` nếu chọn dedup (1 URL dài → 1 code).

**Architecture:**

```
Client ─▶ [LB] ─▶ [API] ─▶ [Cache code→URL (Redis, hit ~90%)]
                       └─▶ [DB (shard theo code)] ─▶ [ID generator]
ID generator: counter (ZooKeeper/etcd range) + base62, hoặc hash(longUrl + salt) + collision check
```

**Deep dive:** counter+base62 đơn giản, không đụng độ, nhưng predict được (thêm salt/hash nếu sợ enumerate); hash-based phân tán tốt nhưng cần xử lý collision (Bloom filter + retry). Redirect cache aggressive vì URL gần như immutable.

## 13.11.2 Case 2: Chat 1-1 (Zalo-scale mini)

**Requirements:** gửi/nhận realtime (< 200ms), online/offline đều nhận được, thứ tự đúng, delivered/read receipt; group chat là mở rộng.

**Capacity estimation:**

| Tham số | Giả định | Kết quả |
|---------|----------|---------|
| DAU | 50M, mỗi user 40 msg/ngày | 2B msg/ngày → **~23k avg QPS**, peak 5× ≈ **115k QPS** |
| Message 200B | 2B × 200B | ~400 GB/ngày → TTL 30–90 ngày + archive lạnh |
| Concurrent WS | 10% DAU online cùng lúc | 5M connections → ~500 instances (10k conn/instance) |

**API:**

```
WS  /connect (auth token) — gửi/nhận realtime, heartbeat + ack per message
POST /api/messages { to, text, clientMsgId } — fallback khi không có WS
GET  /api/conversations/:peer?afterSeq=N — đọc lịch sử / pull offline messages
```

**Data model:** `messages(conversation_id, seq, from, to, text, ts)` — key `(conversation_id, seq)` đọc theo trang; `clientMsgId` unique để idempotent (retry không trùng tin — xem 13.8).

**Architecture:**

```
Client ◀──WS──▶ [WS Cluster (sticky)] ──▶ [MQ] ──▶ [Writer] ──▶ [DB (shard theo conversation_id)]
                    │                        └─▶ [Push service] (offline → push notif)
                    └─▶ [Presence (Redis pub/sub + TTL)]
```

**Deep dive:** sticky session cho WS (13.1); at-least-once + ack + `clientMsgId` chống mất/trùng; offline message giữ TTL (7–30 ngày) + push notification đánh thức; presence dùng Redis TTL thay vì DB.

## 13.11.3 Case 3: Twitter Feed (Fan-Out Khó Nhất)

**Requirements:** post tweet, follow, home timeline (< 500ms p99); celeb 10M followers; đọc nhiều hơn ghi ~100:1.

**Capacity estimation:**

| Tham số | Giả định | Kết quả |
|---------|----------|---------|
| DAU | 100M; 1% post (1M posts/ngày ≈ 12 avg QPS) | Timeline reads ~1.2k avg QPS, peak ~6k |
| Push cost celeb | 5 posts × 10M followers | **50M writes cho 1 người/ngày** — push thuần vỡ |
| Pull cost | 2M opens × 300 followees | 600M scattered reads/ngày — pull thuần chậm |

**API:**

```
POST /api/tweets { text } → { tweetId }
POST /api/follow { userId } | DELETE /api/follow/{userId}
GET  /api/timeline?cursor=N&limit=20 → [tweets] (mới nhất trước)
```

**Data model:** `tweets(tweet_id, author, text, ts)` + `follows(follower, followee)` + `timeline_cache(user_id → [tweet_ids])` (Redis, precomputed cho user thường).

**Architecture (hybrid fan-out — đáp án chuẩn):**

```
Post ─┬─▶ user thường ─▶ PUSH: ghi vào inbox từng follower (timeline_cache)
      └─▶ celeb ───────▶ PULL: không fan-out; follower đọc timeline thì merge tweet celeb realtime
Read: timeline = merge(precomputed inbox, celeb tweets) + rank + paginate(cursor)
```

| Chiến lược | Write | Read | Khi dùng |
|------------|-------|------|----------|
| **Push** (fan-out on write) | Nặng (× followers) | Nhẹ (đọc inbox có sẵn) | User thường (followers ít) |
| **Pull** (fan-out on read) | Nhẹ | Nặng (merge lúc đọc) | Celeb (followers huge) |
| **Hybrid** | Vừa | Vừa | ✅ Production (ngưỡng ~10k followers) |

---

## 💻 Code/Khái Niệm Ví Dụ

Demo trong `examples/index.ts`: base62 shortener + hàm `estimateCapacity()` dùng chung cho mọi case + chat store + so số push vs pull. Công thức capacity dùng trong mọi buổi phỏng vấn:

```typescript
// avg QPS = DAU × req/user/ngày ÷ 86400; peak = avg × 5–10; storage = req × bytes
estimateCapacity({ dailyActiveUsers: 10_000_000, reqPerUserPerDay: 2, bytesPerReq: 500 });
// → avg ~231 QPS, peak ~1157 QPS, storage ~10 GB/ngày
```

**Back-of-envelope cheat sheet (học thuộc):**

| Hằng số | Giá trị | Dùng khi |
|---------|---------|----------|
| 1 ngày | ≈ 86.4k giây (≈ 10⁵ cho tính nhẩm) | Đổi daily → QPS |
| Peak:avg | 5–10× | Flash sale, giờ cao điểm |
| 1 app instance (Node.js) | ~200–500 QPS | Đổi QPS → số instance |
| 1 WS instance | ~10k concurrent conn | Đổi online users → instances |
| Redis single | ~100k ops/s, latency ~0.5ms | Cache sizing |
| PG single | ~10–30k read / 1–5k write QPS | Biết khi nào cần replica/shard |

---

## ✅ Lợi Ích

- **Một framework cho mọi đề:** requirements → capacity → API → data model → architecture → deep dive — không bao giờ "không biết bắt đầu từ đâu".
- **Số liệu dẫn dắt thiết kế:** QPS/storage tính ra sẽ tự chỉ chỗ cần cache, shard, queue (thay vì thêm cho "chắc ăn").
- **Trade-off có tên:** mỗi case trên đều có ít nhất một quyết định push-vs-pull / sync-vs-async / SQL-vs-NoSQL để thảo luận — đó là điểm số.

## ⚠️ Lưu Ý

- **Đừng nhảy vào kiến trúc ngay:** 5 phút đầu phải làm rõ requirements (DAU? read:write? latency SLO? consistency?) — thiết kế sai yêu cầu = trượt dù kiến trúc đẹp.
- **Đừng over-engineer:** đề 1k QPS không cần Kafka + K8s multi-region — bắt đầu đơn giản, scale khi số liệu đòi hỏi (stages of scale ở 13.6).
- **Mỗi con số phải có nguồn:** "5k QPS" phải từ DAU × hành vi user, không từ cảm giác — interviewer luôn hỏi "tại sao lại là con số này".
- **Luôn có deep dive dự phòng:** cache stampede, hot celeb, split-brain, DLQ đầy — chuẩn bị 1–2 failure mode cho mỗi case.

## 🎯 Khi Nào Dùng (mỗi case luyện kỹ năng gì)

| Case | Luyện trọng tâm | Ôn kèm |
|------|-----------------|--------|
| URL shortener | ID generation, cache-heavy read, sizing cơ bản | 13.2 caching, 13.7 hashing |
| Chat 1-1 | WebSocket scale, ordering, offline/Push, idempotency | 13.1 sticky LB, 13.8 queue |
| Twitter feed | Fan-out read vs write, timeline merge, celeb problem | 13.4 sharding, 13.8 pub/sub |

---

## 🔗 Liên Quan

- **13.1 Load Balancer** — WS sticky, horizontal app instances trong mọi case
- **13.2 Caching Strategies** — Redirect cache, timeline inbox cache
- **13.4 Sharding** — Shard `conversation_id`, `tweet_id`, short code
- **13.7 Consistent Hashing** — Placement cho cache/shard khi scale
- **13.8 Message Queues** — Async writer, push fan-out, offline delivery
- **13.9 API Gateway & Discovery** — Entry point + routing cho mọi kiến trúc trên
- **13.10 Consensus & Raft** — Bầu primary writer/partition leader

---

## 📚 Tài Liệu

- 📖 [System Design Primer](https://github.com/donnemartin/system-design-primer) — kho case + Anki
- 📖 [ByteByteGo — System Design Newsletter](https://blog.bytebytego.com/) — case diagrams
- 📖 [DDIA — Designing Data-Intensive Applications](https://dataintensive.net/) — nền tảng cho mọi deep dive

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.11-case-studies
npx ts-node examples/index.ts
```

---

## ⏭️ Bạn Đã Hoàn Thành Nhóm 13: System Design!

Bạn đã đi từ building blocks (13.1–13.10) tới ráp hệ thống hoàn chỉnh (13.11). Tiếp theo: quay lại [README nhóm 13](../README.md) để ôn framework, hoặc bắt đầu project tổng hợp.
