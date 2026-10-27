# 📖 16.3 Storybook (Visual Testing & Docs)

> **Storybook** là công cụ develop UI component isolation — viết story cho từng state, test controls, tự động generate docs.(Component-driven development workflow.)

---

## 🎯 Tại sao Storybook?

```
❌ Không có Storybook:
├─ Test component phải render trong app hoàn chỉnh
├─ Khó isolated testing — phụ thuộc vào app context (router, store, theme)
├─ Documentation nằm rải rác (README + code + chat)
├─ Designer khó review — phải chạy app local
└─ Visual regression không tự động

✅ Với Storybook:
├─ Component chạy isolated — không cần app wrapper
├─ Mỗi state = 1 story — exhaustive coverage
├─ Docs tự generate từ CSF (Component Story Format)
├─ Designer + PM có thể xem trực tiếp (deployed preview)
└─ Chromatic integration cho visual regression testing
```

**Component-Driven Development workflow:**
1. Build component ở isolate state (story)
2. Verify từng variant (primary, secondary, disabled...)
3. Interact (controls addon) — thử args dynamically
4. Test interactions (play function) — click, hover, keyboard
5. Deploy storybook → share link cho team

---

## 🎯 Setup Storybook

```bash
# Khởi tạo trong project React/Vite (tự động detect framework)
npx storybook@latest init

# Sau init, cấu hình cơ bản:
# .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',  // controls, actions, backgrounds, viewport
    '@storybook/addon-interactions', // play function testing
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Optional: TypeScript strict checks
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
```

**Chạy Storybook:**
```bash
npm run storybook    # mở tại localhost:6006
```

---

## ✍️ Writing Stories — Component Story Format (CSF)

CSF là standard format: export `meta` (config) + named `Story` exports (states).

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// Meta: component config + default args
const meta = {
  title: 'Components/Button',     // navigation path
  component: Button,
  tags: ['autodocs'],             // auto-generate docs page
  argTypes: {
    // Define control types for each prop
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    onClick: { action: 'clicked' }, // log click in Actions panel
  },
  parameters: {
    // Docs page description
    docs: {
      description: {
        component: 'Button component với các variant (primary, secondary, ghost) và sizes.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default state — args là mặc định cho tất cả stories
export const Primary: Story = {
  args: { variant: 'primary', children: 'Click me' },
};

// Variants
export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost Button' },
};

// With icon
export const WithIcon: Story = {
  args: {
    variant: 'primary',
    icon: /* <YourIcon /> */,
    children: 'With Icon',
  },
};

// Loading state
export const Loading: Story = {
  args: { loading: true, disabled: true, children: 'Processing...' },
};

// Disabled
export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

// All sizes
export const Sizes: Story = {
  args: { children: 'Size variants' },
  parameters: { layout: 'fullscreen' },
};
```

---

## 🎛️ Controls & Addons

### Controls — Interactive args panel

Controls cho phép designer/dev thử component với different args mà không edit code.

```tsx
// Story với controls expanded
export const Interactive: Story = {
  args: { variant: 'primary', size: 'md', children: 'Button' },
  parameters: {
    controls: { expanded: true },  // auto-expand controls panel
  },
};
```

### Viewport — Responsive testing

```tsx
export const Responsive: Story = {
  args: { children: 'Responsive Test Component' },
  parameters: {
    viewport: {
      viewports: {
        mobile: { width: 375, height: 667 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1440, height: 900 },
      },
    },
  },
};
```

### Actions — Log interactions

```tsx
export const Clickable: Story = {
  args: { children: 'Click Me' },
  argTypes: {
    onClick: { action: 'clicked' },  // auto-log in Actions panel
  },
};
```

### Backgrounds — Theme testing

```tsx
export const OnDark: Story = {
  args: { variant: 'primary', children: 'On Dark Background' },
  parameters: { backgrounds: { default: 'dark' } },
};

export const OnLight: Story = {
  args: { variant: 'primary', children: 'On Light Background' },
  parameters: { backgrounds: { default: 'light' } },
};
```

---

## 📝 Documentation Mode

Storybook tự generate docs từ CSF metadata. Custom docs với `parameters.docs`.

```tsx
const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button component với các variant và state khác nhau.',
      },
      story: {
        paragraphs: [
          'Button có 3 variant: primary (brand color), secondary (outline), ghost (transparent).',
          'Size có 3 mức: sm (compact), md (default), lg (large).',
          'Support loading và disabled states.',
        ],
      },
    },
  },
};

