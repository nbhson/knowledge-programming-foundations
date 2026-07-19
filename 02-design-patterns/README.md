# 🔧 Lớp 2: Design Patterns (Mẫu Thiết Kế)

> **Design Patterns** là các **giải pháp thiết kế đã được kiểm chứng** cho các vấn đề thường gặp trong lập trình.
> Chúng không phải code cụ thể, mà là **template/mô hình** để giải quyết vấn đề.
>
> **Ví dụ:** Kỹ thuật xây dựng cụ thể — đặt gạch theo mẫu nào, lắp cửa ra sao.

---

## Tổng Quan

```
Design Patterns
├── 2.1 Creational Patterns (Mẫu Tạo Đối Tượng)
│   ├── Singleton
│   ├── Factory Method
│   ├── Abstract Factory
│   ├── Builder
│   └── Prototype
├── 2.2 Structural Patterns (Mẫu Cấu Trúc)
│   ├── Adapter
│   ├── Decorator
│   ├── Facade
│   ├── Proxy
│   ├── Composite
│   └── Bridge
└── 2.3 Behavioral Patterns (Mẫu Hành Vi)
    ├── Observer
    ├── Strategy
    ├── Command
    ├── State
    ├── Iterator
    ├── Chain of Responsibility
    ├── Template Method
    └── Mediator
```

---

## 2.1 Creational Patterns (Mẫu Tạo Đối Tượng)

> Giải quyết vấn đề: **Tạo đối tượng một cách linh hoạt và phù hợp**.

### Singleton

**Mục đích:** Đảm bảo một class chỉ có **duy nhất 1 instance** và cung cấp global point truy cập.

```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection;

  private constructor() {
    // Private constructor prevents direct instantiation
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
}

// Usage
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true
```

**Khi nào dùng:** Database connection pool, Logger, Configuration manager.

**Cẩn thận:**滥用 Singleton sẽ tạo tight coupling, khó test.

---

### Factory Method

**Mục đích:** Tạo đối tượng mà **không chỉ rõ class cụ thể** — việc tạo đối tượng được delega cho subclass.

```typescript
// Product interface
interface Notification {
  send(message: string): void;
}

// Concrete Products
class EmailNotification implements Notification {
  send(message: string) {
    console.log(`Sending Email: ${message}`);
  }
}

class SMSNotification implements Notification {
  send(message: string) {
    console.log(`Sending SMS: ${message}`);
  }
}

// Creator (Factory)
abstract class NotificationFactory {
  abstract createNotification(): Notification;

  notify(message: string) {
    const notification = this.createNotification();
    notification.send(message);
  }
}

// Concrete Creators
class EmailFactory extends NotificationFactory {
  createNotification(): Notification {
    return new EmailNotification();
  }
}

class SMSFactory extends NotificationFactory {
  createNotification(): Notification {
    return new SMSNotification();
  }
}

// Usage
const factory: NotificationFactory = new EmailFactory();
factory.notify("Hello!"); // Sending Email: Hello!
```

**Khi nào dùng:** Khi cần tạo nhiều loại đối tượng khác nhau tùy theo context.

---

### Abstract Factory

**Mục đích:** Tạo **gia đình các đối tượng liên quan** mà không chỉ rõ class cụ thể.

```typescript
// Abstract Products
interface Button { render(): void; }
interface Input { render(): void; }

// Concrete Products - Light Theme
class LightButton implements Button { render() { console.log("Light Button"); } }
class LightInput implements Input { render() { console.log("Light Input"); } }

// Concrete Products - Dark Theme
class DarkButton implements Button { render() { console.log("Dark Button"); } }
class DarkInput implements Input { render() { console.log("Dark Input"); } }

// Abstract Factory
interface UIFactory {
  createButton(): Button;
  createInput(): Input;
}

// Concrete Factories
class LightThemeFactory implements UIFactory {
  createButton() { return new LightButton(); }
  createInput() { return new LightInput(); }
}

class DarkThemeFactory implements UIFactory {
  createButton() { return new DarkButton(); }
  createInput() { return new DarkInput(); }
}
```

**Khi nào dùng:** Hệ thống cần hỗ trợ nhiều theme, nhiều platform (mobile/web/desktop).

---

### Builder

**Mục đích:** Xây dựng đối tượng phức tạp **từng bước**, cho phép tạo nhiều biểu diễn khác nhau.

