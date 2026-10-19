# Film X

English | [中文](README.md) | [日本語](README.ja.md)

A collection of film image processing tools that run locally in your browser. Image decoding, editing, and export all happen on your device; nothing is uploaded to a server.

## Tools

### Half-Frame Film Splitter

- Batch import TIFF, JPEG, PNG, and WebP files, or drag and drop them directly onto the page.
- Automatically detects the split position and gutter width of each scanned image, with manual fine-tuning available.
- Each side can be rotated independently, and the current settings can be applied to all images.
- Export as JPEG, PNG, WebP, or TIF, with batch results bundled into a ZIP download.
- JPEG and WebP exports support adjustable output quality.

### Layout Composer

- Use the Film format panel to choose Half-frame or Full-frame and Single or Two images, giving four combinations: a single half-frame, two half-frames (the default), a single full-frame, and two full-frames. The number of image slots follows the selected mode; click-to-select and drag-and-drop import of TIFF, JPEG, PNG, and WebP still work, and when more files are dropped than there are slots, only the first ones are used.
- Switching format applies a recommended layout: side by side for half-frame, stacked for full-frame. Switching to a single image only hides the second image rather than deleting it, and switching back to two restores it; if only the second slot held an image, it moves into the one visible slot.
- With two images, choose side-by-side or stacked (still adjustable after switching format) and swap the image order. With a single image, the layout direction, the gap, the swap button, and the frame picker in image adjustment are hidden.
- The canvas can use a preset ratio, a custom ratio, or a ratio computed automatically from the images and spacing (the default).
- Canvas sizing supports automatic and manual modes; switching to manual retains the calculated dimensions. Before any image is loaded, empty frames and automatic sizing use the format defaults: half-frame is 2:3 portrait with a 1596 px long side, and full-frame is 3:2 landscape with a 2394 px long side (36 mm vs 24 mm, or 1.5× the half-frame long side). Once images are loaded, their actual size and ratio are used.
- With a preset or custom ratio, automatic canvas size works as follows: a single image is shown at its original pixel size (scale 1), where fill (crop) picks the smaller canvas in which one image side exactly fills the frame and fit picks the larger one; with two images, the short edge equals the images’ long edge plus the corresponding outer margins. With the automatic ratio, each frame’s long side equals the image’s long side (landscape images match width, portrait images match height), so images appear at native size in either layout direction. Automatic sizes are also limited to 8000 px on the longest side.
- In manual mode, canvas width or height can be entered directly; the longest side is limited to 8000 px.
- In manual canvas mode, select an image to scale it with a slider or numeric input, then drag it directly on the canvas to reposition it.
- Outer margins and the gap between images can be adjusted with sliders or typed in directly; outer margins support either a uniform value or independent top, right, bottom, and left values.
- Choose between fill (crop) and fit (show the entire image), enter a hex RGB background color, and pick a solid, checkerboard, or dotted background pattern.
- Optionally add 24–240 px film perforation bands outside the canvas, with top-and-bottom or left-and-right placement and either a matching background or black color. Perforations are rounded-corner, densely pitched holes with 135-film-like proportions, placed toward the inner side of the band so an outer strip stays free for edge text; band width is excluded from the canvas dimensions.
- Optionally print up to 48 characters of edge text repeatedly along the outer edges of both bands, staggered between the two (reading bottom to top for left-and-right placement), in an amber, white, or black preset or any hex color.
- Optionally turn on Film texture (off by default) to add deterministic film grain to the background canvas and perforation bands, but not to the photos themselves. Perforations get soft, slightly irregular edges with subtle light and shade variation, and PNG perforation cutouts stay transparent.
- PNG export keeps the perforation cutouts transparent and shows them against a checkerboard in the workbench. For JPEG, matching-background bands use black cutouts, while black bands use white cutouts.
- Export as JPEG or PNG.

### Photo Frame

