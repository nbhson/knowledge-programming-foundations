# 📖 16.3 Storybook (Visual Testing & Docs)

> **Storybook** là công cụ develop UI component isolation — viết story cho từng state, test controls, tự động generate docs.

---

## 🎯 Setup Storybook

```bash
# Khởi tạo trong project React/Vite
npx storybook@latest init

# Cấu hình cơ bản
# .storybook/main.ts
export default {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};
```

---

## ✍️ Writing Stories

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default state
export const Primary: Story = {
  args: { variant: 'primary', children: 'Click me' },
};

// Variants
export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
};

// With icon
export const WithIcon: Story = {
  args: {
    variant: 'primary',
    icon: <svg>...</svg>,
    children: 'With Icon',
  },
};

// Loading state
export const Loading: Story = {
  args: { loading: true, disabled: true, children: 'Processing' },
};

// Disabled
export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};
```

---

## 🎛️ Controls & Addons

```tsx
// Controls — interactive args panel
export const Interactive: Story = {
  args: { variant: 'primary', size: 'md', children: 'Button' },
  parameters: {
    controls: { expanded: true },
  },
};

// Viewport addon — test responsive
export const Responsive: Story = {
  args: { children: 'Responsive Test' },
  parameters: {
    viewport: { viewports: { mobile: { width: 375 }, tablet: { width: 768 } } },
  },
};

// Actions addon — log interactions
export const Clickable: Story = {
  args: { children: 'Click Me' },
  argTypes: { onClick: { action: 'clicked' } },
};
```

---

## 📝 Documentation Mode

```tsx
// Auto-generated docs from CSF
const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button component với các variant và state khác nhau.',
      },
    },
  },
};

// Manual docs page
export const Docs: Story = {
  render: () => null,
  parameters: {
    docs: {
      canvas: { sourceState: 'shown' },
      story: {
        paragraphs: [
          'Button có 3 variant: primary, secondary, ghost.',
          'Size có 3 mức: sm, md, lg.',
        ],
      },
    },
  },
};
```

---

## 🧪 Testing với Storybook

```tsx
// button.interactions.ts
import { expect, userEvent, within } from '@storybook/test';

export const testClick = {
  playground: {
    setup: ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const button = canvas.getByRole('button', { name: /click/i });
      return { button };
    },
    actions: [
      {
        trigger: ({ button }) => userEvent.click(button),
        expect: ({ canvasElement }) => {
          expect(canvasElement).toMatchSnapshot();
        },
      },
    ],
  },
};
```

---

## 🚀 Build & Deploy

```bash
# Build static storybook
npx storybook build -o docs

# Deploy lên Vercel/Netlify
#vercel.json
{
  "buildCommand": "npx storybook build",
  "outputDirectory": "docs"
}
```

---

## ✅ Tổng kết

| ✔️ Nên làm | ❌ Tránh làm |
|------------|-------------|
| Mỗi component có dedicated stories | Viết story tràn lan không organize |
| Dùng autodocs + controls | Manual documentation |
| Test interactions | Chỉ test visual |

---

## 📚 Tài liệu

- 📖 [Storybook Official Docs](https://storybook.js.org/docs)
- 📖 [Writing Stories — Storybook Guide](https://storybook.js.org/docs/writing-stories)

---

## ⏭️ Bài tiếp theo → [16.4 Accessibility](../16.4-accessibility/README.md)
