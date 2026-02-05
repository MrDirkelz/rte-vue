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
        <RTextEditor``
          v-model="defaultContent"
          placeholder="Start typing..."
          minHeight="300px"
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
