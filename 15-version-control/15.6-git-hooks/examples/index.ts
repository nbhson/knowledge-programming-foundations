/**
 * 15.6 Git Hooks — mô phỏng các hook client-side phổ biến
 *
 * pre-commit: chạy linter trên staged files trước khi commit
 * commit-msg: validate message theo Conventional Commits
 * pre-push  : chạy tests trước khi push lên remote
 *
 * Mọi thao tác đều MÔ PHỎNG trong bộ nhớ (KHÔNG chạy git thật) — hook được
 * mô hình hóa bằng các handler TypeScript; chuỗi lệnh git in dạng string.
 */

type GitHooksCommitResult = {
  passed: boolean;
  commitId?: string;
  blockedBy?: string;
};

type GitHooksCheckContext = {
  message: string;
  stagedFiles: string[];
  testsPass: boolean;
};

/**
 * Các hook được đăng ký như handler — từng hook trả kết quả pass/fail.
 */
class GitHooksRunner {
  private preCommitHooks: ((ctx: GitHooksCheckContext) => { ok: boolean; reason: string })[] = [];
  private commitMsgHooks: ((ctx: GitHooksCheckContext) => { ok: boolean; reason: string })[] = [];
  private prePushHooks: ((ctx: GitHooksCheckContext) => { ok: boolean; reason: string })[] = [];

  private counter = 0;
  private commits: { id: string; message: string }[] = [];

  /** Đăng ký hook pre-commit */
  registerPreCommit(fn: (ctx: GitHooksCheckContext) => { ok: boolean; reason: string }): void {
    this.preCommitHooks.push(fn);
  }

  /** Đăng ký hook commit-msg */
  registerCommitMsg(fn: (ctx: GitHooksCheckContext) => { ok: boolean; reason: string }): void {
    this.commitMsgHooks.push(fn);
  }

  /** Đăng ký hook pre-push */
  registerPrePush(fn: (ctx: GitHooksCheckContext) => { ok: boolean; reason: string }): void {
    this.prePushHooks.push(fn);
  }

  /** git commit — chạy lần lượt pre-commit → commit-msg, hỏng bước nào thì abort */
  commit(message: string, stagedFiles: string[]): GitHooksCommitResult {
    console.log(`git commit -m "${message}"`);
    const ctx: GitHooksCheckContext = { message, stagedFiles, testsPass: true };

    console.log(`  ▶️  Chạy hook .husky/pre-commit (${stagedFiles.length} file staged)`);
    for (const hook of this.preCommitHooks) {
      const res = hook(ctx);
      if (!res.ok) {
        console.log(`  ❌ pre-commit: ${res.reason}`);
        console.log(`  🛑 BLOCKED — commit bị từ chối, chưa có commit nào được tạo`);
        return { passed: false, blockedBy: "pre-commit" };
      }
      console.log(`  ✅ pre-commit: ${res.reason}`);
    }

    console.log("  ▶️  Chạy hook .husky/commit-msg (validate message)");
    for (const hook of this.commitMsgHooks) {
      const res = hook(ctx);
      if (!res.ok) {
        console.log(`  ❌ commit-msg: ${res.reason}`);
        console.log(`  🛑 BLOCKED — format message không hợp lệ`);
        return { passed: false, blockedBy: "commit-msg" };
      }
      console.log(`  ✅ commit-msg: ${res.reason}`);
    }

    this.counter++;
    const id = "c" + this.counter.toString(16).padStart(3, "0");
    this.commits.push({ id, message });
    console.log(`  ✅ Tạo commit ${id} — "${message}"`);
    return { passed: true, commitId: id };
  }

  /** git push — chạy pre-push (tests), hỏng thì từ chối đẩy lên remote */
  push(): boolean {
    console.log("git push origin main");
    const ctx: GitHooksCheckContext = {
      message: "",
      stagedFiles: [],
      testsPass: this.testsPassFlag,
    };
    console.log("  ▶️  Chạy hook .husky/pre-push (chạy npm test)");
    for (const hook of this.prePushHooks) {
      const res = hook(ctx);
      if (!res.ok) {
        console.log(`  ❌ pre-push: ${res.reason}`);
        console.log(`  🛑 BLOCKED — không push được lên remote`);
        return false;
      }
      console.log(`  ✅ pre-push: ${res.reason}`);
    }
    console.log("  ✅ Push thành công lên origin/main");
    return true;
  }