- Add a frame to a single photo; click to choose or drag and drop TIFF, JPEG, PNG, and WebP. Any aspect ratio works (square, 6×4.5, 6×7, 3:2, half-frame portrait, XPan panoramic, and more), for both film scans and digital photos. Border, text, and shadow sizes scale from the geometric mean of the photo's width and height, so photos of different proportions look consistent.
- Eight layouts are provided: Border, Gallery, Float, Info bar, Brand bar, Photo left, Photo right, and Column. Info bar and Brand bar place a caption bar below the photo: Info bar shows the camera and lens on the left with the logo and exposure on the right, while Brand bar shows the brand logo on the left with all shooting details on the right. Photo left and Photo right place the photo and a caption column side by side, with the logo, tagline, and shooting details aligned toward the photo. Column adds a thin vertical rule the height of the photo to its right, followed by the logo, the camera and lens, and the exposure and date, left-aligned and bottom-aligned with the photo; the photo-to-rule, rule-to-text, logo-to-details, and between-group spacings can each be adjusted. A layout applies recommended borders, shadows, and displayed content, and you can still adjust the border widths afterward (top, side, and bottom for layouts with the caption below; top, bottom, outer side, and caption column width for side-by-side layouts), as well as the frame color (with White, Ivory paper, Light grey, Charcoal, and Black presets) and the text color.
- The canvas ratio matches the layout composer: 4:5, 1:1, 3:2, 16:9, Auto, and Custom (width:height). Auto lets the canvas follow the photo and borders; any other ratio keeps the photo and frame unchanged and centered, and fills out the canvas around them with the backdrop color (or the frame color when the backdrop is off), never cropping the photo. Ratios are limited to between 1:5 and 5:1.
- Photo shadow offers eight presets: None, Contact, Soft, Lifted, Ambient, Deep, Angled, and Hard, with strength adjustable from 0–150%. You can turn on a backdrop so the frame sits on it like a print; the backdrop color, margin, and frame shadow are set separately.
- On import, EXIF is read locally (for JPEG, PNG, WebP, and TIFF alike, only the small range of bytes holding the metadata is read) to fill in the camera model, lens, focal length, aperture, shutter speed, ISO, and date, and the brand is chosen automatically from the manufacturer. Every field can be edited by hand, edited fields are kept when you switch photos, and you can overwrite them at any time with "Fill from EXIF". Camera, lens, film, exposure, date, custom text, and tagline each have their own size (50–400%) on top of the overall text size; items of different sizes that share a line are aligned on their baseline.
- The photo source is either Digital or Film. When EXIF written by a film scanner (such as Noritsu, Frontier, Coolscan, Flextight, or Epson) is detected, the app switches to Film automatically and never fills in the scanner as the camera. Film mode replaces the exposure fields with film stock, and the camera, lens, and film only need to be entered once to carry over to the whole roll.
- 40 camera, film, and phone brands are built in, with searchable selection or "Custom" for any text. The logo can be a built-in graphic (some brands offer several), a wordmark (seven styles: Classic italic, Roman, Geometric, Bold, Wide, Script, and Mono), a custom image (a PNG with a transparent background is recommended), or none; single-color logos can keep their original color, follow the text color, or use a custom color. The tagline (for example, CREATE TO INSPIRE) can be toggled and edited.
- 18 OFL open-source fonts (Playfair Display, Bodoni Moda, Cormorant Garamond, DM Serif Display, Cinzel, Italiana, Jost, Josefin Sans, Montserrat, Syncopate, Michroma, Orbitron, Bebas Neue, IBM Plex Mono, Courier Prime, Great Vibes, Dancing Script, Caveat) are bundled as Latin subsets and work offline; system sans, serif, and Kai fonts are also offered for Chinese and Japanese text. The wordmark and caption each have their own font, bold, italic, capitals, and letter-spacing settings, and text and logo can be scaled together.
- Export as JPEG or PNG. The output size can be Original (the photo is drawn at its original pixels, with the longest side capped at 8000 px) or Custom, where you type the long side (256–8000 px); the original photo is never upscaled.
- Copy your adjusted settings as a preset code, or paste a preset code to apply it. A preset code stores the layout, canvas ratio, logo, fonts, borders, spacing, shadows, and export options, plus which details are shown and their sizes; it never includes the photo, a custom logo image, or the caption and tagline text. The code is a string starting with `FXF1.` (DEFLATE-compressed JSON encoded as base64url), so it can be shared in chats or URLs as is; on import every value is checked and limited to the ranges the controls allow, and invalid values keep the current settings.

