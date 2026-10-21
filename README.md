# Film X

[English](README.en.md) | 中文 | [日本語](README.ja.md)

一个在浏览器本地运行的胶片图像处理工具合集。图像解码、编辑与导出均在本地完成，不会上传到服务器。

## 工具

### 半格胶片切分

- 支持批量导入 TIFF、JPEG、PNG 和 WebP，也可将文件直接拖入页面。
- 自动识别每张扫描图像的分割位置与中缝宽度，并允许手动微调。
- 两侧画面可分别旋转，也可将当前设置应用到全部图像。
- 支持导出 JPEG、PNG、WebP 与 TIF，并将批量结果打包为 ZIP 下载。
- JPEG 与 WebP 导出支持调整输出质量。

### 排版拼图

- 通过「胶片画幅」面板选择半格或全画幅，以及单张或两张，共四种组合：单张半格、两张半格（默认）、单张全画幅、两张全画幅。图像槽位数量随所选模式变化，仍支持点击选择和拖拽导入 TIFF、JPEG、PNG 与 WebP，一次拖入的文件超出槽位数量时只使用前面的文件。
- 切换画幅会套用推荐布局：半格左右排列，全画幅上下排列。切换为单张时第二张图像只是暂时隐藏而不会删除，切回两张即可恢复；若只有第二个槽位有图像，会移入唯一可见的槽位。
- 两张时支持左右、上下两种布局（切换画幅后仍可调整），以及交换画面顺序；单张时不显示布局方向、画面间距、交换顺序，以及图片调整中的画面选择。
- 画布可使用预设比例、自定义比例或根据图像与间距自动计算比例，默认为自动比例。
- 画布大小支持自动和手动两种模式；切换为手动后会保留当前尺寸。导入图像前，空画框与自动尺寸采用画幅默认值：半格为 2:3 竖幅、长边 1596 px，全画幅为 3:2 横幅、长边 2394 px（36 mm 对 24 mm，即半格长边的 1.5 倍）；导入后按图像的实际尺寸与比例计算。
- 自动画布大小在预设或自定义比例下：单张时图片按原始像素尺寸（缩放 1×）显示，填满裁切取使图片一边恰好铺满画框的较小画布，完整显示取较大的画布；两张时画布短边等于图片长边加对应外边距。自动比例下，每个画框的长边等于图像长边（横图对齐宽度，竖图对齐高度），因此两种布局方向下画面都按原始尺寸显示。自动尺寸同样受 8000 px 最长边限制。
- 手动模式下可直接输入画布宽度或高度，最长边限制为 8000 px。
- 手动模式下可选择单张图片，通过滑块或数值输入缩放，并直接在画布中拖拽调整位置。
- 外边距和画面间距均可滑动或直接输入；外边距支持统一设置和上、右、下、左独立设置。
- 支持填满裁切或完整显示，并可输入十六进制 RGB 背景色、选择纯色、方格或圆点底纹。
- 可选在画布外侧添加 24–240 px 宽的胶片齿孔带，支持上下或左右位置，以及跟随背景或黑色；齿孔采用圆角并按 135 胶片比例密排，偏向带内侧，外侧留出空位印边缘文字；齿孔带宽度不计入画布尺寸。
- 可选在两侧齿孔带外缘交错重复印制最多 48 个字符的边缘文字（左右放置时自下向上阅读），文字颜色可选琥珀色、白色、黑色预设或任意十六进制颜色。
- 可选开启“胶片质感”（默认关闭）：为背景画布和齿孔带加入固定种子的确定性胶片颗粒（不作用于照片本身），并让齿孔边缘柔和、略不规则，带有细微明暗变化；PNG 的齿孔镂空仍保持透明。
- PNG 导出会使齿孔内部镂空透明，并在工作预览中以棋盘格呈现；JPEG 中，跟随背景的齿孔带使用黑色镂空，黑色齿孔带使用白色镂空。
- 支持导出 JPEG、PNG 或 WebP；JPEG 与 WebP 可调整输出质量（70–100%，默认 92%）。若浏览器无法编码所选格式（如 Safari 不支持 WebP），导出会提示错误，而不是保存格式不符的文件。

### 照片相框

