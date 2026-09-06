# Film X

English | [中文](README.md)

A collection of film image processing tools that run locally in your browser. Image decoding, editing, and export all happen on your device; nothing is uploaded to a server.

## Tools

### Half-Frame Film Splitter

- Batch import TIFF, JPEG, PNG, and WebP files, or drag and drop them directly onto the page.
- Automatically detects the split position and gutter width of each scanned image, with manual fine-tuning available.
- Each side can be rotated independently, and the current settings can be applied to all images.
- Export as JPEG, PNG, WebP, or TIF, with batch results bundled into a ZIP download.

### Layout Composer

- Place up to two images and compose them into a single output image; supports click-to-select and drag-and-drop import of TIFF, JPEG, PNG, and WebP.
- Supports side-by-side and stacked layouts, as well as swapping the image order.
- The canvas can use a preset ratio, a custom ratio, or a ratio computed automatically from the images and spacing.
- Outer margins and the gap between images can be adjusted with sliders or typed in directly; outer margins support either a uniform value or independent top, right, bottom, and left values.
- Choose between fill (crop) and fit (show the entire image), enter a hex RGB background color, and pick a solid, checkerboard, or dotted background pattern.
- Export as JPEG or PNG.

The horizontal menu at the top of the page switches between the two tools. Each tool page keeps its working state, so imported images are not lost when you switch away and come back.

## Interface and Theme

- Follows the system light / dark appearance by default; you can also cycle through modes manually from the top-right corner of the page.
- Light mode uses `#F2F3F5` as the page background; dark mode uses `#0A0A0A`.
- The primary interactive color is `#409EFF`; success, warning, danger, and info states use a unified semantic palette.
- Both modes have their own text, border, overlay, and interaction-state colors. The image preview workbench always stays dark to make photo edges easier to judge.

## Tech Stack

App framework and UI: Nuxt 4 + Vue 3 + shadcn-vue + Reka UI + Tailwind CSS

Imaging and compression: UTIF + fflate

Linting and formatting: TypeScript + Oxlint + Oxfmt

## Local Development

The project uses [mise](https://mise.jdx.dev/) to manage the Node.js version, currently configured for Node.js 24.

```bash
mise install
mise exec -- pnpm install
mise exec -- pnpm dev
```

The development server runs at `http://localhost:3000` by default.

## Check and Build

```bash
mise exec -- pnpm check
mise exec -- pnpm build
```

## Project Structure

- `app/pages`: The half-frame splitter and layout composer pages, along with their respective workflow orchestration.
- `app/components/film`: Shared upload, image queue, preview, parameter control, and export components.
- `app/composables`: File queue, auto-detection, image preview, and batch export state.
- `app/types`: Shared types such as image entries, split settings, and export formats.
- `app/utils`: Image decoding, detection, cropping, rotation, and format conversion utilities.
- `app/assets/css`: Global theme, colors, and base control styles.
- `public`: Public static assets such as the favicon.

The half-frame splitting workflow reuses GPL-3.0-only source code from [Full2Half](https://github.com/haizakura/full2half), reorganized within Film X's unified page structure and theme system.

## Image Processing Notes

- All image processing happens entirely in the browser; nothing is uploaded to a server.
- Auto-splitting analyzes vertical brightness, texture, and edge changes in the central region. When the gutter cannot be reliably detected, no pixels are removed.
- TIFF files are decoded in the browser. The half-frame splitter can output JPEG, PNG, WebP, and TIF. TIF output uses uncompressed 8-bit RGBA pixels for splitting and 90° integer rotations, avoiding another round of lossy encoding. High-bit-depth TIFF input is still limited by browser-side decoding to 8-bit RGBA.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE) (GPL-3.0-only).
