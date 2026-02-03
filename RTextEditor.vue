<script setup lang="ts">
/**
 * RTextEditor
 *
 * A fully configurable, framework-agnostic rich text editor component.
 *
 * @component
 * @example
 * <RTextEditor
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
import MarkdownIt from "markdown-it";
import TurndownService from "turndown";
import formatPastedHtml from "./formatPastedHtml";

const markdownParser = new MarkdownIt();
const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
});

/**
 * Heading level type for TipTap
 * @typedef {number} HeadingLevel
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Available toolbar buttons
 * @typedef {string} ToolbarItem
 */
export type ToolbarItem =
    | "bold"
    | "italic"
    | "strike"
    | "heading1"
    | "heading2"
    | "heading3"
    | "heading4"
    | "heading5"
    | "heading6"
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
 * @property {"json" | "markdown"} [contentFormat="json"] - Content format for v-model
 * @property {number} [headingOffset=0] - Offset for heading levels (0=no offset, 1=increment by 1)
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
    contentFormat?: "json" | "markdown";
    headingOffset?: number;
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
    contentFormat: "json",
    headingOffset: 0,
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

const modelValue = defineModel<string>("modelValue", { default: "" });
const text = defineModel<string>("text", { default: "" });
const textLanguage = defineModel<string | undefined>("textLanguage");

// Use modelValue if provided, otherwise fall back to text
const content = computed({
    get: () => modelValue.value || text.value,
    set: (value) => {
        modelValue.value = value;
        text.value = value;
    },
});

const showLinkModal = ref(false);
const url = ref("");
const urlInput = ref<HTMLInputElement | undefined>(undefined);
const lastEmitted = ref<string | undefined>(undefined);

/** Deserialize input string to TipTap content based on format */
function deserializeContent(input: string, format: "json" | "markdown"): any {
    if (!input) return "";
    if (format === "markdown") {
        const html = markdownParser.render(input);
        return html;
    }
    // JSON format
    try {
        return JSON.parse(input);
    } catch {
        return input;
    }
}

/** Serialize TipTap editor content to string based on format */
function serializeContent(editor: any, format: "json" | "markdown"): string {
    if (!editor) return "";
    if (format === "markdown") {
        const html = editor.getHTML();
        return turndownService.turndown(html);
    }
    // JSON format
    const json = editor.getJSON();
    return JSON.stringify(json);
}

const editorText = computed(() => {
    return deserializeContent(content.value, props.contentFormat ?? "json");
});

const editor = useEditor({
    content: editorText.value,
    extensions: [
        StarterKit.configure({
            heading: { levels: [1, 2, 3, 4, 5, 6] },
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
            props.onSave(content.value);
            return true;
        },
    },
    onUpdate: ({ editor }) => {
        const nextValue = serializeContent(editor, props.contentFormat ?? "json");
        lastEmitted.value = nextValue;
        content.value = nextValue;
        props.onChange?.(nextValue);
    },
    onFocus: () => props.onFocus?.(),
    onBlur: () => props.onBlur?.(),
});

const defaultToolbarItems: ToolbarItem[] = [
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
];

const toolbarItems = computed(() =>
    props.toolbarItems?.length ? props.toolbarItems : defaultToolbarItems,
);

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
    heading1: "H1",
    heading2: "H2",
    heading3: "H3",
    heading4: "H4",
    heading5: "H5",
    heading6: "H6",
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
        case "heading1":
            return editor.value.isActive("heading", { level: 1 + (props.headingOffset ?? 0) });
        case "heading2":
            return editor.value.isActive("heading", { level: 2 + (props.headingOffset ?? 0) });
        case "heading3":
            return editor.value.isActive("heading", { level: 3 + (props.headingOffset ?? 0) });
        case "heading4":
            return editor.value.isActive("heading", { level: 4 + (props.headingOffset ?? 0) });
        case "heading5":
            return editor.value.isActive("heading", { level: 5 + (props.headingOffset ?? 0) });
        case "heading6":
            return editor.value.isActive("heading", { level: 6 + (props.headingOffset ?? 0) });
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
    const offset = props.headingOffset ?? 0;
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
        case "heading1":
            chain.toggleHeading({ level: Math.min(1 + offset, 6) as HeadingLevel }).run();
            break;
        case "heading2":
            chain.toggleHeading({ level: Math.min(2 + offset, 6) as HeadingLevel }).run();
            break;
        case "heading3":
            chain.toggleHeading({ level: Math.min(3 + offset, 6) as HeadingLevel }).run();
            break;
        case "heading4":
            chain.toggleHeading({ level: Math.min(4 + offset, 6) as HeadingLevel }).run();
            break;
        case "heading5":
            chain.toggleHeading({ level: Math.min(5 + offset, 6) as HeadingLevel }).run();
            break;
        case "heading6":
            chain.toggleHeading({ level: 6 as HeadingLevel }).run();
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
    () => content.value,
    (newValue) => {
        if (!editor.value) return;
        if (newValue === lastEmitted.value) return;
        if (!newValue) {
            editor.value.commands.setContent("");
            return;
        }
        const deserialized = deserializeContent(newValue, props.contentFormat ?? "json");
        editor.value.commands.setContent(deserialized);
    },
);

