# 🔷 16.5 Design Tokens Deep Dive (Nâng Cao)

> Bài **nâng cao** nối tiếp [16.1 Tokens](../16.1-tokens/README.md).
> 16.1 dừng ở **khái niệm + phân loại cơ bản** (token là gì, 3 tầng, đặt tên semantic, dùng trong CSS/TS).
> Bài này đi sâu 4 chủ đề **vận hành tokens ở quy mô production**:
> **chuẩn W3C DTCG**, **multi-brand theming**, **versioning/migration**, và **tooling Style Dictionary**.

---

## 🧭 16.1 vs 16.5 — Học gì ở đâu?

| Chủ đề | 16.1 (Cơ bản) | 16.5 (Nâng cao — bài này) |
|--------|---------------|---------------------------|
| Token là gì, 3 tầng Foundation → Component → Theme | ✅ | — (xem lại 16.1) |
| Đặt tên semantic, dùng token trong CSS/TS | ✅ | — (xem lại 16.1) |
| Chuẩn file **W3C DTCG** (`$value`, `$type`, alias `{...}`) | — | ✅ Mục 1 |
| **Multi-brand theming** (nhiều brand × light/dark × density) | light/dark đơn giản | ✅ Mục 2 |
| **Versioning/migration** (semver, deprecate, rename, codemod) | — | ✅ Mục 3 |
| **Style Dictionary** pipeline + validate tokens bằng CI | giới thiệu tên tool | ✅ Mục 4 |

> 💡 **Quy tắc đọc:** Chưa rõ token là gì → đọc **16.1** trước.
> Đã dùng tokens và cần scale cho nhiều brand/platform → đọc tiếp bài này.

---

## 1️⃣ Chuẩn W3C DTCG — Viết token để tool nào cũng đọc được

W3C Design Tokens Community Group (DTCG) định nghĩa format trao đổi chuẩn:
mỗi token có **`$value`** (giá trị), **`$type`** (loại), **`$description`** (mô tả),
và **alias** viết dạng `{group.name}` để tham chiếu token khác.

```json
{
  "color": {
    "primary": {
      "$value": "#3B82F6",
      "$type": "color",
      "$description": "Màu brand chính — đổi ở đây, toàn hệ thống đổi theo"
    },
    "surface": {
      "$value": "#FFFFFF",
      "$type": "color"
    }
  },
  "spacing": {
    "md": { "$value": "16", "$type": "dimension" }
  },
  "button": {
    "background": {
      "$value": "{color.primary}",
      "$type": "color",
      "$description": "Alias — component token trỏ về foundation token"
    },
    "padding": {
      "$value": "{spacing.md}",
      "$type": "dimension"
    }
  }
}
```

**Điểm then chốt của DTCG so với JSON "tự chế" ở 16.1:**

| Điểm | JSON tự chế (16.1) | W3C DTCG (bài này) |
|------|-------------------|--------------------|
| Key giá trị | `value` | **`$value`** (dấu `$` = key chuẩn, tool tự nhận biết) |
| Loại token | ngầm hiểu | **`$type`** khai báo tường minh (`color`, `dimension`, `fontFamily`...) |
| Tham chiếu | `var(--x)` (cú pháp CSS) | **`{color.primary}`** (trung lập platform — iOS/Android/CSS đều resolve được) |
| Tương thích tool | thủ công | Tokens Studio, Style Dictionary đọc/ghi trực tiếp |

> 💡 Alias `{...}` là **trung lập platform**: cùng 1 file DTCG có thể sinh ra
> CSS `var(--color-primary)`, Swift `Color.primary`, Android `@color/primary`.

---

## 2️⃣ Multi-brand Theming — 1 codebase, nhiều thương hiệu

Khi có nhiều brand (ví dụ: Brand A xanh, Brand B đỏ) × nhiều mode (light/dark) × mật độ (compact/comfortable),
cách tổ chức là **tách lớp**: token **options** (giá trị thô) → token **decisions** (quyết định ngữ nghĩa theo brand/mode).

