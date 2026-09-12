# 🔷 11.3 GraphQL (GraphQL Schema, Queries & Mutations)

> **GraphQL** là query language cho API, cho phép client yêu cầu chính xác dữ liệu cần — không thừa, không thiếu.

---

## 🎯 GraphQL vs REST

```
┌─────────────────────────────────────────────────────────────┐
│  REST (Nhiều endpoints)                       GraphQL (1 endpoint) │
│                                                             │
│  GET /api/users        ─┐                                   │
│  GET /api/users/1      ─┤       POST /graphql               │
│  GET /api/users/1/posts ─┤    ═══════► {                   │
│  GET /api/users/1/friends ┘         users(id: "1") {       │
│                                      name                  │
│                                    }                        │
│  ❌ Over-fetching                    }                      │
│  ❌ Under-fetching (nhiều request)   ✅ Exact data request  │
└─────────────────────────────────────────────────────────────┘
```

| Feature | REST | GraphQL |
|---------|------|---------|
| Endpoints | Nhiều (`/users`, `/posts`) | 1 (`/graphql`) |
| Dữ liệu thừa | Có thể có | Không — client chọn field |
| Network requests | Nhiều lần | 1 lần |
| Versioning | `/v1/users`, `/v2/users` | Schema evolution |
| Caching | HTTP cache tự động | Phải implement manual |

---

## 11.3.1 GraphQL Schema (Typedef)

```typescript
// schema.ts — Định nghĩa schema bằng SDL (Schema Definition Language)
import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
    createdAt: DateTime!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
    createdAt: DateTime!
  }

  type Comment {
    id: ID!
    text: String!
    author: User!
    post: Post!
  }

  input CreateUserInput {
    name: String!
    email: String!
  }

  input CreatePostInput {
    title: String!
    content: String!
    authorId: ID!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    createPost(input: CreatePostInput!): Post!
    deletePost(id: ID!): Boolean!
  }
`;
```

---

## 11.3.2 Resolvers (Giải Quyết Data)

```typescript
// resolvers.ts
const users = [
  { id: '1', name: 'John', email: 'john@example.com' },
  { id: '2', name: 'Jane', email: 'jane@example.com' }
];

const posts = [
  { id: '1', title: 'GraphQL Intro', content: '...', authorId: '1' },
  { id: '2', title: 'REST vs GraphQL', content: '...', authorId: '2' }
];

const resolvers = {
  Query: {
    users: () => users,
    user: (_, { id }) => users.find(u => u.id === id),
    posts: () => posts,
    post: (_, { id }) => posts.find(p => p.id === id)
  },

  Mutation: {
    createUser: (_, { input }) => {
      const user = { id: String(users.length + 1), ...input };
      users.push(user);
      return user;
    },
    createPost: (_, { input }) => {
      const post = { id: String(posts.length + 1), ...input };
      posts.push(post);
      return post;
    }
  },

  // Nested resolvers — resolve relationships
  User: {
    posts: (user) => posts.filter(p => p.authorId === user.id)
  },
  Post: {
    author: (post) => users.find(u => u.id === post.authorId)
  }
};
```

---

## 11.3.3 Apollo Server Setup

```typescript
// server.ts
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const app = express();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (err) => {
    console.error('GraphQL Error:', err.message);
    return { message: err.message };
  }
});

await server.start();
server.applyMiddleware({ app, path: '/graphql' });

app.listen(4000, () => {
  console.log('🚀 GraphQL server at http://localhost:4000/graphql');
});
```

---

## 11.3.4 Queries (Truy Vấn Dữ Liệu)

```graphql
# query.graphql

# Query cơ bản — lấy tất cả users
query GetUsers {
  users {
    id
    name
    email
  }
}

# Query có biến — lấy user theo ID
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    posts {
      title
      content
    }
  }
}

# Nested query — lấy posts kèm author
query GetPosts {
  posts {
    id
    title
    author {
      name
      email
    }
  }
}
```

**Client call với TypeScript:**

```typescript
import { gql, useQuery } from '@apollo/client';

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
    }
  }
`;

// React hook example
const { data, loading, error } = useQuery(GET_USERS);

if (loading) return <p>Đang tải...</p>;
if (error) return <p>Lỗi: {error.message}</p>;
return <ul>{data.users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
```

---

## 11.3.5 Mutations (Thay Đổi Dữ Liệu)

```graphql
# mutation.graphql

mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
  }
}

mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    author {
      name
    }
  }
}
```

```typescript
import { useMutation } from '@apollo/client';

const [createUser, { loading }] = useMutation(CREATE_USER_MUTATION);

await createUser({
  variables: {
    input: { name: 'Alice', email: 'alice@example.com' }
  }
});
```

---

## 11.3.6 Subscriptions (Real-time Events)

```typescript
// schema.ts — thêm Subscription type
const typeDefs = gql`
  type Subscription {
    postCreated: Post!
    userConnected: User!
  }
`;
```

```typescript
// resolvers.ts
import { PubSub } from 'graphql-subscriptions';
const pubsub = new PubSub();

const resolvers = {
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(['POST_CREATED'])
    }
  },
  Mutation: {
    createPost: (_, { input }) => {
      const post = { id: String(posts.length + 1), ...input };
      posts.push(post);
      pubsub.publish('POST_CREATED', { postCreated: post });
      return post;
    }
  }
};
```

```graphql
subscription OnPostCreated {
  postCreated {
    id
    title
    author { name }
  }
}
```

---

## 📋 Quick Reference

| Khái niệm | Mô tả |
|-----------|-------|
| **Schema** | Định nghĩa types, queries, mutations |
| **Resolver** | Hàm trả về data cho từng field |
| **Query** | Đọc dữ liệu (giống GET) |
| **Mutation** | Thay đổi dữ liệu (giống POST/PUT/DELETE) |
| **Subscription** | Real-time event stream (WebSocket) |
| **Scalar** | Loại dữ liệu cơ bản: String, Int, Float, Boolean, ID |

---

## 🔗 Liên Quan

- **11.2 REST API** — Thiết kế RESTful APIs
- **11.4 WebSockets** — Real-time communication

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| GraphQL Official Docs | https://graphql.org/learn/ |
| Apollo Client Guide | https://www.apollographql.com/docs/ |
| GraphQL Schema Design | https://graphql.org/schema/ |

---

## ⏭️ Bài tiếp theo → [11.4 WebSockets](../11.4-websockets/README.md)
