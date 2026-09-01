# Film X

一个在浏览器本地运行的胶片图像处理工具合集。图像解码、编辑与导出均在本地完成，不会上传到服务器。

## 工具

### 半格胶片切分

- 支持批量导入 TIFF、JPEG、PNG 和 WebP，也可将文件直接拖入页面。
- 自动识别每张扫描图像的分割位置与中缝宽度，并允许手动微调。
- 两侧画面可分别旋转，也可将当前设置应用到全部图像。
- 支持导出 JPEG、PNG、WebP 与 TIF，并将批量结果打包为 ZIP 下载。

### 排版拼图

- 最多放置两张图像并排版为一张成品图，支持点击选择和拖拽导入 TIFF、JPEG、PNG 与 WebP。
- 支持左右、上下两种布局，以及交换画面顺序。
- 画布可使用预设比例、自定义比例或根据图像与间距自动计算比例。
- 外边距和画面间距均可滑动或直接输入；外边距支持统一设置和上、右、下、左独立设置。
- 支持填满裁切或完整显示，并可输入十六进制 RGB 背景色、选择纯色、方格或圆点底纹。
- 支持导出 JPEG 或 PNG。

页面顶部的横向菜单用于在两项工具之间切换。工具页面会保留工作状态，切换后返回不会丢失已导入的图像。

## 界面与主题

- 默认跟随系统的 light / dark 外观设置，也可在页面右上角手动循环切换。
- light 模式使用 `#F2F3F5` 作为页面背景，dark 模式使用 `#0A0A0A`。
- 交互主色使用 `#409EFF`，成功、警告、危险与信息状态采用统一语义色板。
- 两种模式均使用独立的文字、边框、浮层与交互状态配色；图像预览工作台始终保持深色，便于判断照片边缘。

## 技术栈

应用框架与界面：Nuxt 4 + Vue 3 + shadcn-vue + Reka UI + Tailwind CSS

图像与压缩：UTIF + fflate

代码检查与格式化：TypeScript + Oxlint + Oxfmt

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
mise exec -- pnpm build
```

## 代码结构

- `app/pages`：半格切分与排版拼图页面，以及各自的工作流编排。
- `app/components/film`：通用的上传、图像队列、预览、参数控制与导出组件。
- `app/composables`：文件队列、自动识别、图像预览和批量导出状态。
- `app/types`：图像条目、切分设置与导出格式等共享类型。
- `app/utils`：图像解码、检测、裁切、旋转及格式转换工具。
- `app/assets/css`：全局主题、颜色和基础控件样式。
- `public`：favicon 等公开静态资源。

半格切分工作流复用了 [Full2Half](https://github.com/haizakura/full2half) 的 GPL-3.0-only 源码，并在 Film X 的统一页面结构与主题系统中重新组织。

## 图像处理说明

- 图像处理完全在浏览器内完成，不会上传到服务器。
- 自动切分会分析中央区域的纵向亮度、纹理和边界变化；无法可靠识别中缝时不会主动移除像素。
- TIFF 会在浏览器中解码；半格切分输出支持 JPEG、PNG、WebP 与 TIF。TIF 使用未压缩的 8 位 RGBA 像素切分与 90° 整数旋转，避免再次有损编码；高位深 TIFF 输入仍会受浏览器端解码为 8 位 RGBA 的限制。

## 许可证

本项目采用 [GNU General Public License v3.0](LICENSE)（GPL-3.0-only）许可。
