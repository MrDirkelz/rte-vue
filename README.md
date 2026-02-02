# RichTextEditorStandalone

A fully configurable rich text editor component built with Vue 3 and TipTap. Designed to be framework-agnostic and ready for npm publication.

## Features

- ✅ **Configurable Toolbar** – Show/hide toolbar, customize items, groups, and labels
- ✅ **Custom Styling** – Use Tailwind CSS or raw CSS via the `classNames` prop
- ✅ **Custom Buttons** – Replace toolbar buttons or entire toolbar with slots
- ✅ **HTML Paste Transform** – Hook into paste behavior with `transformPastedHtml`
- ✅ **Events** – `onChange`, `onSave`, `onFocus`, `onBlur` callbacks
- ✅ **v-model Support** – Two-way binding for text and language
- ✅ **TypeScript Ready** – Full type exports

## Installation

```bash
npm install rich-text-editor-vue-tiptap
```

## Usage

### Basic

```vue
<script setup>
import { ref } from "vue";
import { RichTextEditorStandalone } from "rich-text-editor-vue-tiptap";

const content = ref("");
</script>

<template>
    <RichTextEditorStandalone
        v-model:text="content"
        title="Edit Content"
        placeholder="Start typing..."
    />
</template>
```

### With Language Support

```vue
<script setup>
import { ref } from "vue";
import { RichTextEditorStandalone } from "rich-text-editor-vue-tiptap";

const content = ref("");
const language = ref("en");
</script>

<template>
    <RichTextEditorStandalone
        v-model:text="content"
        v-model:textLanguage="language"
        title="Multilingual Editor"
    />
</template>
```

### With Event Handlers

```vue
<template>
    <RichTextEditorStandalone
        v-model:text="content"
        :onChange="(value) => console.log('Text changed:', value)"
        :onSave="(value) => saveContent(value)"
        :onFocus="() => console.log('Editor focused')"
        :onBlur="() => console.log('Editor blurred')"
    />
</template>
```

## Props

### `text` (v-model)

Type: `string` | Default: `""`

The editor content as JSON string. Updated via v-model.

### `textLanguage` (v-model)

Type: `string | undefined` | Default: `undefined`

Current language context. Update content when language changes.

### `title`

Type: `string | undefined` | Default: `undefined`

Header title displayed above the editor.

### `icon`

Type: `Component | undefined` | Default: `undefined`

Vue component to render as icon next to title.

### `disabled`

Type: `boolean` | Default: `false`

Disables editor and hides toolbar.

### `showToolbar`

Type: `boolean` | Default: `true`

Show or hide the toolbar entirely.

### `placeholder`

Type: `string | undefined` | Default: `undefined`

Placeholder text when editor is empty.

### `toolbarItems`

Type: `ToolbarItem[]` | Default: `[all items]`

Which toolbar items to display. Options:

- `"bold"` – Bold text
- `"italic"` – Italic text
- `"strike"` – Strikethrough
- `"heading2"` – Heading level 2
- `"heading3"` – Heading level 3
- `"heading4"` – Heading level 4
- `"heading5"` – Heading level 5
- `"bulletList"` – Bullet list
- `"orderedList"` – Ordered list
- `"link"` – Add/edit link
- `"unlink"` – Remove link

### `toolbarGroups`

Type: `ToolbarItem[][]` | Default: `[toolbarItems]`

Organize toolbar items into grouped rows.

```vue
<RichTextEditorStandalone
    :toolbarGroups="[
        ['bold', 'italic', 'strike'],
        ['heading2', 'heading3', 'heading4'],
        ['bulletList', 'orderedList'],
        ['link', 'unlink'],
    ]"
/>
```

### `toolbarLabels`

Type: `Partial<Record<ToolbarItem, string>>` | Default: `{}`

Custom labels for toolbar buttons.

```vue
<RichTextEditorStandalone
    :toolbarLabels="{
        bold: 'Strong',
        italic: 'Emphasis',
    }"
/>
```

### `classNames`

Type: `object` | Default: `{}`

Apply custom CSS classes or Tailwind utilities to any element. All classNames are merged with defaults.

**Available classNames:**

- `root` – Root container
- `header` – Title/icon header
- `title` – Title text
- `icon` – Icon element
- `toolbar` – Toolbar container
- `toolbarGroup` – Button group container
- `button` – Toolbar button
- `buttonActive` – Active button state (merged with `button`)
- `editor` – Editor wrapper
- `editorContent` – ProseMirror editor content container
- `placeholder` – Placeholder text
- `modalBackdrop` – Link modal backdrop
- `modal` – Link modal dialog
- `modalTitle` – Modal title
- `modalInput` – Modal URL input
- `modalActions` – Modal footer actions
- `modalButton` – Modal button

