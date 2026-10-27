/**
 * 3.2.1 SRP (Single Responsibility Principle) - Demo
 *
 * 1 class chỉ có 1 lý do để thay đổi.
 * Mỗi class lo 1 trách nhiệm duy nhất.
 */

// --- ❌ BAD: 1 class 4 trách nhiệm ---
class UserServiceBad {
  validate(user: any) {
    if (!user.name || user.name.length < 3) {
      throw new Error("Name must be at least 3 characters");
    }
    if (!user.email || !user.email.includes("@")) {
      throw new Error("Invalid email");
    }
    console.log("✅ Validated user");
  }

  save(user: any) {
    console.log(`💾 Saved user ${user.name} to database`);
  }

  sendWelcomeEmail(user: any) {
    console.log(`📧 Sent welcome email to ${user.email}`);
  }

  generateReport(user: any) {
    console.log(`📊 Generated report for ${user.name}`);
  }
}

// --- ✅ GOOD: mỗi class 1 trách nhiệm ---
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

class UserReportService {
  generate(user: any) {
    console.log(`📊 Generated report for ${user.name}`);
  }
}

// --- Demo ---
console.log("=== SRP Demo ===");
console.log("");

const user = { name: "Son Nguyen", email: "son@example.com" };

// GOOD: dùng từng class riêng biệt
const validator = new UserValidator();
const repository = new UserRepository();
const emailService = new UserEmailService();
const reportService = new UserReportService();

validator.validate(user);
repository.save(user);
emailService.sendWelcome(user);
reportService.generate(user);
console.log("");

console.log("📊 So sánh:");
console.log("   BAD:  1 class UserServiceBad — 4 trách nhiệm");
console.log("   GOOD: 4 class — mỗi class 1 trách nhiệm");
console.log("");

console.log("🔧 Lợi ích: sửa email service không đụng database");
console.log("   → UserEmailService thay đổi, UserRepository không bị ảnh hưởng");
console.log("");

console.log("✅ SRP: 1 class 1 trách nhiệm, dễ sửa, dễ test, dễ tái sử dụng");

export {};