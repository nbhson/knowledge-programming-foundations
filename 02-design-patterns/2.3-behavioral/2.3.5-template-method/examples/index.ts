/**
 * 📋 Template Method Pattern — Data Import Demo
 * Khung quy trình giống nhau, sub-class điền bước chi tiết.
 */

abstract class DataImporter {
  // 🏗️ Template method — khung cố định, không đổi
  importFile(path: string): void {
    console.log('┌─ BẮT ĐẦU IMPORT ─┐');
    const data = this.readData(path);       // bước chung
    const parsed = this.parseData(data);    // bước riêng (abstract)
    const cleaned = this.validateAndClean(parsed); // bước riêng
    console.log(`  ✅ Import xong: ${cleaned.length} records`);
    console.log('└────────────────────┘');
  }

  protected readData(path: string): string {
    console.log(`  📖 Đọc file: ${path}`);
    return 'raw';
  }

  protected abstract parseData(raw: string): string[];
  protected abstract validateAndClean(data: string[]): string[];
}

class CsvImporter extends DataImporter {
  protected parseData(raw: string): string[] {
    console.log('  🧩 Parse CSV → tách theo dấu phẩy');
    return ['a', 'b'];
  }
  protected validateAndClean(data: string[]): string[] {
    console.log('  🧹 Validate CSV: bỏ dòng trống');
    return data.filter((d) => d.trim() !== '');
  }
}

class JsonImporter extends DataImporter {
  protected parseData(raw: string): string[] {
    console.log('  🧩 Parse JSON → JSON.parse');
    return ['x', 'y', 'z'];
  }
  protected validateAndClean(data: string[]): string[] {
    console.log('  🧹 Validate JSON: kiểm tra schema');
    return data;
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   📋 TEMPLATE METHOD PATTERN DEMO        ║');
  console.log('╚══════════════════════════════════════════╝');

  console.log('\n1️⃣ Import CSV:');
  new CsvImporter().importFile('data.csv');

  console.log('\n2️⃣ Import JSON:');
  new JsonImporter().importFile('data.json');

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Khung quy trình giống nhau — chỉ khác bước parse/validate');
  console.log('  ✅ Thêm định dạng mới → thêm class, không sửa khung');
  console.log('  ✅ Chống duplicate code');
}

main();

export {};