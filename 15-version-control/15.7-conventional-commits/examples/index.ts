/**
 * 15.7 Conventional Commits — mô phỏng parse commit → bump version (semantic-release)
 *
 * Minh họa:
 * - Parse message theo spec: type(scope)!: description + BREAKING CHANGE ở body/footer
 * - Quyết định bump: breaking → major, feat → minor, fix/perf → patch, còn lại → none
 * - Bump SemVer + sinh changelog tự động
 *
 * Mọi thao tác đều MÔ PHỎNG trong bộ nhớ (KHÔNG chạy git thật).
 * Không deps ngoài — TS thuần.
 */

type CcBump = "major" | "minor" | "patch" | "none";

interface CcParsed {
  raw: string;
  valid: boolean;
  type: string;
  scope: string | null;
  breaking: boolean;
  description: string;
}

const CC_HEADER_RE = /^([a-z]+)(?:\(([^)]+)\))?(!)?: (.+)$/;

/** Parse 1 commit message theo Conventional Commits spec. */
function parseCommit(raw: string): CcParsed {
  const lines = raw.split("\n");
  const header = (lines[0] ?? "").trim();
  const m = CC_HEADER_RE.exec(header);
  if (m === null) {
    return { raw, valid: false, type: "", scope: null, breaking: false, description: header };
  }
  const body = lines.slice(1).join("\n");
  const breaking = m[3] === "!" || /BREAKING CHANGE:/.test(body);
  return {
    raw,
    valid: true,
    type: m[1] ?? "",
    scope: m[2] ?? null,
    breaking,
    description: m[4] ?? "",
  };
}

/** Quyết định bump từ danh sách commits — loại "mạnh nhất" thắng. */
function decideBump(commits: CcParsed[]): CcBump {
  const valid = commits.filter((c) => c.valid);
  if (valid.some((c) => c.breaking)) return "major";
  if (valid.some((c) => c.type === "feat")) return "minor";
  if (valid.some((c) => c.type === "fix" || c.type === "perf")) return "patch";
  return "none";
}

/** Bump version SemVer: major reset minor+patch, minor reset patch. */
function bumpVersion(current: string, bump: CcBump): string {
  const parts = current.split(".").map(Number);
  const major = parts[0] ?? 0;
  const minor = parts[1] ?? 0;
  const patch = parts[2] ?? 0;
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  if (bump === "patch") return `${major}.${minor}.${patch + 1}`;
  return current;
}

/** Sinh changelog: gom commits theo nhóm Features / Fixes / Breaking. */
function buildChangelog(version: string, commits: CcParsed[]): string[] {
  const lines: string[] = [`## ${version}`];
  const feats = commits.filter((c) => c.valid && c.type === "feat" && !c.breaking);
  const fixes = commits.filter((c) => c.valid && (c.type === "fix" || c.type === "perf") && !c.breaking);
  const breaking = commits.filter((c) => c.breaking);
  if (breaking.length > 0) {
    lines.push("⚠ BREAKING CHANGES:");
    for (const c of breaking) lines.push(`  - ${c.raw.split("\n")[0]}`);
  }
  if (feats.length > 0) {
    lines.push("✨ Features:");
    for (const c of feats) lines.push(`  - ${c.description}${c.scope === null ? "" : ` (${c.scope})`}`);
  }
  if (fixes.length > 0) {
    lines.push("🐛 Fixes:");
    for (const c of fixes) lines.push(`  - ${c.description}${c.scope === null ? "" : ` (${c.scope})`}`);
  }
  return lines;
}

/** Giả lập 1 đợt semantic-release: parse → bump → version + changelog. */
function simulateRelease(current: string, messages: string[]): string {
  console.log(`  📦 Version hiện tại: ${current}`);
  const commits = messages.map(parseCommit);
  for (const c of commits) {
    if (!c.valid) {
      console.log(`    ⚠️ bỏ qua (sai format): "${c.description}"`);
      continue;
    }
    const flag = c.breaking ? " 🔴 BREAKING" : "";
    console.log(`    - [${c.type}]${c.scope === null ? "" : `(${c.scope})`} ${c.description}${flag}`);
  }
  const bump = decideBump(commits);
  if (bump === "none") {
    console.log(`  → bump: none — không có thay đổi đáng release, giữ ${current}`);
    return current;
  }
  const next = bumpVersion(current, bump);
  console.log(`  → bump: ${bump} — release ${next}`);
  for (const line of buildChangelog(next, commits)) console.log(`    ${line}`);
  return next;
}

// ───────────────────────────────── Demo ─────────────────────────────────

function main(): void {
  console.log("=== Conventional Commits + Semantic Release Demo (mô phỏng) ===");
  console.log("");

  let version = "1.4.2";

  console.log("1️⃣ Đợt 1 — chỉ fix → patch:");
  version = simulateRelease(version, [
    "fix(auth): resolve OAuth token expiry bug",
    "fix(cart): handle negative quantity edge case",
  ]);
  console.log("");

  console.log("2️⃣ Đợt 2 — có feat → minor (mạnh hơn patch):");
  version = simulateRelease(version, [
    "feat(cart): add coupon support",
    "fix(auth): retry login on flaky network",
  ]);
  console.log("");

  console.log("3️⃣ Đợt 3 — có breaking (!) → major:");
  version = simulateRelease(version, [
    "feat(api)!: drop v1 endpoints\n\nBREAKING CHANGE: clients must migrate to /v2",
    "feat(cart): add coupon support",
  ]);
  console.log("");

  console.log("4️⃣ Đợt 4 — chỉ docs/chore → none (không release):");
  version = simulateRelease(version, ["docs: update API documentation", "chore: upgrade deps to v3", "fix bug"]);
  console.log("");

  console.log(`✅ Kết quả: 1.4.2 → ${version} hoàn toàn từ parse commit message, không quyết định tay.`);
}

main();
export {};
