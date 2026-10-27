/**
 * 2.1.3 Abstract Factory Pattern - UI Theme Demo
 *
 * Abstract Factory tạo cả gia đình UI components đồng bộ theo theme.
 * Client chỉ biết UIFactory, không biết class cụ thể.
 */

// --- Abstract Products ---
interface Button {
  render(): void;
}

interface Input {
  render(): void;
}

// --- Concrete Products: Dark theme ---
class DarkButton implements Button {
  render(): void {
    console.log("🌙 [Dark] Button rendered");
  }
}

class DarkInput implements Input {
  render(): void {
    console.log("🌙 [Dark] Input rendered");
  }
}

// --- Concrete Products: Light theme ---
class LightButton implements Button {
  render(): void {
    console.log("☀️ [Light] Button rendered");
  }
}

class LightInput implements Input {
  render(): void {
    console.log("☀️ [Light] Input rendered");
  }
}

// --- Abstract Factory ---
interface UIFactory {
  createButton(): Button;
  createInput(): Input;
}

// --- Concrete Factories ---
class DarkThemeFactory implements UIFactory {
  createButton(): Button {
    return new DarkButton();
  }
  createInput(): Input {
    return new DarkInput();
  }
}

class LightThemeFactory implements UIFactory {
  createButton(): Button {
    return new LightButton();
  }
  createInput(): Input {
    return new LightInput();
  }
}

// --- Client: chỉ biết UIFactory ---
function renderUI(factory: UIFactory): void {
  const button = factory.createButton();
  const input = factory.createInput();
  button.render();
  input.render();
}

// --- Demo ---
console.log("=== Abstract Factory Demo ===");
console.log("");

console.log("Dark theme:");
renderUI(new DarkThemeFactory());
console.log("");

console.log("Light theme:");
renderUI(new LightThemeFactory());
console.log("");

// Thêm theme mới (e.g. BlueThemeFactory) không cần sửa client code
console.log("✅ Thêm theme mới không sửa code client (Open/Closed)");