// Manual docs story (render null, chỉ dùng for docs content)
export const Documentation: Story = {
  render: () => null,
  parameters: {
    docs: {
      canvas: { sourceState: 'shown' },  // show code by default
      story: {
        inline: true,   // render story inline in docs
        iframeHeight: '200px',
      },
    },
  },
};
```

**Docs page structure (auto-generated):**
1. Component description (from `description.component`)
2. Props table (auto from TypeScript interfaces)
3. Stories gallery (interactive)
4. Source code (toggleable)
5. Canvas (live preview)

---

## 🧪 Testing với Storybook

### Interaction testing (play function)

```tsx
// button.interactions.ts
import { expect, userEvent, within } from '@storybook/test';

export const testClick = {
  // Setup: get canvas elements
  playground: {
    setup: ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const button = canvas.getByRole('button', { name: /click/i });
      return { button };
    },
    // Actions: define interactions
    actions: [
      {
        trigger: ({ button }) => userEvent.click(button),
        expect: ({ canvasElement }) => {
          // Visual snapshot
          expect(canvasElement).toMatchSnapshot();
          // Hoặc DOM assertion
          const button = within(canvasElement).getByRole('button');
          expect(button).toHaveTextContent('Clicked!');
        },
      },
    ],
  },
};

// Trong story:
export const ClickTest: Story = {
  args: { children: 'Click Me' },
  play: testClick.playground.actions[0].trigger,
};
```

### Visual regression testing với Chromatic

```bash
# Cài đặt Chromatic
npm install chromatic --save-dev

# Trong package.json scripts
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "chromatic": "npx chromatic --project-token=YOUR_TOKEN"
  }
}
```

```tsx
// .chromatic.config.json
{
  "onlyChanged": true,
  "pauseAnimationAtEnd": true,
  "ignoreStyles": ["button"],
  "uncoveredFiles": ["src/components/Button/**/*"]
}
```

---

## 🚀 Build & Deploy

```bash
# Build static storybook (output vào docs/ folder)
npx storybook build -o docs

# Deploy lên Vercel (auto-detect)
# vercel.json
{
  "buildCommand": "npx storybook build",
  "outputDirectory": "docs",
  "framework": null
}

# Deploy lên Netlify
# netlify.toml
[build]
  command = "npx storybook build"
  publish = "docs"
```

**Deployed storybook URL pattern:**
- Dev: `https://yourlib-staging.vercel.app`
- Preview (PR): `https://yourlib-pr123.vercel.app` (auto from PR)
- Production: `https://yourlib.design`

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Mỗi component có dedicated stories file | Viết story tràn lan không organize |
| Dùng autodocs + controls | Manual documentation tách rời |
| Test interactions với play function | Chỉ test visual (lack behavioral test) |
| Deploy storybook cho team access | Chỉ chạy local, không share được |
| Nhóm stories theo hierarchy (Components/X) | Đưa tất cả vào root level |

---

## 💡 Common Misconceptions

| Quan niệm sai | Sự thật |
|--------------|---------|
| "Storybook chỉ để showcase components" | Storybook là dev environment + docs + testing — 3 trong 1 |
| "Cần viết story cho mọi component state" | Viết story cho mỗi **variant quan trọng**, không phải mọi combination |
| "Storybook chậm vì heavy" | Vite-powered Storybook khởi động < 2s, hot reload tức thì |
| "Chỉ frontend dev cần Storybook" | Designer dùng để review; PM dùng để xem product behavior |

---

## 📚 Tài liệu

- 📖 [Storybook Official Docs](https://storybook.js.org/docs)
- 📖 [Writing Stories — Storybook Guide](https://storybook.js.org/docs/writing-stories)
- 📖 [Component Story Format (CSF) — Spec](https://storybook.js.org/docs/formats/component-story-format/)
- 📖 [Storybook Testing Guide](https://storybook.js.org/docs/writing-tests)

---

## ▶️ Chạy ví dụ

```bash
cd 16-design-systems/16.3-storybook
npx ts-node examples/index.ts
```

---

## ⏭️ Bài tiếp theo → [16.4 Accessibility](../16.4-accessibility/README.md)
