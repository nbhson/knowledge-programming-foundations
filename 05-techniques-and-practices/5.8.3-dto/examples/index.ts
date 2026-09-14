/**
 * 5.8.3 DTO (Data Transfer Object) — Demo
 *
 * DTO = vật trung gian giao tiếp giữa các lớp.
 *  - Đầu ra: từ entity → DTO để LOẠI bỏ field nhạy cảm (passwordHash, mật nội bộ)
 *    trước khi gửi ra ngoài.
 *  - Đầu vào: nhận request → validate trước khi đụng vào entity/business logic.
 */

type DtoUserRole = "admin" | "member";

// Entity — sống trong hệ thống, có thể chứa dữ liệu nhạy cảm
class DtoUserEntity {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly passwordHash: string,
    readonly role: DtoUserRole,
    readonly createdAt: Date
  ) {}
}

// Response DTO — chỉ chứa field an toàn để trả ra client
class DtoUserResponseDto {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: DtoUserRole;
  readonly createdAt: Date;

  private constructor(from: DtoUserEntity) {
    this.id = from.id;
    this.name = from.name;
    this.email = from.email;
    this.role = from.role;
    this.createdAt = from.createdAt;
  }

  static fromEntity(entity: DtoUserEntity): DtoUserResponseDto {
    return new DtoUserResponseDto(entity);
  }

  toJson(): string {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt.toISOString(),
    });
  }
}

// Input DTO — dữ liệu client gửi lên, được validate trước khi xử lý
class DtoCreateUserInput {
  constructor(readonly name: string, readonly email: string, readonly password: string) {}
}

class DtoInputValidator {
  static validate(input: DtoCreateUserInput): string[] {
    const errors: string[] = [];
    if (input.name.trim() === "") errors.push("Tên không được trống");
    if (!input.email.includes("@")) errors.push("Email sai định dạng (thiếu @)");
    if (input.password.length < 8) errors.push("Mật khẩu tối thiểu 8 ký tự");
    return errors;
  }
}

// Dịch vụ tạo user — nhận input DTO đã hợp lệ, trả về response DTO (không hở mật khẩu)
class DtoUserService {
  create(input: DtoCreateUserInput): DtoUserResponseDto {
    const errors = DtoInputValidator.validate(input);
    if (errors.length > 0) throw new Error(`Dữ liệu không hợp lệ: ${errors.join("; ")}`);
    const entity = new DtoUserEntity(
      "u-1",
      input.name.trim(),
      input.email.trim().toLowerCase(),
      `hash(${input.password})`,
      "member",
      new Date()
    );
    return DtoUserResponseDto.fromEntity(entity);
  }
}

// ───────────────────── Demo ─────────────────────
console.log("=== DTO Demo ===");
console.log("");

console.log("1️⃣ ĐẦU RA — entity có passwordHash, DTO không:");
const dtoEntity = new DtoUserEntity("u-1", "Son", "son@dev.com", "5f4dcc3b5aa765d61d8327deb882cf99", "member", new Date());
console.log(`  ❌ Entity JSON (nếu trả thẳng ra client): ${JSON.stringify(dtoEntity)}`);
console.log(`  ✅ DTO JSON: ${DtoUserResponseDto.fromEntity(dtoEntity).toJson()}`);
console.log("     💬 passwordHash bị DTO cắt; client không bao giờ nhìn thấy mật khẩu nội bộ");
console.log("");

console.log("2️⃣ ĐẦU VÀO — validate input DTO trước khi xử lý:");
const dtoService = new DtoUserService();
const dtoBad = new DtoCreateUserInput("", "son#dev.com", "123");
console.log(`  Input lỗi: name="${dtoBad.name}", email="${dtoBad.email}", password="${dtoBad.password}"`);
try {
  dtoService.create(dtoBad);
} catch (error) {
  console.log(`  💥 ${(error as Error).message}`);
}
console.log("");

console.log("3️⃣ INPUT hợp lệ → entity → response DTO (luôn ẩn passwordHash):");
const dtoGood = new DtoCreateUserInput("Son Nguyen", "son@dev.com", "secret123");
console.log(`  DTO gửi ra: ${dtoService.create(dtoGood).toJson()}`);
console.log("     💬 TRƯỚC khi 'chạm' bất kỳ business logic nào, dữ liệu vào đã được kiểm soát");
console.log("");
console.log("✅ DTO: che field nhạy cảm khi ra, validate dữ liệu khi vào — entity/biến nội bộ được bảo vệ");
console.log("");

export {};