```
┌──────────────────────────────────────────────────────────────┐
│ OPTIONS (giá trị thô, không gắn brand nào)                   │
│   blue.500 = #3B82F6   red.500 = #EF4444   space.4 = 16px    │
├──────────────────────────────────────────────────────────────┤
│ DECISIONS — Brand A                                          │
│   color.primary = {blue.500}   (light)                       │
│   color.primary = {blue.300}   (dark — sáng hơn trên nền tối) │
├──────────────────────────────────────────────────────────────┤
│ DECISIONS — Brand B                                          │
│   color.primary = {red.500}    (light)                       │
│   color.primary = {red.400}    (dark)                         │
├──────────────────────────────────────────────────────────────┤
│ COMPONENT (chỉ trỏ decisions — không biết brand nào)         │
│   button.background = {color.primary}                        │
└──────────────────────────────────────────────────────────────┘
```

```json
{
  "brand": {
    "A": {
      "color": {
        "primary": {
          "$value": "{blue.500}",
          "$type": "color",
          "$extensions": { "mode": { "light": "{blue.500}", "dark": "{blue.300}" } }
        }
      }
    },
    "B": {
      "color": {
        "primary": {
          "$value": "{red.500}",
          "$type": "color",
          "$extensions": { "mode": { "light": "{red.500}", "dark": "{red.400}" } }
        }
      }
    }
  }
}
```

**Nguyên tắc multi-brand:**

