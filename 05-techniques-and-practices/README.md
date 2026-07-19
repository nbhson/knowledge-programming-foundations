# ⚙️ Lớp 5: Techniques & Practices (Kỹ Thuật & Thực Hành)

> **Techniques & Practices** là các **phương pháp làm việc cụ thể** hàng ngày trong lập trình.
>
> **Ví dụ:** Công nhân xây dựng hàng ngày — cách làm việc, công cụ sử dụng.

---

## 5.1 Testing Techniques (Kỹ Nghiệm Kiểm Thử)

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Unit Testing** | Kiểm tra từng đơn vị code nhỏ nhất (function, method) trong cô lập |
| **Integration Testing** | Kiểm tra các thành phần hoạt động cùng nhau (API + DB) |
| **End-to-End Testing (E2E)** | Kiểm tra toàn bộ flow từ UI đến DB, mô phỏng người dùng thật |
| **TDD** | Red → Green → Refactor: Viết test trước, code sau |
| **BDD** | Viết test theo câu chuyện hành vi, dễ đọc cho dev và business |
| **Mutation Testing** | Tự động thay đổi code rồi kiểm tra test có phát hiện không |

---

## 5.2 Development Methodologies (Phương Pháp Phát Triển)

| Phương Pháp | Mô Tả |
|-------------|-------|
| **Agile (Scrum/Kanban/XP)** | Phát triển linh hoạt, iterative, feedback liên tục |
| **CI/CD** | Auto Build → Auto Test → Auto Deploy |
| **Pair Programming** | 2 dev: 1 Driver (code) + 1 Navigator (review) |
| **Code Review** | Developer khác đánh giá code trước khi merge |

---

## 5.3 Performance Optimization Techniques

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Lazy Loading / Code Splitting** | Chỉ load code khi cần, giảm initial load time |
| **Caching Strategies** | Browser, CDN, Application, Database, API cache |
| **Memoization** | Cache kết quả function để tránh tính lại |
| **Debouncing & Throttling** | Kiểm soát tần suất gọi function |
| **Virtual Scrolling** | Chỉ render items đang visible trên màn hình |
| **Change Detection Optimization** | OnPush strategy trong Angular |
| **Tree Shaking** | Loại bỏ code không sử dụng trong build |

---

## 5.4 Security Techniques (Kỹ Thuật Bảo Mật)

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **JWT Authentication** | Token-based auth: Header.Payload.Signature |
| **OAuth 2.0 / OpenID Connect** | Authorization Code flow, Access Token + ID Token |
| **OWASP Top 10** | XSS, CSRF, SQL Injection, Broken Authentication, v.v. |

---

## 5.5 State Management Techniques

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Local vs Global vs Server State** | Phân loại scope của state |
| **Redux / NgRx / XState** | Libraries quản lý state tập trung |

---

## 5.6 Refactoring Techniques

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Code Smells** | Long Method, Large Class, Duplicated Code, Dead Code, v.v. |
| **Extract Method / Replace Conditional with Polymorphism** | Các pattern refactor phổ biến |

---

## 5.7 Source Code Management (Quản Lý Mã Nguồn)

| Phương Pháp | Mô Tả |
|-------------|-------|
| **Git Flow** | main, develop, feature/*, release/*, hotfix/* |
| **GitHub Flow** | Đơn giản: everything goes through PR + Code Review |
| **Trunk-Based Development** | Branch ngắn (< 1-2 ngày), commit thường xuyên |

---

## 5.8 Code Organization Techniques

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Feature-based Module Structure** | Tổ chức theo feature (auth/, user/, product/) |
| **Barrel Exports (index.ts)** | Export集中 từ 1 file, import dễ dàng |

---

## 5.9 API Design Techniques

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **RESTful API Design** | GET/POST/PUT/PATCH/DELETE với resource-based URLs |
| **API Versioning** | /api/v1/users, /api/v2/users |
| **Pagination** | page, limit, total, totalPages, hasNext, hasPrev |

---

## 5.10 Error Handling Techniques

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Circuit Breaker** | CLOSED → OPEN → HALF-OPEN: fault tolerance |
| **Retry with Exponential Backoff** | Retry tự động với delay tăng dần (1s, 2s, 4s) |
| **Result/Either Pattern** | Functional error handling với type safety |

---

## 5.11 Error Handling in Architecture

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Saga Pattern** | Quản lý distributed transactions với compensating actions |
| **Strangler Fig Pattern** | Di chuyển hệ thống cũ sang mới dần dần |

---

## 5.12 Event-Based Techniques

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Pub/Sub (Publish-Subscribe)** | Decoupled communication qua events |
| **Event Sourcing** | Lưu all events, replay để có current state |

---

## 5.13 Deployment & Infrastructure Techniques

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Containerization (Docker)** | Package app + dependencies vào container |
| **Orchestration (Kubernetes)** | Quản lý, scale containers |
| **Feature Flags** | Toggle features on/off runtime |
| **Blue-Green & Canary Deployment** | Deployment strategies an toàn |

---

## 5.14 Data Handling Techniques

| Kỹ Thuật | Mô Tả |
|----------|-------|
| **Repository Pattern** | Abstraction layer cho data access |
| **Unit of Work** | Quản lý multiple operations như single transaction |
| **DTO (Data Transfer Object)** | Object dùng để transfer data giữa layers |