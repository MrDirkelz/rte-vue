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
    | "unlink"
    | "upload"
    | "download"
    | "copy";

/**
 * A downloadable format option. Used with the `downloadFormats` prop.
 *
 * Built-in IDs (`"markdown"`, `"html"`, `"txt"`) are handled by rte-vue automatically.
 * Other IDs require an `onDownload` handler that produces and saves the file (returning
 * `false` so rte-vue's default `<a download>` save is suppressed).
 */
export type DownloadFormat = {
    /** Unique identifier. Built-in IDs are `"markdown"`, `"html"`, `"txt"`. */
    id: string;
    /** Label shown in the dropdown menu (e.g. "Markdown (.md)"). */
    label: string;
    /** File extension without the dot (e.g. "md", "docx"). Used to build the filename. */
    extension: string;
    /**
     * Optional MIME type for the Blob. Defaults based on built-in IDs:
     *   markdown → text/markdown
     *   html     → text/html
     *   txt      → text/plain
     * For custom IDs, defaults to "application/octet-stream" when omitted.
     */
    mimeType?: string;
};

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
    contentFormat?: "html" | "markdown";
    headingOffset?: number;
    /** When true, enables file uploading: adds an "upload" toolbar button and allows drag-and-drop / paste of .docx, .odt, .odf, and .txt files directly onto the editor. */
    uploader?: boolean;
    /** When true, enables downloading: adds a "download" toolbar button that saves the editor's current content to a file in the configured contentFormat. */
    downloader?: boolean;
    /** Default filename suggested to the browser when downloading. Defaults to "document". */
    downloadFilename?: string;
    /**
     * Formats offered when the user triggers a download.
     *
     * - omitted or empty → behaves like 1.2.x: single button, downloads in `contentFormat`
     * - 1 entry → single button, downloads in that one format (no dropdown)
     * - 2+ entries → the download toolbar button opens a dropdown menu of these formats
     *
     * Built-in `id` values (`"markdown"`, `"html"`, `"txt"`) are saved automatically.
     * Any other `id` requires an `onDownload` handler.
     */
    downloadFormats?: DownloadFormat[];
    /** When true, enables a "copy" toolbar button that copies the editor's current content to the clipboard. */
    copyable?: boolean;
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
        downloadMenu?: string; // Download dropdown menu
        downloadMenuItem?: string; // Download dropdown menu item
    };
    minHeight?: string;
    maxHeight?: string;
    width?: string;
    onChange?: (value: string) => void;
    onSave?: (value: string) => void;
    onRequestLink?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    /** Called after a file is successfully parsed. Receives the original File and the parsed HTML string. */
    onFileUpload?: (file: File, content: string) => void;
    /** Called when file parsing fails. Receives the Error. */
    onFileError?: (error: Error) => void;
    /** Called when the user triggers a download. Receives the editor content already converted for the
     *  chosen format, the filename (with extension), and the full `DownloadFormat` descriptor.
     *
     *  Return value semantics:
     *  - **`false`** — suppress rte-vue's default save entirely (your handler took care of it, or you
     *    intentionally want nothing to happen). Works for both built-in and custom formats.
     *  - **`true` / `undefined` / no return** — for **built-in** formats (`markdown`, `html`, `txt`,
     *    `docx`, `odt`, `odf`) rte-vue triggers the default browser download after your handler runs.
     *    For **custom** formats (any other `id`) there is no default — your handler MUST perform the
     *    save itself, otherwise a `console.warn` is logged and no file is saved.
     *
     *  Breaking change in 2.0.0: `format` is now a `DownloadFormat` object instead of `"html" | "markdown"`. */
    onDownload?: (payload: {
        content: string;
        filename: string;
        format: DownloadFormat;
    }) => boolean | void;
    /** Called when the user triggers a copy. Receives the editor content in the configured contentFormat.
     *  Return `false` to suppress the default clipboard write (host wants to handle it entirely).
     *
     *  Note: the default clipboard write puts rich `text/html` (plus a plain-text
     *  fallback) on the clipboard so paste targets keep formatting, regardless of
     *  `contentFormat`. `payload.content` is still the configured-format string. */
    onCopy?: (payload: {
        content: string;
        format: "html" | "markdown";
    }) => boolean | void;
    transformPastedHtml?: (html: string) => string;
};

/**
 * Exposed interface for RTextEditor
 */
export interface RTextEditorExpose {
    editor: Editor | undefined;
}
