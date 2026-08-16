/**
 * 3.1.1 DRY (Don't Repeat Yourself) - Validation Demo
 *
 * Tránh trùng lặp logic — mỗi kiến thức có 1 nguồn duy nhất.
 * Cùng 1 logic validate, chỉ định nghĩa 1 lần, tái sử dụng nhiều nơi.
 */

// --- ❌ BAD: Duplicated logic ---
function validateUserBad(user: any) {
  if (!user.name || user.name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }
  if (!user.email || !user.email.includes("@")) {
    throw new Error("Invalid email");
  }
}

function validateAdminBad(admin: any) {
  if (!admin.name || admin.name.length < 3) {
    throw new Error("Name must be at least 3 characters"); // duplicated!
  }
  if (!admin.email || !admin.email.includes("@")) {
    throw new Error("Invalid email"); // duplicated!
  }
}

// --- ✅ GOOD: Single source of truth ---
function validateName(name: string) {
  if (!name || name.length < 3) {
    throw new Error("Name must be at least 3 characters");
  }
}

function validateEmail(email: string) {
  if (!email || !email.includes("@")) {
    throw new Error("Invalid email");
  }
}

function validateUser(user: any) {
  validateName(user.name);
  validateEmail(user.email);
}

function validateAdmin(admin: any) {
  validateName(admin.name);
  validateEmail(admin.email);
}

// --- Demo ---
console.log("=== DRY Demo ===");
console.log("");

// GOOD: dùng chung validateName + validateEmail
const user = { name: "Son Nguyen", email: "son@example.com" };
const admin = { name: "Admin User", email: "admin@example.com" };

validateUser(user);
validateAdmin(admin);
console.log("✅ validateUser + validateAdmin passed (dùng chung 1 logic)");
console.log("");

// GOOD: thêm loại mới chỉ cần gọi lại hàm validate
const staff = { name: "Staff User", email: "staff@example.com" };
function validateStaff(staff: any) {
  validateName(staff.name);
  validateEmail(staff.email);
}
validateStaff(staff);
console.log("✅ validateStaff passed — thêm mới không cần viết lại logic");
console.log("");

// BAD: sửa logic phải sửa nhiều nơi
// Nếu đổi "3 characters" thành "5 characters" → phải sửa validateUserBad + validateAdminBad
// GOOD: chỉ sửa 1 chỗ trong validateName
console.log("🔧 Thay đổi logic: chỉ sửa validateName() 1 chỗ, mọi nơi đều đúng");
console.log("");

// Kiểm tra lỗi — cùng 1 thông báo từ 1 nguồn
try {
  validateUser({ name: "Ab", email: "son@example.com" });
} catch (error: any) {
  console.log(`❌ ${error.message} (từ validateName — 1 nguồn duy nhất)`);
}

console.log("");
console.log("✅ DRY: 1 nguồn duy nhất, sửa 1 chỗ, mọi nơi đều đúng");

export {};
