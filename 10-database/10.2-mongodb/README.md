# 🍃 10.2 MongoDB

> **MongoDB** là NoSQL document database, lưu dữ liệu dạng JSON-like (BSON), scalable theo chiều ngang. Ra đời 2009 tại 10gen (nay là MongoDB Inc.), nó giải quyết một vấn đề cụ thể: **schema rigidity của SQL làm chậm development khi requirement thay đổi liên tục**. MongoDB đặt data vào dạng document — gần với object trong code — nên developer không cần "chiều chuộng" database khi domain model thay đổi.

---

## 🎯 MongoDB là gì và tại sao chọn nó?

Document database khác relational database ở **cách tổ chức data**: thay vì chia data thành nhiều bảng liên kết qua foreign key, MongoDB **nhúng (embed)** data liên quan vào cùng 1 document. Điều này tối ưu cho **read pattern cố định** — khi bạn luôn đọc toàn bộ object cùng lúc, embed nhanh hơn join nhiều bảng.

**Vấn đề MongoDB giải quyết:**
1. **Schema agility** — thêm field mới không cần migration, chỉ cần app code hiểu field mới
2. **Natural mapping** — JavaScript object ↔ MongoDB document gần như 1:1, không còn "object-relational impedance mismatch"
3. **Horizontal scale** — sharding built-in, không cần third-party tool
4. **Rich query** — regex, geospatial, text search, aggregation pipeline

**Vấn đề MongoDB KHÔNG giải quyết (hoặc giải quyết kém):**
- Complex JOINs across collections (dùng $lookup, nhưng chậm hơn SQL JOIN)
- Multi-document transactions (có từ 4.0+, nhưng overhead cao hơn SQL)
- Strong consistency guarantees (default eventual consistency trong replica set)
- Schema enforcement (không có foreign key constraint, không có CHECK constraint mặc định)

---

## 📐 Document Model — Deep dive

```javascript
// Document mẫu — user trong MongoDB
// Lưu ý: BSON (Binary JSON) — mở rộng JSON với types: ObjectId, Date, BinData...
{
  _id: ObjectId("64a1b2c3d4e5f6a7b8c9d0e1"),  // Default primary key, auto-generated
  name: "Alice",
  email: "alice@example.com",
  role: "admin",
  createdAt: ISODate("2024-01-15T08:30:00Z"),  // BSON Date type
  updatedAt: ISODate("2024-06-20T14:22:00Z"),

  // Nested object — embedded document, query via dot notation
  profile: {
    avatar: "https://cdn.example.com/avatars/alice.jpg",
    bio: "Senior Developer",
    location: { city: "Hà Nội", country: "Vietnam", coords: [105.85, 21.03] },
    social: { twitter: "@alice_dev", github: "alicecodes", linkedin: "alice-dev" }
  },

  // Array of primitives
  tags: ["typescript", "mongodb", "backend", "system-design"],

  // Array of embedded documents —Trade-off: fast read, no FK constraint
  orders: [
    {
      orderId: "ord_001",
      total: 99.99,
      status: "completed",
      items: [
        { productId: "prod_123", name: "Mechanical Keyboard", qty: 1, price: 79.99 },
        { productId: "prod_456", name: "Mouse Pad", qty: 2, price: 9.99 }
      ],
      shippedAt: ISODate("2024-01-20T10:00:00Z")
    },
    {
      orderId: "ord_002",
      total: 49.50,
      status: "pending",
      items: [
        { productId: "prod_789", name: "USB Cable", qty: 1, price: 49.50 }
      ]
    }
  ],

  // Metadata fields
  preferences: { theme: "dark", language: "vi", notifications: true },
  loginHistory: [ISODate("2024-06-19T08:00:00Z"), ISODate("2024-06-18T09:15:00Z")]
}
```

**Embed vs Reference — Quyết định thiết kế quan trọng nhất:**

