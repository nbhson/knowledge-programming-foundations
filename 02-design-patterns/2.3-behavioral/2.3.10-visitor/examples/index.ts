/**
 * 🧳 Visitor Pattern — Document Export Demo
 * Element (Paragraph/Image) chỉ biết accept(visitor);
 * operation export nằm trong Visitor, thêm định dạng mới không sửa element.
 * Chạy: npx ts-node examples/index.ts
 */

// --- Shared element types (dùng cho cả BAD lẫn GOOD) ---

class Paragraph {
  constructor(readonly text: string) {}
}

class Image {
  constructor(readonly src: string) {}
}

type DocElement = Paragraph | Image;

// ❌ BAD — operation nằm rải rác + instanceof trong client
function exportHtmlBad(el: DocElement): string {
  if (el instanceof Paragraph) {
    return `<p>${el.text}</p>`;
  }
  return `<img src="${el.src}" />`; // thêm định dạng/element mới → sửa hàm này + mọi hàm tương tự
}

function exportMarkdownBad(el: DocElement): string {
  if (el instanceof Paragraph) {
    return `${el.text}\n`;
  }
  return `![](${el.src})`;
}

// ✅ GOOD — Visitor: 1 method cho mỗi loại element
interface Visitor {
  visitParagraph(p: Paragraph): string;
  visitImage(i: Image): string;
}

// ✅ GOOD — Element mở rộng khả năng accept, không chứa logic export
interface Element {
  accept(visitor: Visitor): string;
}

class ParagraphEl implements Element {
  constructor(readonly text: string) {}

  accept(visitor: Visitor): string {
    return visitor.visitParagraph(this); // double dispatch
  }
}

class ImageEl implements Element {
  constructor(readonly src: string) {}

  accept(visitor: Visitor): string {
    return visitor.visitImage(this);
  }
}

// ✅ GOOD — Operation 1: export HTML
class HtmlExportVisitor implements Visitor {
  visitParagraph(p: ParagraphEl): string {
    return `<p>${p.text}</p>`;
  }

  visitImage(i: ImageEl): string {
    return `<img src="${i.src}" />`;
  }
}

// ✅ GOOD — Operation 2: export Markdown (thêm mới, KHÔNG sửa element)
class MarkdownExportVisitor implements Visitor {
  visitParagraph(p: ParagraphEl): string {
    return `${p.text}\n`;
  }

  visitImage(i: ImageEl): string {
    return `![](${i.src})`;
  }
}

function main(): void {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🧳 VISITOR PATTERN DEMO               ║');
  console.log('╚══════════════════════════════════════════╝');

  const badDoc: DocElement[] = [new Paragraph('Hello'), new Image('a.png')];

  console.log('\n❌ BAD — instanceof rải rác trong từng hàm export:');
  console.log('   HTML:', badDoc.map(exportHtmlBad));
  console.log('   MD:  ', badDoc.map(exportMarkdownBad));
  console.log('   ➕ Thêm export PDF = sửa/thêm hàm + instanceof mới cho mọi loại');

  const goodDoc: Element[] = [new ParagraphEl('Hello'), new ImageEl('a.png')];

  console.log('\n✅ GOOD — mỗi operation là 1 visitor, element không đổi:');
  console.log('   HTML:', goodDoc.map((el) => el.accept(new HtmlExportVisitor())));
  console.log('   MD:  ', goodDoc.map((el) => el.accept(new MarkdownExportVisitor())));

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ BAD:  operation trong client + instanceof — thêm format phải đụng mọi chỗ');
  console.log('  ✅ GOOD: thêm định dạng mới = thêm 1 Visitor class, element giữ nguyên');
  console.log('  ✅ Double dispatch (accept → visitX) chọn đúng handler theo kiểu runtime');
}

main();

export {};
