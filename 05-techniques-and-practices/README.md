# ⚙️ Lớp 5: Techniques & Practices (Kỹ Thuật & Thực Hành)

> **Techniques & Practices** là các **phương pháp làm việc cụ thể** hàng ngày trong lập trình.
>
> **Ví dụ:** Công nhân xây dựng hàng ngày — cách làm việc, công cụ sử dụng.

---

## Tổng Quan

```
Techniques & Practices
├── 5.1  Testing Techniques (Kỹ Nghiệm Kiểm Thử)
├── 5.2  Development Methodologies (Phương Pháp Phát Triển)
├── 5.3  Performance Optimization Techniques
├── 5.4  Security Techniques (Kỹ Thuật Bảo Mật)
├── 5.5  State Management Techniques
├── 5.6  Refactoring Techniques
├── 5.7  Source Code Management (Quản Lý Mã Nguồn)
├── 5.8  Code Organization Techniques
├── 5.9  API Design Techniques
├── 5.10 Error Handling Techniques
├── 5.11 Error Handling in Architecture
├── 5.12 Event-Based Techniques
├── 5.13 Deployment & Infrastructure Techniques
└── 5.14 Data Handling Techniques
```

---

## 5.1 Testing Techniques (Kỹ Nghiệm Kiểm Thử)

---

### Unit Testing

**Mô tả:** Kiểm tra từng **đơn vị code nhỏ nhất** (function, method) trong **cô lập**.

```typescript
// Function to test
function add(a: number, b: number): number {
  return a + b;
}

// Unit test
describe("add", () => {
  it("should add two positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("should handle negative numbers", () => {
    expect(add(-1, -2)).toBe(-3);
  });

  it("should return 0 when adding 0", () => {
    expect(add(0, 0)).toBe(0);
  });
});
```

**Principles:**
- Test một function/method trong cô lập
- Mock external dependencies (database, API)
- Fast, reliable, deterministic

---

### Integration Testing

**Mô tả:** Kiểm tra các thành phần **hoạt động cùng nhau** (API + Database, Service A + Service B).

```typescript
// Integration test — test interactions thực tế
describe("User API Integration", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp(); // Connect to real test database
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it("should create and retrieve user", async () => {
    // Create
    const createRes = await request(app)
      .post("/api/users")
      .send({ name: "John", email: "john@test.com" });
    expect(createRes.status).toBe(201);

    // Retrieve
    const getRes = await request(app).get(`/api/users/${createRes.body.id}`);
    expect(getRes.body.name).toBe("John");
  });
});
```

---

### End-to-End Testing (E2E)

**Mô tả:** Kiểm tra **toàn bộ flow** từ UI đến Database, mô phỏng người dùng thật.

```typescript
// Cypress E2E test
describe("User Registration Flow", () => {
  it("should register a new user", () => {
    cy.visit("/register");

    cy.get("[data-testid=name-input]").type("John Doe");
    cy.get("[data-testid=email-input]").type("john@example.com");
    cy.get("[data-testid=password-input]").type("Password123!");
    cy.get("[data-testid=register-button]").click();

    cy.url().should("include", "/dashboard");
    cy.get("[data-testid=welcome-message]").should("contain", "John Doe");
  });
});
```

---

### TDD (Test-Driven Development)

**Mô tả:** Viết test trước → Viết code để pass test → Refactor.

```
Red → Green → Refactor

1. 🔴 RED:    Viết test (sẽ fail vì chưa có code)
2. 🟢 GREEN:  Viết code tối thiểu để test pass
3. 🔵 REFACTOR: Làm sạch code mà vẫn pass test
```

```typescript
// Step 1: RED — write failing test
describe("calculateDiscount", () => {
  it("should apply 10% discount for orders over $100", () => {
    expect(calculateDiscount(150)).toBe(135); // 10% off = $135
  });
});

// Step 2: GREEN — minimum code to pass
function calculateDiscount(amount: number): number {
  if (amount > 100) return amount * 0.9;
  return amount;
}

// Step 3: REFACTOR — improve code
function calculateDiscount(amount: number): number {
  const DISCOUNT_THRESHOLD = 100;
  const DISCOUNT_RATE = 0.1;

  return amount > DISCOUNT_THRESHOLD
    ? amount * (1 - DISCOUNT_RATE)
    : amount;
}
```

