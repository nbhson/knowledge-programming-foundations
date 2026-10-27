# 🔷 11.3 GraphQL (GraphQL Schema, Queries & Mutations)

> **GraphQL** là query language cho API, cho phép client yêu cầu chính xác dữ liệu cần — không thừa, không thiếu. Được Facebook phát triển 2012, open-source 2015, GraphQL giải quyết hai vấn đề cốt lõi của REST: **over-fetching** (lấy nhiều data hơn cần) và **under-fetching** (cần nhiều requests để get nested data). Nhưng GraphQL đổi trade-off: thay vì HTTP caching tự động, bạn phải implement cache manual; thay vì nhiều endpoints dễ debug, bạn có 1 endpoint phức tạp hơn.

---

## 🎯 GraphQL vs REST — Deep comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REST (Nhiều endpoints)                    GraphQL (1 endpoint)        │
│                                                                         │
│  GET /api/users          ─┐                                             │
│  GET /api/users/1        ─┤                                             │
│  GET /api/users/1/posts   ─┤    POST /graphql                           │
│  GET /api/users/1/friends ─┤ ═══════════► {                             │
│                             │            users(id: "1") {               │
│  ❌ Over-fetching:         │              name                          │
│     GET /api/users/1       │              email                         │
│     returns 50 fields      │              posts {                       │
│     but UI only needs 3    │                title                      │
│                            │                createdAt                  │
│  ❌ Under-fetching:        │              }                             │
│     Need user + posts?     │            }                               │
│     2 separate requests    │          }                                 │
│     → 2 round trips        │                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

| Feature | REST | GraphQL | Giải thích sâu |
|---------|------|---------|----------------|
| Endpoints | Nhiều (`/users`, `/posts`, `/orders`) | 1 (`/graphql`) | GraphQL dùng single endpoint cho mọi operation — client self-describe cần gì |
| Dữ liệu thừa | Có thể có (GET /users trả về full object) | Không — client chọn field | Client control over shape = precise payloads, especially critical for mobile (bandwidth savings) |
| Network requests | Nhiều lần cho nested data | 1 lần | ONE crucial advantage: 1 request thay vì N sequential HTTP calls |
| Versioning | `/v1/users`, `/v2/users` (breaking = new version) | Schema evolution | GraphQL schema có thể thêm field mà không breaking existing queries |
| Caching | HTTP cache (CDN, browser) tự động | Phải implement manual | Trade-off lớn: REST có free caching, GraphQL phải build cache layer |
| Learning curve | Thấp | Trung bình | REST: ai cũng biết HTTP. GraphQL: cần học SDL, resolvers, directives, Apollo/urql patterns |
| Tooling | Swagger/OpenAPI, Postman | Apollo Studio, GraphiQL, GraphQL Playground | GraphQL có better dev experience (introspection, schema visualization) |
| Best for | Public APIs, simple CRUD, mobile apps | Complex UIs, multiple clients, rapid iteration | Context-dependent — no universal "better" |

### Khi nào GraphQL thực sự worth it:

```
✅ GraphQL phù hợp khi:
   - Nhiều clients (web, iOS, Android, admin dashboard) cần data shapes khác nhau
   - Frontend frequently thay đổi requirements (new fields, new layouts)
   - Mobile app cần minimize bandwidth (slow networks, expensive data plans)
   - API có nhiều nested relationships (user → posts → comments → likes)
   - Rapid prototyping — schema evolves faster than backend implementation

❌ GraphQL KHÔNG phù hợp khi:
   - Simple CRUD API với ít clients
   - Heavy file upload workflows (GraphQL multipart awkward)
   - Real-time only use case (WebSocket/sse better)
   - Team chưa quen TypeScript/SDL (steep learning curve)
   - Need simple HTTP caching (CDN, browser cache)
```

---

## 11.3.1 GraphQL Schema (SDL) — The contract

GraphQL schema là **single source of truth** — định nghĩa tất cả types, queries, mutations, subscriptions. Schema được viết bằng **SDL (Schema Definition Language)**, text format dễ đọc.

