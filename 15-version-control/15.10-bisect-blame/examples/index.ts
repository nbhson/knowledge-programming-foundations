/**
 * 15.10 Bisect & Blame — mô phỏng debug workflow: blame khoanh vùng + bisect binary search
 *
 * Minh họa:
 * - blame: dòng lỗi do commit nào chạm gần nhất (nghi phạm ban đầu)
 * - bisect: binary search từ commit XANH → commit ĐỎ, tìm commit đầu tiên gây lỗi
 * - So sánh số bước binary search vs duyệt tuyến tính
 *
 * Mọi thao tác đều MÔ PHỎNG trong bộ nhớ (KHÔNG chạy git thật).
 * Không deps ngoài — TS thuần.
 */

type BlVerdict = "good" | "bad";

/** 1 commit mô phỏng: id + message + có chứa bug không. */
interface BbCommit {
  id: string;
  message: string;
  hasBug: boolean;
}

class BisectRepo {
  readonly commits: BbCommit[];

  /** Dựng repo tuyến tính `total` commits, bug xuất hiện từ `firstBad` trở đi. */
  constructor(total: number, firstBad: number) {
    this.commits = [];
    for (let i = 0; i < total; i++) {
      this.commits.push({
        id: `c${(i + 1).toString().padStart(2, "0")}`,
        message: i + 1 < firstBad ? `commit ${i + 1} (ổn định)` : `commit ${i + 1} (chạm cart.ts)`,
        hasBug: i + 1 >= firstBad,
      });
    }
  }

  /** "Chạy test" ở commit thứ `at` (1-based): có bug → bad, không → good. */
  test(at: number): BlVerdict {
    return (this.commits[at - 1]?.hasBug ?? false) ? "bad" : "good";
  }
}

/** Blame thu nhỏ: mỗi dòng file ↔ commit chạm nó gần nhất. */
function blameFile(lines: string[], touchedBy: string[]): string[] {
  return lines.map((line, i) => `${touchedBy[i] ?? "?"}  ${line}`);
}

interface BisectStep {
  lo: number;
  hi: number;
  mid: number;
  verdict: BlVerdict;
}

/** Binary search thủ phạm: giữ good ở lo, bad ở hi, thu hẹp tới khi lo+1 == hi. */
function bisect(good: number, bad: number, repo: BisectRepo): { culprit: number; steps: BisectStep[] } {
  const steps: BisectStep[] = [];
  let lo = good;
  let hi = bad;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const verdict = repo.test(mid);
    steps.push({ lo, hi, mid, verdict });
    if (verdict === "good") lo = mid;
    else hi = mid;
  }
  return { culprit: hi, steps };
}

// ───────────────────────────────── Demo ─────────────────────────────────

function main(): void {
  console.log("=== Bisect & Blame Demo (mô phỏng, 16 commits, bug từ c11) ===");
  console.log("");

  console.log("1️⃣ git blame — dòng lỗi do commit nào chạm gần nhất?");
  const lines = [
    "export function total(items: Item[]): number {",
    "  const fee = items.length * SHIP_FEE;",
    "  return subtotal(items) + fee;",
    "}",
  ];
  for (const row of blameFile(lines, ["c02 (An)", "c11 (Bình) ← dòng lỗi", "c02 (An)", "c02 (An)"])) {
    console.log(`  ${row}`);
  }
  console.log("  → nghi phạm #1: c11 (Bình). Kiểm chứng bằng bisect thay vì kết luận vội.");
  console.log("");

  console.log("2️⃣ git bisect — binary search từ c01 (good) tới c16 (bad):");
  const repo = new BisectRepo(16, 11);
  console.log(`  git bisect start; git bisect bad c16; git bisect good c01`);
  const { culprit, steps } = bisect(1, 16, repo);
  for (const s of steps) {
    console.log(`  test c${s.mid.toString().padStart(2, "0")} trong [good=c${s.lo}, bad=c${s.hi}] → ${s.verdict} (thu hẹp một nửa)`);
  }
  console.log(`  🎯 ${repo.commits[culprit - 1]?.id} is the first bad commit — "${repo.commits[culprit - 1]?.message}"`);
  console.log("  git bisect reset (về trạng thái ban đầu)");
  console.log("");

  console.log("3️⃣ So sánh số bước (16 commits):");
  console.log(`  duyệt tuyến tính: tới 16 lần test; binary search: ${steps.length} lần test (log2 16 = 4)`);
  console.log(`  với 200 commits: tuyến tính tới 200, bisect chỉ ~8 — càng nhiều commit càng lời`);
  console.log("");

  console.log("4️⃣ Tự động hóa khi có test script (exit code chuẩn):");
  console.log("  git bisect run npm test -- cart.test   # bisect tự mark good/bad mỗi commit");
  console.log("");

  console.log("✅ Workflow: tái hiện → blame khoanh vùng → bisect tìm thủ phạm → show + fix + regression test.");
}

main();
export {};
