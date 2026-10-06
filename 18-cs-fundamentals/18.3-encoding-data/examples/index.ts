/**
 * 18.3 Encoding Data — UTF-8 encode/decode thủ công, base64/hex thuần TS,
 * endianness với DataView + demo mojibake. Không dùng Buffer (thuần ES2020).
 */

export {};

const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** UTF-8 encode 1 code point (phạm vi demo: U+0000..U+07FF + ASCII) */
function utf8EncodeChar(codePoint: number): number[] {
  if (codePoint < 0x80) return [codePoint];
  if (codePoint < 0x800) {
    return [0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f)];
  }
  throw new Error(`Ngoài phạm vi demo: U+${codePoint.toString(16)}`);
}

function utf8DecodeChar(bytes: number[]): { codePoint: number; size: number } {
  if (bytes[0] < 0x80) return { codePoint: bytes[0], size: 1 };
  if ((bytes[0] & 0xe0) === 0xc0) {
    return { codePoint: ((bytes[0] & 0x1f) << 6) | (bytes[1] & 0x3f), size: 2 };
  }
  throw new Error("Byte sequence không hỗ trợ trong demo");
}

function utf8EncodeString(s: string): number[] {
  const out: number[] = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0) as number;
    if (cp > 0x7ff) throw new Error(`Ký tự ngoài phạm vi demo: ${ch}`);
    out.push(...utf8EncodeChar(cp));
  }
  return out;
}

/** Base64 encode thuần TS cho mảng byte */
function base64Encode(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triple = (b0 << 16) | (b1 << 8) | b2;
    out += B64_ALPHABET[(triple >> 18) & 0x3f];
    out += B64_ALPHABET[(triple >> 12) & 0x3f];
    out += i + 1 < bytes.length ? B64_ALPHABET[(triple >> 6) & 0x3f] : "=";
    out += i + 2 < bytes.length ? B64_ALPHABET[triple & 0x3f] : "=";
  }
  return out;
}

/** Base64 decode thuần TS → mảng byte */
function base64Decode(input: string): number[] {
  const clean = input.replace(/=+$/, "");
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64_ALPHABET.indexOf(clean[i]);
    const c1 = B64_ALPHABET.indexOf(clean[i + 1]);
    const c2 = i + 2 < clean.length ? B64_ALPHABET.indexOf(clean[i + 2]) : 0;
    const c3 = i + 3 < clean.length ? B64_ALPHABET.indexOf(clean[i + 3]) : 0;
    const triple = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    out.push((triple >> 16) & 0xff);
    if (i + 2 < clean.length) out.push((triple >> 8) & 0xff);
    if (i + 3 < clean.length) out.push(triple & 0xff);
  }
  return out;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    out.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return out;
}

/** Cùng 4 byte, đọc big-endian vs little-endian ra 2 số khác nhau */
function endianDemo(): { be: number; le: number } {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setUint8(0, 0x01);
  view.setUint8(1, 0x02);
  view.setUint8(2, 0x03);
  view.setUint8(3, 0x04);
  return { be: view.getUint32(0, false), le: view.getUint32(0, true) };
}

function main(): void {
  console.log("=== 18.3 Encoding Data Demo ===");
  console.log("");

  console.log("1. UTF-8: 'é' (U+00E9) tốn 2 byte:");
  const eBytes = utf8EncodeChar(0xe9);
  console.log(`   encode → [${eBytes.map((b) => "0x" + b.toString(16).toUpperCase()).join(", ")}]`);
  const decoded = utf8DecodeChar(eBytes);
  console.log(`   decode → U+${decoded.codePoint.toString(16).toUpperCase()} ('${String.fromCodePoint(decoded.codePoint)}')`);
  console.log(`   'A' ASCII chỉ 1 byte: [${utf8EncodeChar(0x41).join(", ")}]`);
  console.log("");

  console.log("2. Mojibake: byte UTF-8 của 'é' mà đọc nhầm kiểu Latin-1 → 'Ã©':");
  console.log(`   bytes [0xC3, 0xA9] đọc từng byte thành ký tự Latin-1: '${String.fromCharCode(0xc3)}${String.fromCharCode(0xa9)}'`);
  console.log("");

  console.log("3. Base64 round-trip:");
  const raw = utf8EncodeString("Hi!");
  const b64 = base64Encode(raw);
  const back = base64Decode(b64);
  console.log(`   "Hi!" → bytes [${raw.join(", ")}] → base64 "${b64}" → decode [${back.join(", ")}]`);
  console.log("");

  console.log("4. Hex round-trip:");
  const hex = bytesToHex([222, 173, 190, 239]);
  console.log(`   [222,173,190,239] → hex "${hex}" → bytes [${hexToBytes(hex).join(", ")}]`);
  console.log("");

  const { be, le } = endianDemo();
  console.log("5. Endianness (bytes 01 02 03 04):");
  console.log(`   big-endian: ${be} (0x${be.toString(16)}) | little-endian: ${le} (0x${le.toString(16)})`);
  console.log("");
  console.log("✅ UTF-8, base64, hex, endianness hoạt động (thuần ES2020)");
}

main();