The horizontal menu at the top of the page switches between the three tools. Each tool page keeps its working state, so imported images are not lost when you switch away and come back.

## Interface and Theme

- The interface supports Simplified Chinese, English, and Japanese, with a language switcher in the top-right corner. On first visit, Nuxt i18n detects the browser language and falls back to English when it is not supported.
- Follows the system light / dark appearance by default; you can also cycle through modes manually from the top-right corner of the page.
- The interface follows shadcn/ui's default neutral theme and adapts its semantic color tokens to light and dark modes.
- Both modes have their own text, border, overlay, and interaction-state colors. The image preview workbench of all three tools is dark grey in light mode and stays near-black in dark mode, so photo and white frame edges remain easy to judge and workbench text stays legible.
- All scrollable areas use the same thin, rounded scrollbar treatment.

## Installation and Offline Use (PWA)

- In browsers that support installation, use the install entry in the address bar or browser menu to install Film X as an app. In iOS Safari, use Share → Add to Home Screen. Installation and offline features require HTTPS or localhost.
- After the first online visit finishes caching the app resources, all three tools can open offline, and you can switch interface languages. Image decoding, editing, and export still happen entirely on your device.
- The app checks for updates on startup, when returning to the foreground, when connectivity returns, and every hour while running. New versions download in the background. An update applies automatically and refreshes the pages once every Film X window has no imported images and no decoding or export tasks.
- If images or tasks are present, the app shows a pending update. Clear the images in every window and let tasks finish, or close all Film X windows, to allow the update to apply.
- Images stay in memory only and cannot be recovered after a refresh or closing the page. Offline caching does not save imported images or editing work.

## AI Agent Access (Local MCP)

Film X ships a local stdio MCP server (workspace package `packages/mcp`, named `film-x-mcp`) so that desktop AI agents such as Claude Desktop, ChatGPT Desktop, Codex CLI, and other MCP clients can run the three tools directly and receive the generated images.

- Local only: the agent app launches it as a local process; images are read from and written to local paths and are never uploaded. The renderer page is part of the Film X website (route `/mcp-renderer`, deployed with the site to Cloudflare Pages). The server loads it through a reverse proxy on a loopback-only port (127.0.0.1, random port) into headless Google Chrome or Microsoft Edge (playwright-core), so the output is drawn by the same `app/utils` code as the web app (same fonts, logos, sprockets, and EXIF orientation).
- The code comes from the site; images are read and written only on this computer. They travel between the server and the page over the loopback port and are never sent to the site or anywhere else. The proxy only forwards `GET` / `HEAD` requests for the site's own files, without cookies; the site's service worker is blocked in the headless browser; and the content-hashed `_nuxt` assets are cached in memory while the server runs. Network access to the site is needed whenever the browser starts (on the first job, and again after the 5-minute idle close).
- The site must run Film X 0.6.0 or later (that is, serve `/mcp-renderer`); otherwise the first job fails with a message saying to deploy 0.6.0+ or set `FILM_X_SITE_URL`. The server and the page share a renderer protocol version; on a mismatch the error says which side to update: redeploy the site, or rebuild/update the MCP server.
- The renderer page's code runs with access to the images of the current job, so point `FILM_X_SITE_URL` only at a Film X deployment you trust, normally your own.
- `FILM_X_BROWSER_PATH` can point to another Chromium-based browser executable. The browser closes after 5 minutes idle.
- Jobs run one at a time, like the web app, to cap memory use on large TIFF scans.
- Requirements: Node.js 22 or later (any LTS works), an installed Chrome or Edge, and network access to the site when the browser starts.

