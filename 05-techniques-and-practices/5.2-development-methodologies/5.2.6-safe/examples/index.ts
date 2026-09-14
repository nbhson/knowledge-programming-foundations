/**
 * 5.2.6 SAFe (Scaled Agile Framework) — Program Increment (PI) & ART
 *
 * Mô phỏng 1 Agile Release Train (ART): 3 team, mỗi team làm việc theo sprint,
 * cùng tham gia PI Planning 8-12 tuần để thống nhất MỤC TIÊU CHUNG (Objectives),
 * rồi demo cuối PI (System Demo) và cải tiến (Inspect & Adapt).
 *
 * Chạy: npx ts-node examples/index.ts
 */

interface SaFeTeam {
  name: string;
  capacityPoints: number;
  objectives: string[];
}

class AgileReleaseTrain {
  private teams: SaFeTeam[] = [];

  addTeam(team: SaFeTeam): void {
    this.teams.push(team);
  }

  /** PI Planning: cả train họp 2 ngày để chốt objectives cho 1 PI */
  piPlanning(backlog: string[]): void {
    console.log("\n🎯 PI PLANNING — (2 ngày) 3 team ngồi chung 1 phòng:");
    for (const team of this.teams) {
      const goals: string[] = [];
      let used = 0;
      for (const feature of backlog) {
        if (used + 8 <= team.capacityPoints) {
          goals.push(feature);
          used += 8;
        }
      }
      console.log(`   ┌─ ${team.name} (capacity ${team.capacityPoints}pts)`);
      goals.forEach((g) => console.log(`   │   • chọn feature: ${g}`));
      team.objectives.push(...goals);
      console.log(`   └── tổng ${used}pts — cam kết cho PI`);
    }
  }

  /** Mỗi team chạy 4 sprints trong PI; mô phỏng sprint bình thường */
  runSprints(sprintCount: number): void {
    console.log(`\n🔁 4 sprints = 1 PI — chạy ${sprintCount} sprint cho train:`);
    for (let i = 1; i <= sprintCount; i++) {
      console.log(`   ─ Sprint ${i}`);
      for (const team of this.teams) {
        const remaining = Math.max(0, team.objectives.length - i);
        console.log(`      • ${team.name}: còn ${remaining} feature trên sprint board`);
      }
    }
  }

  /** System Demo cuối PI + Inspect & Adapt */
  systemDemo(): void {
    console.log("\n🎉 SYSTEM DEMO — cuối PI (đại diện các team demo chung sản phẩm):");
    for (const team of this.teams) {
      team.objectives.forEach((o) => console.log(`   ✅ ${team.name} demo "${o}"`));
    }
  }

  inspectAndAdapt(): void {
    console.log("\n🧭 INSPECT & ADAPT — tìm root-cause & cải tiến cho PI sau:");
    console.log("   • Good: train demo tạo Integrated increment đúng cadence.");
    console.log("   • Improvable: chia nhỏ feature quá lớn → 2 sprint mới xong.");
    console.log("   • Action PI sau: 'feature slicing' trước khi vào PI Planning.");
  }
}

// ────────────────────────── Demo chạy ─────────────────────────────────

console.log("=== 5.2.6 SAFe — Scaled Agile Framework Demo ===\n");
console.log("🏢 Quy mô: 3 team (7 người/team) = 1 Agile Release Train (ART) ~ 21 người.");

const train = new AgileReleaseTrain();
train.addTeam({
  name: "Team Core (Auth/Giao dịch)",
  capacityPoints: 40,
  objectives: [],
});
train.addTeam({
  name: "Team Checkout (Thanh toán)",
  capacityPoints: 32,
  objectives: [],
});
train.addTeam({
  name: "Team Reports (Báo cáo)",
  capacityPoints: 32,
  objectives: [],
});

train.piPlanning(["Login SSO", "Giỏ hàng", "Thanh toán", "Export PDF", "Dashboard analytics"]);
train.runSprints(4);
train.systemDemo();
train.inspectAndAdapt();

console.log("\n✅ SAFe giúp HÀNG TRĂM dev phối hợp theo cùng nhịp (PI cadence), align chiến lược với thực thi — nhưng ceremony nặng & tốn kém.");

export {};