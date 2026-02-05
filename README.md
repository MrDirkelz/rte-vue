# rte-vue

<p align="left">
  <a href="https://www.npmjs.com/package/rte-vue"><img src="https://img.shields.io/npm/v/rte-vue?style=flat-square&color=blue" alt="npm version" /></a>
  <img src="https://img.shields.io/npm/l/rte-vue?style=flat-square&color=green" alt="license" />
  <img src="https://img.shields.io/badge/vue-3.x-42b883?style=flat-square&logo=vue.js" alt="vue version" />
  <img src="https://img.shields.io/badge/typescript-ready-blue?style=flat-square&logo=typescript" alt="typescript" />
</p>

A **fully configurable**, **ready-to-use** Rich Text Editor for Vue 3.
Built on [TiPTap](https://tiptap.dev/), this editor provides a seamless WYSIWYG experience with Markdown support, customization slots, and zero-config usage.

Perfect for blogs, CMS, comment sections, or any Vue 3 app needing text editing.

## ✨ Features

- 🚀 **Zero-Config**: Just drop it in and it works with `v-model`.
- 📝 **Markdown & JSON**: Native support for Markdown input/output (or use JSON).
- 🎨 **Component-Scoped Styles**: Looks good out of the box, but easily overridable.
- 🔧 **Highly Customizable**:
  - Configure toolbar items and groups.
  - Override specific buttons or the entire toolbar via **Slots**.
  - Custom styling for every element.
- 🧱 **Block Styling**: Headings, lists, links, bold, italic, strike-through out of the box.
- 🦾 **TypeScript**: Full TypeScript support with exported types.

## � Examples

Check out the [**examples**](./examples/README.md) folder for detailed usage scenarios, including:

1. [Basic Usage](./examples/README.md#1-basic-usage)
2. [Custom Toolbar Groups](./examples/README.md#2-custom-toolbar-groups)
3. [Theming with Tailwind CSS](./examples/README.md#3-theming-with-tailwind-css)
4. [Markdown Support](./examples/README.md#4-markdown-support)
5. [Custom Toolbar Buttons (Slots)](./examples/README.md#5-custom-toolbar-buttons-slots)
6. [Form Validation Integration](./examples/README.md#6-form-validation-integration)7. [Internationalization (i18n)](./examples/README.md#7-internationalization-i18n)
8. [Read-Only Display](./examples/README.md#8-read-only-display)
9. [Chat / Comment Input](./examples/README.md#9-chat--comment-input)
10. [Programmatic Control](./examples/README.md#10-programmatic-control)
## �📦 Installation

```bash
npm install rte-vue
```

## ⚡ Quick Start

### The "It Just Works" Way

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RTextEditor } from 'rte-vue';
import 'rte-vue/dist/style.css'; 

const content = ref('# Hello World');
</script>

<template>
  <RTextEditor v-model="content" />
</template>
```

### Full Configuration Example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RTextEditor } from 'rte-vue';
import 'rte-vue/dist/style.css';

const myContent = ref('');

const handleSave = (content: string) => {
  console.log('Saved content:', content);
};
</script>

<template>
  <RTextEditor
    v-model="myContent"
    placeholder="Write something amazing..."
    content-format="markdown"
    :heading-offset="1"
    :toolbar-items="['bold', 'italic', 'heading2', 'bulletList', 'link']"
    @save="handleSave"
  />
</template>
```

## 📖 Component API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` / `text` | `string` | `""` | The content of the editor. Supports `v-model`. |
| `contentFormat` | `'json' \| 'markdown'` | `'json'` | Format for input and output strings. |
| `showToolbar` | `boolean` | `true` | Visibility of the toolbar. |
| `disabled` | `boolean` | `false` | Disables editing. |
| `placeholder` | `string` | - | Placeholder text when empty. |
| `headingOffset` | `number` | `0` | Offsets heading levels (e.g., +1 makes H1 render as H2). |
| `toolbarItems` | `ToolbarItem[]` | `['bold', ...]` | Array of button keys to show. |
| `toolbarGroups` | `ToolbarItem[][]` | - | Advanced: Group buttons into visual clusters. |
| `toolbarLabels` | `Record<string, string>` | - | Custom labels/tooltips for buttons. |
| `classNames` | `object` | - | Object of class strings for `root`, `editor`, `button`, etc. |
| `minHeight` | `string` | - | CSS min-height (e.g., '200px'). |
| `maxHeight` | `string` | - | CSS max-height. |
| `width` | `string` | - | CSS width. |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string` | Emitted on every change (v-model). |
| `change` | `string` | Emitted on every change. |
| `save` | `string` | Emitted when user presses `Cmd+S` or `Ctrl+S`. |
| `focus` | - | Emitted when editor gains focus. |
| `blur` | - | Emitted when editor loses focus. |

### Slots

#### `#toolbar`
Completely replace the toolbar area.
**Scope**: `{ items, groups, isActive(item), isDisabled(item), runCommand(item) }`

#### `#toolbar-button`
Customize individual buttons while keeping the default layout.
**Scope**: `{ item, label, active, disabled, runCommand }`

## 🖌️ Styling

The editor comes with minimalist base styles. You can override specific parts using the `classNames` prop or standard CSS.

### Using Utility Classes (Tailwind, UnoCSS, etc)
Because the default styles use the `:where()` selector (zero specificity), you can pass utility classes directly to the component via the `classNames` prop and they will work immediately without `!important`.

```vue
<RTextEditor
  :class-names="{
    editorContent: 'bg-zinc-50 border-2 border-red-500 rounded-xl',
    toolbar: 'bg-transparent border-b-0',
    buttonActive: 'bg-blue-100 text-blue-700'
  }"
/>
```

### CSS Classes & Selectors
If you prefer writing custom CSS, you can target the following stable class names. 

| Class Name | Description |
|------------|-------------|
| `.rte-root` | The top-level container element. |
| `.rte-header` | The header row containing the icon and title. |
| `.rte-title` | The header title text. |
| `.rte-icon` | The header icon svg. |
| `.rte-toolbar` | The Flex container for the toolbar area. |
| `.rte-toolbar-group` | The container for a group of related buttons. |
| `.rte-button` | The toolbar button element. |
| `.rte-button-active` | The active state of a toolbar button. |
| `.rte-editor` | The wrapper around the editor content area. |
| `.rte-editor-content` | The actual editable area (TipTap/ProseMirror container). |
| `.rte-placeholder` | The absolute positioned placeholder text. |

Since all defaults use `:where(.classname)`, your custom CSS will always win as long as it has a specificity greater than 0 (which is basically any class selector).

```css
/* No !important needed! */
.rte-editor-content {
  background-color: #fdf2f8; 
  border-radius: 12px;
}
```

## ⌨️ Shortcuts

- **Bold**: `Cmd/Ctrl + B`
- **Italic**: `Cmd/Ctrl + I`
- **Save**: `Cmd/Ctrl + S`

## License

MIT
