<script setup lang="ts">
import type { Component } from "vue";
import type { ToolbarItem } from "../types";
import RToolbarButton from "./RToolbarButton.vue";

interface Props {
  groups: ToolbarItem[][];
  toolbarIcons: Partial<Record<ToolbarItem, Component>>;
  classNames?: {
    toolbar?: string;
    toolbarGroup?: string;
    button?: string;
    buttonActive?: string;
  };
  // Function props for state/actions
  isActive: (item: ToolbarItem) => boolean;
  isDisabled: (item: ToolbarItem) => boolean;
  getLabel: (item: ToolbarItem) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "execute", item: ToolbarItem): void;
}>();

function onExecute(item: ToolbarItem) {
  emit("execute", item);
}
</script>

<template>
  <div :class="['rte-toolbar', props.classNames?.toolbar]">
    <div
      v-for="(group, groupIndex) in props.groups"
      :key="groupIndex"
      :class="['rte-toolbar-group', props.classNames?.toolbarGroup]"
    >
      <template v-for="item in group" :key="item">
        <slot
          name="button"
          :item="item"
          :label="props.getLabel(item)"
          :active="props.isActive(item)"
          :disabled="props.isDisabled(item)"
          :runCommand="onExecute"
        >
          <RToolbarButton
            :item="item"
            :label="props.getLabel(item)"
            :active="props.isActive(item)"
            :disabled="props.isDisabled(item)"
            :icon="props.toolbarIcons[item]"
            :classNames="{
              button: props.classNames?.button,
              buttonActive: props.classNames?.buttonActive,
            }"
            @click="onExecute"
          />
        </slot>
      </template>
    </div>
  </div>
</template>

<style>
:where(.rte-toolbar) {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

:where(.rte-toolbar-group) {
  display: flex;
  padding-bottom: 0.5rem;
  gap: 0;
  border-radius: 0.375rem;
  overflow: hidden;
}
</style>