```typescript
class QueryBuilder {
  private table: string = "";
  private conditions: string[] = [];
  private orderBy: string = "";
  private limit: number = 0;

  from(table: string): this {
    this.table = table;
    return this;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  order(column: string): this {
    this.orderBy = column;
    return this;
  }

  take(limit: number): this {
    this.limit = limit;
    return this;
  }

  build(): string {
    let query = `SELECT * FROM ${this.table}`;
    if (this.conditions.length) {
      query += ` WHERE ${this.conditions.join(" AND ")}`;
    }
    if (this.orderBy) query += ` ORDER BY ${this.orderBy}`;
    if (this.limit) query += ` LIMIT ${this.limit}`;
    return query;
  }
}

// Usage
const query = new QueryBuilder()
  .from("users")
  .where("age > 18")
  .where("status = 'active'")
  .order("name")
  .take(10)
  .build();

// "SELECT * FROM users WHERE age > 18 AND status = 'active' ORDER BY name LIMIT 10"
```

**Khi nào dùng:** Object có nhiều optional parameters, immutable object creation.

---

### Prototype

**Mục đích:** Tạo mới đối tượng bằng cách **clone** (sao chép) từ prototype có sẵn, thay vì tạo từ đầu.

```typescript
interface Clonable<T> {
  clone(): T;
}

class User implements Clonable<User> {
  constructor(
    public name: string,
    public permissions: string[]
  ) {}

  clone(): User {
    // Deep clone
    return new User(this.name, [...this.permissions]);
  }
}

const admin = new User("Admin", ["read", "write", "delete"]);
const newAdmin = admin.clone(); // Tạo bản sao
```

**Khi nào dùng:** Tạo đối tượng phức tạp tốn tài nguyên, muốn tránh initialization cost.

---

## 2.2 Structural Patterns (Mẫu Cấu Trúc)

> Giải quyết vấn đề: **Kết hợp các đối tượng và classes thành cấu trúc lớn hơn**.

### Adapter

**Mục đích:** Chuyển giao diện của class này thành giao diện khác mà client mong đợi.

```typescript
// Old system
class OldPaymentGateway {
  makePayment(amount: number) {
    console.log(`Paying $${amount} via Old Gateway`);
  }
}

// New system expects this interface
interface PaymentProcessor {
  processPayment(amount: number, currency: string): void;
}

// Adapter
class PaymentAdapter implements PaymentProcessor {
  private oldGateway: OldPaymentGateway;

  constructor() {
    this.oldGateway = new OldPaymentGateway();
  }

  processPayment(amount: number, currency: string): void {
    // Adapter converts the interface
    this.oldGateway.makePayment(amount);
  }
}

// Client code works with new interface
function checkout(processor: PaymentProcessor) {
  processor.processPayment(100, "USD");
}

checkout(new PaymentAdapter());
```

**Khi nào dùng:** Tích hợp hệ thống mới với hệ thống cũ, sử dụng third-party library với interface khác.

---

### Decorator

**Mục đích:** Thêm hành vi mới cho đối tượng **một cách linh hoạt** mà không thay đổi class gốc.

```typescript
interface Coffee {
  getCost(): number;
  getDescription(): string;
}

class SimpleCoffee implements Coffee {
  getCost() { return 5; }
  getDescription() { return "Simple coffee"; }
}

// Decorator
class CoffeeDecorator implements Coffee {
  constructor(protected coffee: Coffee) {}

  getCost() { return this.coffee.getCost(); }
  getDescription() { return this.coffee.getDescription(); }
}

class MilkDecorator extends CoffeeDecorator {
  getCost() { return super.getCost() + 2; }
  getDescription() { return super.getDescription() + ", milk"; }
}

class SugarDecorator extends CoffeeDecorator {
  getCost() { return super.getCost() + 1; }
  getDescription() { return super.getDescription() + ", sugar"; }
}

// Usage - stack decorators
let coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);

console.log(coffee.getCost());       // 8
console.log(coffee.getDescription()); // "Simple coffee, milk, sugar"
```

**Khi nào dùng:** Thêm chức năng mà không sửa code gốc, thay vì kế thừa.

---

### Facade

**Mô tả:** Cung cấp **interface đơn giản hóa** cho một subsystem phức tạp.

