/**
 * 5.9.1 Barrel Exports — Demo
 *
 * Cấu trúc folder domain/:
 *   examples/domain/
 *   ├── user.model.ts        (type + factory)
 *   ├── user.repository.ts   (repository)
 *   ├── user.service.ts      (service)
 *   └── index.ts             ← BARREL: re-export tất cả
 */

// ✅ CÓ barrel — import MỘT điểm
import { BeUserRepository, BeUserService, makeBeUser } from "./domain";

// ❌ không có barrel — phải import từng đường sâu
import { BeUserRepository as BeDeepRepo } from "./domain/user.repository";

// ───────────────────── Demo ─────────────────────
console.log("=== Barrel Exports Demo ===");
console.log("");

console.log("📁 Cấu trúc có barrel:");
console.log("  domain/");
console.log("  ├── user.model.ts");
console.log("  ├── user.repository.ts");
console.log("  ├── user.service.ts");
console.log("  └── index.ts  ← 3 dòng `export * from ...`");
console.log("");

console.log("✅ CÓ barrel — 1 dòng import, code consumer gọn:");
console.log("  import { BeUserRepository, BeUserService, makeBeUser } from './domain'");
const beRepo = new BeUserRepository();
const beService = new BeUserService(beRepo);
const alice = beService.onboard("Alice", "alice@dev.com");
beRepo.save(makeBeUser("special", "CEO", "ceo@dev.com"));
console.log(`  → onboard Alice: ${alice.id} / ${alice.name} — repo có ${beRepo.count()} users`);
console.log("");

console.log("❌ KHÔNG có barrel — import rải rác, phải biết đường dẫn sâu:");
console.log("  import { BeUserRepository } from './domain/user.repository'");
console.log("  import { BeUserService } from './domain/user.service'");
console.log("  import { BeUser } from './domain/user.model'");
const beDeep = new BeDeepRepo();
beDeep.save(makeBeUser("bob", "Bob", "bob@dev.com"));
console.log(`  → sâu vẫn chạy được (${beDeep.findById("bob")?.name}) nhưng mỗi lần đổi cấu trúc folder phải sửa khắp nơi`);
console.log("");

console.log("💡 DÙNG KHI: library/package expose API, hoặc folder lớn cần single entry.");
console.log("⚠️ LƯU Ý: barrel dùng ẩu có thể gây circular dependency — chỉ re-export đúng thứ public API cần.");
console.log("");
console.log("✅ Barrel Exports: một index.ts re-export → import 1 nơi, đổi cấu trúc bên trong không vỡ consumer");
console.log("");

export {};