watch(
    () => textLanguage.value,
    (newLang, oldLang) => {
        if (!newLang || newLang === oldLang) return;
        if (!editor.value) return;
        if (!content.value) {
            editor.value.commands.setContent("");
            return;
        }
        const deserialized = deserializeContent(content.value, props.contentFormat ?? "json");
        editor.value.commands.setContent(deserialized);
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
            <div
                v-if="props.placeholder && isEmpty"
                :class="['rte-placeholder', props.classNames?.placeholder]"
            >
                {{ props.placeholder }}
            </div>
            <EditorContent
                :editor="editor"
                :class="['rte-editor-content', props.classNames?.editorContent]"
            />
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
    gap: 1rem;
    padding: 0.75rem;
    background-color: #f4f4f5;
    border-bottom: 1px solid #e4e4e7;
}

.rte-toolbar-group {
    display: flex;
    gap: 0;
    border-radius: 0.375rem;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.rte-button {
    padding: 0.5rem 0.75rem;
    border-radius: 0;
    border: 1px solid #e4e4e7;
    font-size: 0.875rem;
    cursor: pointer;
    background-color: #ffffff;
    color: #52525b;
    transition: all 0.15s ease-in-out;
    font-weight: 500;
}

.rte-button:first-child {
    border-radius: 0.375rem 0 0 0.375rem;
}

.rte-button:last-child {
    border-radius: 0 0.375rem 0.375rem 0;
}

.rte-button:hover:not(:disabled) {
    background-color: #fafafa;
    border-color: #d4d4d8;
}

.rte-button:active:not(:disabled) {
    background-color: #f5f5f5;
}

.rte-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.rte-button-active {
    background-color: #d4d4d8;
    color: #18181b;
    border-color: #b4b4b8;
}

.rte-editor {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #e4e4e7;
    border-radius: 0.5rem;
    background-color: #ffffff;
}

.rte-editor-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: inherit;
}

.rte-editor-content :deep(.tiptap) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: inherit;
}

.rte-placeholder {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    pointer-events: none;
    font-size: 0.95rem;
    z-index: 1;
    color: #a1a1aa;
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
    border-radius: 0.75rem;
    padding: 1.5rem;
    width: min(24rem, 90vw);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background-color: #ffffff;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.rte-modal-title {
    font-weight: 700;
    font-size: 1.125rem;
    color: #18181b;
}

.rte-modal-input {
    border-radius: 0.5rem;
    padding: 0.75rem;
    font-size: 0.95rem;
    border: 1px solid #e4e4e7;
    background-color: #ffffff;
}

.rte-modal-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
}

.rte-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.rte-modal-button {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    border: 1px solid #e4e4e7;
    background-color: #ffffff;
    color: #52525b;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.15s ease-in-out;
}

.rte-modal-button:hover:not(:disabled) {
    background-color: #fafafa;
    border-color: #d4d4d8;
}

.rte-modal-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.rte-editor-content :deep(.ProseMirror) {
    flex: 1;
    width: 100%;
    padding: 0.75rem;
    outline: none;
    overflow-y: auto;
    box-sizing: border-box;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #27272a;
}

.rte-editor-content :deep(.ProseMirror) > :first-child {
    margin-top: 0;
}

.rte-editor-content :deep(.ProseMirror) h1 {
    font-size: 2em;
    font-weight: 700;
    margin: 0.67em 0;
    line-height: 1.2;
    color: #18181b;
}

.rte-editor-content :deep(.ProseMirror) h2 {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0.75em 0;
    line-height: 1.3;
    color: #18181b;
}

.rte-editor-content :deep(.ProseMirror) h3 {
    font-size: 1.17em;
    font-weight: 600;
    margin: 0.83em 0;
    line-height: 1.4;
    color: #18181b;
}

.rte-editor-content :deep(.ProseMirror) h4 {
    font-size: 1em;
    font-weight: 600;
    margin: 1em 0;
    line-height: 1.4;
    color: #18181b;
}

.rte-editor-content :deep(.ProseMirror) h5 {
    font-size: 0.83em;
    font-weight: 600;
    margin: 0.5rem 0;
    line-height: 1.3;
    color: #18181b;
}

.rte-editor-content :deep(.ProseMirror) h6 {
    font-size: 0.67em;
    font-weight: 600;
    margin: 0.5rem 0;
    line-height: 1.3;
    color: #18181b;
}

.rte-editor-content :deep(.ProseMirror) p {
    margin: 0.5rem 0;
}

.rte-editor-content :deep(.ProseMirror) strong {
    font-weight: 700;
}

.rte-editor-content :deep(.ProseMirror) em {
    font-style: italic;
}

.rte-editor-content :deep(.ProseMirror) ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
}

.rte-editor-content :deep(.ProseMirror) ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
}

.rte-editor-content :deep(.ProseMirror) li {
    margin: 0.25rem 0;
}

.rte-editor-content :deep(.ProseMirror) a {
    color: #3b82f6;
    text-decoration: underline;
    cursor: pointer;
    transition: color 0.15s ease-in-out;
}

.rte-editor-content :deep(.ProseMirror) a:hover {
    color: #2563eb;
}

.rte-editor-content :deep(.ProseMirror) blockquote {
    border-left: 4px solid #e4e4e7;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #71717a;
    font-style: italic;
}

.rte-editor-content :deep(.ProseMirror) code {
    background-color: #f4f4f5;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.875em;
}

.rte-editor-content :deep(.ProseMirror) pre {
    background-color: #27272a;
    color: #fafafa;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
}

.rte-editor-content :deep(.ProseMirror) pre code {
    background-color: transparent;
    color: inherit;
    padding: 0;
    border-radius: 0;
    font-size: 0.875rem;
}
</style>
