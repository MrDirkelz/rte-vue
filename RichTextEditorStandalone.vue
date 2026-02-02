<script setup lang="ts">
/**
 * RichTextEditorStandalone
 *
 * A fully configurable, framework-agnostic rich text editor component.
 *
 * @component
 * @example
 * <RichTextEditorStandalone
 *   v-model:text="content"
 *   title="Edit Content"
 *   placeholder="Start typing..."
 * />
 */
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { computed, nextTick, ref, watch } from "vue";
import type { Component } from "vue";
import formatPastedHtml from "./formatPastedHtml";

/**
 * Available toolbar buttons
 * @typedef {string} ToolbarItem
 */
export type ToolbarItem =
    | "bold"
    | "italic"
    | "strike"
    | "heading2"
    | "heading3"
    | "heading4"
    | "heading5"
    | "bulletList"
    | "orderedList"
    | "link"
    | "unlink";

/**
 * Component Props
 *
 * @property {string} [title] - Header title
 * @property {Component} [icon] - Icon component to display next to title
 * @property {boolean} [disabled=false] - Disable editor and toolbar
 * @property {boolean} [showToolbar=true] - Show/hide toolbar
 * @property {string} [placeholder] - Placeholder text
 * @property {ToolbarItem[]} [toolbarItems] - Items to display in toolbar
 * @property {ToolbarItem[][]} [toolbarGroups] - Organize items into groups
 * @property {Record<ToolbarItem, string>} [toolbarLabels] - Custom button labels
 * @property {Object} [classNames] - Custom CSS classes
 * @property {string} [minHeight] - Min height (e.g., "300px")
 * @property {string} [maxHeight] - Max height (e.g., "500px")
 * @property {string} [width] - Width (e.g., "100%")
 * @property {Function} [onChange] - Called on text change
 * @property {Function} [onSave] - Called on Ctrl/Cmd+S
 * @property {Function} [onFocus] - Called on editor focus
 * @property {Function} [onBlur] - Called on editor blur
 * @property {Function} [transformPastedHtml] - Transform pasted HTML
 */
export type RichTextEditorProps = {
    title?: string;
    icon?: Component;
    disabled?: boolean;
    showToolbar?: boolean;
    placeholder?: string;
    toolbarItems?: ToolbarItem[];
    toolbarGroups?: ToolbarItem[][];
    toolbarLabels?: Partial<Record<ToolbarItem, string>>;
    classNames?: {
        root?: string; // Root container
        header?: string; // Header wrapper
        title?: string; // Title text
        icon?: string; // Icon element
        toolbar?: string; // Toolbar container
        toolbarGroup?: string; // Button group
        button?: string; // Toolbar button
        buttonActive?: string; // Active button state
        editor?: string; // Editor wrapper
        editorContent?: string; // ProseMirror content
        placeholder?: string; // Placeholder text
        modalBackdrop?: string; // Link modal backdrop
        modal?: string; // Link modal dialog
        modalTitle?: string; // Modal title
        modalInput?: string; // Modal URL input
        modalActions?: string; // Modal actions footer
        modalButton?: string; // Modal buttons
    };
    minHeight?: string;
    maxHeight?: string;
    width?: string;
    onChange?: (value: string) => void;
    onSave?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    transformPastedHtml?: (html: string) => string;
};

const props = withDefaults(defineProps<RichTextEditorProps>(), {
    disabled: false,
    showToolbar: true,
    transformPastedHtml: formatPastedHtml,
    toolbarItems: () => [
        "bold",
        "italic",
        "strike",
        "heading2",
        "heading3",
        "heading4",
        "heading5",
        "bulletList",
        "orderedList",
        "link",
        "unlink",
    ],
});

const text = defineModel<string>("text", { default: "" });
const textLanguage = defineModel<string | undefined>("textLanguage");

const showLinkModal = ref(false);
const url = ref("");
const urlInput = ref<HTMLInputElement | undefined>(undefined);
const lastEmitted = ref<string | undefined>(undefined);

const editorText = computed(() => {
    if (!text.value) return "";
    try {
        return JSON.parse(text.value);
    } catch {
        return text.value;
    }
});

const editor = useEditor({
    content: editorText.value,
    extensions: [
        StarterKit.configure({
            heading: { levels: [2, 3, 4, 5, 6] },
        }),
        Link.configure({ openOnClick: false }),
    ],
    editable: !props.disabled,
    editorProps: {
        attributes: {
            class: "rte-prosemirror",
        },
        handlePaste(_, event) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            let html = clipboardData.getData("text/html");
            if (!html) return false;

            const transform = props.transformPastedHtml ?? ((value: string) => value);
            editor.value?.commands.insertContent(transform(html));
            return true;
        },
        handleKeyDown(_, event) {
            if (!props.onSave) return false;
            const isSave = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
            if (!isSave) return false;
            event.preventDefault();
            props.onSave(text.value);
            return true;
        },
    },
    onUpdate: ({ editor }) => {
        const raw = editor.getJSON();
        const nextValue = JSON.stringify(raw);
        lastEmitted.value = nextValue;
        text.value = nextValue;
        props.onChange?.(nextValue);
    },
    onFocus: () => props.onFocus?.(),
    onBlur: () => props.onBlur?.(),
});

