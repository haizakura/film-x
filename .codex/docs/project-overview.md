# Film X 项目说明

> 本文依据当前工作区的代码、配置与 README 整理，说明“项目现在如何工作”。开发时如与用户需求或实际配置冲突，应以前者和实际代码为准。

## 1. 项目定位与边界

Film X 是一个浏览器本地优先的胶片图像处理工具集。图像读取、TIFF 解码、自动检测、Canvas 绘制、格式编码、ZIP 打包和文件下载都在用户浏览器内完成；当前仓库没有业务服务端、远程图像处理或持久化存储实现。

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

其中 check 依序执行格式检查、Oxlint 和 Nuxt 类型检查。当前没有测试脚本、测试框架依赖或测试目录；不要假定存在可运行的单元测试或端到端测试。

## 3. 目录与分层

~~~text
app/
  app.vue                         全局应用壳
  pages/
    index.vue                     路由 /：半格胶片切分工作流编排
    compose.vue                   路由 /compose：排版拼图入口
  components/
    film/                         产品领域 UI：上传、队列、预览、控制、导航
    film/composition/             拼图编辑器、工作区和分项控制面板
    ui/                           Button、Switch、Dialog、Progress、Sonner 等基础原语
  composables/                    响应式状态、异步任务、资源生命周期与 Canvas 逻辑
  types/                          图像与拼图的领域类型、联合类型、边界常量
  utils/                          无 UI 的解码、裁切、检测、下载和错误工具
  lib/utils.ts                    Tailwind class 合并函数 cn
  assets/css/main.css             Tailwind 入口、主题令牌、全局基础及共享样式
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

根组件 app/app.vue 渲染页头、保活页面、页脚和 Toast。NuxtPage 使用 max 为 4 的 keepalive 配置，使两个工具页面在站内切换后维持当前内存状态。

路由采用无语言前缀策略：

| 路由 | 入口 | 作用 |
| --- | --- | --- |
| / | app/pages/index.vue | 批量半格胶片切分 |
| /compose | app/pages/compose.vue | 最多两张图的胶片排版拼图 |

国际化当前仅支持 en 与 zh-CN。默认语言和回退语言均为 en；首次访问会根据浏览器语言选择，并把选择写入 Cookie。页面标题、描述、Toast、可访问性标签和普通界面文字都以语言包为来源。

主题由 color-mode 管理，默认跟随系统；页头可在 system、light、dark 间循环。全局样式使用 neutral 语义颜色变量，普通界面应以 background、foreground、card、border、primary 等语义 token 适配明暗主题。图像工作台保持深色属于产品视觉的一部分。

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

- 最多导入两张 TIFF、JPEG、PNG 或 WebP 图像，并支持拖放。
- 支持左右或上下布局、交换位置、预设/自定义/自动比例。
- 支持自动或手动画布尺寸、独立外边距、画面间距、cover 或 contain。
- 支持纯色、方格、圆点背景；手动模式可缩放并拖动图像。
- 可选上下或左右胶片齿孔带，宽度限制为 24 至 240 px。
- 输出 JPEG 或 PNG；PNG 齿孔内部保持透明。

### 6.2 数据流与约束

~~~text
FilmCompositionEditor
  |- useCompositionImages：两个槽位、验证、解码任务版本保护、释放旧资源
  |- useCompositionSettings：设置为单一来源，派生画布 geometry
  '- FilmCompositionWorkspace
       '- useCompositionCanvas：按设置和 geometry 绘制并下载
~~~

CompositionSettings 是拼图设置的单一来源，CompositionGeometry 是派生出的画布和画框几何信息。自动和手动尺寸都须遵守 MAX_COMPOSITION_CANVAS_SIDE（8000 px）。齿孔带在主画布外扩展最终输出尺寸，因此须通过 getCompositionOutputGeometry 计算，不能只修改显示尺寸。

拼图异步加载以槽位版本号阻止旧解码结果覆盖新选择。替换、移除或卸载时必须释放旧 DecodedImage。手动模式才允许 Canvas 内拖动图片；工作区只上报拖动增量，编辑器负责更新共享状态。

## 7. 资源、并发和错误处理模型

图像处理的主要风险是高分辨率 TIFF 同时保留多个完整像素缓冲区。因此现有实现有意采用以下方式：

- decodeImage 维护全局串行解码队列。
- 自动检测和批量导出逐张执行，并在循环间让出事件循环。
- DecodedImage 统一提供 dispose：ImageBitmap 调用 close，临时 Canvas 将宽高置零。
- 预览以递增 token 废弃迟到的异步结果；拼图按槽位版本号防止竞态。
- URL.createObjectURL 生成的下载地址在触发下载后回收。

新增图像读取、Canvas、动画帧、定时器或指针捕获逻辑时，应同时设计成功、失败、替换、取消和卸载路径的释放策略。

可预期的图像处理失败以 AppErrorCode 和 errors.* 翻译键表达；交互层用 useTranslatedError 转换后通过 Toast 呈现。不要把底层异常原文直接作为用户提示。

## 8. 质量与配置现状

- Oxfmt：100 列、无分号、单引号、无尾随逗号。
- Oxlint：correctness 为 error；suspicious 和 perf 为 warn。
- .codex、构建产物、依赖目录和 sample 不参与 lint。
- format 与 format:check 当前只覆盖应用代码、主要配置和 README；.codex 下的说明文档不在自动格式化范围内，修改时需自行保持 Markdown 的可读性。
- components.json 使用 reka-vega、neutral 基础色、CSS Variables 和 Lucide；生成或调整基础 UI 时必须保持这些约定。

更多面向后续修改的强制准则见 ../rules/development-guidelines.md。