---

### BDD (Behavior-Driven Development)

**Mô tả:** Viết test theo **câu chuyện hành vi**, dễ đọc cho dev và business.

```gherkin
# feature file
Feature: User Login
  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter "john@example.com" as email
    And I enter "Password123!" as password
    And I click the "Login" button
    Then I should be redirected to the dashboard
    And I should see "Welcome, John!"
```

---

### Mutation Testing

**Mô tả:** Tự động **thay đổi (mutate)** code rồi kiểm tra test có **phát hiện** không.

```typescript
// Original code
function isEven(n: number): boolean {
  return n % 2 === 0;
}

// Mutant 1: === becomes !==
function isEven(n: number): boolean {
  return n % 2 !== 0; // Logic reversed!
}

// Mutant 2: % becomes *
function isEven(n: number): boolean {
  return n * 2 === 0; // Completely different!
}

// If your tests catch these mutants → good test coverage!
```

**Tool:** Stryker, pitest (Java)

---

## 5.2 Development Methodologies (Phương Pháp Phát Triển)

> 📖 **Xem chi tiết tại:** [5.2-development-methodologies/README.md](./5.2-development-methodologies/README.md)

Danh sách 12 quy trình & framework phát triển phần mềm phổ biến:

1. 🔄 **[5.2.1 Scrum](./5.2-development-methodologies/5.2.1-scrum/README.md)** — Sprint 1-4 tuần, 3 role, 4 ceremony, 3 artifact
2. 📋 **[5.2.2 Kanban](./5.2-development-methodologies/5.2.2-kanban/README.md)** — Luồng liên tục, WIP limit, cycle time, không sprint
3. ⚡ **[5.2.3 XP (Extreme Programming)](./5.2-development-methodologies/5.2.3-xp/README.md)** — TDD, Pair Programming, Continuous Integration, Refactoring
4. 🍃 **[5.2.4 Lean Software Development](./5.2-development-methodologies/5.2.4-lean/README.md)** — 7 nguyên tắc loại bỏ lãng phí (waste)
5. 🌊 **[5.2.5 Waterfall](./5.2-development-methodologies/5.2.5-waterfall/README.md)** — Mô hình thác nước tuần tự truyền thống
6. 🏢 **[5.2.6 SAFe (Scaled Agile Framework)](./5.2-development-methodologies/5.2.6-safe/README.md)** — Mở rộng Agile cho quy mô Enterprise
7. 🔍 **[5.2.7 LeSS (Large-Scale Scrum)](./5.2-development-methodologies/5.2.7-less/README.md)** — Scrum tối giản cho 2-8+ teams
8. 💎 **[5.2.8 Crystal Agile Framework](./5.2-development-methodologies/5.2.8-crystal/README.md)** — Linh hoạt theo quy mô team & mức độ rủi ro
9. 🏗️ **[5.2.9 Feature-Driven Development (FDD)](./5.2-development-methodologies/5.2.9-fdd/README.md)** — Phát triển theo từng feature nhỏ (2 tuần)
10. ⏱️ **[5.2.10 Dynamic Systems Development Method (DSDM)](./5.2-development-methodologies/5.2.10-dsdm/README.md)** — Cố định Time/Cost, biến đổi Scope (MoSCoW)
11. 🌀 **[5.2.11 Spiral Model](./5.2-development-methodologies/5.2.11-spiral/README.md)** — Lặp lại kết hợp phân tích rủi ro chuyên sâu
12. 🚀 **[5.2.12 Rapid Application Development (RAD)](./5.2-development-methodologies/5.2.12-rad/README.md)** — Prototype nhanh & liên tục nhận phản hồi