  private testsPassFlag = true;

  /** Đổi kết quả giả lập của bộ test (để demo hook chặn push) */
  setTestsPass(pass: boolean): void {
    this.testsPassFlag = pass;
  }
}

// ─────────────────── Các hook cụ thể (giống file .husky/*) ───────────────────
/** Linter giả lập — vài file stage được coi là "chứa lỗi lint" */
const FILES_WITH_LINT_ERROR = new Set(["login.ts", "legacy.js"]);

function lintCheck(ctx: GitHooksCheckContext): { ok: boolean; reason: string } {
  const bad = ctx.stagedFiles.filter((f) => FILES_WITH_LINT_ERROR.has(f));
  if (bad.length > 0) {
    return {
      ok: false,
      reason: `eslint phát hiện lỗi trong: ${bad.join(", ")}. Chạy "npm run lint && npm run format:check"`,
    };
  }
  return { ok: true, reason: `eslint sạch ${ctx.stagedFiles.length} file` };
}

/** Validate message theo Conventional Commits: type(scope): mô tả */
const CONVENTION_RE = /^[a-z]+(\([a-z0-9-]+\))?: .+/;

function commitMsgCheck(ctx: GitHooksCheckContext): { ok: boolean; reason: string } {
  if (!CONVENTION_RE.test(ctx.message)) {
    return {
      ok: false,
      reason: `"${ctx.message}" không khớp <type>(scope): <mô tả>. Ví dụ: feat(auth): add login endpoint`,
    };
  }
  return { ok: true, reason: `"${ctx.message}" đúng Conventional Commits` };
}

/** Kiểm tra tests giả lập trước khi push */
function testCheck(ctx: GitHooksCheckContext): { ok: boolean; reason: string } {
  if (!ctx.testsPass) {
    return { ok: false, reason: "npm test thất bại: 2 test failed, 5 test passing" };
  }
  return { ok: true, reason: "npm test pass: 42 test passing" };
}

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Git Hooks Demo ===");
console.log("");

const hooks = new GitHooksRunner();
hooks.registerPreCommit(lintCheck);
hooks.registerCommitMsg(commitMsgCheck);
hooks.registerPrePush(testCheck);

console.log("Các hook đã gắn vào project:");
console.log("  .husky/pre-commit   → npm run lint && npm run format:check");
console.log("  .husky/commit-msg   → commitlint (Conventional Commits)");
console.log("  .husky/pre-push     → npm test");
console.log("");

console.log("1️⃣ Commit với message sai format:");
hooks.commit("fix bug", ["app.ts"]);
console.log("");

console.log("2️⃣ Commit đúng format:");
hooks.commit("feat(auth): add login endpoint", ["auth.ts"]);
console.log("");

console.log("3️⃣ Commit chứa file lỗi lint (message đúng):");
hooks.commit("fix(login): resolve timeout issue", ["login.ts"]);
console.log("");

console.log("4️⃣ Sửa lỗi lint (chạy npm run format:check) rồi commit lại:");
console.log("  ▶️  npm run format:check → login.ts đã được tự format lại, hết lỗi eslint");
FILES_WITH_LINT_ERROR.delete("login.ts");
hooks.commit("fix(login): resolve timeout issue", ["login.ts", "auth.ts"]);
console.log("");

console.log("5️⃣ Push khi tests pass:");
hooks.setTestsPass(true);
hooks.push();
console.log("");

console.log("6️⃣ Push khi có test FAIL:");
hooks.setTestsPass(false);
hooks.push();

console.log("");
console.log("✅ Git Hooks: pre-commit, commit-msg, pre-push mô phỏng chặn commit/push không đạt chuẩn");
export {};