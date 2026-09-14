/**
 * 7.5 Behavior-Driven Development (BDD) — Mini Spec runner
 *
 * Minh họa BDD:
 * - Viết "spec" bằng Gherkin: Feature → Scenario → Given/When/Then.
 * - Ngôn ngữ tự nhiên (business-readable) nhưng step có code thật chạy.
 * - Runner in ra Feature/Scenario và từng step với trạng thái.
 */

// ──────────────────── Hệ thống cần test (login) ────────────────────
interface BddCredential {
  email: string;
  password: string;
}

class BddLoginService {
  private registered = new Map<string, string>(); // email → password

  register(email: string, password: string): void {
    this.registered.set(email, password);
  }

  login(email: string, password: string): { ok: boolean; redirect?: string; message: string } {
    if (!email || !password) {
      return { ok: false, message: "Vui lòng nhập email và mật khẩu" };
    }
    const stored = this.registered.get(email);
    if (stored === undefined) {
      return { ok: false, message: "Invalid credentials" };
    }
    if (stored !== password) {
      return { ok: false, message: "Invalid credentials" };
    }
    return { ok: true, redirect: "/dashboard", message: "Chào mừng!" };
  }
}

// ──────────────────── Mini Gherkin runner ────────────────────
type BddStepKind = "Given" | "When" | "Then" | "And";

interface BddStep {
  kind: BddStepKind;
  text: string;
  run: () => { expectedTrue: boolean; summary: string };
}

interface BddScenario {
  title: string;
  steps: BddStep[];
}

interface BddFeature {
  title: string;
  scenarios: BddScenario[];
}

function bddRunFeature(feature: BddFeature): void {
  console.log(`🏷️  FEATURE: ${feature.title}`);
  for (const scenario of feature.scenarios) {
    let allPass = true;
    console.log(`\n   📌 SCENARIO: ${scenario.title}`);
    for (const step of scenario.steps) {
      const result = step.run();
      if (!result.expectedTrue) allPass = false;
      const mark = result.expectedTrue ? "✅" : "❌";
      console.log(`      ${mark} ${step.kind} ${step.text}  → ${result.summary}`);
    }
    console.log(`      ${allPass ? "🎉" : "🚨"} Kết quả scenario: ${allPass ? "PASS" : "FAIL"}`);
  }
}

// ───────────────────────────── Demo ──────────────────────────────
console.log("=== BDD Demo ===");
console.log("Khách hàng + Dev + QA cùng đọc được 1 spec bằng ngôn ngữ tự nhiên.\n");

const loginSvc = new BddLoginService();
loginSvc.register("user@test.com", "password123");

const loginFeature: BddFeature = {
  title: "Đăng nhập người dùng",
  scenarios: [
    {
      title: "Đăng nhập thành công với thông tin hợp lệ",
      steps: [
        {
          kind: "Given",
          text: 'người dùng đã đăng ký với email "user@test.com"',
          run: () => ({ expectedTrue: true, summary: "user đã có trong hệ thống" }),
        },
        {
          kind: "When",
          text: 'người dùng đăng nhập với email "user@test.com" và mật khẩu "password123"',
          run: () => {
            const res = loginSvc.login("user@test.com", "password123");
            return { expectedTrue: res.ok, summary: res.message };
          },
        },
        {
          kind: "Then",
          text: "hệ thống chuyển hướng tới /dashboard",
          run: () => {
            const res = loginSvc.login("user@test.com", "password123");
            return { expectedTrue: res.redirect === "/dashboard", summary: `redirect=${res.redirect}` };
          },
        },
      ],
    },
    {
      title: "Đăng nhập thất bại với sai mật khẩu",
      steps: [
        {
          kind: "Given",
          text: 'người dùng đã đăng ký với email "user@test.com"',
          run: () => ({ expectedTrue: true, summary: "user đã có trong hệ thống" }),
        },
        {
          kind: "When",
          text: 'người dùng đăng nhập với mật khẩu "wrong"',
          run: () => {
            const res = loginSvc.login("user@test.com", "wrong");
            return { expectedTrue: !res.ok, summary: res.message };
          },
        },
        {
          kind: "Then",
          text: 'hệ thống hiển thị lỗi "Invalid credentials"',
          run: () => {
            const res = loginSvc.login("user@test.com", "wrong");
            return { expectedTrue: res.message === "Invalid credentials", summary: `message=${res.message}` };
          },
        },
      ],
    },
    {
      title: "Để trống thông tin đăng nhập",
      steps: [
        {
          kind: "When",
          text: "người dùng đăng nhập với email và mật khẩu rỗng",
          run: () => {
            const res = loginSvc.login("", "");
            return { expectedTrue: !res.ok, summary: res.message };
          },
        },
        {
          kind: "Then",
          text: "hệ thống yêu cầu nhập đủ thông tin",
          run: () => {
            const res = loginSvc.login("", "");
            return {
              expectedTrue: res.message.includes("nhập"),
              summary: `message=${res.message}`,
            };
          },
        },
      ],
    },
  ],
};

bddRunFeature(loginFeature);

console.log("\n✅ BDD: behavior được mô tả bằng ngôn ngữ business (Given/When/Then) nhưng vẫn chạy được");
export {};