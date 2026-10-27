# 👑 13.10 Consensus & Raft (Đồng Thuận & Raft)

> **Consensus** giúp cụm node phân tán đồng ý MỘT giá trị/lịch sử duy nhất dù có node sập, mạng partition — **Raft** là thuật toán consensus được chọn vì dễ hiểu, dễ implement đúng.

---

## 🎯 Vấn Đề

Distributed system cần "một sự thật duy nhất" ở nhiều nơi: ai là primary DB? Offset Kafka partition do ai giữ? Config/cluster membership hiện tại là gì?

```
Không consensus (split-brain):           Có consensus (quorum):

Partition: {A,B} | {C}                   Partition: {A,B} | {C}
A tự xưng leader, C tự xưng leader       {A,B} = majority (2/3) → tiếp tục phục vụ
→ 2 primary cùng ghi → data conflict     {C} = minority → từ chối ghi (bảo toàn tính đúng)
  không thể merge
```

**Kết quả bất khả nổi tiếng (FLP):** mạng async + 1 node có thể crash thì không có thuật toán deterministic nào đảm bảo consensus trong mọi trường hợp — thực tế dùng **majority quorum + timeout + leader** để đảm bảo an toàn (safety) luôn đúng, còn liveness chờ mạng ổn định. Trade-off: minority partition **từ chối phục vụ** để giữ tính đúng (CP theo CAP — xem 13.5).

---

## 13.10.1 Raft: 3 Cơ Chế

| Cơ chế | Ý tưởng | Chi tiết cần nhớ khi phỏng vấn |
|--------|---------|--------------------------------|
| **Leader election** | Node hết nghe heartbeat → tăng term, xin vote; ai đạt **majority** trước thì làm leader | Mỗi term chỉ vote 1 lần; randomized election timeout (150–300ms) chống split vote lặp lại |
| **Log replication** | Mọi ghi qua leader → append entry → replicate → **commit khi majority ack** → apply vào state machine | Commit = bền bỉ (dù leader chết, entry đã commit vẫn còn ở majority) |
| **Safety (quorum)** | `quorum = floor(N/2) + 1`; 2 quorum bất kỳ luôn giao nhau ≥ 1 node → không thể có 2 leader cùng term | N=3 chịu 1 lỗi; N=5 chịu 2 lỗi — N lẻ để quorum rẻ |

```
Election (5 nodes, quorum=3):

Follower (timeout) ──▶ Candidate (term+1, vote cho mình, xin vote)
                           │ majority (≥3)          │ timeout/split vote
                           ▼                        ▼
                        Leader ◀── heartbeat ──  Candidate (term+1, bầu lại)
                        (nhận mọi ghi)
```

**Split vote:** 2 candidate cùng term mỗi người 2–3 phiếu, không ai đủ quorum → cả hai timeout → term mới, randomized timeout khiến một người đi trước và thắng. Đây là lý do timeout **phải random**, không fixed.

## 13.10.2 Raft vs Paxos

| Tiêu chí | Paxos (Lamport, 1989) | Raft (Ongaro & Ousterhout, 2014) |
|----------|----------------------|----------------------------------|
| Vai trò | Proposer/Acceptor/Learner gộp, khó tách | Leader/Follower/Candidate rõ ràng, mạnh về leadership |
| Hiểu & implement | Nổi tiếng khó hiểu đúng (nhiều biến thể: Multi-Paxos, EPaxos) | Thiết kế cho understandability; có hình minh họa chuẩn |
| Thực tế | Chiron, một số KV (ít dùng nguyên bản) | etcd, Consul, TiKV, CockroachDB, Kafka KRaft |
| Khi nhắc | Biết tên + "tiền đề lý thuyết của consensus" | Biết election + replication + quorum (đủ cho phỏng vấn) |

> 💡 **Câu trả lời phỏng vấn 30 giây:** "Raft bầu leader theo term bằng majority vote, mọi ghi qua leader và commit khi đủ quorum, nên chịu được minority lỗi mà không split-brain. Paxos là tiền đề lý thuyết nhưng khó implement, thực tế dùng Raft (etcd/Consul/Kafka KRaft)."

---

## 💻 Code/Khái Niệm Ví Dụ

Demo trong `examples/index.ts`: cluster 5 node (quorum=3) — election, split vote, replicate khi mất minority (commit được) vs mất majority (từ chối).