```
Embed (nested array/object):
✅ Fast read — 1 query, no join
✅ Atomic updates — update entire document in 1 op
❌ Document size limit (16MB per document in MongoDB)
❌ Read whole document even if you need 1 field
❌ Update amplification — rewrite entire document on partial update

Reference (separate collection, link by _id):
✅ Flexible — independent lifecycle per collection
✅ Smaller documents — no size limit concern
✅ Better for write-heavy — update specific doc
❌ Requires $lookup (join) for reads — slower, more complex
❌ No transaction guarantee across collections (historically)

Decision rule: Embed when the relationship is 1:1 or 1:few AND you always read them together.
              Reference when the relationship is 1:many OR the child collection is large/independent.
```

---

## 💻 CRUD Operations — TypeScript driver

```typescript
import { MongoClient, ObjectId, Double, Timestamp } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db('myapp');
const users = db.collection('users');
const orders = db.collection('orders');

// ── CREATE ─────────────────────────────────────────────
// insertOne — insert 1 document, returns { insertedId }
async function createUser(user: { name: string; email: string }) {
  const result = await users.insertOne({
    ...user,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: { settings: {} },  // initialize empty profile
  });
  return result.insertedId;  // ObjectId string
}

// insertMany — bulk insert, returns { insertedIds } (Map index → ObjectId)
async function bulkCreateUsers(usersData: Array<{ name: string; email: string }>) {
  const result = await users.insertMany(
    usersData.map(u => ({ ...u, role: 'user', createdAt: new Date() }))
  );
  return result.insertedIds;  // Map<number, ObjectId>
}

// ── READ ───────────────────────────────────────────────
// findOne — return 1 document or null
async function getUser(id: string) {
  return users.findOne({ _id: new ObjectId(id) });
}

// find — return cursor (lazy evaluation, doesn't execute until .toArray())
async function findUsersByRole(role: string, limit = 100) {
  return users
    .find({ role })
    .limit(limit)
    .sort({ createdAt: -1 })
    .toArray();
}

// Projection — only return selected fields (reduces network payload)
async function getUserSummary(id: string) {
  return users.findOne(
    { _id: new ObjectId(id) },
    { projection: { name: 1, email: 1, role: 1, _id: 1 } }  // 1 = include, 0 = exclude
  );
}

// Count documents — fast, uses index if available
async function countUsersByRole(role: string) {
  return users.countDocuments({ role });
}

// Distinct values — efficient for dropdown filters
async function getDistinctRoles() {
  return users.distinct('role');
}

// ── UPDATE ─────────────────────────────────────────────
// updateOne — update first matching document
async function updateUser(id: string, updates: Partial<object>) {
  return users.updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
}

// $inc — atomic increment (safe for counters, no race condition)
async function incrementViews(userId: string) {
  return users.updateOne(
    { _id: new ObjectId(userId) },
    { $inc: { views: 1 } }  // atomic, concurrent-safe
  );
}

// $push — add to array
async function addTag(userId: string, tag: string) {
  return users.updateOne(
    { _id: new ObjectId(userId), tags: { $ne: tag } },  // avoid duplicates
    { $push: { tags: tag } }
  );
}

// $pull — remove from array
async function removeTag(userId: string, tag: string) {
  return users.updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { tags: tag } }
  );
}

// $unset — remove field entirely
async function removeProfileField(userId: string, field: string) {
  return users.updateOne(
    { _id: new ObjectId(userId) },
    { $unset: { [`profile.${field}`]: '' } }
  );
}

// findByIdAndUpdate — update and return new value
async function updateAndGet(id: string, updates: Partial<object>) {
  return users.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: 'after', projection: { password: 0 } }  // exclude sensitive field
  );
}

// ── DELETE ─────────────────────────────────────────────
// deleteOne — delete first matching document
async function deleteUser(id: string) {
  return users.deleteOne({ _id: new ObjectId(id) });
}

// deleteMany — bulk delete
async function deleteInactiveUsers(days: number) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return users.deleteMany({ lastLoginAt: { $lt: cutoff } });
}

// findOneAndDelete — delete and return deleted document
async function softDeleteAndGet(id: string) {
  return users.findOneAndDelete({ _id: new ObjectId(id) });
}
```

### Array Operators — Power tools cho embedded documents

