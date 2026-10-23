# Film X 项目说明

> 本文依据当前工作区的代码、配置与 README 整理，说明“项目现在如何工作”。开发时如与用户需求或实际配置冲突，应以前者和实际代码为准。

## 1. 项目定位与边界

Film X 是一个浏览器本地优先的胶片图像处理工具集。图像读取、TIFF 解码、自动检测、Canvas 绘制、格式编码、ZIP 打包和文件下载都在用户浏览器内完成；当前仓库没有业务服务端、远程图像处理或持久化存储实现。另有仅供本机桌面 AI Agent 调用的本地 MCP 服务（packages/mcp），同样在本机处理，见第 10 节。

这一定义带来几个产品边界：

- 用户导入的图像不能被现有功能上传到网络。
- 所有大图处理都要考虑浏览器内存、Canvas 限制和异步竞态。
- 状态是页面内存状态。应用通过路由保活保留工具切换前的工作状态，但刷新页面或重新打开站点不会恢复已导入文件。
- 浏览器原生 API（例如 File、Canvas、ImageBitmap、URL）是图像链路的一部分；代码应在客户端交互或生命周期内调用它们。

## 2. 技术基线与运行方式

| 范畴 | 当前实现 |
| --- | --- |
| 应用框架 | Nuxt 4、Vue 3、TypeScript |
| UI | Tailwind CSS v4、shadcn-nuxt、Reka UI、Lucide、Vue Sonner |
| 图像与归档 | UTIF（TIFF）、浏览器 Canvas、fflate（ZIP） |
| 国际化与主题 | @nuxtjs/i18n、@nuxtjs/color-mode |
| 质量工具 | Oxfmt、Oxlint、Nuxt Typecheck |
| 运行环境 | mise 管理的 Node.js 24.21.0 |
| 包管理器 | pnpm 12.5.1 |

项目命令必须经由 mise 和 pnpm 运行：

~~~sh
mise exec -- pnpm dev
mise exec -- pnpm check
mise exec -- pnpm build
mise exec -- pnpm generate
mise exec -- pnpm preview
~~~

