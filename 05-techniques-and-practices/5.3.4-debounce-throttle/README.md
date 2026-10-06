# 🔬 5.3.4 Debounce & Throttle

> **Debounce** (chống dội) và **Throttle** (tiết lưu) là hai kỹ thuật kiểm soát tần suất thực thi hàm, ngăn việc kích hoạt quá mức khi xử lý sự kiện (event handling).

```
❌ VẤN ĐỀ: Sự kiện kích hoạt quá mức
Ô tìm kiếm: mỗi lần nhấn một phím đều gọi API → server quá tải
Thanh cuộn: mỗi mili-giây đều kích hoạt tính toán → trang bị giật lag
Chuột di chuyển: mỗi giây kích hoạt hàng trăm lần → lãng phí tài nguyên

✅ GIẢI PHÁP: Kiểm soát tần suất thực thi
Debounce: đợi người dùng dừng thao tác rồi thực thi một lần
Throttle: giới hạn trong một đơn vị thời gian chỉ thực thi tối đa một lần
```

---

## 🎯 Vấn Đề

Việc kích hoạt sự kiện tần suất cao mà không kiểm soát:

- **API bị gọi tràn lan**: ô tìm kiếm mỗi lần nhập một ký tự lại gửi request, server sập
- **Hiệu năng giật lag**: các sự kiện tần suất cao như cuộn trang (scroll), đổi kích thước cửa sổ (resize) làm trang đơ
- **Lãng phí tài nguyên**: hàng loạt phép tính và request vô nghĩa
- **Trải nghiệm người dùng kém**: phản hồi chậm, thao tác không mượt

---

## 💻 Code ví dụ

Xem đầy đủ: [`examples/index.ts`](examples/index.ts)

```typescript
// ─────────────────────────────────────────────
// ❌ BAD: 没有防抖和节流
// ─────────────────────────────────────────────
window.addEventListener('scroll', () => {
  // 每滚动一像素都执行 → 性能灾难
  updateScrollIndicator();
});

document.querySelector('.search-box').addEventListener('input', (e) => {
  // 每个字符都请求 → API预算耗尽
  fetchSearchResults((e.target as HTMLInputElement).value);
});

// ─────────────────────────────────────────────
// ✅ GOOD: Debounce 防抖
// ─────────────────────────────────────────────
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const search = debounce((query: string) => {
  fetch(`/api/search?q=${query}`).then(console.log);
}, 300); // 停止输入300ms后才执行

document.querySelector('.search-box').addEventListener('input', (e) => {
  search((e.target as HTMLInputElement).value);
});

// ─────────────────────────────────────────────
// ✅ GOOD: Throttle 节流
// ─────────────────────────────────────────────
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
}

window.addEventListener('scroll', throttle(() => {
  updateScrollIndicator();
}, 100)); // 每100ms最多执行一次

// ─────────────────────────────────────────────
// ✅ GOOD: 两者对比
// ─────────────────────────────────────────────
// Debounce - 每次动作结束后执行
// 适用场景: 搜索框、窗口resize、表单验证

// Throttle - 动作期间定期执行
// 适用场景: 滚动监听、鼠标移动、游戏循环
```

---

## ✅ Lợi Ích

| Lợi ích | Giải thích |
|---------|------------|
| ⚡ **Nâng cao hiệu năng** | Giảm các lần gọi hàm không cần thiết |
| 💰 **Tiết kiệm tài nguyên** | Giảm áp lực server và mức tiêu thụ CPU |
| 🎯 **Kích hoạt chính xác** | Debounce đảm bảo chỉ thực thi vào thời điểm then chốt |
| 📊 **Đầu ra ổn định** | Throttle mang lại tần suất thực thi đều đặn |

---

## ⚠️ Lưu Ý

| Vấn đề | Cách tránh |
|--------|------------|
| **Debounce gây cảm giác trễ** | Đặt thời gian chờ (delay) hợp lý |
| **Throttle bỏ sót khung hình quan trọng** | Điều chỉnh khoảng thời gian (interval) theo nhu cầu |
| **Lần thực thi không thể hủy** | Cung cấp phương thức cancel |
| **Mất ngữ cảnh (context)** | Dùng arrow function hoặc bind |

---

## 🎯 Khi nào dùng?

| Tình huống | Khuyến nghị |
|------------|-------------|
| Nhập liệu ô tìm kiếm | ✅ Debounce |
| Validate form theo thời gian thực | ✅ Debounce |
| Lắng nghe sự kiện cuộn trang | ✅ Throttle |
| Resize cửa sổ | ✅ Debounce |
| Theo dõi di chuyển chuột | ✅ Throttle |
| Chống nhấn nút trùng lặp | ✅ Debounce |

---

## 🔗 Liên quan

- **5.3.3 Memoization** — Bộ nhớ đệm (cache) kết quả tính toán
- **5.3.2 Lazy Loading** — Tải tài nguyên khi cần (theo nhu cầu)
- **5.3.5 Tree Shaking** — Tối ưu kích thước gói build (bundle)

---

## 📚 Tài liệu tham khảo

- 📖 [Underscore.js - Debounce/Throttle](http://underscorejs.org/#throttle)
- 📖 [MDN - Throttle Pattern](https://developer.mozilla.org/en-US/docs/Glossary/Throttling)
- 📖 [Event Throttling in Action](https://css-tricks.com/debouncing-throttling-explained-examples/)

---

## ⏭️ Bài tiếp theo

→ [5.3.5 Tree Shaking](../5.3.5-tree-shaking/README.md)
