/**
 * 16.3 Storybook — mô phỏng khai báo stories (meta, args, controls)
 *
 * Story là DỮ LIỆU: meta + argTypes (controls) + một tập stories với args.
 * Mỗi story render() ra một chuỗi mô tả. KHÔNG có DOM, KHÔNG có framework
 * — chỉ là mô hình dữ liệu trung gian thể hiện ý tưởng CSF của Storybook.
 */

type StorybookControlKind = "text" | "select" | "boolean";

type StorybookArgValue = string | boolean;

interface StorybookArgType {
  control: StorybookControlKind;
  options: string[];
  description: string;
}

type StorybookArgs = Record<string, StorybookArgValue>;

interface StorybookMeta {
  title: string;
  component: string;
  argTypes: Record<string, StorybookArgType>;
}

interface StorybookStoryDefinition {
  name: string;
  args: StorybookArgs;
  render: (args: StorybookArgs) => string;
}

// ─────────────────── "Component" render thuần (không DOM) ───────────────────
function renderButton(args: StorybookArgs): string {
  const variant = String(args.variant ?? "primary");
  const size = String(args.size ?? "md");
  const children = String(args.children ?? "Button");
  const disabled = args.disabled === true;
  const attr = disabled ? " disabled" : "";
  return `<button class="btn btn--${variant} btn--${size}"${attr}>${children}</button>`;
}

// ─────────────────── Storybook catalogue ───────────────────
class StorybookCatalogue {
  private meta: StorybookMeta | null = null;
  private stories: StorybookStoryDefinition[] = [];

  attachMeta(meta: StorybookMeta): void {
    this.meta = meta;
  }

  addStory(story: StorybookStoryDefinition): void {
    this.stories.push(story);
  }

  renderStory(name: string): string {
    const story = this.stories.find((s) => s.name === name);
    if (!story) throw new Error(`Không tìm thấy story "${name}"`);
    return story.render(story.args);
  }

  /** Mô phỏng bảng controls (argTypes) mà Storybook hiển thị */
  printControls(): void {
    if (!this.meta) return;
    console.log("🎛️  Controls panel:");
    for (const [argName, argType] of Object.entries(this.meta.argTypes)) {
      const options = argType.options.length > 0 ? ` [${argType.options.join(", ")}]` : "";
      console.log(`    - ${argName} — ${argType.description} (control: ${argType.control}${options})`);
    }
  }

  printStories(): void {
    console.log("📚 Danh sách stories:");
    this.stories.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`     args: ${JSON.stringify(s.args)}`);
    });
  }

  printRenderedStories(): void {
    console.log("🖥️  Rendered preview (render theo args):");
    this.stories.forEach((s) => {
      console.log(`  • ${s.name}: ${s.render(s.args)}`);
    });
  }

  /** Mô phỏng thao tác control: đổi 1 arg rồi re-render story */
  updateArg(storyName: string, argName: string, value: StorybookArgValue): string {
    const story = this.stories.find((s) => s.name === storyName);
    if (!story) throw new Error(`Không tìm thấy story "${storyName}"`);
    story.args = { ...story.args, [argName]: value };
    return story.render(story.args);
  }
}

// ─────────────────── Khai báo Meta + Stories for Button ───────────────────
const buttonMeta: StorybookMeta = {
  title: "Components/Button",
  component: "Button",
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost"], description: "Kiểu nút" },
    size: { control: "select", options: ["sm", "md", "lg"], description: "Kích thước nút" },
    disabled: { control: "boolean", options: [], description: "Vô hiệu hóa nút" },
    children: { control: "text", options: [], description: "Nội dung nút" },
  },
};

// ───────────────────────────────── Demo ─────────────────────────────────
console.log("=== Storybook Demo ===");
console.log("");

const catalogue = new StorybookCatalogue();
catalogue.attachMeta(buttonMeta);

catalogue.addStory({
  name: "Primary",
  args: { variant: "primary", size: "md", disabled: false, children: "Đăng nhập" },
  render: renderButton,
});
catalogue.addStory({
  name: "Secondary",
  args: { variant: "secondary", size: "md", disabled: false, children: "Hủy" },
  render: renderButton,
});
catalogue.addStory({
  name: "GhostLoading",
  args: { variant: "ghost", size: "md", disabled: true, children: "Đang tải…" },
  render: renderButton,
});
catalogue.addStory({
  name: "LargeDisabled",
  args: { variant: "primary", size: "lg", disabled: true, children: "Không khả dụng" },
  render: renderButton,
});

console.log("1️⃣ Meta + argTypes (controls):");
console.log(`   title: ${buttonMeta.title}`);
catalogue.printControls();
console.log("");

console.log("2️⃣ Danh sách stories (dữ liệu):");
catalogue.printStories();
console.log("");

console.log("3️⃣ Render preview:");
catalogue.printRenderedStories();
console.log("");

console.log("4️⃣ Mô phỏng thao tác controls (thay đổi args → re-render ngay):");
console.log(`   Đổi Primary.children → "Đăng nhập bằng Google":`);
console.log(`   Result: ${catalogue.updateArg("Primary", "children", "Đăng nhập bằng Google")}`);
console.log(`   Đổi Primary.size → "sm":`);
console.log(`   Result: ${catalogue.updateArg("Primary", "size", "sm")}`);

console.log("");
console.log("✅ Storybook: khai báo meta/argTypes/stories như dữ liệu, controls thay đổi args → re-render");
export {};