---

### CI/CD (Continuous Integration / Continuous Deployment)

```
Code → Build → Test → Deploy (Staging) → Deploy (Production)

CI (Continuous Integration):
  Developer → Push → Auto Build → Auto Test → Merge

CD (Continuous Delivery):
  Merge → Auto Deploy to Staging → Manual Approval → Deploy to Production

CD (Continuous Deployment):
  Merge → Auto Deploy to Staging → Auto Deploy to Production (no manual step)
```

```yaml
# GitHub Actions CI/CD example
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy
```

---

### Pair Programming

**Mô tả:** 2 developer cùng làm việc tại 1 máy tính.

```
Driver (người code)          Navigator (người review)
├── Viết code                ├── Xem xét chiến lược
├── Focus implementation     ├── Phát hiện lỗi
└── Kiên nhẫn                └── Nghĩ về test cases

Rotation: Đổi vai trò mỗi 25-30 phút (Pomodoro)
```

**Ưu điểm:** Code review real-time, knowledge sharing, fewer bugs.

---

### Code Review

**Mô tả:** Developer khác **đánh giá code** trước khi merge vào codebase chính.

```markdown
## Code Review Checklist
- [ ] Code works correctly
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities
- [ ] Follows coding standards
- [ ] Variable/function names are clear
- [ ] No duplicated code
- [ ] Error handling is proper
- [ ] Performance is acceptable
- [ ] Documentation/comments if needed
```

---

## 5.3 Performance Optimization Techniques

---

### Lazy Loading / Code Splitting

**Mô tả:** Chỉ **load code khi cần**, giảm initial load time.

```typescript
// React Lazy Loading
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}

// Angular Lazy Loading
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  }
];
```

---

### Caching Strategies

```
Browser Cache    → Static assets (JS, CSS, images)
CDN Cache        → Geographic distribution
Application Cache → Redis, Memcached
Database Cache   → Query result cache
API Cache        → Response cache (ETag, Last-Modified)
```

```typescript
// Cache-Aside Pattern
async function getUser(id: string): Promise<User> {
  // 1. Check cache first
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  // 2. If not in cache, get from database
  const user = await db.users.findById(id);

  // 3. Store in cache for next time
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));

  return user;
}
```

---

### Memoization

**Mô tả:** **Cache kết quả function** để tránh tính lại với cùng input.

```typescript
// Simple memoization
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Usage
const expensiveCalculation = memoize((n: number): number => {
  console.log(`Computing for ${n}...`);
  return n * n;
});

expensiveCalculation(4); // Computing for 4... → 16
expensiveCalculation(4); // 16 (cached, no computation)
expensiveCalculation(5); // Computing for 5... → 25
```

---

### Debouncing & Throttling

```typescript
// Debounce: Execute AFTER delay (user stops typing)
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const search = debounce((query: string) => {
  fetch(`/api/search?q=${query}`);
}, 300);

// Throttle: Execute AT MOST once per interval
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
}

window.addEventListener('scroll', throttle(() => {
  updateScrollIndicator();
}, 100));
```

---

### Virtual Scrolling

**Mô tả:** Chỉ render items **đang visible** trên màn hình.

```typescript
// Concept
class VirtualList {
  private visibleStart = 0;
  private visibleEnd = 0;

  constructor(
    private items: any[],
    private itemHeight: number,
    private containerHeight: number
  ) {}

  getVisibleItems(scrollTop: number) {
    this.visibleStart = Math.floor(scrollTop / this.itemHeight);
    this.visibleEnd = Math.ceil((scrollTop + this.containerHeight) / this.itemHeight);

    return {
      items: this.items.slice(this.visibleStart, this.visibleEnd),
      totalHeight: this.items.length * this.itemHeight,
      offsetY: this.visibleStart * this.itemHeight
    };
  }
}

// 10,000 items but only renders ~20 visible ones
const list = new VirtualList(items, 40, 800);
list.getVisibleItems(0); // Items 0-20
list.getVisibleItems(400); // Items 10-30
```