```typescript
// $elemMatch — find document where array element matches condition
db.orders.find({
  orders: { $elemMatch: { status: "pending", total: { $gt: 100 } } }
});

// $all — array contains ALL specified elements (AND semantics)
db.users.find({ tags: { $all: ["typescript", "mongodb"] } });

// $size — array has exact size (requires index for efficiency)
db.users.find({ tags: { $size: 3 } });

// Positional operator $ — update first matching array element
db.users.updateOne(
  { "orders.status": "pending" },
  { $set: { "orders.$.status": "shipped" } }  // $ = first matching element
);

// Array filters $[element] — update specific elements with conditions
db.users.updateOne(
  { orders: { $elemMatch: { status: "pending", total: { $gt: 50 } } } },
  { $set: { "orders.$[elem].status": "cancelled" } },
  { arrayFilters: [{ "elem.status": "pending", "elem.total": { $gt: 50 } }] }
);
```

---

## 📊 Aggregation Pipeline — Sức mạnh thực sự của MongoDB

Aggregation pipeline là **transform stream** của documents — mỗi stage nhận document, transform, pass sang stage tiếp theo. Pipeline được optimize bởi MongoDB engine, chạy trên server (không phải client-side), nên hiệu quả hơn nhiều so với fetch-all-then-process-in-JS.

```javascript
// Pipeline mẫu: Report doanh thu theo role
db.orders.aggregate([
  // Stage 1: $match — filter sớm nhất có thể để giảm data flowing downstream
  // (MongoDB có "pipeline pushdown" — filter pushed to storage engine)
  {
    $match: {
      status: "completed",
      createdAt: { $gte: ISODate("2024-01-01"), $lt: ISODate("2025-01-01") }
    }
  },

  // Stage 2: $lookup — LEFT JOIN với users collection
  // $lookup trong MongoDB 4.2+ hỗ trợ pipeline form (biến đổi trước join)
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },

  // Stage 3: $unwind — flatten array từ $lookup (luôn trả về array dù 1 result)
  // preserveNullAndEmptyArrays: true nếu muốn giữ orders không có user match
  { $unwind: "$user" },

  // Stage 4: $addFields — thêm computed field mới (không xóa field cũ)
  {
    $addFields: {
      profit: { $multiply: ["$amount", 0.15] },  // giả sử margin 15%
      isHighValue: { $gte: ["$amount", 500] }
    }
  },

  // Stage 5: $group — aggregate theo role
  {
    $group: {
      _id: "$user.role",
      totalRevenue: { $sum: "$amount" },
      totalProfit: { $sum: "$profit" },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: "$amount" },
      maxOrder: { $max: "$amount" },
      minOrder: { $min: "$amount" },
      // Collect all customer IDs per role (for later use)
      customerIds: { $push: "$user._id" }
    }
  },

  // Stage 6: $addFields — thêm field từ aggregate result
  {
    $addFields: {
      profitMargin: {
        $cond: {
          if: { $gt: ["$totalRevenue", 0] },
          then: { $divide: ["$totalProfit", "$totalRevenue"] },
          else: 0
        }
      }
    }
  },

  // Stage 7: $sort
  { $sort: { totalRevenue: -1 } },

  // Stage 8: $project — reshape output, rename fields, exclude _id
  {
    $project: {
      _id: 0,
      role: "$_id",
      revenue: "$totalRevenue",
      profit: "$totalProfit",
      count: "$orderCount",
      avgOrder: { $round: ["$avgOrderValue", 2] },
      margin: { $round: ["$profitMargin", 4] }
    }
  },

  // Stage 9: $limit
  { $limit: 10 }
]);
```

### Aggregation Operators Cheat Sheet

```
Arithmetic:    $add, $subtract, $multiply, $divide, $mod, $abs, $ceil, $floor, $round
Comparison:    $eq, $ne, $gt, $gte, $lt, $lte, $cond (ternary)
Logical:       $and, $or, $not, $nor
Array:         $arrayElemAt, $filter, $map, $reduce, $size, $slice, $isArray
Date:          $year, $month, $dayOfMonth, $hour, $minute, $second, $dateToString
String:        $concat, $substr, $toLower, $toUpper, $split, $trim
Conversion:    $toInt, $toString, $toDecimal, $toBool
Grouping:      $sum, $avg, $min, $max, $first, $last, $addToSet, $push
Accumulator:   $stdDevPop, $stdDevSamp, $variancePop, $varianceSamp
```

