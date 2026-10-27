/**
 * 🕵️ Proxy Pattern — Video Streaming Demo
 * Lazy load + caching qua Proxy, client không biết.
 */

interface Video {
  play(): void;
}

class YouTubeVideo implements Video {
  constructor(private id: string) {
    console.log(`⬇️ Downloading video ${id}... (tốn băng thông)`);
  }
  play(): void {
    console.log(`▶️ Playing ${this.id}...`);
  }
}

class VideoProxy implements Video {
  private realVideo: YouTubeVideo | null = null;

  constructor(private id: string) {}

  play(): void {
    if (!this.realVideo) {
      this.realVideo = new YouTubeVideo(this.id);
    }
    this.realVideo.play();
  }
}

function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🕵️ PROXY PATTERN DEMO                  ║');
  console.log('╚══════════════════════════════════════════╝');

  console.log('\n1️⃣ Tạo proxy — chưa tải gì cả (lazy):');
  const video: Video = new VideoProxy('abc123');

  console.log('\n2️⃣ Play lần 1 — tải + phát:');
  video.play();

  console.log('\n3️⃣ Play lần 2 — không tải lại (cache):');
  video.play();

  console.log('\n📝 KẾT LUẬN:');
  console.log('  ✅ Chỉ tải khi thực sự cần (lazy)');
  console.log('  ✅ Lần sau không tải lại (cache)');
  console.log('  ✅ Client không biết mình đang dùng proxy');
}

main();

export {};