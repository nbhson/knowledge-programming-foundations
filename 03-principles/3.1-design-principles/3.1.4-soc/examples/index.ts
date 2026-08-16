/**
 * 3.1.4 SoC (Separation of Concerns) - Demo
 *
 * Tách trách nhiệm theo lĩnh vực — mỗi class chỉ lo 1 việc.
 * Sửa 1 lĩnh vực không ảnh hưởng lĩnh vực khác.
 */

// --- ❌ BAD: One class does everything ---
class UserServiceBad {
  validateUser(user: any) {
    if (!user.name || user.name.length < 3) {
      throw new Error("Name must be at least 3 characters");
    }
    if (!user.email || !user.email.includes("@")) {
      throw new Error("Invalid email");
    }
    console.log("✅ Validated user");
  }

  saveToDatabase(user: any) {
    console.log(`💾 Saved user ${user.name} to database`);
  }

  sendWelcomeEmail(user: any) {
    console.log(`📧 Sent welcome email to ${user.email}`);
  }

  generateUserReport(user: any) {
    console.log(`📊 Generated report for ${user.name}`);
  }
}

// --- ✅ GOOD: Separation of concerns ---
class UserValidator {
  validate(user: any) {
    if (!user.name || user.name.length < 3) {
      throw new Error("Name must be at least 3 characters");
    }
    if (!user.email || !user.email.includes("@")) {
      throw new Error("Invalid email");
    }
    console.log("✅ Validated user");
  }
}

class UserRepository {
  save(user: any) {
    console.log(`💾 Saved user ${user.name} to database`);
  }
}

class UserEmailService {
  sendWelcome(user: any) {
    console.log(`📧 Sent welcome email to ${user.email}`);
  }
}

class ReportService {
  generateUserReport(user: any) {
    console.log(`📊 Generated report for ${user.name}`);
  }
}

// --- Demo ---
console.log("=== SoC Demo ===");
console.log("");

const user = { name: "Son Nguyen", email: "son@example.com" };

// GOOD: mỗi class 1 trách nhiệm, dùng riêng từng phần
const validator = new UserValidator();
const repository = new UserRepository();
const emailService = new UserEmailService();
const reportService = new ReportService();

validator.validate(user);
repository.save(user);
emailService.sendWelcome(user);
reportService.generateUserReport(user);
console.log("");

console.log("📊 So sánh:");
console.log("   BAD:  1 class UserServiceBad — 4 trách nhiệm");
console.log("   GOOD: 4 class — mỗi class 1 trách nhiệm");
console.log("");

console.log("🔧 Lợi ích: sửa email service không đụng database");
console.log("   → UserEmailService thay đổi, UserRepository không bị ảnh hưởng");
console.log("");

console.log("✅ SoC: tách trách nhiệm, dễ sửa, dễ test, dễ tái sử dụng");

export {};