---

## ✅ Khi nào dùng MongoDB? — Lập luận chi tiết

| Tình huống | SQL (PostgreSQL) | MongoDB | Lập luận |
|------------|------------------|---------|----------|
| Schema cố định, quan hệ phức tạp | ✅ Tốt hơn | ❌ Không phù hợp | FK constraint + JOIN + ACID multi-table = SQL domain. MongoDB không có FK enforcement. |
| Data bán cấu trúc / linh hoạt | ⚠️ JSONB giúp được | ✅ Tốt hơn | Khi schema thay đổi weekly (content, IoT sensor), migration SQL là overhead không cần thiết. |
| Write scale lớn, shard nhiều | ⚠️ Cần tool bên thứ ba | ✅ Native sharding | MongoDB shard key tự động phân phối write across multiple servers. PostgreSQL shard cần Citus/pg_shard. |
| Query JOIN phức tạp | ✅ Tốt hơn | ⚠️ $lookup chậm | $lookup load foreign collection vào RAM → OOM risk với large collections. |
| Rapid prototyping / MVP | ⚠️ Cần migration | ✅ Không cần schema | `db.collection.insertOne(doc)` — chạy ngay, schema tự hình thành qua usage pattern. |
| Geospatial queries | ⚠️ PostGIS plugin | ✅ Built-in | MongoDB native $near, $geoWithin, $geoIntersects — không cần cài plugin. |
| Full-text search | ⚠️ TSvector setup | ✅ Text index | Nhưng Elasticsearch/Meilisearch vẫn mạnh hơn cả 2 cho search phức tạp. |
| Real-time analytics | ⚠️ Materialized view | ✅ Aggregation pipeline | Pipeline chạy trên server, streaming aggregation, gần real-time. |
| Content Management (blog, media) | ⚠️ Overkill | ✅ Excellent | Document model = natural fit cho hierarchical content (post → comments → tags). |
| Financial / banking | ❌ Risky | ❌❌ Worse | Strong consistency + ACID multi-record transaction = PostgreSQL only. |

> 📌 **Misconception fix:** "MongoDB không có schema" — sự thật là **schema vẫn tồn tại**, chỉ không được enforce ở DB layer. Developer phải validate schema ở application level (Zod, Joi, TypeScript interfaces). Nếu không có discipline, schema drift sẽ xảy ra và trở thànhtechnical debt ngầm.

---

## ⚠️ Caveats & Anti-Patterns — Tránh những pitfalls này

```
❌ Over-embedding: nhúng array lớn (1000+ items) vào document
   → Document size limit 16MB, read entire document for 1 field = waste

❌ Missing indexes: mặc định chỉ có _id index
   → Setiap query tanpa index = full collection scan
   → Tạo index sớm: db.collection.createIndex({ field: 1 })

❌ $lookup trong loop (N+1 query pattern)
   → 100 orders × $lookup users = 100 round trips
   → Thay bằng 1 aggregation pipeline với $lookup

❌ storing computed values without synchronization
   → total_amount trong order vs SUM(items.price * qty) trong order_items
   → Divergence = data inconsistency

❌ ignoring TTL for temporary data
   → Session data, log entries, events nên có TTL index
   → db.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

✅ Best practice: design document shape around access pattern, not normalization
✅ Best practice: always check query plan (db.collection.explain("executionStats"))
✅ Best practice: use $out hoặc $merge cho aggregation result caching
```

---

## ▶️ Chạy ví dụ

```bash
cd 10-database/10.2-mongodb
npx ts-node examples/index.ts
```

Demo bao gồm: CRUD operations, aggregation pipeline execution, và index creation. Để ý cách TypeScript typing được áp dụng với MongoDB driver — interface `User` map thẳng sang document shape.

---

## ⏭️ Bài tiếp theo

→ [10.3 Prisma ORM](../10.3-prisma-orm/README.md)