- 为单张照片添加相框，支持点击选择或拖入 TIFF、JPEG、PNG 与 WebP。适配任意画幅（方画幅、6×4.5、6×7、3:2、半格竖幅、XPan 宽幅等），兼容胶片扫描与数码照片；边框、文字与阴影尺寸以照片宽高的几何平均为基准等比计算，不同比例的照片观感一致。
- 提供白边、画廊、悬浮、信息条、品牌条、左图、右图、分栏八种版式。信息条与品牌条在照片下方放置信息栏：信息条左侧为机型与镜头、右侧为标志与拍摄参数；品牌条左侧为品牌标志、右侧为全部拍摄信息。左图、右图将照片与信息左右并排，信息栏中的标志、标语和拍摄信息朝照片一侧对齐；分栏在照片右侧加一条与照片等高的细竖线，竖线右侧依次排列标志、机型与镜头、曝光参数与日期，整体左对齐并与照片底边对齐，照片与竖线、竖线与文字、标志与信息、两组信息之间的间距均可单独调整。版式会套用推荐的边框、阴影与显示内容，之后仍可调整边框宽度（上下方信息栏版式为上、左右、下边框；左右并排版式为上、下、外侧边框与信息栏宽度），以及相框颜色（含纯白、米白相纸、浅灰、炭灰、纯黑预设）和文字颜色。
- 画布比例与排版拼图一致，提供 4:5、1:1、3:2、16:9、自动和自定义（宽:高）。自动时画布随照片与边框确定；选择其他比例时照片与相框保持不变并居中，画布四周以底板颜色补足留白（未开启底板时使用相框颜色），不会裁切照片；比例限制在 1:5 至 5:1 之间。
- 照片阴影提供无、贴合、柔和、浮起、环绕、深邃、斜光、硬投影八种预设，强度 0–150% 可调；可开启底板，让相框像相纸一样放在底板上，底板颜色、留白与相框阴影可单独设置。
- 导入时在本地读取 EXIF（JPEG、PNG、WebP、TIFF 均只读取元数据所在的少量字节），自动填写机型、镜头、焦距、光圈、快门、感光度与日期，并按厂商自动选择品牌。所有字段均可手动修改，修改过的项目在更换照片后保留；也可随时“从 EXIF 填写”覆盖。机型、镜头、胶卷、曝光参数、日期、自定义文字与标语均可单独设置字号（50–400%），在整体文字大小的基础上叠加；同一行内字号不同的项目按基线对齐。
- 照片来源分为数码与胶片。识别到胶片扫描仪（如 Noritsu、Frontier、Coolscan、Flextight、Epson 等）写入的 EXIF 时会自动切换为胶片模式，不会把扫描仪当作相机填写；胶片模式以胶卷字段替代曝光参数，机型、镜头与胶卷填写一次即可沿用整卷。
- 内置 40 个相机、胶片与手机品牌，可搜索选择，也可选择“自定义”输入任意文字。标志可使用内置图形（部分品牌提供多种）、文字标（经典斜体、罗马碑刻、几何细体、粗体、宽体、花体、等宽七种样式）、自定义图片（建议透明背景 PNG）或不显示；单色标志可保持原色、跟随文字颜色或自定义颜色。标语（例如 CREATE TO INSPIRE）可开关和编辑。
- 内置 18 款 OFL 开源字体（Playfair Display、Bodoni Moda、Cormorant Garamond、DM Serif Display、Cinzel、Italiana、Jost、Josefin Sans、Montserrat、Syncopate、Michroma、Orbitron、Bebas Neue、IBM Plex Mono、Courier Prime、Great Vibes、Dancing Script、Caveat）的拉丁字符子集，随应用打包并可离线使用；另提供系统黑体、宋体与楷体用于中日文字。文字标与说明文字可分别设置字体、粗体、斜体、大写与字距，并可整体缩放文字和标志。
- 导出 JPEG、PNG 或 WebP；JPEG 与 WebP 可调整输出质量（70–100%，默认 92%）。输出尺寸可选原尺寸（照片按原始像素绘制，最长边不超过 8000 px）或自定义长边（手动输入 256–8000 px），不会放大原图。
- 可将调整好的参数复制为预设码，或粘贴预设码直接套用。预设码保存版式、画布比例、品牌标志、字体、边框、间距、阴影与导出设置，以及拍摄信息的显示项与字号；不包含照片、自定义标志图片，以及拍摄信息与标语的文字内容和输出质量（套用预设时保留当前质量）。预设码为以 `FXF1.` 开头的字符串（JSON 经 DEFLATE 压缩后以 base64url 编码），可直接在聊天或网址中传递；导入时会逐项校验并限制在界面允许的范围内，无效的项目保持当前设置。