```typescript
// Complex subsystems
class CPU {
  freeze() { console.log("CPU freeze"); }
  jump(address: number) { console.log(`CPU jump to ${address}`); }
  execute() { console.log("CPU execute"); }
}

class Memory {
  load(address: number, data: string) {
    console.log(`Memory load: ${data} at ${address}`);
  }
}

class HardDrive {
  read(sector: number, size: number) {
    console.log(`HardDrive read sector ${sector}`);
    return "boot data";
  }
}

// Facade
class ComputerFacade {
  private cpu = new CPU();
  private memory = new Memory();
  private hardDrive = new HardDrive();

  start() {
    this.cpu.freeze();
    this.memory.load(0, this.hardDrive.read(0, 1024));
    this.cpu.jump(0);
    this.cpu.execute();
  }
}

// Client chỉ cần gọi 1 method
const computer = new ComputerFacade();
computer.start(); // Thay vì gọi 4-5 method riêng lẻ
```

---

### Proxy

**Mục đích:** Đại diện cho một đối tượng khác để kiểm soát truy cập.

**Các loại Proxy:**
- **Virtual Proxy:** Lazy loading (chỉ tạo object khi cần)
- **Protection Proxy:** Kiểm soát quyền truy cập
- **Caching Proxy:** Cache kết quả
- **Remote Proxy:** Đại diện cho resource từ xa

```typescript
interface Image {
  display(): void;
}

class RealImage implements Image {
  constructor(private filename: string) {
    this.loadFromDisk(); // Tốn kém!
  }

  private loadFromDisk() {
    console.log(`Loading ${this.filename} from disk...`);
  }

  display() {
    console.log(`Displaying ${this.filename}`);
  }
}

class ProxyImage implements Image {
  private realImage: RealImage | null = null;

  constructor(private filename: string) {}

  display() {
    if (!this.realImage) {
      this.realImage = new RealImage(this.filename); // Lazy loading
    }
    this.realImage.display();
  }
}

// Usage
const image = new ProxyImage("photo.jpg");
// RealImage chưa được tạo cho đến khi gọi display()
image.display(); // Loading... then Displaying
image.display(); // Displaying (đã có trong memory)
```

---

### Composite

**Mục đích:** Cấu trúc tree, cho phép client **treating individual objects và compositions uniformly**.

```typescript
interface FileSystemItem {
  getName(): string;
  getSize(): number;
  display(indent: string): void;
}

class File implements FileSystemItem {
  constructor(private name: string, private size: number) {}

  getName() { return this.name; }
  getSize() { return this.size; }
  display(indent: string) {
    console.log(`${indent}📄 ${this.name} (${this.size}KB)`);
  }
}

class Folder implements FileSystemItem {
  private items: FileSystemItem[] = [];

  constructor(private name: string) {}

  add(item: FileSystemItem): this {
    this.items.push(item);
    return this;
  }

  getName() { return this.name; }
  getSize() { return this.items.reduce((sum, item) => sum + item.getSize(), 0); }
  display(indent: string) {
    console.log(`${indent}📁 ${this.name}/ (${this.getSize()}KB)`);
    this.items.forEach(item => item.display(indent + "  "));
  }
}

// Usage
const root = new Folder("root");
const docs = new Folder("docs");
docs.add(new File("readme.md", 5));
docs.add(new File("guide.pdf", 500));
root.add(docs);
root.add(new File("app.js", 10));

root.display("");
// 📁 root/ (515KB)
//   📁 docs/ (505KB)
//     📄 readme.md (5KB)
//     📄 guide.pdf (500KB)
//   📄 app.js (10KB)
```

---

### Bridge

**Mục đích:** Tách abstraction khỏi implementation để cả hai có thể **thay đổi độc lập**.

```typescript
// Implementation (Draw API)
interface DrawAPI {
  drawCircle(x: number, y: number, radius: number): void;
}

class OpenGL implements DrawAPI {
  drawCircle(x: number, y: number, radius: number) {
    console.log(`OpenGL: Drawing circle at (${x},${y}) r=${radius}`);
  }
}

class DirectX implements DrawAPI {
  drawCircle(x: number, y: number, radius: number) {
    console.log(`DirectX: Drawing circle at (${x},${y}) r=${radius}`);
  }
}

// Abstraction (Shape)
abstract class Shape {
  constructor(protected drawAPI: DrawAPI) {}
  abstract draw(): void;
}

class Circle extends Shape {
  private x: number;
  private y: number;
  private radius: number;

  constructor(x: number, y: number, radius: number, drawAPI: DrawAPI) {
    super(drawAPI);
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  draw() {
    this.drawAPI.drawCircle(this.x, this.y, this.radius);
  }
}

// Usage - linh hoạt kết hợp
new Circle(1, 2, 3, new OpenGL()).draw();   // OpenGL
new Circle(1, 2, 3, new DirectX()).draw();  // DirectX
```