```typescript
// schema.ts — Định nghĩa schema bằng SDL
import { gql } from 'graphql-tag'; // Apollo Server 4/5: gql nằm ở graphql-tag (apollo-server-express đã EOL)

const typeDefs = gql`
  # Scalar types — built-in: String, Int, Float, Boolean, ID
  # Custom scalar — extend with resolver
  scalar DateTime
  scalar Upload

  # Enum — constrained set of values
  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  enum UserRole {
    USER
    MODERATOR
    ADMIN
  }

  # Object types — the building blocks
  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    bio: String
    avatar: String
    posts: [Post!]!            # 1-to-Many: user has many posts
    followers: [User!]!        # Many-to-Many: user's followers
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String!
    status: PostStatus!
    viewCount: Int!
    publishedAt: DateTime
    author: User!               # Relation to User (resolved by resolver)
    comments: [Comment!]!       # 1-to-Many: post has many comments
    categories: [Category!]!    # Many-to-Many via junction
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Comment {
    id: ID!
    text: String!
    author: User!
    post: Post!
    parent: Comment             # Self-referencing for threaded comments
    replies: [Comment!]         # Nested replies
    createdAt: DateTime!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    posts: [Post!]!
  }

  # Input types — for mutations (required fields marked with !)
  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    role: UserRole
  }

  input UpdateUserInput {
    name: String
    bio: String
    avatar: String
    role: UserRole
  }

  input CreatePostInput {
    title: String!
    slug: String!
    content: String!
    categoryIds: [ID!]
    status: PostStatus
  }

  input CreateCommentInput {
    text: String!
    postId: ID!
    parentId: ID               # Optional — for replies
  }

  # Query type — READ operations (equivalent to HTTP GET)
  type Query {
    # List with pagination and filtering
    users(
      first: Int = 10
      after: String             # Cursor for pagination
      role: UserRole
      search: String
    ): UserConnection!

    # Single resource
    user(id: ID!): User

    # List posts
    posts(
      first: Int = 10
      after: String
      status: PostStatus
      categoryId: ID
    ): PostConnection!

    # Single post by ID or slug
    post(id: ID): Post
    postBySlug(slug: String!): Post
  }

  # Mutation type — WRITE operations (equivalent to HTTP POST/PUT/PATCH/DELETE)
  type Mutation {
    # Auth mutations
    signup(input: CreateUserInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(token: String!): AuthPayload!

    # User mutations
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!

    # Post mutations
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    publishPost(id: ID!): Post!

    # Comment mutations
    createComment(input: CreateCommentInput!): Comment!
    deleteComment(id: ID!): Boolean!
  }

  # Subscription type — REAL-TIME events (WebSocket transport)
  type Subscription {
    # Subscribe to new posts
    postCreated: Post!

    # Subscribe to comments on a post
    commentAdded(postId: ID!): Comment!

    # Subscribe to user online status
    userStatusChanged(userId: ID!): User!
  }

  # Pagination wrapper type
  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Auth response wrapper
  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }
`;
```

### SDL Key concepts:

```
! (non-null)     → Field cannot be null. Required by GraphQL spec.
[Type!]!        → List of non-null types, list itself non-null.
[Type]          → List that may contain nulls, list itself may be null.
input Type      → Input type for mutations (cannot have methods/resolvers).
scalar Name     → Custom scalar (DateTime, Upload, JSON).
enum Name       → Constrained string set.
type Name       → Object type (returned by queries/mutations).
interface Name  → Shared fields across types (advanced).
union Name      → Can be one of several types (advanced).
```

---

## 11.3.2 Resolvers — Data fetching logic

Resolvers là hàm trả về data cho từng field trong query. Mỗi resolver nhận 4 arguments: `(parent, args, context, info)`.