另有 mcp:build（构建本地 MCP 服务并生成 dist/site 安装文件）与 test:mcp（先运行 generate，再运行 packages/mcp/tests/*.test.mjs：在本地端口提供 .output/public，经代理运行 server.test.mjs；install.test.mjs 对生成的站点运行真实的 curl | sh 一键安装并检查配置、更新与拒绝非安装脚本创建的文件夹，找得到 PowerShell（FILM_X_PWSH 或 PATH 中的 pwsh）时还会以 irm | iex 运行 install.ps1，否则跳过该项；npm 安装需访问仓库；设置 FILM_X_SITE_URL 时 server 测试改为针对已部署的网站）。generate 与 build 都会先运行 mcp:build，并通过 Nitro publicAssets 将 packages/mcp/dist/site 发布到 /mcp/（install.sh、install.ps1、server.mjs、package.json、SHA256SUMS，不被 PWA Service Worker 预缓存）；因此 Cloudflare Pages 的构建命令必须是 pnpm generate 或 pnpm build，不能是裸 nuxt generate。

~~~sh
mise exec -- pnpm mcp:build
mise exec -- pnpm test:mcp
~~~

其中 check 依序执行格式检查、Oxlint 和 Nuxt 类型检查。现有测试脚本为 test:pwa、test:app（tests/app-*.test.mjs，经 tests/resolve-app.mjs 解析 ~/ 并以 --experimental-transform-types 直接运行 app/utils 的纯逻辑）与 test:mcp，test 依次运行 test:pwa 与 test:app；均使用 Node 内置的 node --test，没有测试框架依赖；不要假定存在其他单元测试或端到端测试。

## 3. 目录与分层

~~~text
app/
  app.vue                         全局应用壳
  pages/
    index.vue                     路由 /：半格胶片切分工作流编排
    compose.vue                   路由 /compose：排版拼图入口
    frame.vue                     路由 /frame：照片相框入口
    mcp-renderer.vue              路由 /mcp-renderer：仅供本地 MCP 服务使用的渲染页（noindex）
  components/
    film/                         产品领域 UI：上传、队列、预览、控制、导航；ToolPanel.vue 为各工具右侧控制区的共用标签页容器（桌面在右栏顶部；移动端标签栏固定在屏幕底部，点选后控件以 67% 不透明的卡片悬浮于工作区底部，工作区高度不变，仅画布保持尺寸平滑上移以尽量避开卡片（最高到预览区内边距处，仍被遮挡的部分不处理），收起后复原；卡片高度由页面经 provideToolCardSpace 共享，画布位移由 useToolCardLift 计算，再次点选同一标签或点卡片顶部把手收起；未激活标签保持挂载）
    film/composition/             拼图编辑器、工作区和分项控制面板
    film/frame/                   相框编辑器、工作区和分项控制面板
    ui/                           Button、Switch、Dialog、Progress、Sonner 等基础原语
  composables/                    响应式状态、异步任务、资源生命周期与 Canvas 逻辑
  types/                          图像与拼图的领域类型、联合类型、边界常量
  utils/                          无 UI 的解码、裁切、检测、下载和错误工具
  lib/utils.ts                    Tailwind class 合并函数 cn
  assets/css/main.css             Tailwind 入口、主题令牌、全局基础及共享样式
packages/
  mcp/                            本地 stdio MCP 服务（Node，仅服务端：回环代理、文件传输、工具定义）、install.sh / install.ps1（一键安装脚本）、scripts/build-site.mjs（生成 dist/site 安装文件）与 tests/
i18n/
  locales/en.json                 英文界面文本
  locales/zh-CN.json              简体中文界面文本
  i18n.config.ts                  Vue I18n 基础配置
public/
  favicon.svg                     公开静态图标
nuxt.config.ts                    Nuxt、模块、主题、国际化和站点 head 配置
components.json                   shadcn-vue 生成约定
mise.toml                         Node.js 版本
~~~

分层责任如下：

- 页面是编排层：设置页面 SEO、创建 composable、连接组件事件和组织流程。
- film 组件负责领域展示和用户交互；composition 子目录只承载拼图领域 UI。
- composable 负责响应式状态、异步控制、资源释放和可复用的领域行为。
- utils 负责可独立理解的无 UI 工具或算法，不应持有 Vue 状态。
- types 是共享模型的唯一来源；有限选项、状态和边界应优先在这里集中定义。
- ui 是基础组件层。业务功能应组合这些原语，而非复制 Button、Dialog、Switch 或 Progress。

## 4. 全局壳、路由、语言与主题

根组件 app/app.vue 渲染页头（含版本徽标）、可选的 PWA 更新提示、保活页面和 Toast，不再有页脚。应用壳固定为视口高度（h-dvh、overflow hidden），页面本身不纵向滚动，各面板在内部滚动。NuxtPage 使用 max 为 4 的 keepalive 配置，使三个工具页面在站内切换后维持当前内存状态。

路由采用无语言前缀策略：

| 路由 | 入口 | 作用 |
| --- | --- | --- |
| / | app/pages/index.vue | 批量半格胶片切分 |
| /compose | app/pages/compose.vue | 单张或两张半格/全画幅图像的胶片排版拼图 |
| /frame | app/pages/frame.vue | 为单张照片添加相机品牌相框，读取 EXIF 填写拍摄信息 |
| /mcp-renderer | app/pages/mcp-renderer.vue | 本地 MCP 服务使用的渲染页（noindex，不在导航中；访客只看到说明） |

预渲染路由为 /、/compose、/frame 与 /mcp-renderer。
国际化当前支持 en、zh-CN 与 ja。默认语言和回退语言均为 en；首次访问会根据浏览器语言选择，并把选择写入 Cookie。页面标题、描述、Toast、可访问性标签和普通界面文字都以语言包为来源。

主题由 color-mode 管理，默认跟随系统；页头可在 system、light、dark 间循环。全局样式使用 neutral 语义颜色变量，普通界面应以 background、foreground、card、border、primary 等语义 token 适配明暗主题。图像工作台（半格切分、排版拼图、照片相框的预览区）通过 main.css 中的 workbench 颜色变量适配：light 模式为深灰色，dark 模式保持原有近黑色；两种模式的工作台都足够暗，内部文字、边框与底栏沿用白色 / 黑色半透明色。

## 5. 功能一：半格胶片切分

### 5.1 用户能力

- 批量选择或拖放 TIFF、JPEG、PNG、WebP 图像。
- 自动识别扫描图中部的分割位置与中缝宽度，并允许手动微调。
- 左右半幅可独立旋转，也可将当前切分设置应用至所有条目。
- 输出 JPEG、PNG、WebP、TIF；批量结果打包为 ZIP 下载。
- JPEG 与 WebP 支持输出质量设置。

### 5.2 数据流

~~~text
文件选择或拖放
  -> useImageQueue：格式过滤、去重、活动项、条目状态和切分设置
  -> useImagePreview：活动项解码、预览和过期请求保护
  -> useAutoSplitDetection：后台串行检测中缝
  -> 队列、预览、控制组件
  -> useImageExport：逐张解码、裁切、旋转、编码
  -> fflate ZIP 打包
  -> 浏览器下载
~~~

核心模型 ImageQueueItem 持有源文件、队列状态、分析状态、检测结果、用户是否修改过检测参数以及每张图独立的 SplitSettings。自动检测默认不覆盖用户手动设置；显式重新检测或重置时才按既有规则恢复检测结果。

格式白名单由 app/utils/image.ts 中的 SUPPORTED_EXTENSIONS、IMAGE_FILE_ACCEPT 和 partitionSupportedImages 集中维护。新增输入格式必须从此处开始扩展，不要在单个组件再写一份白名单。

自动检测只分析图像中央区域的亮度、纹理与边界变化。置信度不足时，算法会选择相对安静的接缝但把 gap 设为 0；这是“不可靠时不主动移除像素”的保护策略。

TIFF 输入在浏览器中转为 8 位 RGBA。导出 TIFF 时走像素裁切和 90 度整数旋转路径，以避免再次有损编码；高位深输入仍会受到浏览器端 8 位 RGBA 解码的限制。

## 6. 功能二：排版拼图

### 6.1 用户能力

- 通过“胶片画幅”面板选择半格或全画幅、单张或两张，共四种组合（默认两张半格）；图像槽位数量随模式变化，支持点击选择和拖放导入 TIFF、JPEG、PNG 或 WebP，拖入文件超出槽位数量时只使用前面的文件。
- 切换画幅会套用推荐布局方向（半格左右、全画幅上下）；两张时仍可改为左右或上下并交换位置。单张时隐藏布局方向、画面间距、交换按钮和图片调整中的画面选择；第二张图像只是被隐藏而不删除，切回两张即可恢复，若仅第二个槽位有图则会移入可见槽位。
- 支持预设/自定义/自动比例，默认为自动比例。
- 支持自动或手动画布尺寸、独立外边距、画面间距、cover 或 contain。
- 自动尺寸在未导入图像时采用画幅默认值（半格 2:3 竖幅、长边 1596 px；全画幅 3:2 横幅、长边 2394 px），导入后按图像实际尺寸与比例计算。预设或自定义比例下，单张按原始像素尺寸（缩放 1×）取画布，cover 取使图片一边恰好铺满画框的较小画布，contain 取较大者；两张时短边等于图片长边加对应外边距。自动比例下每个画框的长边等于图像长边（横图对齐宽度、竖图对齐高度）。
- 支持纯色、方格、圆点背景；手动模式可缩放并拖动图像。
- 可选上下或左右胶片齿孔带，宽度限制为 24 至 240 px 且不计入画布尺寸；齿孔采用圆角并按 135 胶片比例密排，偏向带内侧，外侧留出边缘文字空位。
- 可选边缘文字（最多 48 个字符），沿两侧齿孔带外缘交错重复印制，左右放置时自下向上阅读；颜色可选琥珀、白、黑预设或任意十六进制颜色。
- 可选“胶片质感”开关（默认关闭）：为背景画布和齿孔带加入确定性胶片颗粒（不作用于照片本身），齿孔边缘柔和且略不规则，带细微明暗变化；PNG 齿孔镂空保持透明。
- 输出 JPEG、PNG 或 WebP（JPEG 与 WebP 可调输出质量 70–100%，默认 92%）；PNG 齿孔内部保持透明。

### 6.2 数据流与约束

~~~text
FilmCompositionEditor
  |- useCompositionImages：固定两个槽位、验证、解码任务版本保护、释放旧资源
  |- useCompositionSettings：设置为单一来源，由 frameFormat/frameCount 派生 activeImages 与画布 geometry
  '- FilmCompositionWorkspace
       '- useCompositionCanvas：按设置和 geometry 绘制并下载
~~~

useCompositionImages 始终保存固定的两个槽位（MAX_COMPOSITION_FRAMES），只有前 frameCount 个槽位参与布局：切换为单张只隐藏第二个槽位而不释放其图像，切回两张即可恢复；仅第二个槽位有图时，编辑器会先交换槽位再切换。编辑器因此把 activeImages（前 frameCount 项）交给工作区和控制面板，拖放分配也只在活动槽位内进行。useCompositionSettings 由 frameFormat 与 frameCount 派生 activeImages、画框网格和 geometry；切换画幅时同步套用推荐布局方向。app/types/composition.ts 中的 COMPOSITION_FRAME_FORMATS 是各画幅默认比例、长边和推荐布局方向的唯一来源，空画框和自动尺寸的默认值都取自这里，不要在组件或 composable 中重复这些数字。

CompositionSettings（含 frameFormat 与 frameCount）是拼图设置的单一来源，CompositionGeometry 是派生出的画布和画框几何信息。自动和手动尺寸都须遵守 MAX_COMPOSITION_CANVAS_SIDE（8000 px）。齿孔带在主画布外扩展最终输出尺寸，因此须通过 getCompositionOutputGeometry 计算，不能只修改显示尺寸。齿孔几何、边缘文字与颗粒纹理绘制集中在 app/utils/filmSprocket.ts 与 app/utils/filmTexture.ts；颗粒使用固定种子的伪随机数与缓存的小尺寸噪声贴图平铺，不对整幅画布读取像素，以免抬高大画布内存峰值。

拼图异步加载以槽位版本号阻止旧解码结果覆盖新选择。替换、移除或卸载时必须释放旧 DecodedImage。手动模式才允许 Canvas 内拖动图片；工作区只上报拖动增量，编辑器负责更新共享状态。

## 7. 功能三：照片相框

### 7.1 用户能力

- 单张照片槽位，支持点击选择和拖放 TIFF、JPEG、PNG、WebP；适配任意画幅，兼容胶片扫描与数码照片。
- 八种版式（白边、画廊、悬浮、信息条、品牌条、左图、右图、分栏）作为预设套用边框、照片阴影、底板与显示内容，之后仍可逐项调整。版式由文字布局（stack 堆叠、split 信息条、bar 品牌条、column 竖线分栏且与照片底边对齐，四项间距由 FrameSettings.columnSpacing 控制并随版式重置）与信息位置（bottom、left、right）组合而成；左右并排版式的信息朝照片一侧对齐，边框滑块随信息位置切换为上、下、外侧边框与信息栏宽度。
- 画布比例与排版拼图共用 FilmRatioPicker 和 app/types/canvas.ts 的预设与 1:5–5:1 限制；非自动比例只在居中的相框四周补足画布（有底板时补底板，否则补相框纸面），不裁切照片。
- 八种照片阴影预设与强度；可选底板，底板上的相框另有独立阴影。
- 导入时本地读取 EXIF 自动填写机型、镜头、曝光参数和日期，并按厂商匹配品牌；字段均可手动修改。各信息行与标语有独立字号倍率（lineScales / taglineScale），说明文字以 FrameCaptionRun 携带倍率，同一行多个项目按基线对齐。
- 照片来源分为数码与胶片；识别到扫描仪 EXIF 时自动切换为胶片模式且不填写扫描仪信息。
- 品牌目录、内置 logo 图形、七种文字标样式、自定义 logo 图片；单色标志可重新着色。
- 18 款随应用打包的 OFL 字体（仅拉丁子集）与三种系统中文字体；输出 JPEG、PNG 或 WebP（JPEG 与 WebP 可调输出质量 70–100%，默认 92%），可选原尺寸或自定义长边（256–8000 px，不放大原图）。
- 预设码：app/utils/framePreset.ts 将 FramePreset（FrameSettings 去掉标语文字与输出质量，套用预设时保留当前质量）序列化为 `FXF<版本>.` + base64url(DEFLATE(JSON))，使用已有依赖 fflate；解码前限制长度（MAX_FRAME_PRESET_LENGTH），逐字段校验枚举、颜色与数值范围，缺失或无效的字段沿用当前设置。导入由 useFrameSettings.importPreset 应用，视为手动选择品牌与来源类型；剪贴板与提示在 useFramePreset 中处理，剪贴板不可用时预设码保留在输入框供手动复制。

### 7.2 数据流与约束

~~~text
FilmFrameEditor
  |- useFrameImage('frame-photo', { readExif })：单槽位、版本号保护、先读 EXIF 再串行解码、释放旧资源
  |- useFrameImage('frame-logo')：自定义 logo 槽位，规则相同
  |- useFrameSettings：FrameSettings 单一来源；版式、品牌、来源类型的自动/手动选择
  |- useFrameMetadata：EXIF → 说明字段；记录用户编辑过的字段
  '- FilmFrameWorkspace
       '- useFrameCanvas：预览绘制（缓存降采样照片）、logo 资源解析、字体加载与导出
~~~

- 布局与绘制集中在 app/utils/photoFrame.ts：getFrameLayout 以照片宽高的几何平均（unit）为基准计算上、右、下、左四边边框、文字与阴影尺寸，预览与导出共用同一绘制函数，只改变 scale。FrameLayout 的 card 为纸面与裁切区域（无底板时随画布比例扩展），content 为自然尺寸的相框，说明文字始终以 content 定位，避免画布扩展后信息栏脱离照片。导出尺寸须经 getFrameScale 与 MAX_FRAME_CANVAS_SIDE（复用拼图的 8000 px 上限）计算，不放大原图。
- 阴影只绘制阴影本身（形状置于画布外，用偏移把阴影带回），大半径阴影在降采样离屏 Canvas 上绘制再放大，临时 Canvas 绘制后立即释放；照片阴影裁切在相框内。
- 字体 @font-face 由 app/assets/css/frame-fonts.css 引入 @fontsource 包的 latin 子集，只在相框页面加载。Canvas 绘制前用 document.fonts.load 确保字体就绪；未就绪时先用回退字体绘制并在加载后重绘。Canvas letterSpacing 兼容性不足，字距通过逐字符排版实现。
- EXIF 读取在 app/utils/exif.ts，通过 Blob.slice 只读取元数据所在的少量字节，不整读大 TIFF；解析失败返回 undefined 而不抛错。字段格式化、扫描仪识别在 app/utils/frameMetadata.ts。
- 品牌目录与 EXIF 匹配在 app/utils/cameraBrands.ts；logo SVG 位于 app/assets/frame-logos，经 import.meta.glob 按需加载为 data URL 并补写固有尺寸（Firefox 需要），来源与许可记录在同目录的 SOURCES.md。
- 自动选择（品牌、来源类型）只在用户未手动选择时生效；用户编辑过的说明字段在换图时保留，“从 EXIF 填写”会强制覆盖并清除编辑标记。

## 8. 资源、并发和错误处理模型

图像处理的主要风险是高分辨率 TIFF 同时保留多个完整像素缓冲区。因此现有实现有意采用以下方式：

- decodeImage 维护全局串行解码队列。
- 自动检测和批量导出逐张执行，并在循环间让出事件循环。
- DecodedImage 统一提供 dispose：ImageBitmap 调用 close，临时 Canvas 将宽高置零。
- 预览以递增 token 废弃迟到的异步结果；拼图按槽位版本号防止竞态。
- URL.createObjectURL 生成的下载地址在触发下载后回收。

新增图像读取、Canvas、动画帧、定时器或指针捕获逻辑时，应同时设计成功、失败、替换、取消和卸载路径的释放策略。

可预期的图像处理失败以 AppErrorCode 和 errors.* 翻译键表达；交互层用 useTranslatedError 转换后通过 Toast 呈现。不要把底层异常原文直接作为用户提示。

## 9. 质量与配置现状

- Oxfmt：100 列、无分号、单引号、无尾随逗号。
- Oxlint：correctness 为 error；suspicious 和 perf 为 warn。
- .codex、构建产物、依赖目录和 sample 不参与 lint。
- format 与 format:check 当前只覆盖应用代码、主要配置和 README；.codex 下的说明文档不在自动格式化范围内，修改时需自行保持 Markdown 的可读性。
- components.json 使用 reka-vega、neutral 基础色、CSS Variables 和 Lucide；生成或调整基础 UI 时必须保持这些约定。

## 10. 本地 MCP 服务（packages/mcp）

workspace 包 film-x-mcp 是由桌面 AI Agent（Claude Desktop、ChatGPT Desktop、Codex CLI 等）以本地进程启动的 stdio MCP 服务，提供 list_images、read_photo_exif、split_half_frame、compose_film、frame_photo、frame_preset 六个工具。

- 边界：只在本机运行。图像从本地路径读取并写入本地路径，不上传、不做远程处理。渲染页面不再随服务打包，而是 Film X 网站的一部分：路由 /mcp-renderer，代码为 app/pages/mcp-renderer.vue、app/composables/useAgentRenderer.ts 与 app/utils/agentRenderer.ts，共享协议在 app/types/agent.ts；页面带 noindex，普通访客只看到一段说明。服务通过仅监听回环地址（127.0.0.1，随机端口）的反向代理，在无头 Chrome / Edge（playwright-core，可用 FILM_X_BROWSER_PATH 覆盖）中加载 FILM_X_SITE_URL（默认 https://filmx.nya.run/）上的该页面。
- 代理约束：只转发对网站自身文件的 GET / HEAD 请求且不带 Cookie；无头浏览器中阻止网站的 Service Worker；带内容哈希的 _nuxt 资源在服务运行期间缓存在内存中。图像只在服务与页面之间经回环端口传递，不发送到网站。每次启动浏览器（首个任务及空闲 5 分钟关闭后）都需要能访问网站。FILM_X_SITE_URL 必须为 https，仅 localhost / 127.0.0.1 / [::1] 允许 http，支持子路径。渲染页面的代码可访问当前任务的图像，只应指向可信的 Film X 部署。
- 版本要求：网站须运行 0.6.0 或更高版本（提供 /mcp-renderer），否则首个任务报错并提示部署或设置 FILM_X_SITE_URL；compose_film / frame_photo 输出 WebP 需 0.7.0 及以上（渲染前检查，较旧时报错并提示改用 jpeg/png 或部署 0.7.0+，不会把 JPEG 写入 .webp）。compose_film 与 frame_photo 的 format 为 jpeg/png/webp（frame_photo 也接受 .webp 输出路径），quality 适用于 JPEG 与 WebP（0.7–1，更低按 0.7）；AGENT_RENDERER_PROTOCOL 仍为 1。服务与页面共用 app/types/agent.ts 中的 AGENT_RENDERER_PROTOCOL，不一致时错误信息指明应更新哪一侧。
- 任务串行执行以控制大 TIFF 的内存峰值。packages/mcp 的 dist/server.mjs 不含渲染包；server.mjs 支持 --version / --help / --print-config（打印填好该 Node 与 server.mjs 绝对路径的配置，FILM_X_SITE_URL 非默认时一并写入，并标明各平台配置文件位置）。
- 一键安装（macOS / Linux 用 install.sh，Windows 用 install.ps1：PowerShell 5.1 / 7，`irm https://filmx.nya.run/mcp/install.ps1 | iex`，默认目录 %LOCALAPPDATA%\film-x-mcp，失败时抛出错误而非退出以保留用户窗口；已在 macOS 上用 PowerShell 7 完整验证，尚未在 Windows 与 Windows PowerShell 5.1 上实际运行；与更新相关的改动尚未用 PowerShell 运行）：网站构建经 scripts/build-site.mjs 在 /mcp/ 发布 install.sh、install.ps1、server.mjs、package.json（锁定运行时依赖的精确版本）与 SHA256SUMS；用户运行 `curl -fsSL https://filmx.nya.run/mcp/install.sh | sh`（网站需 0.6.0 及以上，否则下载 404 并提示）。脚本先下载 SHA256SUMS（也列出 install.sh 与 install.ps1），与已安装副本一致且 server.mjs --version 仍可运行时提示已是最新并跳过下载与 npm install（仍打印配置）；否则检查 Node.js 22+（含 npm）与 curl/wget，下载并校验 SHA-256，运行 npm install --omit=dev 并确认 server.mjs --version，原子化安装到 ~/.film-x-mcp（FILM_X_MCP_HOME 可覆盖；新副本先在目标旁暂存再移入，仅替换带标记文件的既有安装，拒绝其他文件夹），未找到 Chrome / Edge 时警告，并通过 node server.mjs --print-config 打印 Claude Desktop（JSON）与 ChatGPT Desktop / Codex（config.toml）配置。不修改任何 Agent 配置，不上传。更新即重新运行（升级 Node 后也需重新运行）；每次安装保留 install.sh / install.ps1 副本与记录来源网站的 site-url 文件，运行保留副本即可无需环境变量地更新同一文件夹（macOS / Linux：sh ~/.film-x-mcp/install.sh；Windows：powershell -NoProfile -ExecutionPolicy Bypass -File "%LOCALAPPDATA%\film-x-mcp\install.ps1"；FILM_X_SITE_URL / FILM_X_MCP_HOME 仍优先），--print-config 末尾附该安装的更新命令（无安装脚本副本时退回“重新运行安装脚本”）；卸载为删除安装文件夹并移除配置。
- Node 版本：运行 MCP 服务需要 Node.js 22 或更高版本；项目自身开发仍使用 mise 管理的 Node.js 24。
- 复用方式：渲染页面直接复用 app/utils 的解码、绘制、EXIF 与预设码能力，保证与网页版输出一致；不复制业务规则。服务端只负责路径校验、回环代理与文件传输、串行队列与工具 schema。
- 渲染类工具默认不覆盖已有文件、不写入输入文件，并返回输出路径、像素尺寸与长边不超过 1024 px 的 JPEG 预览；画布限制与网页版相同。

更多面向后续修改的强制准则见 ../rules/development-guidelines.md。
