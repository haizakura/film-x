# Film X

一个在浏览器本地运行的胶片图像处理工具合集。

## 工具

- 半格胶片切分工具
  - 将包含左右两幅半格照片的扫描图像切成独立文件，支持 TIFF、JPEG、PNG 和 WebP 输入。导入后会逐张自动识别分割位置和中缝宽度，也可手动微调分割线、中缝宽度与旋转方向，并批量打包下载。
- 半格胶片排版拼图工具
  - 将2张半格胶片图像进行排版拼接成单张图像。支持自定义画布比例调节，自定义画布颜色和图案，以及添加各类水印和文字内容。

页面顶部的横向菜单用于在两项工具之间切换。工具页面会保留工作状态，切换后返回不会丢失已导入的图像。

## 界面与主题

- 默认跟随系统的 light / dark 外观设置，也可在页面右上角手动循环切换。
- light 模式使用 `#FEFEFE` 作为页面背景，dark 模式使用 `#141414`。
- 两种模式均使用独立的文字、边框、浮层与交互状态配色；图像预览工作台始终保持深色，便于判断照片边缘。

## 技术栈

前后端：Nuxt 4 + Nuxt UI + Tailwind CSS

代码检查与格式化：Oxlint + Oxfmt

## 本地开发

项目使用 [mise](https://mise.jdx.dev/) 管理 Node.js 版本，当前配置为 Node.js 24。

```bash
mise install
mise exec -- corepack pnpm install
mise exec -- corepack pnpm dev
```

开发服务器默认运行在 `http://localhost:3000`。

## 检查与构建

```bash
mise exec -- corepack pnpm check
mise exec -- corepack pnpm build
```

## 代码结构

- `app/pages`：只负责页面组合和跨模块事件协调。
- `app/components/film`：无业务状态所有权的展示与表单组件，通过 props / emits 复用。
- `app/composables`：文件队列、图像预览和批量导出工作流。
- `app/utils`：图像解码、裁切、旋转及格式转换等纯工具函数。

半格切分工作流复用了 [Full2Half](https://github.com/haizakura/full2half) 的 GPL-3.0-only 源码，并在 Film X 的统一页面结构与主题系统中重新组织。

- `oxlint` 负责代码检查。
- `oxfmt` 负责格式化。

- 图像处理完全在浏览器内完成，不会上传到服务器。
- 自动切分会分析中央区域的纵向亮度、纹理和边界变化；无法可靠识别中缝时不会主动移除像素。
- TIFF 会在浏览器中解码；输出支持 JPEG、PNG、WebP 与 TIF。TIF 使用未压缩的 8 位 RGBA 像素切分与 90° 整数旋转，避免再次有损编码；高位深 TIFF 输入仍会受浏览器端解码为 8 位 RGBA 的限制。

## 许可证

本项目采用 [GNU General Public License v3.0](LICENSE)（GPL-3.0-only）许可。