### One-Click Install (macOS / Linux / Windows)

macOS / Linux:

```bash
curl -fsSL https://filmx.nya.run/mcp/install.sh | sh
```

Windows (PowerShell 5.1 or 7):

```powershell
irm https://filmx.nya.run/mcp/install.ps1 | iex
```

The site build publishes `install.sh`, `install.ps1`, `server.mjs`, `package.json`, and `SHA256SUMS` under `/mcp/`. This works only once the site runs 0.6.0 or later; until then the download returns 404 and the script says the site must run Film X 0.6.0 or later. Both scripts take the same steps:

- Checks prerequisites: Node.js 22 or later with npm, and curl or wget.
- Downloads the files from `<site>/mcp/` and verifies their SHA-256 checksums.
- Runs `npm install --omit=dev` (needs network access to the npm registry), then checks that `server.mjs --version` runs.
- Installs atomically into `~/.film-x-mcp` (`%LOCALAPPDATA%\film-x-mcp` on Windows; override with `FILM_X_MCP_HOME`): the new copy is staged next to the target and moved into place. An existing folder is replaced only if an earlier run of the installer created it (marker file); any other folder is refused.
- Warns if neither Google Chrome nor Microsoft Edge is found (Edge ships with Windows).
- Prints, via `node server.mjs --print-config`, ready-to-paste configuration for Claude Desktop (JSON) and ChatGPT Desktop / Codex (`~/.codex/config.toml`, or Settings → MCP servers → Add server → STDIO), filled with the absolute path of that exact Node.js binary and the installed `server.mjs`, and names each platform's config file (Claude Desktop: `%APPDATA%\Claude\claude_desktop_config.json` on Windows, `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS; Codex / ChatGPT Desktop: `%USERPROFILE%\.codex\config.toml` on Windows, `~/.codex/config.toml` on macOS/Linux). When `FILM_X_SITE_URL` is not the default, the snippets include it.

It changes no agent configuration and uploads nothing. On Windows, set any environment variables first, e.g. `$env:FILM_X_MCP_HOME = 'D:\film-x-mcp'`. On failure the PowerShell installer throws an error instead of exiting, so your PowerShell window stays open. `FILM_X_SITE_URL` selects the site to install from and render with (default `https://filmx.nya.run/`; https only, http just for localhost).

- Update: run the same command again. Run it again after upgrading Node.js too, because the configuration points at that exact binary.
- Uninstall: delete the install folder and remove the configuration entry.
- To re-create a configuration later, run `node server.mjs --print-config`; `server.mjs` also supports `--version` / `--help`.

### Build from Source (Developers)

```bash
mise exec -- pnpm install
mise exec -- pnpm mcp:build
```

This produces only `packages/mcp/dist/server.mjs`.

GUI apps do not inherit the shell's PATH (mise, fish, and so on), so the configuration must use the absolute path of node (printed by `mise which node`, for example `/Users/you/.local/share/mise/installs/node/24/bin/node`) and the absolute path of `dist/server.mjs`.

### Claude Desktop

The installer prints this configuration already filled in.

Edit the config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, also reachable via Settings → Developer → Edit Config), then restart Claude Desktop:

```json
{
  "mcpServers": {
    "film-x": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/film-x/packages/mcp/dist/server.mjs"],
      "env": {
        "FILM_X_IMAGE_DIR": "/Users/you/Pictures/Scans",
        "FILM_X_SITE_URL": "https://filmx.nya.run/"
      }
    }
  }
}
```

### ChatGPT Desktop / Codex CLI

The installer prints this configuration already filled in.

ChatGPT Desktop uses the Codex host's MCP configuration, shared with Codex CLI and the IDE extension. Either add a server under Settings → MCP servers → Add server → STDIO (command and args), or edit `~/.codex/config.toml`:

```toml
[mcp_servers.film-x]
command = "/absolute/path/to/node"
args = ["/absolute/path/to/film-x/packages/mcp/dist/server.mjs"]
startup_timeout_sec = 30
# Large TIFF batches can take longer than the 60 s default.
tool_timeout_sec = 600
env = { FILM_X_IMAGE_DIR = "/Users/you/Pictures/Scans", FILM_X_SITE_URL = "https://filmx.nya.run/" }
```

