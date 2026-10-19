/**
 * Triggers a browser download of `content` as a file named `filename`.
 *
 * - When `content` is a string, it's wrapped in a Blob with the given `mimeType`.
 * - When `content` is already a Blob, it's used directly and `mimeType` is ignored
 *   (the Blob carries its own type, set by whoever constructed it).
 *
 * Uses the standard `<a download>` + `URL.createObjectURL` pattern.
 */
export default function triggerDownload(
    content: string | Blob,
    filename: string,
    mimeType?: string,
): void {
    const blob =
        content instanceof Blob
            ? content
            : new Blob([content], mimeType ? { type: mimeType } : undefined);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