```vue
<RichTextEditorStandalone
    :classNames="{
        root: 'h-full shadow-lg',
        editor: 'border-2 border-blue-500',
        button: 'px-3 py-2 rounded hover:bg-gray-200',
        buttonActive: 'bg-blue-500 text-white',
        placeholder: 'text-gray-400 italic',
    }"
/>
```

### `minHeight` / `maxHeight` / `width`

Type: `string` | Default: `undefined`

Inline CSS height/width (e.g., `"200px"`, `"50vh"`).

```vue
<RichTextEditorStandalone minHeight="300px" maxHeight="500px" width="100%" />
```

### `onChange`

Type: `(value: string) => void` | Default: `undefined`

Callback fired on every text change.

### `onSave`

Type: `(value: string) => void` | Default: `undefined`

Callback fired when Cmd/Ctrl+S is pressed.

### `onFocus`

Type: `() => void` | Default: `undefined`

Callback fired when editor gains focus.

### `onBlur`

Type: `() => void` | Default: `undefined`

Callback fired when editor loses focus.

### `transformPastedHtml`

Type: `(html: string) => string` | Default: `formatPastedHtml`

Hook to transform HTML before pasting into editor. Useful for cleaning up Microsoft Word formatting.

```vue
<script setup>
import { formatPastedHtml } from "rich-text-editor-vue-tiptap";
</script>

<template>
    <RichTextEditorStandalone :transformPastedHtml="formatPastedHtml" />
</template>
```

## Slots

### `#toolbar`

Override the entire toolbar layout.

**Slot Props:**

- `items` – `ToolbarItem[]` – All toolbar items
- `groups` – `ToolbarItem[][]` – Grouped items
- `isActive(item)` – Check if button is active
- `isDisabled(item)` – Check if button is disabled
- `getLabel(item)` – Get button label
- `runCommand(item)` – Execute toolbar action

```vue
<RichTextEditorStandalone v-model:text="content">
  <template #toolbar="{ getLabel, runCommand, isActive }">
    <div class="flex gap-1">
      <button
        v-for="item in ['bold', 'italic', 'strike']"
        :key="item"
        :class="{ 'font-bold': isActive(item) }"
        @click="runCommand(item)"
      >
        {{ getLabel(item) }}
      </button>
    </div>
  </template>
</RichTextEditorStandalone>
```

### `#toolbar-button`

Override individual toolbar buttons.

**Slot Props:**

- `item` – `ToolbarItem` – Button identifier
- `label` – `string` – Button label
- `active` – `boolean` – Is button active
- `disabled` – `boolean` – Is button disabled
- `runCommand` – `(item) => void` – Execute action

```vue
<RichTextEditorStandalone v-model:text="content">
  <template #toolbar-button="{ item, label, active, disabled, runCommand }">
    <button
      :class="[
        'px-3 py-1.5 rounded transition',
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 hover:bg-gray-200'
      ]"
      :disabled="disabled"
      @click="runCommand(item)"
    >
      {{ label }}
    </button>
  </template>
</RichTextEditorStandalone>
```

## Examples

### Minimal (No Toolbar)

```vue
<RichTextEditorStandalone v-model:text="content" :showToolbar="false" />
```

### With Tailwind Styling

```vue
<RichTextEditorStandalone
    v-model:text="content"
    title="Rich Text"
    :classNames="{
        root: 'rounded-lg shadow-md border border-gray-300',
        editor: 'bg-white focus-within:border-blue-500',
        button: 'text-sm rounded px-2 py-1 hover:bg-gray-200',
        buttonActive: 'bg-blue-500 text-white',
        placeholder: 'text-gray-400',
    }"
/>
```

### With Custom Toolbar

```vue
<RichTextEditorStandalone v-model:text="content">
  <template #toolbar="{ runCommand }">
    <div class="toolbar-custom flex gap-4 p-2">
      <button @click="runCommand('bold')" class="btn">B</button>
      <button @click="runCommand('italic')" class="btn">I</button>
      <button @click="runCommand('heading2')" class="btn">H2</button>
      <button @click="runCommand('link')" class="btn">Link</button>
    </div>
  </template>
</RichTextEditorStandalone>

<style>
.btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 0.375rem;
    cursor: pointer;
}

.btn:hover {
    background-color: #f0f0f0;
}
</style>
```

### With Transform & Handlers

```vue
<script setup>
import { ref } from "vue";
import { RichTextEditorStandalone, formatPastedHtml } from "rich-text-editor-vue-tiptap";

const content = ref("");

const handleSave = (value) => {
    console.log("Saving:", value);
    // API call
};
</script>

<template>
    <RichTextEditorStandalone
        v-model:text="content"
        :transformPastedHtml="formatPastedHtml"
        :onSave="handleSave"
    />
</template>
```