- Component **không bao giờ** trỏ thẳng options (`blue.500`) — luôn qua decisions (`color.primary).
  Đổi brand = đổi lớp decisions, component giữ nguyên.
- Foundation options **bất biến** giữa các mode; chỉ decisions đổi theo mode (kế thừa ý từ 16.1, mở rộng lên nhiều brand).
- Mỗi cặp brand × mode sinh 1 bộ CSS variables riêng (ví dụ: `[data-brand="B"][data-theme="dark"]`).

---

## 3️⃣ Versioning & Migration — Tokens cũng là API, đổi là phải có lộ trình

Tokens được hàng chục app dùng → **đổi tên/xóa token = breaking change** như đổi public API.
Quản lý bằng version + deprecation + bản đồ rename (rename map) + codemod.

```
VÒNG ĐỜI TOKEN
┌──────────┐    ┌──────────┐    ┌────────────┐    ┌──────────┐
│ Thêm mới │ →  │ Đánh dấu │ →  │ Xóa ở bản  │ →  │ Ghi vào  │
│ (minor)  │    │ deprecated│    │ major tiếp │    │ CHANGELOG│
│          │    │ (vẫn chạy,│    │ theo       │    │ + codemod│
│          │    │ log warn) │    │ rename map │    │          │
└──────────┘    └──────────┘    └────────────┘    └──────────┘
```

| Thay đổi | Semver | Cách làm |
|----------|--------|----------|
| Thêm token mới | **minor** | Thêm vào file DTCG, sinh output, thông báo cho các team |
| Đổi **giá trị** token (ví dụ: `#3B82F6` → `#2563EB`) | **minor/patch** + audit impact | Grep mọi usage, chụp visual regression (Chromatic) trước khi merge |
| Đổi **tên** token | **major** + rename map | Giữ tên cũ 1 bản với `deprecated: true`, song song tên mới |
| Xóa token | **major** | Chỉ xóa sau khi rename map + codemod đã chạy hết, CI báo 0 usage |

**Ví dụ rename map + deprecated (DTCG `$extensions`):**

```json
{
  "color": {
    "primary": {
      "$value": "#3B82F6",
      "$type": "color"
    },
    "brand-blue": {
      "$value": "{color.primary}",
      "$type": "color",
      "$extensions": {
        "deprecated": true,
        "deprecatedMessage": "Dùng color.primary thay thế — sẽ xóa ở v3.0.0"
      }
    }
  },
  "$extensions": {
    "renameMap": {
      "color.brand-blue": "color.primary"
    }
  }
}
```

**Codemod mẫu** (quét codebase, thay tên token cũ → mới trước khi xóa):

```bash
# 1. Tìm mọi usage còn sót của token cũ — phải về 0 mới được xóa
rg "brand-blue|--color-brand-blue" src/ tokens/

# 2. Thay hàng loạt theo rename map (khô + review diff trước khi merge)
npx jscodeshift -t codemods/rename-tokens.ts src/
```

> 💡 **Quy tắc vàng:** Token deprecated **không xóa ngay** — giữ + warning ít nhất 1 bản major,
> và **không bao giờ** đổi nghĩa của 1 tên token đang tồn tại (muốn nghĩa mới → đặt tên mới).

---

## 4️⃣ Tooling Style Dictionary — Từ 1 file DTCG ra mọi platform

[Style Dictionary](https://amzn.github.io/style-dictionary/) là pipeline chuẩn:
**source (DTCG JSON) → transform (đổi format theo platform) → format/output (CSS/Swift/XML/TS)**.

```
tokens/*.json (DTCG)
        │  Style Dictionary
        ├─ transform: px → rem (web), px → pt (iOS), px → dp (Android)
        │
        ├─→ build/css/variables.css      (web: --color-primary)
        ├─→ build/ios/StyleDictionary.swift (iOS: Color.primary)
        ├─→ build/android/colors.xml     (Android: @color/primary)
        └─→ build/js/tokens.ts           (TS types cho logic JS)
```

**Config tối thiểu:**

```json
{
  "source": ["tokens/**/*.json"],
  "platforms": {
    "css": {
      "transformGroup": "css",
      "buildPath": "build/css/",
      "files": [{ "destination": "variables.css", "format": "css/variables" }]
    },
    "ts": {
      "transformGroup": "js",
      "buildPath": "build/js/",
      "files": [{ "destination": "tokens.ts", "format": "javascript/es6" }]
    }
  }
}
```

**Checklist CI cho tokens (chạy mỗi pull request):**

| Bước CI | Lệnh / tool | Chặn merge khi nào? |
|---------|-------------|---------------------|
| Validate đúng chuẩn DTCG | `style-dictionary build` (fail nếu JSON sai/`$value` thiếu) | Build fail |
| Không còn usage token deprecated | `rg "deprecated-token" src/` trả về kết quả | Còn usage mà không có plan migrate |
| Không hardcode lọt vào | `stylelint --custom-properties` / `rg "#[0-9a-fA-F]{6}" src/components` | Còn màu/spacing hardcode mới |
| Visual regression | Chromatic / Percy chụp lại Storybook | Diff UI ngoài ý muốn |

**Workflow tổng thể (nối từ 16.1):**

1. Designer tạo/sửa tokens trong Figma (plugin Tokens Studio) → export DTCG JSON
2. Dev review pull request (CI chạy 4 bước trên)
3. Style Dictionary build → CSS/Swift/XML/TS cho từng platform + từng brand × mode
4. Release theo semver + CHANGELOG + codemod nếu có rename/deprecate

---

## ✅ Tổng kết Deep Dive

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Viết tokens theo chuẩn **W3C DTCG** (`$value`/`$type`/alias `{...}`) | JSON tự chế mỗi team 1 kiểu, tool không đọc được |
| Component trỏ **decisions**, decisions trỏ **options** (multi-brand) | Component trỏ thẳng giá trị thô theo brand |
| Đổi tên/xóa token theo **semver + deprecate + codemod** | Xóa/đổi nghĩa token đang dùng, các app vỡ dây chuyền |
| Build đa platform bằng **Style Dictionary** + CI validate | Copy tay giá trị từ Figma sang từng platform |
| Đọc **16.1** cho nền tảng, bài này cho vận hành scale | Nhồi mọi thứ vào 1 bài duy nhất |

---

## 📚 Tài liệu

- 📖 [W3C DTCG Format Spec](https://design-tokens.github.io/community-group/format/)
- 📖 [Style Dictionary — Amazon](https://amzn.github.io/style-dictionary/)
- 📖 [Tokens Studio for Figma](https://tokens.studio)
- 📖 [Multi-brand Theming — Tokens Studio](https://docs.tokens.studio/)
- 📖 [Semantic Versioning](https://semver.org/)

---

## ▶️ Chạy ví dụ

```bash
cd 16-design-systems/16.5-design-tokens
npx tsx examples/index.ts
```

> Ví dụ minh họa cơ chế **alias resolve + sinh CSS variables đa theme** —
> phiên bản thu nhỏ bằng TypeScript thuần của pipeline Style Dictionary ở Mục 4.

---

## ⏭️ Bài tiếp theo → [16.6 Consistency Guidelines](../16.6-consistency-guidelines/README.md)
