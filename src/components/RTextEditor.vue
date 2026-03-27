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
import type { Editor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { computed, ref, watch } from "vue";
import MarkdownIt from "markdown-it";
import TurndownService from "turndown";
import formatPastedHtml from "../utils/formatPastedHtml";
import type { HeadingLevel, ToolbarItem, RichTextEditorProps } from "../types";
import { defaultToolbarIcons } from "./icons";
import RToolbar from "./RToolbar.vue";

const markdownParser = new MarkdownIt();
const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
});

const props = withDefaults(defineProps<RichTextEditorProps>(), {
    disabled: false,
    showToolbar: true,
    contentFormat: "html",
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

const lastEmitted = ref<string | undefined>(undefined);

/** Deserialize input string to TipTap content based on format */
function deserializeContent(input: string, format: "html" | "markdown"): any {
    if (!input) return "";
    if (format === "markdown") {
        return markdownParser.render(input);
    }
    // HTML format — TipTap accepts HTML strings directly
    return input;
}

/** Serialize TipTap editor content to string based on format */
function serializeContent(editor: any, format: "html" | "markdown"): string {
    if (!editor) return "";
    if (format === "markdown") {
        return turndownService.turndown(editor.getHTML());
    }
    // HTML format
    return editor.getHTML();
}

const editorText = computed(() => {
    return deserializeContent(content.value, props.contentFormat ?? "html");
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
        const nextValue = serializeContent(editor, props.contentFormat ?? "html");
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

const defaultLabels: Record<ToolbarItem, string> = {
    bold: "B",
    italic: "I",
    strike: "Strike",
    heading1: "H1",
    heading2: "H2",
    heading3: "H3",
    heading4: "H4",
    heading5: "H5",
    heading6: "H6",
    bulletList: "Bullets",
    orderedList: "Numbers",
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
            props.onRequestLink?.();
            break;
        case "unlink":
            chain.unsetLink().run();
            break;
        default:
            break;
    }
}

watch(
    () => props.disabled,
    () => {
        editor.value?.setEditable(!props.disabled);
    },
);

watch(
    () => content.value,
    (newValue) => {
        if (!editor.value) return;
        if (newValue === lastEmitted.value) return;
        if (!newValue) {
            editor.value.commands.setContent("");
            return;
        }
        const deserialized = deserializeContent(newValue, props.contentFormat ?? "html");
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
        const deserialized = deserializeContent(content.value, props.contentFormat ?? "html");
        editor.value.commands.setContent(deserialized);
    },
);

defineExpose({
    get editor(): Editor | undefined {
        return editor.value;
    },
});
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

        <div v-if="!props.disabled && props.showToolbar">
            <slot
                name="toolbar"
                :items="toolbarItems"
                :groups="toolbarGroups"
                :isActive="isActive"
                :isDisabled="isDisabled"
                :getLabel="getLabel"
                :runCommand="runCommand"
            >
                <RToolbar
                    :groups="toolbarGroups"
                    :toolbarIcons="defaultToolbarIcons"
                    :classNames="{
                        toolbar: props.classNames?.toolbar,
                        toolbarGroup: props.classNames?.toolbarGroup,
                        button: props.classNames?.button,
                        buttonActive: props.classNames?.buttonActive,
                    }"
                    :isActive="isActive"
                    :isDisabled="isDisabled"
                    :getLabel="getLabel"
                    @execute="runCommand"
                >
                    <template #button="slotProps">
                        <slot name="toolbar-button" v-bind="slotProps" />
                    </template>
                </RToolbar>
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
</template>

<style>
:where(.rte-root) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    height: 100%;
}

:where(.rte-header) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

:where(.rte-icon) {
    width: 1.5rem;
    height: 1.5rem;
    color: #52525b; /* zinc-600 */
}

:where(.rte-title) {
    font-weight: 500;
    font-size: 0.875rem;
    color: #3f3f46; /* zinc-700 */
}

:where(.rte-editor) {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
}

:where(.rte-editor-content) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: inherit;
    border-radius: 0.375rem;
    background-color: #ffffff;
    box-shadow: 0 0 0 1px #d4d4d8 inset; /* zinc-300 */
    padding: 0.75rem;
    overflow: hidden;
    margin-bottom: 0.25rem;
    transition: box-shadow 0.15s ease-in-out;
}

:where(.rte-editor-content:focus-within) {
    box-shadow: 0 0 0 2px #09090b inset; /* zinc-950 */
    outline: none;
}

:where(.rte-editor-content .tiptap) {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: inherit;
    outline: none;
}

:where(.rte-placeholder) {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    pointer-events: none;
    font-size: 0.95rem;
    z-index: 1;
    color: #a1a1aa; /* zinc-400 */
}

:where(.rte-editor-content .ProseMirror) {
    flex: 1;
    width: 100%;
    outline: none;
    overflow-y: auto;
    box-sizing: border-box;
    font-size: 0.95rem;
    line-height: 1.6;
    color: #27272a;
}

:where(.rte-editor-content .ProseMirror > :first-child) {
    margin-top: 0;
}

:where(.rte-editor-content .ProseMirror h1) {
    font-size: 2em;
    font-weight: 700;
    margin: 0.67em 0;
    line-height: 1.2;
    color: #18181b;
}

:where(.rte-editor-content .ProseMirror h2) {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0.75em 0;
    line-height: 1.3;
    color: #18181b;
}

:where(.rte-editor-content .ProseMirror h3) {
    font-size: 1.17em;
    font-weight: 600;
    margin: 0.83em 0;
    line-height: 1.4;
    color: #18181b;
}

:where(.rte-editor-content .ProseMirror h4) {
    font-size: 1em;
    font-weight: 600;
    margin: 1em 0;
    line-height: 1.4;
    color: #18181b;
}

:where(.rte-editor-content .ProseMirror h5) {
    font-size: 0.83em;
    font-weight: 600;
    margin: 0.5rem 0;
    line-height: 1.3;
    color: #18181b;
}

:where(.rte-editor-content .ProseMirror h6) {
    font-size: 0.67em;
    font-weight: 600;
    margin: 0.5rem 0;
    line-height: 1.3;
    color: #18181b;
}

:where(.rte-editor-content .ProseMirror p) {
    margin: 0.5rem 0;
}

:where(.rte-editor-content .ProseMirror strong) {
    font-weight: 700;
}

:where(.rte-editor-content .ProseMirror em) {
    font-style: italic;
}

:where(.rte-editor-content .ProseMirror ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
}

:where(.rte-editor-content .ProseMirror ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
}

:where(.rte-editor-content .ProseMirror li) {
    margin: 0.25rem 0;
}

:where(.rte-editor-content .ProseMirror a) {
    color: #3b82f6;
    text-decoration: underline;
    cursor: pointer;
    transition: color 0.15s ease-in-out;
}

:where(.rte-editor-content .ProseMirror a:hover) {
    color: #2563eb;
}

:where(.rte-editor-content .ProseMirror blockquote) {
    border-left: 4px solid #e4e4e7;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #71717a;
    font-style: italic;
}

:where(.rte-editor-content .ProseMirror code) {
    background-color: #f4f4f5;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.875em;
}

:where(.rte-editor-content .ProseMirror pre) {
    background-color: #27272a;
    color: #fafafa;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
}

:where(.rte-editor-content .ProseMirror pre code) {
    background-color: transparent;
    color: inherit;
    padding: 0;
    border-radius: 0;
    font-size: 0.875rem;
}
</style>