```typescript
// resolvers.ts
import { PubSub } from 'graphql-subscriptions';
import { verifyToken, hashPassword, generateToken } from './auth';

// In-memory store (use database in production)
const users = [
  { id: '1', name: 'John', email: 'john@example.com', role: 'USER' as const, createdAt: new Date('2024-01-01') },
  { id: '2', name: 'Jane', email: 'jane@example.com', role: 'ADMIN' as const, createdAt: new Date('2024-01-15') },
];

const posts = [
  { id: '1', title: 'GraphQL Intro', content: '...', authorId: '1', status: 'PUBLISHED' as const, viewCount: 42, createdAt: new Date() },
  { id: '2', title: 'REST vs GraphQL', content: '...', authorId: '2', status: 'PUBLISHED' as const, viewCount: 18, createdAt: new Date() },
];

const pubsub = new PubSub();

const resolvers = {
  // ── Custom scalar resolvers ─────────────────────────────
  DateTime: {
    // Serialize: JS Date → ISO string
    serialize: (value: Date) => value.toISOString(),
    // Parse: ISO string → JS Date (for input)
    parseValue: (value: string) => new Date(value),
    parseLiteral: (ast) => new Date(ast.value),
  },

  // ── Query resolvers ─────────────────────────────────────
  Query: {
    // List users with cursor pagination
    users: (_, { first = 10, after, role, search }) => {
      let filtered = users;
      if (role) filtered = filtered.filter(u => u.role === role);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
      }

      // Cursor pagination: after = last seen cursor (userId)
      let edgeUsers = filtered;
      if (after) {
        const afterIndex = filtered.findIndex(u => u.id === after);
        edgeUsers = filtered.slice(afterIndex + 1);
      }
      const edges = edgeUsers.slice(0, first).map(u => ({ node: u, cursor: u.id }));
      const hasNextPage = edges.length === first && afterIndex !== undefined;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
      };
    },

    // Single user
    user: (_, { id }) => users.find(u => u.id === id) || null,

    // Posts with filtering
    posts: (_, { first = 10, after, status }) => {
      let filtered = posts;
      if (status) filtered = filtered.filter(p => p.status === status);

      let edgePosts = filtered;
      if (after) {
        const afterIndex = filtered.findIndex(p => p.id === after);
        edgePosts = filtered.slice(afterIndex + 1);
      }
      const edges = edgePosts.slice(0, first).map(p => ({ node: p, cursor: p.id }));

      return {
        edges,
        pageInfo: {
          hasNextPage: edges.length === first,
          hasPreviousPage: !!after,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
      };
    },

    // Single post by ID or slug
    post: (_, { id }) => posts.find(p => p.id === id) || null,
    postBySlug: (_, { slug }) => posts.find(p => p.slug === slug) || null,
  },

  // ── Mutation resolvers ──────────────────────────────────
  Mutation: {
    signup: async (_, { input }) => {
      const existing = users.find(u => u.email === input.email);
      if (existing) throw new Error('Email đã tồn tại');

      const user = {
        id: String(users.length + 1),
        ...input,
        role: input.role || 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.push(user);

      const token = generateToken(user);
      const refreshToken = generateToken({ ...user, type: 'refresh' });

      return { token, refreshToken, user };
    },

    login: async (_, { email, password }) => {
      const user = users.find(u => u.email === email);
      if (!user || user.password !== password) {  // In production: bcrypt.compare()
        throw new Error('Email hoặc mật khẩu không đúng');
      }
      const token = generateToken(user);
      const refreshToken = generateToken({ ...user, type: 'refresh' });
      return { token, refreshToken, user };
    },

    createPost: (_, { input }, { user }) => {
      if (!user) throw new Error('Unauthorized');

      const post = {
        id: String(posts.length + 1),
        ...input,
        authorId: user.id,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      posts.push(post);

      // Publish real-time event
      pubsub.publish('POST_CREATED', { postCreated: post });

      return post;
    },

    deletePost: (_, { id }) => {
      const index = posts.findIndex(p => p.id === id);
      if (index === -1) return false;
      posts.splice(index, 1);
      return true;
    },

    createComment: (_, { input }, { user }) => {
      if (!user) throw new Error('Unauthorized');

      const comment = {
        id: String(Date.now()),
        ...input,
        authorId: user.id,
        createdAt: new Date(),
      };
      // In production: save to DB, then publish event
      pubsub.publish('COMMENT_ADDED', { commentAdded: comment });
      return comment;
    },
  },

  // ── Field resolvers (nested type resolution) ────────────
  // These resolve relations between types
  User: {
    // Resolve posts for a user
    posts: (user) => posts.filter(p => p.authorId === user.id),

    // Resolve followers (simplified — in production: separate users_following table)
    followers: (user) => users.filter(u => u.id !== user.id),  // All others as demo
  },

  Post: {
    // Resolve author
    author: (post) => users.find(u => u.id === post.authorId),

    // Resolve comments
    comments: (post) => [],  // In production: query comments by postId

    // Resolve categories
    categories: (post) => [],  // In production: junction table query

    // Computed field
    viewCount: (post) => post.viewCount,
  },

  Comment: {
    author: (comment) => users.find(u => u.id === comment.authorId),
    post: (comment) => posts.find(p => p.id === comment.postId),
    parent: (comment) => null,  // In production: self-join
    replies: (comment) => [],   // In production: filter by parentId
  },

  // ── Subscription resolvers ──────────────────────────────
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(['POST_CREATED']),
    },
    commentAdded: {
      subscribe: (_, { postId }) => pubsub.asyncIterator(['COMMENT_ADDED']),
    },
    userStatusChanged: {
      subscribe: (_, { userId }) => pubsub.asyncIterator(['USER_STATUS_CHANGED']),
    },
  },
};
```

