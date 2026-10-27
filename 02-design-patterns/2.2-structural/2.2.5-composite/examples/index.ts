/**
 * 🌳 Composite Pattern — File System Demo
 * File (leaf) và Folder (composite) cùng interface — client không phân biệt.
 */

interface FileSystemItem {
  show(indent: string): void;
}

class File implements FileSystemItem {
  constructor(private name: string) {}
  show(indent: string): void {
    console.log(`${indent}📄 ${this.name}`);
  }
}

class Folder implements FileSystemItem {
  private children: FileSystemItem[] = [];

  constructor(private name: string) {}

  add(item: FileSystemItem): void {
    this.children.push(item);
  }

  show(indent: string): void {
    console.log(`${indent}📁 ${this.name}/`);
    for (const child of this.children) {
      child.show(indent + '  ');
    }
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🌳 COMPOSITE PATTERN DEMO              ║');
  console.log('╚══════════════════════════════════════════╝');

  // Xây cây: src/index.ts, src/utils/helpers.ts, src/utils/config.ts
  const src = new Folder('src');
  const utils = new Folder('utils');
  utils.add(new File('helpers.ts'));
  utils.add(new File('config.ts'));
  src.add(new File('index.ts'));
  src.add(utils);

  console.log('\n📂 Cây thư mục:');
  src.show('');

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ File và Folder cùng interface');
  console.log('  ✅ Client gọi show() — không cần phân biệt leaf/composite');
  console.log('  ✅ Folder tự đệ quy gọi con của nó');
}

main();

export {};