const toolbarItems = computed(() => (props.toolbarItems?.length ? props.toolbarItems : []));

const toolbarGroups = computed(() =>
    props.toolbarGroups?.length ? props.toolbarGroups : [toolbarItems.value],
);

const hasTextSelected = computed(() => {
    const state = editor.value?.state;
    return state ? !state.selection.empty : false;
});

const hasLinkSelected = computed(() => {
    const attrs = editor.value?.getAttributes("link");
    return !!attrs?.href;
});

const isEmpty = computed(() => editor.value?.isEmpty ?? true);

const editorStyle = computed(() => ({
    minHeight: props.minHeight,
    maxHeight: props.maxHeight,
    width: props.width,
}));

const activeButtonClass = computed(() => props.classNames?.buttonActive);

const defaultLabels: Record<ToolbarItem, string> = {
    bold: "Bold",
    italic: "Italic",
    strike: "Strike",
    heading2: "H2",
    heading3: "H3",
    heading4: "H4",
    heading5: "H5",
    bulletList: "Bullets",
    orderedList: "Numbered",
    link: "Link",
    unlink: "Unlink",
};

/** Get custom or default label for toolbar item */
function getLabel(item: ToolbarItem) {
    return props.toolbarLabels?.[item] ?? defaultLabels[item];
}

/** Check if toolbar item is currently active */
function isActive(item: ToolbarItem) {
    if (!editor.value) return false;
    switch (item) {
        case "bold":
            return editor.value.isActive("bold");
        case "italic":
            return editor.value.isActive("italic");
        case "strike":
            return editor.value.isActive("strike");
        case "heading2":
            return editor.value.isActive("heading", { level: 2 });
        case "heading3":
            return editor.value.isActive("heading", { level: 3 });
        case "heading4":
            return editor.value.isActive("heading", { level: 4 });
        case "heading5":
            return editor.value.isActive("heading", { level: 5 });
        case "bulletList":
            return editor.value.isActive("bulletList");
        case "orderedList":
            return editor.value.isActive("orderedList");
        case "link":
        case "unlink":
            return editor.value.isActive("link");
        default:
            return false;
    }
}

/** Check if toolbar item should be disabled */
function isDisabled(item: ToolbarItem) {
    if (props.disabled) return true;
    if (item === "link") return !hasTextSelected.value;
    if (item === "unlink") return !hasLinkSelected.value;
    return false;
}

/** Execute toolbar command */
function runCommand(item: ToolbarItem) {
    if (!editor.value) return;
    const chain = editor.value.chain().focus();
    switch (item) {
        case "bold":
            chain.toggleBold().run();
            break;
        case "italic":
            chain.toggleItalic().run();
            break;
        case "strike":
            chain.toggleStrike().run();
            break;
        case "heading2":
            chain.toggleHeading({ level: 2 }).run();
            break;
        case "heading3":
            chain.toggleHeading({ level: 3 }).run();
            break;
        case "heading4":
            chain.toggleHeading({ level: 4 }).run();
            break;
        case "heading5":
            chain.toggleHeading({ level: 5 }).run();
            break;
        case "bulletList":
            chain.toggleBulletList().run();
            break;
        case "orderedList":
            chain.toggleOrderedList().run();
            break;
        case "link":
            openLinkModal();
            break;
        case "unlink":
            chain.unsetLink().run();
            break;
        default:
            break;
    }
}

function openLinkModal() {
    if (!editor.value) return;
    const attrs = editor.value.getAttributes("link");
    url.value = attrs?.href ?? "";
    showLinkModal.value = true;
}

function addLink() {
    if (!url.value || !editor.value) return;
    const chain = editor.value.chain().focus();
    if (hasLinkSelected.value) chain.extendMarkRange("link");
    chain.setLink({ href: url.value }).run();
    showLinkModal.value = false;
}

watch(
    () => props.disabled,
    () => {
        editor.value?.setEditable(!props.disabled);
    },
);

watch(showLinkModal, async () => {
    if (showLinkModal.value) {
        await nextTick();
        urlInput.value?.focus();
        return;
    }
    editor.value?.commands.focus();
});

watch(
    () => text.value,
    (newValue) => {
        if (!editor.value) return;
        if (newValue === lastEmitted.value) return;
        if (!newValue) {
            editor.value.commands.setContent("");
            return;
        }
        try {
            const parsed = JSON.parse(newValue);
            editor.value.commands.setContent(parsed);
        } catch {
            editor.value.commands.setContent(newValue);
        }
    },
);

watch(
    () => textLanguage.value,
    (newLang, oldLang) => {
        if (!newLang || newLang === oldLang) return;
        if (!editor.value) return;
        if (!text.value) {
            editor.value.commands.setContent("");
            return;
        }
        try {
            const parsed = JSON.parse(text.value);
            editor.value.commands.setContent(parsed);
        } catch {
            editor.value.commands.setContent(text.value);
        }
    },
);
</script>

