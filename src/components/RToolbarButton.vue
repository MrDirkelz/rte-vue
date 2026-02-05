<script setup lang="ts">
import type { Component } from "vue";
import type { ToolbarItem } from "../types";

interface Props {
  item: ToolbarItem;
  label: string;
  icon?: Component;
  active?: boolean;
  disabled?: boolean;
  classNames?: {
    button?: string;
    buttonActive?: string;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "click", item: ToolbarItem): void;
}>();

function onClick() {
  if (!props.disabled) {
    emit("click", props.item);
  }
}
</script>

<template>
  <button
    :class="[
      'rte-button',
      props.classNames?.button,
      { 'rte-button-active': props.active },
      props.active && props.classNames?.buttonActive ? props.classNames.buttonActive : undefined
    ]"
    :disabled="props.disabled"
    @click="onClick"
    type="button"
    :title="props.label"
    :aria-label="props.label"
  >
    <component v-if="props.icon" :is="props.icon" class="rte-icon-svg" />
    <template v-else>{{ props.label }}</template>
  </button>
</template>

<style>
:where(.rte-button) {
  padding: 0.375rem 0.5rem;
  border-radius: 0;
  border: 0;
  font-size: 0.875rem;
  cursor: pointer;
  background-color: #f4f4f5; /* zinc-100 */
  color: #3f3f46; /* zinc-700 */
  transition: all 0.15s ease-in-out;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:where(.rte-button:first-child) {
  border-radius: 0.375rem 0 0 0.375rem;
}

:where(.rte-button:last-child) {
  border-radius: 0 0.375rem 0.375rem 0;
}

:where(.rte-button:hover:not(:disabled)) {
  background-color: #e4e4e7; /* zinc-200 */
}

:where(.rte-button:active:not(:disabled)) {
  background-color: #d4d4d8; /* zinc-300 */
}

:where(.rte-button:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

:where(.rte-button-active) {
  background-color: #d4d4d8; /* zinc-300 */
  color: #18181b;
}

/* Ensure icons fit nicely */
:where(.rte-icon-svg) {
  width: 1.25em;
  height: 1.25em;
}
</style>
