import type { Component } from "vue";
import type { Editor } from "@tiptap/vue-3";
// Import extensions to ensure their types augment the Editor chain
import "@tiptap/extension-link";
import "@tiptap/starter-kit";

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
    };
    minHeight?: string;
    maxHeight?: string;
    width?: string;
    onChange?: (value: string) => void;
    onSave?: (value: string) => void;
    onRequestLink?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    transformPastedHtml?: (html: string) => string;
};

/**
 * Exposed interface for RTextEditor
 */
export interface RTextEditorExpose {
    editor: Editor | undefined;
}
