<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";
import type { Component } from "vue";
import type { DownloadFormat } from "../types";

interface Props {
  formats: DownloadFormat[];
  label: string;
  icon?: Component;
  disabled?: boolean;
  classNames?: {
    button?: string;
    downloadMenu?: string;
    downloadMenuItem?: string;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "select", format: DownloadFormat): void;
}>();

const buttonRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const open = ref(false);
const menuStyle = ref<Record<string, string>>({});

function position() {
  const btn = buttonRef.value;
  /* v8 ignore next -- @preserve: defensive, button is always mounted when open */
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  menuStyle.value = {
    position: "fixed",
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    minWidth: `${Math.max(rect.width, 160)}px`,
    zIndex: "1000",
  };
}

function onOutsideMouseDown(e: MouseEvent) {
  const target = e.target as Node | null;
  if (!target) return;
  if (buttonRef.value?.contains(target) || menuRef.value?.contains(target)) return;
  closeMenu();
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    closeMenu();
    buttonRef.value?.focus();
  }
}

function onViewportChange() {
  position();
}

async function openMenu() {
  open.value = true;
  await nextTick();
  position();
  document.addEventListener("mousedown", onOutsideMouseDown, true);
  document.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("scroll", onViewportChange, true);
  window.addEventListener("resize", onViewportChange);
}

function closeMenu() {
  open.value = false;
  document.removeEventListener("mousedown", onOutsideMouseDown, true);
  document.removeEventListener("keydown", onKeyDown, true);
  window.removeEventListener("scroll", onViewportChange, true);
  window.removeEventListener("resize", onViewportChange);
}

function toggle() {
  if (open.value) closeMenu();
  else openMenu();
}

function pick(format: DownloadFormat) {
  closeMenu();
  emit("select", format);
}

onBeforeUnmount(closeMenu);
</script>

<template>
  <button
    ref="buttonRef"
    type="button"
    :class="['rte-button', 'rte-download-trigger', props.classNames?.button]"
    :disabled="props.disabled"
    :title="props.label"
    :aria-label="props.label"
    aria-haspopup="menu"
    :aria-expanded="open"
    @click="toggle"
  >
    <component v-if="props.icon" :is="props.icon" class="rte-icon-svg" />
    <template v-else>{{ props.label }}</template>
    <svg
      class="rte-download-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  </button>
  <Teleport to="body">
    <div
      v-if="open"
      ref="menuRef"
      role="menu"
      :class="['rte-download-menu', props.classNames?.downloadMenu]"
      :style="menuStyle"
    >
      <button
        v-for="f in props.formats"
        :key="f.id"
        type="button"
        role="menuitem"
        :class="['rte-download-menu-item', props.classNames?.downloadMenuItem]"
        @click="pick(f)"
      >
        {{ f.label }}
      </button>
    </div>
  </Teleport>
</template>

<style>
:where(.rte-download-trigger) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

:where(.rte-download-chevron) {
  width: 0.7em;
  height: 0.7em;
  flex-shrink: 0;
}

:where(.rte-download-menu) {
  display: flex;
  flex-direction: column;
  min-width: 10rem;
  padding: 0.25rem;
  background-color: #ffffff;
  border: 1px solid #d4d4d8;
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

:where(.rte-download-menu-item) {
  appearance: none;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 0.375rem 0.625rem;
  font-size: 0.875rem;
  color: #27272a;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.12s ease-in-out;
}

:where(.rte-download-menu-item:hover),
:where(.rte-download-menu-item:focus) {
  background-color: #f4f4f5;
  outline: none;
}
</style>
