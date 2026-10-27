# 🚫 Law of Demeter - Vi phạm & Cách xử lý

## Tình huống 1: "Train wreck" — chuỗi method call quá dài

**Vi phạm:**

```typescript
// ❌ BAD: Chuỗi gọi xuyên qua nhiều object
const country = customer.getAddress().getCity().getCountry().getName();

// Customer biết quá sâu cấu trúc Address → City → Country
```

**Cách xử lý:**

```typescript
// ✅ GOOD: hỏi customer trực tiếp, không xâm nhập cấu trúc nội bộ
const country = customer.getCountryName();

// Hoặc dùng getter trực tiếp nếu cần
const country = customer.country;
```

---

## Tình huống 2: Object biết cấu trúc nội bộ của object khác

**Vi phạm:**

```typescript
// ❌ BAD: Order biết chi tiết cấu trúc Address
class Order {
  getShippingCity(): string {
    return this.shippingAddress.city; // biết cấu trúc nội bộ
  }
  getShippingZip(): string {
    return this.shippingAddress.zipCode; // biết cấu trúc nội bộ
  }
  getShippingState(): string {
    return this.shippingAddress.state; // biết cấu trúc nội bộ
  }
}

class Address {
  city: string;
  zipCode: string;
  state: string;
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: mỗi object tự quản lý dữ liệu của mình
class Order {
  getShippingCity(): string {
    return this.shippingAddress.getCity(); // hỏi object, không xâm nhập
  }
}

class Address {
  private city: string;
  getCity(): string { return this.city; }
}
```

---

## Tình huống 3: Function tham số nhận object rồi truy cập sâu thuộc tính

**Vi phạm:**

```typescript
// ❌ BAD: Function cần nhiều thuộc tính từ nested object
function calculateShippingCost(order: Order) {
  const weight = order.package.weight;      // truy cập sâu
  const destination = order.package.destination.country; // quá sâu!
  const distance = getDistance(weight, destination);
  return distance * 0.5;
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: đóng gói logic vào object sở hữu dữ liệu
class Order {
  calculateShippingCost(): number {
    return this.package.calculateShippingCost();
  }
}

class Package {
  calculateShippingCost(): number {
    const distance = getDistance(this.weight, this.destination.country);
    return distance * 0.5;
  }
}
```

---

## Tình huống 4: Service gọi phương thức của object trả về từ service khác

**Vi phạm:**

```typescript
// ❌ BAD: UserService gọi method của object trả về từ UserRepository
class UserService {
  async getUserEmailStatus(userId: number) {
    const user = await this.userRepo.findById(userId);
    return user.getEmailVerificationStatus(); // biết quá sâu
  }
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: UserService hỏi User trực tiếp qua method đã định nghĩa sẵn
class UserService {
  async getUserEmailStatus(userId: number) {
    const user = await this.userRepo.findById(userId);
    return user.isEmailVerified(); // method rõ ràng trên class
  }
}

class User {
  isEmailVerified(): boolean {
    return this.emailVerificationStatus === "verified";
  }
}
```

---

## Tình huống 5: Builder/Query chains bị lạm dụng

**Vi phạm:**

```typescript
// ❌ BAD: Chuỗi query phức tạp xuyên qua nhiều layer
const result = db
  .collection("orders")
  .where("status", "==", "pending")
  .limit(10)
  .get()
  .then(snapshot => snapshot.docs.map(doc => doc.data()))
  .then(docs => docs.filter(d => d.total > 100));
// Chuỗi quá dài, khó đọc, khó test
```

**Cách xử lý:**

```typescript
// ✅ GOOD: đóng gói trong repository method
class OrderRepository {
  async findPendingHighValue(minTotal: number) {
    const snapshot = await db
      .collection("orders")
      .where("status", "==", "pending")
      .where("total", ">", minTotal)
      .get();
    return snapshot.docs.map(doc => doc.data());
  }
}

// Gọi đơn giản
const orders = await orderRepo.findPendingHighValue(100);
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm LoD | Cách xử lý |
|---------------------|------------|
| Chuỗi `a.b.c.d.method()` | Thêm method trung gian trên object cấp cao |
| Object biết cấu trúc nội bộ object khác | Đóng gói trong object đó |
| Function truy cập deep property từ param | Chuyển logic vào object sở hữu dữ liệu |
| Service gọi method của object trả về | Thêm method rõ ràng trên class |
| Query chain quá dài | Đóng gói trong repository method |