<template>
    <div :class="['rte-root', props.classNames?.root, $attrs.class]">
        <div v-if="props.title || props.icon" :class="['rte-header', props.classNames?.header]">
            <component
                v-if="props.icon"
                :is="props.icon"
                :class="['rte-icon', props.classNames?.icon]"
            />
            <div :class="['rte-title', props.classNames?.title]">{{ props.title }}</div>
        </div>

        <div
            v-if="!props.disabled && props.showToolbar"
            :class="['rte-toolbar', props.classNames?.toolbar]"
        >
            <slot
                name="toolbar"
                :items="toolbarItems"
                :groups="toolbarGroups"
                :isActive="isActive"
                :isDisabled="isDisabled"
                :getLabel="getLabel"
                :runCommand="runCommand"
            >
                <div
                    v-for="(group, groupIndex) in toolbarGroups"
                    :key="groupIndex"
                    :class="['rte-toolbar-group', props.classNames?.toolbarGroup]"
                >
                    <template v-for="item in group" :key="item">
                        <slot
                            name="toolbar-button"
                            :item="item"
                            :label="getLabel(item)"
                            :active="isActive(item)"
                            :disabled="isDisabled(item)"
                            :runCommand="runCommand"
                        >
                            <button
                                :class="[
                                    'rte-button',
                                    props.classNames?.button,
                                    { 'rte-button-active': isActive(item) },
                                    activeButtonClass && isActive(item)
                                        ? activeButtonClass
                                        : undefined,
                                ]"
                                :disabled="isDisabled(item)"
                                @click="runCommand(item)"
                                type="button"
                            >
                                {{ getLabel(item) }}
                            </button>
                        </slot>
                    </template>
                </div>
            </slot>
        </div>

        <div :class="['rte-editor', props.classNames?.editor]" :style="editorStyle">
            <EditorContent
                :editor="editor"
                :class="['rte-editor-content', props.classNames?.editorContent]"
            />
            <div
                v-if="props.placeholder && isEmpty"
                :class="['rte-placeholder', props.classNames?.placeholder]"
            >
                {{ props.placeholder }}
            </div>
        </div>
    </div>

    <div
        v-if="showLinkModal"
        :class="['rte-modal-backdrop', props.classNames?.modalBackdrop]"
        @click.self="showLinkModal = false"
        @keydown.esc="showLinkModal = false"
    >
        <div :class="['rte-modal', props.classNames?.modal]" @keydown.enter="addLink">
            <div :class="['rte-modal-title', props.classNames?.modalTitle]">Add Link</div>
            <input
                ref="urlInput"
                v-model="url"
                :class="['rte-modal-input', props.classNames?.modalInput]"
                :disabled="props.disabled"
                name="url"
                placeholder="https://example.com"
                type="text"
            />
            <div :class="['rte-modal-actions', props.classNames?.modalActions]">
                <button
                    :class="['rte-modal-button', props.classNames?.modalButton]"
                    :disabled="!url"
                    @click="addLink"
                    type="button"
                >
                    Ok
                </button>
                <button
                    :class="['rte-modal-button', props.classNames?.modalButton]"
                    @click="showLinkModal = false"
                    type="button"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.rte-root {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: 100%;
}

.rte-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.rte-icon {
    width: 1.5rem;
    height: 1.5rem;
}

.rte-title {
    font-weight: 600;
}

.rte-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.rte-toolbar-group {
    display: flex;
    gap: 0.25rem;
}

.rte-button {
    border: 1px solid #d4d4d8;
    background: #f4f4f5;
    padding: 0.35rem 0.6rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
}

.rte-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.rte-button-active {
    background: #e4e4e7;
}

.rte-editor {
    position: relative;
    border: 1px solid #d4d4d8;
    border-radius: 0.5rem;
    background: #ffffff;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.rte-editor-content {
    flex: 1;
}

.rte-placeholder {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    color: #a1a1aa;
    pointer-events: none;
    font-size: 0.95rem;
}

.rte-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
}

.rte-modal {
    background: #ffffff;
    border-radius: 0.75rem;
    padding: 1rem;
    width: min(24rem, 90vw);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.rte-modal-title {
    font-weight: 600;
}

.rte-modal-input {
    border: 1px solid #d4d4d8;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.95rem;
}

.rte-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

.rte-modal-button {
    border: 1px solid #d4d4d8;
    background: #f4f4f5;
    padding: 0.35rem 0.8rem;
    border-radius: 0.5rem;
    cursor: pointer;
}

.rte-modal-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.rte-prosemirror {
    min-height: 100%;
    padding: 0.75rem;
    outline: none;
}

div[data-tiptap-editor] {
    height: 100%;
    display: flex;
    flex-direction: column;
}

div[data-tiptap-editor] > div {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.ProseMirror {
    height: 100%;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
    flex: 1;
    overflow-y: auto;
}

.ProseMirror > :first-child {
    margin-top: 0;
}

.ProseMirror h5 {
    font-size: 0.83em;
    font-weight: 600;
    margin: 0.5rem 0;
    line-height: 1.3;
}
</style>