Known issue: in some ChatGPT Desktop builds, local MCP tools are discovered but not exposed in normal Chat sessions (see [openai/codex#38162](https://github.com/openai/codex/issues/38162)); they work in Codex CLI and the desktop Work surface.

### Environment Variables

- `FILM_X_IMAGE_DIR`: The default folder for `list_images`.
- `FILM_X_SITE_URL`: The site's base URL, default `https://filmx.nya.run/`. It must be https; plain http is allowed only for `localhost` / `127.0.0.1` / `[::1]`, for local testing. Sub-path deployments work, e.g. `https://example.com/film-x/`.
- `FILM_X_BROWSER_PATH`: Path to a browser executable, overriding the automatically found Chrome or Edge.
- `FILM_X_MCP_HOME`: The install folder, default `~/.film-x-mcp` (used only by the installer).

### Tools

- `list_images`: Lists supported images (TIFF, JPEG, PNG, WebP) in a folder, optionally recursively.
- `read_photo_exif`: Reads EXIF, the detected brand, the digital or film source, and caption fields, as the frame tool would fill them.
- `split_half_frame`: Splits one or more half-frame scans into `<name>_01` / `<name>_02` (JPEG, PNG, WebP, or TIF). The gutter is detected automatically unless the center and gap are given; each side can be rotated.
- `compose_film`: Composes 1–2 photos into a half-frame or full-frame layout, with direction, ratio (such as `auto` or `4:5`), padding, gap, background, pattern, fit, sprocket band with edge text, and film texture. By default it writes `film-x-layout.jpg|png` next to the first photo.
- `frame_photo`: Frames one photo with a template, brand, partial settings, and/or an `FXF1.` preset code from the web app, with EXIF auto-fill (on by default) and caption overrides. It writes `<name>-frame.jpg|png` and returns the preset code of the resolved settings, which can be pasted into the web app.
- `frame_preset`: Resolves frame settings or preset codes without rendering (read-only).

Usage notes:

- Inputs are absolute paths or `~/…`. Chat attachments are not visible to the server, so give file or folder paths directly.
- Render tools never overwrite existing files unless `overwrite: true` is set and never write over an input. They return the output paths, pixel sizes, and a small JPEG preview (long side up to 1024 px) that the agent can look at (`preview: false` disables it).
- Canvas limits are the same as the web app: 8000 px on the long side and a 24–240 px sprocket band.

## Tech Stack

App framework and UI: Nuxt 4 + Vue 3 + shadcn-vue + Reka UI + Tailwind CSS

Localization and theme: `@nuxtjs/i18n` + `@nuxtjs/color-mode`

Imaging and compression: UTIF + fflate

Frame fonts: `@fontsource` (OFL open-source fonts, bundling Latin subsets only)

Installation, offline support, and updates: `@vite-pwa/nuxt` + Workbox

Linting and formatting: TypeScript + Oxlint + Oxfmt

MCP: `@modelcontextprotocol/sdk` + `playwright-core` (system Chrome / Edge)

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
mise exec -- pnpm test:pwa
mise exec -- pnpm test:mcp
mise exec -- pnpm build
```

`test:pwa` uses native Node regression tests to verify update activation conditions across idle, busy, unresponsive, and closed windows, scopes, retries, and concurrent messages.

`test:mcp` first runs `pnpm generate` (which builds the MCP package), then `packages/mcp/tests/*.test.mjs`: it serves the generated `.output/public` on a local port and runs the tests through the proxy against it. This includes `install.test.mjs`, which runs the real `curl … | sh` one-liner against the generated site into a temp folder, checks the printed configuration, starts the installed server, and checks update-in-place and the refusal of foreign folders. When PowerShell is available (`FILM_X_PWSH` or `pwsh` on PATH), it also runs `install.ps1` with `irm … | iex`; otherwise that case is skipped (the npm install needs network access to the registry). It also uses the first image in the git-ignored `sample/` folder (or `FILM_X_SAMPLE`); it is skipped when no image is available. Setting `FILM_X_SITE_URL` makes the tests run against a deployed site instead.

`check` runs formatting checks, Oxlint, and Nuxt type checking in sequence. To generate a static site or preview the build output, use:

```bash
mise exec -- pnpm generate
mise exec -- pnpm preview
```

Development mode does not register a Service Worker. To test the production PWA, run `mise exec -- pnpm build` followed by `mise exec -- pnpm preview`, or run `mise exec -- pnpm generate` and serve `.output/public` with a static server. The test environment also requires HTTPS or localhost.

## PWA Deployment

- Deployment supports both the root path and subpaths configured with `NUXT_APP_BASE_URL`. Use the same base path for building and deployment.
- Set `Cache-Control: no-cache` for `sw.js`, `pwa-update-guard.js`, `manifest.webmanifest`, and HTML so browsers revalidate updates promptly. Configure these response headers yourself on static hosting platforms.
- Publish new static assets and the Service Worker in the same release, with assets published before the worker. Retain old hashed `_nuxt` assets during rolling deployments so windows running an older version can still load them.
- The build (`pnpm generate` and `pnpm build` both run `pnpm mcp:build` first) publishes the MCP installer files (`install.sh`, `install.ps1`, `server.mjs`, `package.json`, `SHA256SUMS`) under `/mcp/`; the PWA service worker does not precache them. The Pages build command must therefore be `pnpm generate` (or `pnpm build`), not a raw `nuxt generate`. `public/_headers` makes Pages serve both installers as plain text and always revalidate the files under `/mcp/`.

## Project Structure

- `app/pages`: The half-frame splitter, layout composer, and photo frame pages, along with their respective workflow orchestration.
- `app/components/film`: Shared upload, image queue, preview, parameter control, and export components.
- `app/composables`: File queue, auto-detection, image preview, and batch export state.
- `app/types`: Shared types such as image entries, split settings, and export formats.
- `app/utils`: Image decoding, detection, cropping, rotation, format conversion, EXIF reading, and frame rendering utilities.
- `app/assets/css`: Global theme, colors, base control styles, and frame font imports.
- `app/assets/frame-logos`: Camera brand logo SVGs used by the photo frame, along with their source notes.
- `public`: Public static assets, including the favicon, PWA icons, and the `pwa-update-guard.js` update guard.
- `packages/mcp`: The local MCP server (Node): loopback proxy, file transfer, and tool definitions; `install.sh` / `install.ps1` are the one-click installers and `scripts/build-site.mjs` generates the installer files into `dist/site`, which the site build publishes under `/mcp/`.
- The renderer page it uses is `app/pages/mcp-renderer.vue` with `app/utils/agentRenderer.ts`.

The half-frame splitting workflow reuses source code from the personal project [Full2Half](https://github.com/haizakura/full2half), reorganized within Film X's unified page structure and theme system.

## Image Processing Notes

- All image processing happens entirely in the browser; nothing is uploaded to a server.
- The local MCP server loads its code from the configured site and processes images in a headless browser on this computer; nothing is uploaded.
- When the photo frame reads EXIF, it reads only the metadata segments of the file on demand and never loads a large TIFF in full for this; the preview is drawn from a downscaled copy, and the export redraws from the original image at the selected size.
- Auto-splitting analyzes vertical brightness, texture, and edge changes in the central region. When the gutter cannot be reliably detected, no pixels are removed.
- TIFF files are decoded in the browser. The half-frame splitter can output JPEG, PNG, WebP, and TIF. TIF output uses uncompressed 8-bit RGBA pixels for splitting and 90° integer rotations, avoiding another round of lossy encoding. High-bit-depth TIFF input is still limited by browser-side decoding to 8-bit RGBA.

## License

This project is licensed under the [Apache License 2.0](LICENSE) (Apache-2.0).
