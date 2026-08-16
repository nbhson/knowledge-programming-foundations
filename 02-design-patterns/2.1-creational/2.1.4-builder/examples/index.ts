/**
 * 2.1.4 Builder Pattern - Pizza Demo
 *
 * Builder tách quá trình xây dựng object phức tạp (nhiều optional param)
 * khỏi biểu diễn của nó. Fluent API dễ đọc, Product immutable.
 */

class Pizza {
  readonly size: string;
  readonly crust: string;
  readonly cheese: boolean;
  readonly pepperoni: boolean;
  readonly mushrooms: boolean;

  // Constructor private — chỉ tạo qua static create()
  private constructor(builder: PizzaBuilder) {
    this.size = builder.size;
    this.crust = builder.crust;
    this.cheese = builder.cheese;
    this.pepperoni = builder.pepperoni;
    this.mushrooms = builder.mushrooms;
  }

  // Static factory — truy cập được private constructor
  static create(builder: PizzaBuilder): Pizza {
    return new Pizza(builder);
  }

  static get builder(): PizzaBuilder {
    return new PizzaBuilder();
  }

  describe(): string {
    const toppings = [
      this.cheese ? "cheese" : "",
      this.pepperoni ? "pepperoni" : "",
      this.mushrooms ? "mushrooms" : "",
    ].filter(Boolean);

    return `🍕 ${this.size} ${this.crust} crust pizza with ${toppings.join(", ") || "no toppings"}`;
  }
}

class PizzaBuilder {
  size = "medium";
  crust = "classic";
  cheese = false;
  pepperoni = false;
  mushrooms = false;

  setSize(size: string): this {
    this.size = size;
    return this;
  }

  setCrust(crust: string): this {
    this.crust = crust;
    return this;
  }

  addCheese(): this {
    this.cheese = true;
    return this;
  }

  addPepperoni(): this {
    this.pepperoni = true;
    return this;
  }

  addMushrooms(): this {
    this.mushrooms = true;
    return this;
  }

  build(): Pizza {
    return Pizza.create(this);
  }
}

// --- Demo ---
console.log("=== Builder Demo ===");
console.log("");

// Tạo pizza theo từng bước, dễ đọc
const pizza1 = Pizza.builder
  .setSize("large")
  .setCrust("thin")
  .addCheese()
  .addPepperoni()
  .build();

const pizza2 = Pizza.builder
  .setSize("small")
  .addMushrooms()
  .build();

const pizza3 = Pizza.builder.build(); // default

console.log(pizza1.describe());
console.log(pizza2.describe());
console.log(pizza3.describe());
console.log("");

// Product immutable — không thể sửa sau khi build
// pizza1.size = "small"; // ❌ Error: Cannot assign to 'size' because it is a read-only property

console.log("✅ Builder tạo object phức tạp dễ đọc, Product immutable");