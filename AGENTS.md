# AGENTS.md

## Project

古诗卡片分享工具（Poetry Card Share）—— 将古诗词排版成精美卡片，导出为图片分享到小红书等社交平台。

## Tech Stack

- **Vite + React + TypeScript**
- **html2canvas** 导出 PNG/JPG 图片
- **Tailwind CSS** 样式
- 纯前端项目，无后端依赖（诗词 API 后期接入）

## Project Structure

```
gushi_card_share/
├── src/
│   ├── components/
│   │   ├── InputArea/        # 左侧：文案输入区
│   │   ├── PreviewArea/      # 中间：卡片预览区
│   │   ├── SettingsPanel/    # 右侧：卡片设置区
│   │   └── Card/             # 卡片渲染组件
│   ├── templates/            # 内置卡片模板（古风、简约、禅意等）
│   ├── utils/
│   │   ├── export.ts         # html2canvas 导出逻辑
│   │   ├── textSplitter.ts   # 长文本智能拆分
│   │   └── fontManager.ts    # 字体加载管理
│   ├── types/
│   └── App.tsx
├── public/
│   └── fonts/                # 用户提供的字体包
├── package.json
└── vite.config.ts
```

## Core Features

### 1. 三栏布局

| 区域 | 功能 |
|------|------|
| 左侧输入区 | 文案编辑，支持富文本 |
| 中间预览区 | 实时卡片预览，多卡片展示 |
| 右侧设置区 | 卡片样式配置 |

### 2. 卡片设置项

- **比例**：3:4 (600×800)、9:16 (540×960)、1:1 (720×720)
- **背景**：图片背景 / 纯色背景
- **排版**：
  - 文本大小
  - 垂直内间距、横向内间距
  - 行间距
  - 文字颜色
  - 字体选择
- **版权信息**：固定在卡片底部

### 3. 文本输入能力

- 标题
- 高亮
- 有序列表 / 无序列表
- 引用
- 文本对齐：居中、居左、居右
- 垂直对齐：顶部、居中、底部

### 4. 多卡片拆分

- 长文本自动拆分到多张卡片
- 策略：充分利用横向空间，最少展示一条内容
- 缩略图尽量展示多张卡片，空间不足时垂直滚动

### 5. 导出

- 导出为 PNG/JPG 图片
- 用户下载后可直接分享到小红书

## Setup

```bash
npm install
npm run dev     # 开发服务器
npm run build   # 生产构建
```

## Conventions

- 组件命名：PascalCase（`InputArea`、`PreviewArea`）
- 工具函数命名：camelCase（`splitText`、`exportCard`）
- 样式优先用 Tailwind CSS，复杂组件可用 CSS Modules
- 所有卡片相关样式通过 props/config 驱动，方便模板切换

## Background Images

背景图位于 `public/images/`，提供 3 张卡片背景：

| 文件 | 用途 |
|------|------|
| card_bg.png | 卡片背景 1 |
| card_bg1.png | 卡片背景 2 |
| card_bg2.png | 卡片背景 3 |
| example.png | 效果示例图 |

## Font Configuration

字体文件位于 `public/fonts/`，配置如下：

| 字体文件 | 内部名称 | 显示名称 |
|---------|---------|---------|
| HuiwenMingchao.ttf | HuiwenMingchao | 汇文明朝体 |
| ChillKai_Big5.woff2 | ChillKai | 寒蝉行楷体 |
| AlimamaDaoLiTi.woff2 | AlimamaDaoLiTi | 阿里妈妈刀隶体 |
| HanyiZhongliShujian.ttf | HanyiZhongliShujian | 汉仪中隶书简 |
| KingHwa.ttf | KingHwa | 京华老宋体 |
| 系统字体 | Arial, sans-serif | Arial |
| 系统字体 | 'Microsoft YaHei', sans-serif | 微软雅黑 |
| 系统字体 | SimSun', serif | 宋体 |
| 系统字体 | 'SimHei', sans-serif | 黑体 |
| 系统字体 | 'KaiTi', serif | 楷体 |

使用 `@font-face` 加载自定义字体，font-family 使用 `name` 字段值。

## Notes

- 字体包由用户提供，放置在 `public/fonts/`
- 诗词 API 后期接入，先手动输入
- 内置 3+ 套卡片模板（古风、简约、禅意）
- localStorage 保存最近编辑记录
