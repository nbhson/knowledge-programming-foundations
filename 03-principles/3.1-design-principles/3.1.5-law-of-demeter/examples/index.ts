/**
 * 3.1.5 Law of Demeter (LoD) - Demo
 *
 * Chỉ nói chuyện với bạn thân — không gọi method xuyên qua chuỗi object.
 * Object chỉ gọi: chính nó, tham số, thuộc tính, object nó tạo ra.
 */

// --- Object model ---
class Address {
  private city: string;
  private country: string;

  constructor(city: string, country: string) {
    this.city = city;
    this.country = country;
  }

  getCity(): string {
    return this.city;
  }

  getCountry(): string {
    return this.country;
  }
}

class Customer {
  private name: string;
  private address: Address;

  constructor(name: string, address: Address) {
    this.name = name;
    this.address = address;
  }

  getAddress(): Address {
    return this.address;
  }

  // ✅ GOOD: Customer tự lo lấy country từ address của nó
  getCountry(): string {
    return this.address.getCountry();
  }
}

// --- ❌ BAD: Train wreck — biết quá sâu cấu trúc ---
function getCountryBad(customer: Customer): string {
  return customer.getAddress().getCountry(); // biết Customer có Address
}

// --- ✅ GOOD: Hỏi object trực tiếp ---
function getCountryGood(customer: Customer): string {
  return customer.getCountry(); // chỉ biết Customer có country
}

// --- Demo ---
console.log("=== Law of Demeter Demo ===");
console.log("");

const address = new Address("Ho Chi Minh City", "Vietnam");
const customer = new Customer("Son Nguyen", address);

// BAD: gọi xuyên qua chuỗi — biết quá sâu
console.log(`❌ BAD:  customer.getAddress().getCountry() = ${getCountryBad(customer)}`);
// GOOD: hỏi trực tiếp — Customer tự lo
console.log(`✅ GOOD: customer.getCountry() = ${getCountryGood(customer)}`);
console.log("");

console.log("📊 So sánh:");
console.log("   BAD:  getAddress() được gọi từ ngoài — biết cấu trúc nội bộ");
console.log("   GOOD: Customer.getCountry() — Customer tự lo address");
console.log("");

console.log("🔧 Lợi ích: nếu Address đổi cấu trúc, chỉ sửa Customer");
console.log("   → Nơi gọi không cần biết Address tồn tại");
console.log("");

console.log("✅ LoD: chỉ nói chuyện với bạn thân, coupling thấp, dễ sửa");

export {};