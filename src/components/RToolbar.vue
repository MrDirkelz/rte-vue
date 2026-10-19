<script setup lang="ts">
import type { Component } from "vue";
import type { DownloadFormat, ToolbarItem } from "../types";
import RToolbarButton from "./RToolbarButton.vue";
import RDownloadButton from "./RDownloadButton.vue";

interface Props {
  groups: ToolbarItem[][];
  toolbarIcons: Partial<Record<ToolbarItem, Component>>;
  classNames?: {
    toolbar?: string;
    toolbarGroup?: string;
    button?: string;
    buttonActive?: string;
    downloadMenu?: string;
    downloadMenuItem?: string;
  };
  downloadFormats?: DownloadFormat[];
  // Function props for state/actions
  isActive: (item: ToolbarItem) => boolean;
  isDisabled: (item: ToolbarItem) => boolean;
  getLabel: (item: ToolbarItem) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "execute", item: ToolbarItem): void;
  (e: "downloadSelect", format: DownloadFormat): void;
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
          <RDownloadButton
            v-if="
              item === 'download' &&
              props.downloadFormats !== undefined &&
              props.downloadFormats.length >= 2
            "
            :formats="props.downloadFormats"
            :label="props.getLabel(item)"
            :icon="props.toolbarIcons[item]"
            :disabled="props.isDisabled(item)"
            :classNames="{
              button: props.classNames?.button,
              downloadMenu: props.classNames?.downloadMenu,
              downloadMenuItem: props.classNames?.downloadMenuItem,
            }"
            @select="emit('downloadSelect', $event)"
          />
          <RToolbarButton
            v-else
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