页面顶部的横向菜单用于在三项工具之间切换。工具页面会保留工作状态，切换后返回不会丢失已导入的图像。

## 界面与主题

- 页面支持简体中文、英语和日语，可在右上角切换；首次访问时由 Nuxt i18n 匹配浏览器语言，未匹配语言回退到英语。
- 默认跟随系统的 light / dark 外观设置，也可在页面右上角手动循环切换。
- 页面配色遵循 shadcn/ui 默认 neutral 主题，并通过语义颜色令牌适配 light / dark 模式。
- 两种模式均使用独立的文字、边框、浮层与交互状态配色；三个工具的图像预览工作台在 light 模式下为深灰色，dark 模式下保持接近黑色的深色，便于判断照片与白色相框的边缘，同时保证工作台文字的对比度。
- 所有滚动区域均使用统一的细窄圆角滚动条样式。

## 安装与离线使用（PWA）

- 在支持安装的浏览器中，可通过地址栏或浏览器菜单的安装入口将 Film X 安装为应用；iOS Safari 请使用“分享 → 添加到主屏幕”。安装与离线功能需要 HTTPS 或 localhost。
- 首次在线访问并完成应用资源缓存后，三项工具均可离线打开，也可切换界面语言。图像解码、编辑和导出仍完全在本地完成。
- 应用会在启动、回到前台、恢复联网时检查更新，运行期间每小时也会检查一次。新版本会在后台下载；当所有 Film X 窗口都没有导入的图片，且没有解码或导出任务时，会自动应用更新并刷新页面。
- 有图片或任务时会显示待更新状态；清空所有窗口中的图片并等待任务结束，或关闭所有 Film X 窗口后，更新即可应用。
- 图片仅保存在内存中，刷新或关闭页面后无法恢复。离线缓存不会保存导入的图片或编辑工作。

## AI Agent 调用（本地 MCP）

Film X 提供一个本地 stdio MCP 服务（工作区包 `packages/mcp`，名称 `film-x-mcp`），让 Claude Desktop、ChatGPT Desktop、Codex CLI 等支持 MCP 的桌面 AI Agent 直接运行三项工具并取得生成的图片。

- 仅在本地运行：由 Agent 应用将其作为本地进程启动，图片从本地路径读取并写入本地路径，不会上传。渲染页面是 Film X 网站的一部分（路由 `/mcp-renderer`，随网站一同部署到 Cloudflare Pages）。服务通过仅监听回环地址（127.0.0.1，随机端口）的反向代理，在无头模式的 Google Chrome 或 Microsoft Edge（playwright-core）中加载该页面，因此输出与网页版由同一份 `app/utils` 代码绘制（字体、标志、齿孔、EXIF 方向均一致）。
- 代码来自网站，图片只在本机读写：图片仅经由回环端口在服务与页面之间传递，不会发送到网站或其他任何地方。代理只转发对网站自身文件的 `GET` / `HEAD` 请求，且不带 Cookie；无头浏览器中会阻止网站的 Service Worker；带内容哈希的 `_nuxt` 资源在服务运行期间缓存在内存中。每次启动浏览器时都需要能访问该网站（首次任务以及空闲 5 分钟关闭后的下一次任务）。
- 网站需运行 Film X 0.6.0 或更高版本（即提供 `/mcp-renderer`）；否则首个任务会失败，并提示部署 0.6.0 及以上版本或设置 `FILM_X_SITE_URL`。服务与页面共用渲染协议版本，版本不一致时错误信息会指明应更新哪一侧：重新部署网站，或重新构建 / 更新 MCP 服务。
- 渲染页面的代码可访问当前任务的图片，因此 `FILM_X_SITE_URL` 只应指向你信任的 Film X 部署，通常是你自己的部署。
- 可通过 `FILM_X_BROWSER_PATH` 指定其他基于 Chromium 的浏览器可执行文件；浏览器空闲 5 分钟后自动关闭。
- 任务逐个串行执行，与网页版一致，以控制大尺寸 TIFF 扫描图的内存占用。
- 环境要求：Node.js 22 或更高版本（任一 LTS 版本均可），已安装 Chrome 或 Edge，且启动浏览器时能访问网站。

### 一键安装（macOS / Linux / Windows）

macOS / Linux：

```bash
curl -fsSL https://filmx.nya.run/mcp/install.sh | sh
```

Windows（PowerShell 5.1 或 7）：

```powershell
irm https://filmx.nya.run/mcp/install.ps1 | iex
```