---

## 11.3.3 Apollo Server Setup — Full server configuration

```typescript
// server.ts
// ⚠️ Apollo Server 3 (package `apollo-server-express`) đã EOL — dùng Apollo Server 4/5:
//    import từ '@apollo/server' và tích hợp Express qua '@as-integrations/express5' (hoặc express4).
//    Alternative: GraphQL Yoga hoặc graphql-http.
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { authenticate } from './middleware/auth';

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(authenticate);  // Attach user to context

const server = new ApolloServer({
  typeDefs,
  resolvers,

  // Lưu ý: Apollo Server 4/5 KHÔNG nhận `context` trong constructor nữa —
  // context được truyền qua expressMiddleware() bên dưới.

  // Error formatting: strip stack traces from production errors
  formatError: (err) => {
    // Log full error server-side
    console.error('GraphQL Error:', err.extensions?.code, err.message);

    // Return safe error to client
    if (err.extensions?.code === 'UNAUTHENTICATED') {
      return { message: 'Không có quyền truy cập' };
    }
    if (err.extensions?.code === 'BAD_USER_INPUT') {
      return { message: err.message };
    }
    return { message: 'Đã có lỗi xảy ra' };
  },

  // Playgrounds: enable in dev, disable in production
  introspection: process.env.NODE_ENV !== 'production',
  plugins: [
    // Request logging plugin
    {
      requestDidStart: () => ({
        didResolveOperation: ({ request, document }) => {
          console.log(`[${request.operationName}] executed`);
        },
        willSendResponse: ({ response }) => {
          console.log(`[${response.operationName}] completed in ${response.perf.durationNs / 1e6}ms`);
        },
      }),
    },
  ],
});

await server.start();

// Tích hợp với Express qua @as-integrations/express5 (thay cho server.applyMiddleware của AS3)
app.use('/graphql', expressMiddleware(server, {
  // Context: shared across all resolvers (user, DB client, etc.)
  context: async ({ req }) => ({
    user: (req as any).user,          // Set by auth middleware
    pubsub: new (require('graphql-subscriptions').PubSub)(),
  }),
}));

app.listen({ port: process.env.PORT || 4000 }, () => {
  console.log(`🚀 GraphQL server at http://localhost:4000${server.graphqlPath}`);
  console.log(`📖 GraphQL Playground: http://localhost:4000${server.graphqlPath}`);
});
```

---

## 11.3.4 Queries — Reading data

```graphql
# query.graphql — Các mẫu query phổ biến

