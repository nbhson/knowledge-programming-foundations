/**
 * 🔁 Iterator Pattern — Playlist Demo
 * Duyệt collection nhiều cách, không lộ cấu trúc bên trong.
 */

interface Iterator<T> {
  hasNext(): boolean;
  next(): T;
}

class Playlist {
  constructor(private songs: string[]) {}

  // Trả về iterator — client không biết cấu trúc bên trong
  createIterator(): Iterator<string> {
    return new SequentialIterator(this.songs);
  }

  createReverseIterator(): Iterator<string> {
    return new ReverseIterator(this.songs);
  }
}

class SequentialIterator implements Iterator<string> {
  private index = 0;
  constructor(private songs: string[]) {}

  hasNext(): boolean {
    return this.index < this.songs.length;
  }

  next(): string {
    return this.songs[this.index++];
  }
}

class ReverseIterator implements Iterator<string> {
  private index: number;
  constructor(private songs: string[]) {
    this.index = this.songs.length - 1;
  }

  hasNext(): boolean {
    return this.index >= 0;
  }

  next(): string {
    return this.songs[this.index--];
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🔁 ITERATOR PATTERN DEMO               ║');
  console.log('╚══════════════════════════════════════════╝');

  const playlist = new Playlist(['🎵 Song A', '🎵 Song B', '🎵 Song C']);

  console.log('\n1️⃣ Duyệt xuôi:');
  const it = playlist.createIterator();
  while (it.hasNext()) {
    console.log(`   ${it.next()}`);
  }

  console.log('\n2️⃣ Duyệt ngược:');
  const rev = playlist.createReverseIterator();
  while (rev.hasNext()) {
    console.log(`   ${rev.next()}`);
  }

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Client duyệt mà không biết cấu trúc (array, list, tree...)');
  console.log('  ✅ Thêm cách duyệt mới → thêm iterator, không sửa Playlist');
  console.log('  ✅ JS có sẵn: for...of, [Symbol.iterator]');
}

main();

export {};