---

### Tree Shaking

**Mô tả:** Loại bỏ **code không sử dụng** trong build.

```typescript
// file: math.ts
export function add(a: number, b: number) { return a + b; }
export function subtract(a: number, b: number) { return a - b; }
export function multiply(a: number, b: number) { return a * b; }
export function divide(a: number, b: number) { return a / b; }

// file: app.ts
import { add } from './math';  // Only imports add

// With tree shaking, build will include ONLY add function
// subtract, multiply, divide will be removed from bundle
```

---

## 5.4 Security Techniques (Kỹ Thuật Bảo Mật)

---

### JWT Authentication

```typescript
// JWT Structure: Header.Payload.Signature

// Header (algorithm & token type)
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload (claims)
{
  "sub": "user123",
  "name": "John Doe",
  "role": "admin",
  "iat": 1700000000,
  "exp": 1700003600
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

```typescript
// Node.js JWT example
import jwt from 'jsonwebtoken';

// Generate token
function generateToken(user: User): string {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

// Verify token
function verifyToken(token: string): any {
  return jwt.verify(token, process.env.JWT_SECRET!);
}
```

---

### OWASP Top 10

```
1. Injection          → Use parameterized queries
2. Broken Auth        → MFA, rate limiting, secure session
3. Sensitive Data     → Encryption, HTTPS, no sensitive data in URL
4. XXE                → Disable XML external entities
5. Broken Access Ctrl → Deny by default, validate permissions
6. Security Misconfig → Default configs, error messages
7. XSS                → Escape output, Content-Security-Policy
8. Insecure Deserialization → Integrity checks
9. Known Vulnerabilities   → Update dependencies
10. Insufficient Logging   → Log security events
```

---

## 5.5 State Management Techniques

---

### Local vs Global vs Server State

```typescript
// Local State — component's own state
const [count, setCount] = useState(0);

// Global State — shared across components (Redux/Context)
const user = useSelector(state => state.user);

// Server State — data from API (React Query/SWR)
const { data: users, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(r => r.json())
});
```

---

### Redux Pattern

```typescript
// Action Types
const ADD_TODO = 'todos/add';

// Action Creator
const addTodo = (text: string) => ({
  type: ADD_TODO,
  payload: { id: Date.now(), text, completed: false }
});

// Reducer
function todosReducer(state = [], action) {
  switch (action.type) {
    case ADD_TODO:
      return [...state, action.payload];
    default:
      return state;
  }
}

// Dispatch
dispatch(addTodo('Learn Redux'));
```

---

## 5.6 Refactoring Techniques

---

### Code Smells

```typescript
// 1. Long Method
class Order {
  process() {
    // 50+ lines of code doing everything
  }
}

// ✅ Refactor: Extract methods
class Order {
  process() {
    this.validate();
    this.calculateTotal();
    this.applyDiscounts();
    this.save();
    this.sendConfirmation();
  }
}

// 2. Duplicated Code
// ❌ Same validation in 3 places
// ✅ Extract into shared function

// 3. Large Class (God Object)
// ❌ User class doing everything
// ✅ Split into UserService, UserRepository, UserValidator

// 4. Dead Code
// ❌ Unused variables, unreachable code
// ✅ Delete it (use git history if needed)

// 5. Feature Envy
// ❌ Method uses another class's data more than its own
// ✅ Move method to the class it envies