# ── Basic query: list users ──────────────────────────────
query GetUsers {
  users(first: 10) {
    edges {
      node {
        id
        name
        email
        role
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}

# ── Query with variables: get user by ID ────────────────
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    posts(first: 5) {
      edges {
        node {
          id
          title
          status
          viewCount
          createdAt
        }
      }
    }
  }
}
# Variables: { "id": "1" }

# ── Nested query: get post with author and comments ─────
query GetPostWithDetails($slug: String!) {
  postBySlug(slug: $slug) {
    id
    title
    content
    status
    viewCount
    author {
      id
      name
      avatar
    }
    comments {
      id
      text
      author {
        name
      }
      replies {
        id
        text
        author {
          name
        }
      }
    }
    createdAt
  }
}
# Variables: { "slug": "graphql-intro" }

# ── Query with filtering ────────────────────────────────
query GetPosts($status: PostStatus, $first: Int) {
  posts(status: $status, first: $first) {
    edges {
      node {
        id
        title
        status
        viewCount
        publishedAt
      }
    }
  }
}
# Variables: { "status": "PUBLISHED", "first": 20 }
```

```typescript
// Client call với @apollo/client
import { gql, useQuery } from '@apollo/client';

const GET_USERS = gql`
  query GetUsers($first: Int, $role: UserRole) {
    users(first: $first, role: $role) {
      edges {
        node { id, name, email, role }
        cursor
      }
      pageInfo { hasNextPage, endCursor }
    }
  }
`;

// React hook example
const { data, loading, error, fetchMore } = useQuery(GET_USERS, {
  variables: { first: 10, role: 'USER' },
});

if (loading) return <p>Đang tải...</p>;
if (error) return <p>Lỗi: {error.message}</p>;

return (
  <div>
    <ul>
      {data.users.edges.map(({ node, cursor }) => (
        <li key={node.id}>{node.name} ({node.role})</li>
      ))}
    </ul>
    {data.users.pageInfo.hasNextPage && (
      <button onClick={() => fetchMore({ variables: { after: data.users.pageInfo.endCursor } })}>
        Tải thêm
      </button>
    )}
  </div>
);
```

---

## 11.3.5 Mutations — Writing data

```graphql
# mutation.graphql — Các mẫu mutation

# ── Create user ──────────────────────────────────────────
mutation CreateUser($input: CreateUserInput!) {
  signup(input: $input) {
    token
    refreshToken
    user {
      id
      name
      email
      role
    }
  }
}
# Variables: { "input": { "name": "Alice", "email": "alice@example.com", "password": "secret123" } }

# ── Create post ──────────────────────────────────────────
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    slug
    status
    author { name }
    createdAt
  }
}
# Variables: { "input": { "title": "My Post", "slug": "my-post", "content": "Hello world!", "categoryIds": ["cat-1"] } }

# ── Update user ──────────────────────────────────────────
mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    bio
    avatar
    role
  }
}

# ── Delete post ──────────────────────────────────────────
mutation DeletePost($id: ID!) {
  deletePost(id: $id)
}
```

```typescript
// Client call với useMutation hook
import { useMutation } from '@apollo/client';

const [createPost, { loading, error }] = useMutation(CREATE_POST_MUTATION);

const handleSubmit = async (input: CreatePostInput) => {
  try {
    const { data } = await createPost({ variables: { input } });
    // Optimistic update: update cache immediately before server response
    // Apollo cache automatically updated via data response
    router.push(`/posts/${data.createPost.slug}`);
  } catch (err) {
    setError(err.message);
  }
};
```

### Mutation best practices:

```
✅ ALWAYS wrap mutation in try/catch
✅ Use optimistic updates for better UX (update cache before server responds)
✅ Invalidate relevant cache entries after mutation (use refetchQueries or cache.evict)
✅ Return complete object from mutation (not just ID) — avoids extra query
✅ Use input types for complex mutations (typed, validated)
❌ Don't use queries for writes — mutations have semantic meaning (side effects)
❌ Don't mutate without authorization check in resolver context
```

---

## 11.3.6 Subscriptions — Real-time events

```typescript
// Schema — thêm Subscription type
const typeDefs = gql`
  type Subscription {
    postCreated: Post!
    commentAdded(postId: ID!): Comment!
    userOnline(userId: ID!): User!
  }
`;

