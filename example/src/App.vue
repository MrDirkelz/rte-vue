<script setup lang="ts">
import { ref } from 'vue'
import { RTextEditor } from 'rte-vue'
import type { ToolbarItem } from 'rte-vue'

// Default style
const defaultContent = ref('')

// With toolbar (custom styled)
const withToolbar = ref('')

// Without toolbar
const withoutToolbar = ref('')

// Toolbar grouped example
const groupedContent = ref('')
const myToolbarGroups: ToolbarItem[][] = [
  ['bold', 'italic', 'strike'],
  ['heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6'],
  ['bulletList', 'orderedList'],
  ['link', 'unlink']
]

// File uploader example
const uploaderContent = ref('')
const uploadedFile = ref<string | null>(null)
const uploadError = ref<string | null>(null)

const onFileUpload = (file: File, _content: string) => {
  uploadedFile.value = file.name
  uploadError.value = null
  console.log(`Imported "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`)
}

const onFileError = (error: Error) => {
  uploadError.value = error.message
  uploadedFile.value = null
  console.error('File import failed:', error.message)
}

// Custom styled uploader example
const styledUploaderContent = ref('')
const styledUploadedFile = ref<string | null>(null)

const onStyledFileUpload = (file: File) => {
  styledUploadedFile.value = file.name
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          RTextEditor Demo
        </h1>
        <p class="text-gray-600">
          Simple rich text editor examples
        </p>
      </div>

      <!-- Default Style -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          Default Style
        </h2>
        <RTextEditor
          v-model="defaultContent"
          placeholder="Start typing..."
          minHeight="300px"
        />
      </div>

      <!-- File Uploader -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          File Uploader
        </h2>
        <p class="text-gray-500 text-sm mb-4">
          Click the <strong>Upload</strong> button in the toolbar, drag a file onto the editor,
          or paste a file with <code>Cmd/Ctrl+V</code>.
          Supports <code>.docx</code>, <code>.odt</code>, <code>.odf</code>, and <code>.txt</code>.
        </p>
        <div v-if="uploadedFile" class="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Imported: {{ uploadedFile }}
        </div>
        <div v-if="uploadError" class="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Error: {{ uploadError }}
        </div>
        <RTextEditor
          v-model="uploaderContent"
          :uploader="true"
          placeholder="Upload a file or start typing..."
          minHeight="300px"
          @file-upload="onFileUpload"
          @file-error="onFileError"
        />
      </div>

      <!-- File Uploader (Custom Styled) -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          File Uploader (Custom Styled)
        </h2>
        <p class="text-gray-500 text-sm mb-4">
          The uploader toolbar button and editor can be fully styled. Try dragging a file onto the editor area below.
        </p>
        <div v-if="styledUploadedFile" class="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Imported: {{ styledUploadedFile }}
        </div>
        <RTextEditor
          v-model="styledUploaderContent"
          :uploader="true"
          placeholder="Upload a document to see it here..."
          :classNames="{
            root: 'border-2 border-gray-300 rounded-lg',
            toolbar: 'bg-gray-50 p-3 border-b-2 border-gray-200',
            button: 'px-3 py-1.5 rounded text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100',
            buttonActive: 'bg-blue-600 text-white border-blue-600',
            editor: 'bg-white',
            placeholder: 'text-gray-400'
          }"
          minHeight="300px"
          @file-upload="(file: File) => onStyledFileUpload(file)"
        />
      </div>

      <!-- With Toolbar (Custom Styled) -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          With Toolbar (Custom Styled)
        </h2>
        <RTextEditor
          v-model="withToolbar"
          placeholder="Click here and start typing..."
          :classNames="{
            root: 'border-2 border-gray-300 rounded-lg',
            toolbar: 'bg-gray-50 p-3 border-b-2 border-gray-200',
            button: 'px-3 py-1.5 rounded text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100',
            buttonActive: 'bg-blue-600 text-white border-blue-600',
            editor: 'bg-white',
            placeholder: 'text-gray-400'
          }"
          minHeight="300px"
        />
      </div>

      <!-- Toolbar Groups (All Features) -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          Toolbar Groups (All Features)
        </h2>
        <RTextEditor
          v-model="groupedContent"
          :toolbarGroups="myToolbarGroups"
          placeholder="Editor with grouped toolbar items..."
          minHeight="300px"
        />
      </div>

      <!-- Without Toolbar -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          Without Toolbar (Plain Text)
        </h2>
        <RTextEditor
          v-model="withoutToolbar"
          :showToolbar="false"
          contentFormat="markdown"
          placeholder="Click anywhere in this box to type..."
          :classNames="{
            root: 'border-2 border-gray-300 rounded-lg',
            editor: 'bg-white',
            placeholder: 'text-gray-400'
          }"
          minHeight="300px"
        />
      </div>
    </div>
  </div>
</template>
