/**
 * 3.1.3 YAGNI (You Ain't Gonna Need It) - Demo
 *
 * Chỉ viết code khi thực sự cần — đừng viết "phòng khi".
 * Mỗi dòng code thừa = mỗi dòng phải maintain.
 */

// --- ❌ BAD: Writing code "just in case" ---
class UserServiceBad {
  createUser(data: any) {
    console.log(`✅ Created user: ${data.name}`);
  }

  deleteUser(id: string) {
    console.log(`✅ Deleted user: ${id}`);
  }

  // "Có thể cần sau này" — nhưng chưa có yêu cầu
  softDeleteUser(id: string) {
    console.log(`⚠️ softDeleteUser: ${id} — chưa ai yêu cầu`);
  }

  // "Biết đâu khách hàng muốn" — chưa ai xác nhận
  archiveUser(id: string) {
    console.log(`⚠️ archiveUser: ${id} — chưa ai yêu cầu`);
  }

  // "Cho chắc" — thêm param không ai dùng
  restoreUser(id: string) {
    console.log(`⚠️ restoreUser: ${id} — chưa ai yêu cầu`);
  }

  // "Phòng khi" — viết trước tính năng chưa có deadline
  bulkDeleteUsers(ids: string[]) {
    console.log(`⚠️ bulkDeleteUsers: ${ids.length} users — chưa ai yêu cầu`);
  }
}

// --- ✅ GOOD: Only what's needed NOW ---
class UserService {
  createUser(data: any) {
    console.log(`✅ Created user: ${data.name}`);
  }

  deleteUser(id: string) {
    console.log(`✅ Deleted user: ${id}`);
  }
}

// --- Demo ---
console.log("=== YAGNI Demo ===");
console.log("");

const userService = new UserService();
userService.createUser({ name: "Son" });
userService.deleteUser("user-1");
console.log("");

console.log("📊 So sánh:");
console.log("   BAD:  6 methods — 4 methods chưa ai dùng");
console.log("   GOOD: 2 methods — đúng nhu cầu hiện tại");
console.log("");

console.log("❓ Câu hỏi kiểm tra:");
console.log("   'Tính năng này có ai yêu cầu không?'");
console.log("   'Có deadline không?'");
console.log("   'Nếu không → đừng viết'");
console.log("");

console.log("✅ YAGNI: chỉ viết code khi thực sự cần");

export {};