// Resolvers
const resolvers = {
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(['POST_CREATED']),
    },
    commentAdded: {
      subscribe: (_, { postId }) => pubsub.asyncIterator(['COMMENT_ADDED']),
    },
    userOnline: {
      subscribe: () => pubsub.asyncIterator(['USER_ONLINE']),
    },
  },
  Mutation: {
    createPost: (_, { input }, { user, pubsub }) => {
      const post = { id: String(posts.length + 1), ...input, authorId: user.id };
      posts.push(post);
      // Publish to all subscribers
      pubsub.publish('POST_CREATED', { postCreated: post });
      return post;
    },
  },
};
```

```graphql
# Client subscription
subscription OnPostCreated {
  postCreated {
    id
    title
    author { name }
    createdAt
  }
}
```

```typescript
// React subscription hook
import { useSubscription } from '@apollo/client';

const { data, loading, error } = useSubscription(ON_POST_CREATED);

if (loading) return <p>Đang kết nối...</p>;
if (error) return <p>Lỗi kết nối real-time</p>;

// data.postCreated sẽ có mỗi khi post mới được tạo
useEffect(() => {
  if (data?.postCreated) {
    notification.success({ message: `Bài viết mới: ${data.postCreated.title}` });
  }
}, [data]);
```

> 💡 **WebSocket transport cho subscriptions:** GraphQL subscriptions yêu cầu WebSocket connection (thường tại `/graphql` với `Upgrade: websocket` header). Apollo Client tự động switch từ HTTP → WebSocket khi detect subscription operation.

---

## 📋 Quick Reference — Vocabulary

| Khái niệm | Mô tả | Ví dụ |
|-----------|-------|-------|
| **Schema** | Định nghĩa types, queries, mutations, subscriptions | `type User { id: ID! name: String! }` |
| **Type** | Object type định nghĩa shape của data | `type Post { id title content }` |
| **Input** | Input type cho mutation arguments | `input CreateUserInput { name email password }` |
| **Enum** | Constrained string set | `enum PostStatus { DRAFT PUBLISHED }` |
| **Scalar** | primitive type (String, Int, Float, Boolean, ID) | `id: ID!` |
| **Resolver** | Hàm trả về data cho field | `User.posts = (parent) => posts.filter(...)` |
| **Query** | Read operation (GET equivalent) | `query GetUser($id) { user(id: $id) { name } }` |
| **Mutation** | Write operation (POST/PUT/PATCH/DELETE equivalent) | `mutation CreatePost($input) { createPost(input: $input) { id } }` |
| **Subscription** | Real-time event stream (WebSocket) | `subscription OnPostCreated { postCreated { title } }` |
| **Directive** | Metadata annotation (@skip, @include, @deprecated) | `field @deprecated(reason: "use newField")` |
| **Fragment** | Reusable query piece | `fragment UserFields on User { id name }` |
| **Variable** | Parameterized query input | `$id: ID!` in query definition |

---

## 🔗 Liên Quan

- **11.2 REST API** — Thiết kế RESTful APIs (alternative approach)
- **11.4 WebSockets** — Real-time communication (subscriptions use WebSocket transport)
- **11.5 REST Clients** — HTTP client patterns (Apollo Client uses HTTP + WebSocket)

---

## 📚 Tài Liệu Tham Khảo

| Tài liệu | Liên kết |
|----------|---------|
| GraphQL Official Docs | https://graphql.org/learn/ |
| Apollo Client Guide | https://www.apollographql.com/docs/react/ |
| Apollo Server Docs | https://www.apollographql.com/docs/apollo-server/ |
| GraphQL Schema Design | https://graphql.org/schema/ |
| Relay Specification | https://relay.dev/docs/ |

---

## ▶️ Chạy ví dụ

```bash
cd 11-networking-apis/11.3-graphql
npx ts-node examples/index.ts
```

Demo bao gồm: schema definition, query/mutation execution, nested resolvers, và subscription setup. Chú ý cách TypeScript typing được áp dụng cho resolvers và how Apollo cache auto-optimizes repeated queries.

---

## ⏭️ Bài tiếp theo → [11.4 WebSockets](../11.4-websockets/README.md)
