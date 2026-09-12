# 🍃 10.2 MongoDB

> **MongoDB** là NoSQL document database, lưu dữ liệu dạng JSON-like (BSON), scalable theo chiều ngang.

```
┌─────────────────────────────────────────────────────────────┐
│           SQL vs MongoDB                                    │
├──────────────────┬──────────────────────────────────────────┤
│ SQL              │ MongoDB                                 │
├──────────────────┼──────────────────────────────────────────┤
│ Table            │ Collection                              │
│ Row              │ Document (BSON)                         │
│ Column           │ Field                                   │
│ Join             │ $lookup (aggregate)                     │
│ Schema định sẵn  │ Schema linh hoạt (schemaless)           │
│ Scale đứng       │ Scale ngang (sharding)                  │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 📐 Document Model

```javascript
// Document mẫu — user trong MongoDB
{
  _id: ObjectId("64a1..."),
  name: "Alice",
  email: "alice@example.com",
  role: "admin",
  createdAt: ISODate("2024-01-15"),
  profile: {
    avatar: "https://...",
    bio: "Developer",
    social: { twitter: "@alice" }
  },
  tags: ["typescript", "mongodb"],
  orders: [
    { orderId: "ord_001", total: 99.99, status: "completed" },
    { orderId: "ord_002", total: 49.50, status: "pending" }
  ]
}
```

---

## 💻 CRUD Operations

```typescript
import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db('myapp');
const users = db.collection('users');
const orders = db.collection('orders');

// ── CREATE ─────────────────────────────────────────────
async function createUser(user: { name: string; email: string }) {
  const result = await users.insertOne({
    ...user,
    role: 'user',
    createdAt: new Date(),
  });
  return result.insertedId;
}

// ── READ ───────────────────────────────────────────────
async function getUser(id: string) {
  return users.findOne({ _id: new ObjectId(id) });
}

async function findUsersByRole(role: string) {
  return users.find({ role }).toArray();
}

// ── UPDATE ─────────────────────────────────────────────
async function updateUser(id: string, updates: Partial<object>) {
  return users.updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );
}

async function incrementViews(userId: string) {
  return users.updateOne(
    { _id: new ObjectId(userId) },
    { $inc: { views: 1 } }
  );
}

// ── DELETE ─────────────────────────────────────────────
async function deleteUser(id: string) {
  return users.deleteOne({ _id: new ObjectId(id) });
}
```

---

## 📊 Aggregation Pipeline

```javascript
// Pipeline: các stage nối tiếp nhau
db.orders.aggregate([
  // Stage 1: Filter
  { $match: { status: "completed" } },
  // Stage 2: Join với users
  { $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user"
    }
  },
  // Stage 3: Unwind array
  { $unwind: "$user" },
  // Stage 4: Group + aggregate
  { $group: {
      _id: "$user.role",
      totalRevenue: { $sum: "$amount" },
      orderCount: { $sum: 1 }
    }
  },
  // Stage 5: Sort
  { $sort: { totalRevenue: -1 } },
  // Stage 6: Project (chọn cột)
  { $project: {
      _id: 0,
      role: "$_id",
      revenue: "$totalRevenue",
      count: "$orderCount"
    }
  }
]);
```

```typescript
// TypeScript với MongoDB Driver
const pipeline = [
  { $match: { status: 'completed' as const } },
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user',
    },
  },
  { $unwind: '$user' },
  {
    $group: {
      _id: '$user.role',
      totalRevenue: { $sum: '$amount' },
      orderCount: { $sum: 1 },
    },
  },
];

const results = await orders.aggregate(pipeline).toArray();
```

---

## ✅ Khi nào dùng MongoDB?

| Tình huống | SQL (PostgreSQL) | MongoDB |
|------------|------------------|---------|
| Schema cố định, quan hệ phức tạp | ✅ Tốt hơn | ❌ |
| Data bán cấu trúc / linh hoạt | ❌ | ✅ Tốt hơn |
| Write scale lớn, shard nhiều | ⚠️ Khó | ✅ Native sharding |
| Query JOIN phức tạp | ✅ Tốt hơn | ⚠️ $lookup chậm |
| Rapid prototyping | ⚠️ Cần migration | ✅ Không cần schema |
| Geospatial queries | ⚠️ PostGIS cần plugin | ✅ Built-in |

---

## ⚠️ Lưu ý khi dùng MongoDB

- Thiếu transaction multi-collection (tuy đã có vào 4.0+)
- Không có FOREIGN KEY constraint
- Cần index thủ công cho query performance
- $lookup JOIN không hiệu quả như SQL JOIN

---

⏭️ Bài tiếp theo → [10.3 Prisma ORM](../10.3-prisma-orm/README.md)