---

## 2.3 Behavioral Patterns (Mẫu Hành Vi)

> Giải quyết vấn đề: **Cách các đối tượng giao tiếp và phân phối trách nhiệm**.

### Observer

**Mục đích:** Định nghĩa **mối quan hệ 1-nhiều** — khi một đối tượng thay đổi, tất cả các đối tượng depend được thông báo tự động.

```typescript
type EventCallback = (data: any) => void;

class EventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

// Usage
const emitter = new EventEmitter();

emitter.on("userLoggedIn", (user) => {
  console.log(`Welcome ${user.name}!`);
});

emitter.on("userLoggedIn", (user) => {
  console.log(`Log: ${user.name} logged in at ${new Date()}`);
});

emitter.emit("userLoggedIn", { name: "John" });
// Welcome John!
// Log: John logged in at ...
```

**Ví dụ thực tế:** RxJS Observables, DOM events, Angular EventEmitter.

---

### Strategy

**Mục đích:** Định nghĩa **một family algorithms**, đóng gói từng algorithm, và làm cho chúng **interchangeable**.

```typescript
interface SortStrategy<T> {
  sort(data: T[]): T[];
}

class BubbleSort<T> implements SortStrategy<T> {
  sort(data: T[]): T[] {
    console.log("Sorting with Bubble Sort");
    return [...data].sort(); // simplified
  }
}

class QuickSort<T> implements SortStrategy<T> {
  sort(data: T[]): T[] {
    console.log("Sorting with Quick Sort");
    return [...data].sort(); // simplified
  }
}

class MergeSort<T> implements SortStrategy<T> {
  sort(data: T[]): T[] {
    console.log("Sorting with Merge Sort");
    return [...data].sort(); // simplified
  }
}

class Sorter<T> {
  private strategy: SortStrategy<T>;

  constructor(strategy: SortStrategy<T>) {
    this.strategy = strategy;
  }

  setStrategy(strategy: SortStrategy<T>) {
    this.strategy = strategy;
  }

  sort(data: T[]): T[] {
    return this.strategy.sort(data);
  }
}

// Usage
const sorter = new Sorter(new BubbleSort());
sorter.sort([3, 1, 2]);    // Bubble Sort

sorter.setStrategy(new QuickSort());
sorter.sort([3, 1, 2]);    // Quick Sort — changed at runtime!
```

---

### Command

**Mục đích:** Đóng gói request thành **đối tượng**, cho phép parameterize, queue, log, và undo operations.

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  private content: string = "";

  type(text: string) { this.content += text; }
  delete(length: number) { this.content = this.content.slice(0, -length); }
  getContent() { return this.content; }
}

class TypeCommand implements Command {
  constructor(
    private editor: TextEditor,
    private text: string
  ) {}

  execute() { this.editor.type(this.text); }
  undo() { this.editor.delete(this.text.length); }
}

class DeleteCommand implements Command {
  private deletedText: string = "";

  constructor(
    private editor: TextEditor,
    private length: number
  ) {}

  execute() {
    const content = this.editor.getContent();
    this.deletedText = content.slice(-this.length);
    this.editor.delete(this.length);
  }

  undo() { this.editor.type(this.deletedText); }
}

// Command History for undo
class CommandHistory {
  private history: Command[] = [];

  execute(command: Command) {
    command.execute();
    this.history.push(command);
  }

  undo() {
    const command = this.history.pop();
    command?.undo();
  }
}

// Usage
const editor = new TextEditor();
const history = new CommandHistory();

history.execute(new TypeCommand(editor, "Hello "));
history.execute(new TypeCommand(editor, "World"));
console.log(editor.getContent()); // "Hello World"

history.undo();
console.log(editor.getContent()); // "Hello "
```

---

### State

**Mô tả:** Cho phép đối tượng **thay đổi hành vi** khi internal state thay đổi — như thể đối tượng thay đổi class.

```typescript
interface OrderState {
  next(order: Order): void;
  getStatus(): string;
}

class NewState implements OrderState {
  next(order: Order) {
    order.setState(new ProcessingState());
  }
  getStatus() { return "New"; }
}

class ProcessingState implements OrderState {
  next(order: Order) {
    order.setState(new ShippedState());
  }
  getStatus() { return "Processing"; }
}

class ShippedState implements OrderState {
  next(order: Order) {
    order.setState(new DeliveredState());
  }
  getStatus() { return "Shipped"; }
}

