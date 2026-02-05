# Usage Examples

This directory contains examples demonstrating different ways to use the `rte-vue` component.

## Table of Contents

1. [Basic Usage](#1-basic-usage)
2. [Custom Toolbar Groups](#2-custom-toolbar-groups)
3. [Theming with Tailwind CSS](#3-theming-with-tailwind-css)
4. [Markdown Support](#4-markdown-support)
5. [Custom Toolbar Buttons (Slots)](#5-custom-toolbar-buttons-slots)
6. [Form Validation Integration](#6-form-validation-integration)

---

## 1. Basic Usage

The simplest way to use the editor. It works out of the box with `v-model`.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RTextEditor } from 'rte-vue';
import 'rte-vue/dist/style.css';

const content = ref('<p>Hello World</p>');
</script>

<template>
  <RTextEditor v-model="content" placeholder="Start typing..." />
</template>
```

---

## 2. Custom Toolbar Groups

Organize your toolbar buttons into logical groups.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RTextEditor, type ToolbarItem } from 'rte-vue';
import 'rte-vue/dist/style.css';

const content = ref('');

// Define groups of buttons
const myToolbarGroups: ToolbarItem[][] = [
  ['bold', 'italic', 'strike'], // Inline styles
  ['heading1', 'heading2', 'heading3'], // Headings
  ['bulletList', 'orderedList'], // Lists
  ['link', 'unlink'] // Actions
];
</script>

<template>
  <RTextEditor
    v-model="content"
    :toolbarGroups="myToolbarGroups"
  />
</template>
```

---

## 3. Theming with Tailwind CSS

Because `rte-vue` uses zero-specificity CSS, you can easily override styles with Tailwind classes.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RTextEditor } from 'rte-vue';
import 'rte-vue/dist/style.css';

const content = ref('');
</script>

<template>
  <div class="p-8 bg-gray-50 min-h-screen">
    <RTextEditor
      v-model="content"
      :classNames="{
        // Target specific parts of the editor
        editorContent: 'bg-white border-2 border-indigo-100 rounded-xl shadow-sm min-h-[300px]',
        toolbar: 'bg-white border-b border-gray-100 px-4 py-2 rounded-t-xl',
        button: 'p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors',
        buttonActive: 'bg-indigo-100 text-indigo-700 font-bold',
      }"
    />
  </div>
</template>
```

---

## 4. Markdown Support

If your backend stores Markdown instead of HTML, `rte-vue` can handle the conversion automatically.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RTextEditor } from 'rte-vue';
import 'rte-vue/dist/style.css';

// Content is plain markdown string
const markdownContent = ref('# Hello Markdown\n\n- Item 1\n- Item 2');
</script>

<template>
  <RTextEditor
    v-model="markdownContent"
    contentFormat="markdown" 
  />
</template>
```

---

## 5. Custom Toolbar Buttons (Slots)

Use the `#toolbar-button` slot to completely customize the look and feel of your buttons (e.g., using Heroicons).

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RTextEditor } from 'rte-vue';
import { BoldIcon, ItalicIcon } from '@heroicons/vue/24/solid'; 
import 'rte-vue/dist/style.css';

const content = ref('');
</script>

<template>
  <RTextEditor v-model="content">
    <template #toolbar-button="{ item, label, active, disabled, runCommand }">
      <button
        @click="runCommand(item)"
        :disabled="disabled"
        class="p-2 rounded hover:bg-gray-100"
        :class="{ 'text-blue-600 bg-blue-50': active }"
        :title="label"
      >
        <!-- Render custom icons based on the item name -->
        <BoldIcon v-if="item === 'bold'" class="w-5 h-5" />
        <ItalicIcon v-else-if="item === 'italic'" class="w-5 h-5" />
        <span v-else>{{ label }}</span>
      </button>
    </template>
  </RTextEditor>
</template>
```

---

## 6. Form Validation Integration

Integrating with a form library (custom logic example).

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { RTextEditor } from 'rte-vue';
import 'rte-vue/dist/style.css';

const content = ref('');
const isTouched = ref(false);

const error = computed(() => {
  if (isTouched.value && !content.value) {
    return 'This field is required.';
  }
  return '';
});

const handleBlur = () => {
  isTouched.value = true;
};
</script>

<template>
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">Biography</label>
    
    <RTextEditor
      v-model="content"
      @blur="handleBlur"
      :classNames="{
        editorContent: error ? 'border-red-500 focus:ring-red-500' : ''
      }"
    />
    
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
  </div>
</template>
```
