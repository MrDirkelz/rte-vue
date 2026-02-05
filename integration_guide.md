You are fixing the integration of `RTextEditor` into a parent Vue component. A fellow developer has updated `RTextEditor` to support your requirements.

Here is the technical specification for the changes you need to apply to the parent component:

### 1. Fix: Layout & Height
The helper agent reported issues with the editor not filling the height.
*   **Action:** Ensure the parent container has a defined height (e.g., `h-64` or `flex-1`) and apply `class="h-full"` to the `<RTextEditor />` component itself.
*   **Action:** If usage involves a flex column, ensure `min-h-0` is used to prevent overflow issues.

### 2. Fix: Focus Ring
You reported a "blue focus ring".
*   **Cause:** This is likely the default browser outline on the `contenteditable` element inside the editor, OR a Tailwind ring utility on your wrapper.
*   **Action:** Verify if your wrapper `div` has `focus-within:ring-2`. This is good for accessibility, but ensure you don't have *double* rings. The `RTextEditor` internally handles some basic styling, but you are wrapping it to provide the "input-like" look.
*   **Recommendation:** Keep the `focus-within:ring` on your wrapper, but ensure the `RTextEditor`'s internal content has `outline: none`.

### 3. Feature: Headless Link Handling
The `RTextEditor` has been updated to support "headless" link management. It no longer contains a built-in modal.
*   **New Prop:** `onRequestLink`. This is a *void* event handler, NOT a Promise code block.
*   **Mechanism:**
    1.  Bind a `ref` to the `<RTextEditor ref="editorRef" />`.
    2.  Listen to `@request-link="handleRequestLink"`.
    3.  In `handleRequestLink`, open *YOUR* global link modal/input.
    4.  When the user submits the URL in your modal, call the editor instance method directly:
        ```typescript
        // In your submit handler
        if (editorRef.value?.editor) {
            editorRef.value.editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: url })
                .run();
        }
        ```
    5.  To remove a link, use `.unsetLink().run()`.

### Example Implementation Update

Refactor your component code to look like this:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { RTextEditor } from 'dirk-rte-vue';

// Reference to the exposed editor component
const editorRef = ref(); 
const showLinkModal = ref(false);

const handleRequestLink = () => {
    // 1. Open your custom modal
    showLinkModal.value = true;
};

const submitLink = (url: string) => {
    // 2. Apply change programmatically
    editorRef.value?.editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    showLinkModal.value = false;
};
</script>

<template>
  <div class="h-64 border rounded-lg overflow-hidden focus-within:ring-2 ring-blue-500">
    <RTextEditor
      ref="editorRef"
      v-model="content"
      class="h-full"
      @request-link="handleRequestLink" 
    />
  </div>
  
  <!-- Your Link Modal -->
  <Dialog v-model="showLinkModal">
     <!-- ... -->
  </Dialog>
</template>
```
