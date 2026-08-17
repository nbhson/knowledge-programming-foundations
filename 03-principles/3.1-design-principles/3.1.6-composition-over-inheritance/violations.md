# 🚫 Composition over Inheritance - Vi phạm & Cách xử lý

## Tình huống 1: Kế thừa để "vô hiệu hóa" method

**Vi phạm:**

```typescript
// ❌ BAD: Penguin kế thừa Bird nhưng phải override fly() để vô hiệu hóa
class Bird {
  fly() { return "Flying at 100km/h"; }
  sing() { return "Chirp chirp"; }
}

class Penguin extends Bird {
  fly() { throw new Error("Penguins can't fly"); } // vi phạm LSP!
  swim() { return "Swimming"; }
}

// Dùng sai
const penguin = new Penguin();
penguin.fly(); // ❌ exception tại runtime
```

**Cách xử lý:**

```typescript
// ✅ GOOD: composition — Penguin chỉ kết hợp behavior cần thiết
interface Flyable { fly(): string; }
interface Singable { sing(): string; }
interface Swimable { swim(): string; }

class Penguin implements Swimable {
  swim() { return "Swimming"; }
  // không có fly(), không có sing()
}

class Eagle implements Flyable, Singable {
  fly() { return "Flying"; }
  sing() { return "Eagle screech"; }
}
```

---

## Tình huống 2: Kế thừa sâu nhiều tầng

**Vi phạm:**

```typescript
// ❌ BAD: Kế thừa 4-5 tầng, khó hiểu, khó bảo trì
class Animal { move() {} }
class Mammal extends Animal { breathe() {} }
class Dog extends Mammal { bark() {} }
class Puppy extends Dog { weep() {} }
class ToyDog extends Puppy { spin() {} }

// Mỗi lớp thêm 1 behavior, nhưng cũng kéo theo tất cả behavior của lớp cha
const toy = new ToyDog();
toy.spin(); // OK
toy.bark(); // OK nhưng có thể không muốn
toy.weep(); // thừa thãi
```

**Cách xử lý:**

```typescript
// ✅ GOOD: composition — chỉ kết hợp những gì cần
class ToyDog {
  constructor(
    private spinner: Spinner,
    private barker: Barkable,
    private mover: Mover
  ) {}

  spin() { this.spinner.spin(); }
  bark() { this.barker.bark(); }
  move() { this.mover.move(); }
}
```

---

## Tình huống 3: Kế thừa vì muốn tái sử dụng method

**Vi phạm:**

```typescript
// ❌ BAD: Kế thừa chỉ để dùng 1-2 method từ class khác
class Logger {
  log(msg: string) { console.log(msg); }
  error(msg: string) { console.error(msg); }
  warn(msg: string) { console.warn(msg); }
}

// UserService chỉ cần log(), nhưng lại kế thừa cả Logger
class UserService extends Logger {
  createUser() {
    this.log("Creating user"); // dùng 1 method
    // ...
  }
  // Phải chịu đựng error() và warn() không dùng đến
}
```

**Cách xử lý:**

```typescript
// ✅ GOOD: inject dependency thay vì kế thừa
class UserService {
  constructor(private logger: Logger) {}

  createUser() {
    this.logger.log("Creating user");
    // ...
  }
}
```

---

## Tình huống 4: Class con override để throw exception

**Vi phạm:**

```typescript
// ❌ BAD: Class con override method để ném exception
class Shape {
  area() { return 0; }
  perimeter() { return 0; }
}

class Circle extends Shape {
  area() { return Math.PI * this.radius * this.radius; }
  perimeter() { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
  area() { return this.width * this.height; }
  perimeter() { return 2 * (this.width + this.height); }
}

// Vấn đề: Shape.area() = 0 là implementation mặc định vô nghĩa
// Shape.perimeter() = 0 cũng vậy
```

**Cách xử lý:**

```typescript
// ✅ GOOD: dùng interface, không có default implementation gây hiểu nhầm
interface Shape {
  area(): number;
  perimeter(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  area() { return Math.PI * this.radius * this.radius; }
  perimeter() { return 2 * Math.PI * this.radius; }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area() { return this.width * this.height; }
  perimeter() { return 2 * (this.width + this.height); }
}
```

---

## Tình huống 5: Kế thừa nhiều lớp cho các feature combinations

**Vi phạm:**

```typescript
// ❌ BAD: Tạo quá nhiều subclass cho các tổ hợp feature
class Notification { send() {} }
class EmailNotification extends Notification { send() { /* email */ } }
class SMSNotification extends Notification { send() { /* SMS */ } }
class PushNotification extends Notification { send() { /* push */ } }
class EmailWithTemplateNotification extends EmailNotification { /* ... */ }
class EmailWithAttachmentNotification extends EmailNotification { /* ... */ }
class SMSEmptyNotification extends SMSNotification { /* ... */ }
// ... explosive growth of subclasses
```

**Cách xử lý:**

```typescript
// ✅ GOOD: composition — kết hợp channel + formatter
interface NotificationChannel { send(to: string, content: string): void; }
interface ContentFormatter { format(content: string): string; }

class EmailChannel implements NotificationChannel { send(to, content) { /* ... */ } }
class SMSChannel implements NotificationChannel { send(to, content) { /* ... */ } }
class TemplateFormatter implements ContentFormatter { format(content) { /* ... */ } }
class PlainFormatter implements ContentFormatter { format(content) { return content; } }

class NotificationService {
  constructor(
    private channel: NotificationChannel,
    private formatter: ContentFormatter
  ) {}
  send(to: string, content: string) {
    this.channel.send(to, this.formatter.format(content));
  }
}
// Kết hợp tự do: EmailChannel + TemplateFormatter, SMSChannel + PlainFormatter...
```

---

## Tổng kết nhanh

| Dấu hiệu vi phạm Composition | Cách xử lý |
|---------------------------|------------|
| Class con override method để vô hiệu hóa | Dùng interface + composition |
| Kế thừa sâu > 2 tầng | Thay bằng composition |
| Kế thừa chỉ để dùng 1-2 method | Inject dependency thay vì extend |
| Default implementation gây hiểu nhầm | Dùng interface không có default |
|爆炸 subclass growth | Tách thành interfaces/componenets riêng |