// 6. Primitive Obsession
// ❌ Using strings for everything: createUser("John", "john@email.com", "admin")
// ✅ Use value objects: createUser(new UserName("John"), new Email("..."), new Role("admin"))
```

---

## 5.7 Source Code Management (Quản Lý Mã Nguồn)

---

### Git Flow

```
main ──────────────────────── Production
  ↑                               ↑
  │ (release/*)                   │ (hotfix/*)
  ├── develop ────────────────────┤
  │    ↑    ↑    ↑               │
  │    │    │    │               │
  │ feature/* feature/* feature/*│
```

```bash
# Create feature
git checkout -b feature/user-auth develop

# Work on feature
git add .
git commit -m "feat(auth): add login functionality"

# Merge back
git checkout develop
git merge --no-ff feature/user-auth
git branch -d feature/user-auth

# Release
git checkout -b release/1.0.0 develop
# ... test & fix ...
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Version 1.0.0"

# Hotfix
git checkout -b hotfix/critical-bug main
# ... fix ...
git checkout main
git merge --no-ff hotfix/critical-bug
```

---

### GitHub Flow

```
main ─────── PR ────── PR ────── PR
      ↑       ↑         ↑
 feature/   feature/   feature/
```

**Nguyên tắc đơn giản:**
1. Tạo branch từ main
2. Commit vào branch
3. Tạo Pull Request
4. Code Review
5. Merge vào main
6. Deploy tự động

---

### Trunk-Based Development

```
main ─────── commit ──── commit ──── commit ──── commit
             ↑            ↑            ↑
          short-lived  short-lived  short-lived
           branch       branch       branch
          (< 1-2 ngày)
```

**Tips:**
- Feature Flags cho features chưa sẵn sàng
- Branch ngắn (< 1-2 ngày)
- Commit thường xuyên
- Comprehensive CI/CD

---

## 5.8 Code Organization Techniques

---

### Feature-based Module Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.guard.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── users.module.ts
│   └── orders/
│       ├── orders.service.ts
│       ├── orders.controller.ts
│       └── orders.module.ts
├── shared/
│   ├── utils/
│   └── types/
└── core/
    ├── database/
    └── config/
```

---

### Barrel Exports (index.ts)

```typescript
// features/users/index.ts
export { UserService } from './users.service';
export { UsersController } from './users.controller';
export { User } from './user.entity';
export * from './dto/create-user.dto';

// Usage — clean imports
import { UserService, User } from '@/features/users';
```

---

## 5.9 API Design Techniques

---

### RESTful API Design

```
GET    /api/users          → List all users
GET    /api/users/:id      → Get user by ID
POST   /api/users          → Create user
PUT    /api/users/:id      → Update user (full)
PATCH  /api/users/:id      → Update user (partial)
DELETE /api/users/:id      → Delete user

GET    /api/users/:id/posts → Get user's posts (nested resource)
```

---

### Pagination

```typescript
// Request
GET /api/users?page=2&limit=20

// Response
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## 5.10 Error Handling Techniques

---

### Circuit Breaker

```
CLOSED (Normal) ──[failure threshold]──→ OPEN (Reject all)
     ↑                                       │
     │                              [timeout expires]
     │                                       ↓
     └────[success]─────────── HALF-OPEN (Allow one request)
```

```typescript
class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime = 0;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
      }
      throw error;
    }
  }
}
```

---

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
      const jitter = Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay + jitter));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const data = await retryWithBackoff(
  () => fetch('/api/unstable-endpoint').then(r => r.json()),
  3,    // max 3 retries
  1000  // start with 1s delay
);
```

---

### Result/Either Pattern

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "Division by zero" };
  return { ok: true, value: a / b };
}

// Usage — type-safe error handling
const result = divide(10, 0);
if (result.ok) {
  console.log(result.value); // TypeScript knows value is number
} else {
  console.log(result.error); // TypeScript knows error is string
}
```

---

## 5.11 Error Handling in Architecture

---

### Saga Pattern

**Mô tả:** Quản lý **distributed transactions** với compensating actions.

```
Order Saga:
1. Create Order         → Success
2. Process Payment      → Success
3. Reserve Inventory    → FAIL!
4. Compensate: Cancel Payment  ← Undo step 2
5. Compensate: Delete Order    ← Undo step 1
```

**2 loại Saga:**
- **Choreography:** Mỗi service tự phát events
- **Orchestration:** Có orchestrator điều phối

---

### Strangler Fig Pattern

**Mô tả:** Di chuyển hệ thống cũ sang mới **dừng dần dần** — "strangle" hệ thống cũ.

```
Step 1: Deploy proxy
  Client → [Proxy] → Old System

Step 2: Add new service
  Client → [Proxy] → Old System (for feature A)
                    → New System (for feature B)

Step 3: Migrate more features
  Client → [Proxy] → Old System (fewer features)
                    → New System (more features)

Step 4: Old system retired
  Client → [Proxy] → New System (all features)
```

---

## 5.12 Event-Based Techniques

---

### Pub/Sub (Publish-Subscribe)

```typescript
// Publisher
class EventBus {
  private subscribers: Map<string, Function[]> = new Map();

  publish(event: string, data: any) {
    const handlers = this.subscribers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  subscribe(event: string, handler: Function) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(handler);
  }
}

// Usage
const bus = new EventBus();

// Subscriber
bus.subscribe('order.created', (order) => {
  sendConfirmationEmail(order);
});

bus.subscribe('order.created', (order) => {
  updateInventory(order);
});

// Publisher
bus.publish('order.created', { id: 1, items: [...] });
```

---

## 5.13 Deployment & Infrastructure Techniques

---

### Containerization (Docker)

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml — Compose v2 (không cần trường `version`)
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

### Kubernetes

```yaml
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

### Feature Flags

```typescript
// Feature flag system
class FeatureFlags {
  private flags: Map<string, boolean> = new Map();

  constructor(flags: Record<string, boolean>) {
    Object.entries(flags).forEach(([key, value]) => {
      this.flags.set(key, value);
    });
  }

  isEnabled(flag: string): boolean {
    return this.flags.get(flag) ?? false;
  }
}

const features = new FeatureFlags({
  'new-checkout': true,
  'dark-mode': false,
  'beta-search': true
});

// Usage in code
function CheckoutButton() {
  if (features.isEnabled('new-checkout')) {
    return <NewCheckout />;
  }
  return <OldCheckout />;
}
```

---

### Blue-Green & Canary Deployment

```yaml
# Blue-Green Deployment
# Two identical environments
Blue (current)  → Live traffic
Green (new)     → Deploy new version here
                 → Test thoroughly
                 → Switch traffic to Green
                 → Blue becomes standby

# Canary Deployment
# Gradually shift traffic
v1 (90%) ───────┐
                ├──→ Users
v2 (10% Canary) ─┘
# Monitor metrics → If OK, increase v2 percentage
```

---

## 5.14 Data Handling Techniques

---

### Repository Pattern

```typescript
// Abstraction
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// PostgreSQL implementation
class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }

  async save(user: User): Promise<User> {
    return this.db.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [user.name, user.email]
    );
  }
}

// In-memory implementation (for testing)
class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }
}
```

---

### Unit of Work

```typescript
class UnitOfWork {
  private changes: Operation[] = [];

  addOperation(operation: Operation) {
    this.changes.push(operation);
  }

  async commit(): Promise<void> {
    const transaction = await this.db.beginTransaction();
    try {
      for (const operation of this.changes) {
        await operation.execute(transaction);
      }
      await transaction.commit();
      this.changes = [];
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

// Usage
const uow = new UnitOfWork();

uow.addOperation({
  execute: (tx) => tx.insert('orders', orderData)
});

uow.addOperation({
  execute: (tx) => tx.update('inventory', { decrement: 5 }, { productId })
});

await uow.commit(); // Both succeed or both fail
```

---

### DTO (Data Transfer Object)

```typescript
// Entity — contains business logic
class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public passwordHash: string, // 🔒 Should NOT be exposed
    public createdAt: Date
  ) {}
}

// DTO — used for API responses (no sensitive data)
class UserResponseDTO {
  id: string;
  name: string;
  email: string;
  createdAt: Date;

  static fromEntity(user: User): UserResponseDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
      // passwordHash is NOT included!
    };
  }
}

// Usage
app.get('/api/users/:id', (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json(UserResponseDTO.fromEntity(user));
});