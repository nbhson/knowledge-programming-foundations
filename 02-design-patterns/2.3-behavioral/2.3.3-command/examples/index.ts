/**
 * 🔘 Command Pattern — Text Editor Undo/Redo Demo
 * Hành động đóng gói thành object → lưu lịch sử, undo/redo dễ dàng.
 */

interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  private text = '';

  write(text: string): void {
    this.text += text;
  }

  deleteLast(n: number): void {
    this.text = this.text.slice(0, -n);
  }

  getText(): string {
    return this.text;
  }
}

class WriteCommand implements Command {
  constructor(
    private editor: TextEditor,
    private text: string,
  ) {}

  execute(): void {
    this.editor.write(this.text);
  }

  undo(): void {
    this.editor.deleteLast(this.text.length);
  }
}

class History {
  private commands: Command[] = [];
  private index = -1;

  execute(cmd: Command): void {
    cmd.execute();
    this.commands = this.commands.slice(0, this.index + 1);
    this.commands.push(cmd);
    this.index++;
  }

  undo(): void {
    if (this.index < 0) return;
    this.commands[this.index].undo();
    this.index--;
  }

  redo(): void {
    if (this.index >= this.commands.length - 1) return;
    this.index++;
    this.commands[this.index].execute();
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🔘 COMMAND PATTERN DEMO                ║');
  console.log('╚══════════════════════════════════════════╝');

  const editor = new TextEditor();
  const history = new History();

  console.log('\n1️⃣ Gõ "Hello " rồi "World!":');
  history.execute(new WriteCommand(editor, 'Hello '));
  history.execute(new WriteCommand(editor, 'World!'));
  console.log(`   Text: "${editor.getText()}"`);

  console.log('\n2️⃣ Undo (xóa "World!"):');
  history.undo();
  console.log(`   Text: "${editor.getText()}"`);

  console.log('\n3️⃣ Undo (xóa "Hello "):');
  history.undo();
  console.log(`   Text: "${editor.getText()}"`);

  console.log('\n4️⃣ Redo (gõ lại "Hello "):');
  history.redo();
  console.log(`   Text: "${editor.getText()}"`);

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Hành động = object → lưu lịch sử, undo/redo');
  console.log('  ✅ Tách nơi gọi (History) và nơi thực thi (Editor)');
  console.log('  ✅ Dễ thêm command mới (copy, paste...)');
}

main();

export {};