网站构建时会在 `/mcp/` 下发布 `install.sh`、`install.ps1`、`server.mjs`、`package.json` 和 `SHA256SUMS`。仅当网站运行 0.6.0 或更高版本时才可用；在此之前下载会返回 404，脚本会提示网站需运行 Film X 0.6.0 或更高版本。两个脚本的步骤相同：

- 检查环境：需要 Node.js 22 或更高版本（含 npm）以及 curl 或 wget。
- 从 `<站点>/mcp/` 下载文件并校验 SHA-256。
- 运行 `npm install --omit=dev` 安装依赖（需要能访问 npm 仓库），再确认 `server.mjs --version` 可运行。
- 原子化安装到 `~/.film-x-mcp`（Windows 为 `%LOCALAPPDATA%\film-x-mcp`；可用 `FILM_X_MCP_HOME` 修改）：新副本先在目标旁暂存再移入；仅当已有文件夹由之前的安装脚本创建（带标记文件）时才会替换，其他文件夹一律拒绝。
- 若未找到 Google Chrome 或 Microsoft Edge，则给出警告（Windows 自带 Edge）。
- 通过 `node server.mjs --print-config` 打印可直接粘贴的 Claude Desktop（JSON）和 ChatGPT Desktop / Codex（`~/.codex/config.toml`，或 设置 → MCP 服务器 → 添加服务器 → STDIO）配置，其中已填入该 Node.js 的绝对路径和已安装的 `server.mjs`，并标明各平台的配置文件位置（Claude Desktop 在 Windows 为 `%APPDATA%\Claude\claude_desktop_config.json`，在 macOS 为 `~/Library/Application Support/Claude/claude_desktop_config.json`；Codex / ChatGPT Desktop 在 Windows 为 `%USERPROFILE%\.codex\config.toml`，在 macOS / Linux 为 `~/.codex/config.toml`）；当 `FILM_X_SITE_URL` 不是默认值时，配置中会包含它。

脚本不会修改任何 Agent 配置，也不会上传任何内容。在 Windows 上，如需修改环境变量请先设置，例如 `$env:FILM_X_MCP_HOME = 'D:\film-x-mcp'`。出错时安装脚本会抛出错误而不是退出，因此 PowerShell 窗口不会被关闭。`FILM_X_SITE_URL` 指定安装来源及渲染所用的网站（默认 `https://filmx.nya.run/`；仅限 https，http 只允许 localhost）。

- 更新：再次运行同一条命令。升级 Node.js 之后也请再运行一次，因为配置指向的是那一个 Node 可执行文件。
- 卸载：删除安装文件夹，并移除配置中的条目。
- 之后需要重新生成配置时，可运行 `node server.mjs --print-config`；`server.mjs` 还支持 `--version` / `--help`。

### 从源码构建（开发者）

```bash
mise exec -- pnpm install
mise exec -- pnpm mcp:build
```

产物仅有 `packages/mcp/dist/server.mjs`。

图形界面应用不会继承 shell 的 PATH（mise、fish 等），因此配置中必须使用 node 的绝对路径（`mise which node` 会输出，例如 `/Users/you/.local/share/mise/installs/node/24/bin/node`）以及 `dist/server.mjs` 的绝对路径。

### Claude Desktop

安装脚本会打印已填好的此配置。

编辑配置文件（macOS 为 `~/Library/Application Support/Claude/claude_desktop_config.json`，也可在 设置 → 开发者 → 编辑配置 中打开），然后重启 Claude Desktop：

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

安装脚本会打印已填好的此配置。

ChatGPT Desktop 使用 Codex 宿主的 MCP 配置，与 Codex CLI 和 IDE 扩展共用。可在 设置 → MCP 服务器 → 添加服务器 → STDIO 中填写命令与参数，或编辑 `~/.codex/config.toml`：

```toml
[mcp_servers.film-x]
command = "/absolute/path/to/node"
args = ["/absolute/path/to/film-x/packages/mcp/dist/server.mjs"]
startup_timeout_sec = 30
# 处理大批量 TIFF 可能超过默认的 60 秒，因此调大工具超时。
tool_timeout_sec = 600
env = { FILM_X_IMAGE_DIR = "/Users/you/Pictures/Scans", FILM_X_SITE_URL = "https://filmx.nya.run/" }
```