class DeliveredState implements OrderState {
  next(order: Order) {
    console.log("Order already delivered!");
  }
  getStatus() { return "Delivered"; }
}

class Order {
  private state: OrderState = new NewState();

  setState(state: OrderState) { this.state = state; }
  next() { this.state.next(this); }
  getStatus() { return this.state.getStatus(); }
}

// Usage
const order = new Order();
console.log(order.getStatus()); // "New"
order.next();
console.log(order.getStatus()); // "Processing"
order.next();
console.log(order.getStatus()); // "Shipped"
```

---

### Iterator

**Mô tả:** Cung cấp cách **truy cập elements** của collection mà không expose underlying representation.

```typescript
class NumberRange {
  private start: number;
  private end: number;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;

    return {
      next() {
        if (current <= end) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

// Usage
const range = new NumberRange(1, 5);
for (const num of range) {
  console.log(num); // 1, 2, 3, 4, 5
}
```

---

### Chain of Responsibility

**Mô tả:** Cho phép request **pass qua một chain of handlers**. Mỗi handler quyết định xử lý hoặc forward cho handler tiếp theo.

```typescript
abstract class Handler {
  private nextHandler: Handler | null = null;

  setNext(handler: Handler): Handler {
    this.nextHandler = handler;
    return handler;
  }

  handle(request: string): string | null {
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }
    return null;
  }
}

class AuthHandler extends Handler {
  handle(request: string): string | null {
    if (request === "auth") return "Auth: ✅ Authenticated";
    return super.handle(request);
  }
}

class ValidationHandler extends Handler {
  handle(request: string): string | null {
    if (request === "validate") return "Validation: ✅ Valid data";
    return super.handle(request);
  }
}

class ErrorHandler extends Handler {
  handle(request: string): string | null {
    if (request === "error") return "Error: ❌ Something went wrong";
    return super.handle(request);
  }
}

// Usage - build chain
const auth = new AuthHandler();
const validation = new ValidationHandler();
const error = new ErrorHandler();

auth.setNext(validation).setNext(error);

console.log(auth.handle("validate")); // "Validation: ✅ Valid data"
console.log(auth.handle("error"));    // "Error: ❌ Something went wrong"
console.log(auth.handle("unknown"));  // null
```

---

### Template Method

**Mô tả:** Định nghĩa **skeleton của algorithm** trong base class, cho phép subclasses **override các bước cụ thể** mà không thay đổi cấu trúc algorithm.

```typescript
abstract class DataMiner {
  // Template method — không thể override
  mine(): void {
    this.extractData();
    this.parseData();
    this.analyzeData();
    this.report();
  }

  protected abstract extractData(): void;
  protected abstract parseData(): void;

  protected analyzeData() {
    console.log("Analyzing data (default behavior)");
  }

  protected report() {
    console.log("Generating report");
  }
}

class CSVDataMiner extends DataMiner {
  protected extractData() { console.log("Extracting CSV data"); }
  protected parseData() { console.log("Parsing CSV format"); }
}

class JSONDataMiner extends DataMiner {
  protected extractData() { console.log("Extracting JSON data"); }
  protected parseData() { console.log("Parsing JSON format"); }
}

// Usage
const csvMiner = new CSVDataMiner();
csvMiner.mine();
// Extracting CSV data → Parsing CSV format → Analyzing data → Generating report
```

---

### Mediator

**Mô tả:** Định nghĩa đối tượng **điều phối giao tiếp** giữa các objects, tránh tight coupling.

```typescript
interface ChatRoom {
  sendMessage(message: string, sender: User): void;
  addUser(user: User): void;
}

class ChatRoomMediator implements ChatRoom {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  sendMessage(message: string, sender: User): void {
    this.users
      .filter(user => user !== sender)
      .forEach(user => user.receive(message, sender.name));
  }
}

class User {
  constructor(
    public name: string,
    private chatRoom: ChatRoom
  ) {
    chatRoom.addUser(this);
  }

  send(message: string) {
    this.chatRoom.sendMessage(message, this);
  }

  receive(message: string, from: string) {
    console.log(`${from} → ${this.name}: ${message}`);
  }
}

// Usage
const room = new ChatRoomMediator();
const alice = new User("Alice", room);
const bob = new User("Bob", room);
const charlie = new User("Charlie", room);

alice.send("Hello everyone!");
// Bob ← Alice: Hello everyone!
// Charlie ← Alice: Hello everyone!