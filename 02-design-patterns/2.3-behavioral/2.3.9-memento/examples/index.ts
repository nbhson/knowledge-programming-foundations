/**
 * 🕰️ Memento Pattern — Editor History (Undo) Demo
 * Originator (Editor) tự chụp/khôi phục snapshot;
 * Caretaker (History) chỉ giữ hộ, không đọc nội dung bên trong.
 * Chạy: npx ts-node examples/index.ts
 */

// ❌ BAD — sửa trực tiếp, không snapshot: mất lịch sử, không undo được
class EditorBad {
  content = '';

  write(text: string): void {
    this.content = text; // ghi đè — bản cũ mất vĩnh viễn
  }
}

// ✅ GOOD — Memento: snapshot bất biến, opaque với Caretaker
class EditorMemento {
  constructor(
    readonly content: string,
    readonly timestamp: Date,
  ) {}
}

// ✅ GOOD — Originator: chỉ nó hiểu và khôi phục được state của mình
class Editor {
  private content = '';

  write(text: string): void {
    this.content = text;
  }

  read(): string {
    return this.content;
  }

  save(): EditorMemento {
    return new EditorMemento(this.content, new Date());
  }

  restore(m: EditorMemento): void {
    this.content = m.content;
  }
}

// ✅ GOOD — Caretaker: kho giữ hộ, không đọc/sửa snapshot
class History {
  private stack: EditorMemento[] = [];

  push(m: EditorMemento): void {
    this.stack.push(m);
  }

  undo(): EditorMemento | null {
    return this.stack.pop() ?? null;
  }

  size(): number {
    return this.stack.length;
  }
}

function restoreOrWarn(editor: Editor, history: History): void {
  const prev = history.undo();
  if (prev) {
    editor.restore(prev);
    console.log(`   ↩️ Undo → "${editor.read()}"`);
  } else {
    console.log('   ⚠️ Hết lịch sử, không undo được');
  }
}

function main(): void {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🕰️ MEMENTO PATTERN DEMO               ║');
  console.log('╚══════════════════════════════════════════╝');

  console.log('\n❌ BAD — không snapshot, sửa sai là mất:');
  const bad = new EditorBad();
  bad.write('bản thảo v1');
  bad.write('bản lỗi v2 (ghi đè!)');
  console.log(`   content = "${bad.content}" (v1 mất vĩnh viễn, không undo được)`);

  console.log('\n✅ GOOD — snapshot trước mỗi lần sửa, undo khi cần:');
  const editor = new Editor();
  const history = new History();

  editor.write('bản thảo v1');
  history.push(editor.save());
  console.log(`   ✍️ Viết: "${editor.read()}" (đã snapshot, stack=${history.size()})`);

  editor.write('bản thảo v2');
  history.push(editor.save());
  console.log(`   ✍️ Viết: "${editor.read()}" (đã snapshot, stack=${history.size()})`);

  editor.write('bản LỖI v3!!!');
  console.log(`   ✍️ Viết: "${editor.read()}" (chưa snapshot — sai!)`);

  console.log('\n↩️ Undo 2 lần:');
  restoreOrWarn(editor, history);
  restoreOrWarn(editor, history);

  console.log('\n↩️ Undo khi hết lịch sử:');
  restoreOrWarn(editor, history);

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ BAD:  ghi đè trực tiếp — mất dữ liệu, không undo');
  console.log('  ✅ GOOD: save() trước khi sửa → undo() khôi phục đúng bản cũ');
  console.log('  ✅ History không đọc nội dung snapshot — encapsulation nguyên vẹn');
}

main();

export {};