已知问题：部分 ChatGPT Desktop 版本中，本地 MCP 工具能被发现，但不会在普通 Chat 会话中提供（见 [openai/codex#38162](https://github.com/openai/codex/issues/38162)）；在 Codex CLI 和桌面端的 Work 界面中可正常使用。

### 环境变量

- `FILM_X_IMAGE_DIR`：`list_images` 默认列出的文件夹。
- `FILM_X_SITE_URL`：网站的基础 URL，默认 `https://filmx.nya.run/`。必须为 https；仅 `localhost` / `127.0.0.1` / `[::1]` 允许 http，用于本地测试。支持子路径部署，例如 `https://example.com/film-x/`。
- `FILM_X_BROWSER_PATH`：浏览器可执行文件路径，用于覆盖自动查找的 Chrome / Edge。
- `FILM_X_MCP_HOME`：安装文件夹，默认 `~/.film-x-mcp`（仅安装脚本使用）。

### 工具

- `list_images`：列出文件夹中受支持的图片（TIFF、JPEG、PNG、WebP），可递归。
- `read_photo_exif`：读取 EXIF、识别品牌、数码或胶片来源及说明字段，与相框工具自动填写的结果一致。
- `split_half_frame`：切分一张或多张半格扫描图，输出 `<name>_01` / `<name>_02`（JPEG、PNG、WebP 或 TIF）；未指定中心与间隙时自动识别中缝；两侧可分别旋转。
- `compose_film`：将 1–2 张照片排成半格或全画幅拼图，支持方向、比例（如 `auto` 或 `4:5`）、外边距、画面间距、背景、底纹、填充方式、齿孔带与边缘文字、胶片质感；默认在第一张照片旁输出 `film-x-layout.jpg|png`。
- `frame_photo`：为一张照片添加相框，可指定模板、品牌、部分设置和/或网页版的 `FXF1.` 预设码，默认开启 EXIF 自动填写，并可覆盖说明文字；输出 `<name>-frame.jpg|png`，并返回最终设置对应的预设码，可直接粘贴到网页版。
- `frame_preset`：只解析相框设置或预设码而不渲染（只读）。

使用说明：

- 输入使用绝对路径或 `~/…`。聊天中的附件服务端不可见，请直接提供文件或文件夹路径。
- 渲染类工具默认不会覆盖已有文件（需设置 `overwrite: true`），也绝不会写入输入文件本身；返回输出路径、像素尺寸和一张小的 JPEG 预览（长边不超过 1024 px），供 Agent 查看（`preview: false` 可关闭）。
- 画布限制与网页版相同：最长边 8000 px，齿孔带宽度 24–240 px。

## 技术栈

应用框架与界面：Nuxt 4 + Vue 3 + shadcn-vue + Reka UI + Tailwind CSS

语言与主题：`@nuxtjs/i18n` + `@nuxtjs/color-mode`

图像与压缩：UTIF + fflate

相框字体：`@fontsource`（OFL 开源字体，仅打包拉丁字符子集）

安装、离线与更新：`@vite-pwa/nuxt` + Workbox

代码检查与格式化：TypeScript + Oxlint + Oxfmt

MCP：`@modelcontextprotocol/sdk` + `playwright-core`（系统 Chrome / Edge）

## 本地开发

项目使用 [mise](https://mise.jdx.dev/) 管理 Node.js 版本，当前配置为 Node.js 24。

```bash
mise install
mise exec -- pnpm install
mise exec -- pnpm dev
```

开发服务器默认运行在 `http://localhost:3000`。

## 检查与构建

```bash
mise exec -- pnpm check
mise exec -- pnpm test:pwa
mise exec -- pnpm test:app
mise exec -- pnpm test:mcp
mise exec -- pnpm build
```

`test:pwa` 使用 Node 原生回归测试验证多窗口空闲、忙碌、无响应、关闭、作用域、重试及并发消息下的更新激活条件。

`test:app` 用 Node 原生测试直接运行 `app/utils` 中的纯逻辑（切分矩形、EXIF 解析、相框预设码、拼图尺寸边界），无需浏览器；`test` 依次运行 `test:pwa` 与 `test:app`。

`test:mcp` 会先运行 `pnpm generate`（其中会构建 MCP 包），再运行 `packages/mcp/tests/*.test.mjs`：在本地端口上提供生成的 `.output/public`，通过代理对其运行测试，其中 `install.test.mjs` 会针对生成的站点在临时文件夹中运行真实的 `curl … | sh` 一键安装命令，检查打印的配置、启动已安装的服务，并验证原地更新以及对非安装脚本创建的文件夹的拒绝；能找到 PowerShell（`FILM_X_PWSH` 或 PATH 中的 `pwsh`）时，还会以 `irm … | iex` 运行 `install.ps1`，否则跳过这一项（npm 安装需要能访问 npm 仓库）。测试并使用 git 忽略的 `sample/` 文件夹（或 `FILM_X_SAMPLE`）中的第一张图片进行验证；没有可用图片时会跳过。设置 `FILM_X_SITE_URL` 后，测试会改为针对已部署的网站运行。

`check` 会依次执行格式检查、Oxlint 和 Nuxt 类型检查。需要生成静态站点或预览构建结果时，可使用：

```bash
mise exec -- pnpm generate
mise exec -- pnpm preview
```

开发模式不注册 Service Worker。测试生产 PWA 时，请先运行 `mise exec -- pnpm build`，再运行 `mise exec -- pnpm preview`；或运行 `mise exec -- pnpm generate`，通过静态服务器提供 `.output/public`。测试环境同样需要 HTTPS 或 localhost。

## PWA 部署

- 支持部署到根路径，也支持通过 `NUXT_APP_BASE_URL` 配置子路径；构建和部署时应使用一致的基础路径。
- `sw.js`、`pwa-update-guard.js`、`manifest.webmanifest` 和 HTML 应设置 `Cache-Control: no-cache`，让浏览器及时重新验证更新。静态托管平台需自行配置这些响应头。
- 新静态资源与 Service Worker 必须在同一批次发布，并先发布资源，再发布 worker。滚动发布期间保留旧的 `_nuxt` hash 资源，避免仍运行旧版本的窗口加载失败。
- 构建（`pnpm generate` 与 `pnpm build` 都会先运行 `pnpm mcp:build`）会在 `/mcp/` 下发布 MCP 一键安装文件（`install.sh`、`install.ps1`、`server.mjs`、`package.json`、`SHA256SUMS`），它们不会被 PWA Service Worker 预缓存。因此 Pages 的构建命令必须是 `pnpm generate`（或 `pnpm build`），不能直接运行 `nuxt generate`。`public/_headers` 会让 Pages 以纯文本返回这两个安装脚本，并对 `/mcp/` 下的文件始终重新验证。

## 代码结构

- `app/pages`：半格切分、排版拼图与照片相框页面，以及各自的工作流编排。
- `app/components/film`：通用的上传、图像队列、预览、参数控制与导出组件。
- `app/composables`：文件队列、自动识别、图像预览和批量导出状态。
- `app/types`：图像条目、切分设置与导出格式等共享类型。
- `app/utils`：图像解码、检测、裁切、旋转、格式转换、EXIF 读取与相框绘制工具。
- `app/assets/css`：全局主题、颜色、基础控件样式与相框字体引入。
- `app/assets/frame-logos`：相框使用的相机品牌标志 SVG 及其来源说明。
- `public`：favicon、PWA 图标与更新保护脚本 `pwa-update-guard.js` 等公开静态资源。
- `packages/mcp`：本地 MCP 服务（Node）：回环代理、文件传输与工具定义；`install.sh` / `install.ps1` 为一键安装脚本，`scripts/build-site.mjs` 将安装文件生成到 `dist/site` 并在网站构建时发布到 `/mcp/`。
- 其使用的渲染页面为 `app/pages/mcp-renderer.vue` 与 `app/utils/agentRenderer.ts`。

半格切分工作流复用了个人项目 [Full2Half](https://github.com/haizakura/full2half) 的源码，并在 Film X 的统一页面结构与主题系统中重新组织。

## 图像处理说明

- 图像处理完全在浏览器内完成，不会上传到服务器。
- 本地 MCP 服务从所配置的网站加载代码，并在本机的无头浏览器中处理图片，不会上传任何图片。
- 照片相框读取 EXIF 时只按需读取文件中的元数据片段，不会为此整读大尺寸 TIFF；预览使用缩小的副本绘制，导出时才按所选尺寸以原图重新绘制。
- 自动切分会分析中央区域的纵向亮度、纹理和边界变化；无法可靠识别中缝时不会主动移除像素。
- TIFF 会在浏览器中解码；半格切分输出支持 JPEG、PNG、WebP 与 TIF。TIF 使用未压缩的 8 位 RGBA 像素切分与 90° 整数旋转，避免再次有损编码；高位深 TIFF 输入仍会受浏览器端解码为 8 位 RGBA 的限制。

## 许可证

本项目采用 [Apache License 2.0](LICENSE)（Apache-2.0）许可。