```typescript
// Quy tắc quorum — dòng quan trọng nhất của bài này
quorum = Math.floor(N / 2) + 1;   // N=5 → 3
committed = acks >= quorum;       // đủ majority mới commit

// Minh họa từ demo:
// sập 2/5 node → còn 3/5 ≥ quorum → vẫn COMMIT ✔ (chịu lỗi minority)
// sập 3/5 node → còn 2/5 < quorum → từ chối ✘ (giữ tính đúng, hy sinh availability)
```

**Back-of-envelope — chọn N:**

| N | Quorum | Chịu được | Write latency | Ghi chú |
|---|--------|-----------|---------------|---------|
| 3 | 2 | 1 lỗi | 1 round-trip tới 1 follower | Default cho etcd/Consul nhỏ |
| 5 | 3 | 2 lỗi | 1 RTT tới 2 follower (node xa nhất quyết định) | Chuẩn production multi-AZ |
| 7 | 4 | 3 lỗi | RTT tới 3 follower, quorum đắt | Chỉ khi cần chịu 3 lỗi (global) |

Quy tắc: **N=5 cho production multi-AZ**; N=3 cho dev/staging; N=7 hiếm khi đáng (quorum 4 làm write chậm mà vẫn chết khi mất 4).

---

## ✅ Lợi Ích

- **Single source of truth:** config, leader, metadata luôn nhất quán dù node sập.
- **Tự phục hồi:** leader chết → election lại trong ~vài trăm ms, không cần can thiệp tay.
- **Chịu lỗi có tính toán:** số lỗi chịu được = N − quorum, biết trước thay vì hy vọng.
- **Hệ sinh thái sẵn:** etcd/Consul đóng gói Raft — đa số hệ thống chỉ cần *dùng*, không cần *implement*.

## ⚠️ Lưu Ý

- **Minority không phục vụ:** partition lẻ (2/5 node) từ chối ghi — thiết kế client phải xử lý "leader unknown / not leader" + retry sang majority.
- **Không dùng consensus cho data path nóng:** mỗi ghi tốn quorum RTT — Raft cho metadata/leader election/config; data nóng dùng replication async + quorum read khi cần (xem Dynamo N/W/R).
- **Clock không đáng tin:** Raft dùng timeout tương đối + randomized, không dựa clock sync — đừng "tối ưu" bằng timeout cố định ngắn (gây election storm).
- **Tự implement Raft rất dễ sai:** membership change, snapshot, log compaction đầy edge case — production dùng etcd/Consul có sẵn.

## 🎯 Khi Nào Dùng

| Scenario | Khuyến nghị | Lập luận |
|----------|-------------|----------|
| Bầu primary/failover (DB, Kafka partition) | ✅ Bắt buộc | Không split-brain, failover tự động |
| Service registry/config center HA (etcd, Consul) | ✅ Bắt buộc | Membership phải nhất quán tuyệt đối |
| Distributed lock, barrier, sequence | ✅ Phù hợp | Cần một sự thật duy nhất, QPS thấp |
| Data path QPS cao (> 10k writes/s) | ❌ Không dùng trực tiếp | Quorum RTT giết throughput — dùng async replication |
| Single node / chấp nhận mất dữ liệu | ❌ Thừa | Consensus cost vô nghĩa khi không cần FT |

---

## 🔗 Liên Quan

- **13.5 CAP Theorem** — Raft là hệ CP điển hình: mất quorum thì hy sinh availability giữ consistency
- **13.9 API Gateway & Discovery** — Registry HA (etcd/Consul) đứng trên Raft
- **13.8 Message Queues** — Kafka KRaft dùng consensus bầu partition leader
- **13.4 Sharding** — Membership/shard map nhất quán nhờ consensus-backed control plane

---

## 📚 Tài Liệu

- 📖 [In Search of an Understandable Consensus (Raft paper)](https://raft.github.io/raft.pdf)
- 📖 [Raft Interactive Visualization](https://thesecretlivesofdata.com/raft/) — xem election/log replication trực quan
- 📖 [Paxos Made Simple (Lamport)](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf) — đọc sau khi đã hiểu Raft

---

## ▶️ Chạy ví dụ

Chạy file demo TypeScript của bài này:

```bash
cd 13-system-design/13.10-consensus-raft
npx tsx examples/index.ts
```

---

## ⏭️ Bài Tiếp Theo

→ [13.11 Case Studies](../13.11-case-studies/README.md)
