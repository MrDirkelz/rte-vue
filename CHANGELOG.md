# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-03-31

### Added
- **File Uploader**: New `uploader` prop that enables document file importing via toolbar button, drag-and-drop onto the editor, and paste. Supports `.docx`, `.odt`, `.odf`, and `.txt` files.
- New `"upload"` toolbar item with an upload icon in the toolbar.
- New `onFileUpload` and `onFileError` event callbacks for handling upload results.
- New `parseDocumentFile` utility exported for standalone use.
- New `.rte-drop-overlay` CSS class shown when dragging files over the editor.
- Added `mammoth` and `jszip` dependencies for document parsing.

## [1.0.3] - 2026-02-05

### Added
- Expanded `keywords` in `package.json` for better SEO and discoverability.
- Added `CHANGELOG.md` to track project history.

## [1.0.2] - 2026-02-05

### Fixed
- Added `README.md` to the npm package to resolve "No README data" warning.
- Improved documentation with a dedicated `examples/` directory.

## [1.0.1] - 2026-02-05

### Changed
- Refactored CSS usage to use `:where()` selectors for zero-specificity styling.
- Removed `scoped` styles from components to facilitate easier overrides.

## [1.0.0] - 2026-02-04

### Added
- Initial release of `rte-vue`.
- Basic TipTap integration with Markdown support.
