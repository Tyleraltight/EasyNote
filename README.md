# EasyNote 📝

**EasyNote** 是一款极简主义风格的个人效率管理应用，结合了**年度目标（Flag）追踪**、**随手记/待办事项**以及**日历进度回顾**功能。旨在提供流畅、无感的数据持久化体验，以及充满物理交互反馈的现代化前端界面。

<div align="center">
  <img src="src/assets/localhost_5173_%20(1).png" alt="EasyNote Dashboard Screenshot" width="800"/>
</div>

---

## ✨ 核心特性

- 🎯 **Flag 目标追踪系统**
  - **进度跟踪**：设定目标次数（如：每周跑步 3次），每次完成点击打卡，实时查看进度条。
  - **智能转化**：在“想法”模式下输入带数字的文本（如：“本月完成阅读 5 本书”），可一键通过行级闪电图标⚡快捷创建新 Flag。
  - **拖拽排序**：原生支持 HTML5 拖放（Drag & Drop），轻松调整 Flag 优先级。
  - **交互反馈**：打卡按钮具备真实的“物理按压”缩放反馈；Flag 达到 100% 完成态时，背景平滑过渡至琥珀色（Amber），按钮图标 360° 轻快翻转，支持一键回旋重置。

- 📅 **年度进度回顾（Monthly Block Calendar）**
  - **可视化日历**：按月切换显示的方块日历，自动高亮“今天”。
  - **状态映射**：有打卡记录的日期自动呈现对应任务专属配色的指示点。
  - **完成日发光特效**：当某项 Flag 在一天内被彻底完成时，该日期格子将触发特殊的动画。

- 📝 **极简边栏：想法与待办**
  - **双模式自由切换**：在无拘无束的“想法”文本框与结构化的“待办任务”列表间无缝切换。
  - **悬浮操作**：待办事项支持高效的悬浮删除交互。

- 💾 **增强型无感数据持久化**
  - **实时自动保存**：所有数据变动（增、删、改、打卡）即时生效，彻底告别手动保存按钮。
  - **安全水合 (Safe Hydration)**：启动时采用 `localStorage` → `IndexedDB` 双层级优先级读取，并具备防空态覆盖保护机制。
  - **底层双写机制**：数据实时写入 LocalStorage 与 IndexedDB 做本地双重备份。
  - **智能静默备份**：当检测到重要 Milestone（如 Flag 进度达到 100%）时，自动触发后台 JSON 数据导出至操作系统 Download 目录。
  - **友好错误处理**：针对极限存储空间占满 (`QuotaExceededError`) 情况，提供醒目的浮动 Toast 提示，保障应用不崩溃。

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript + Vite
- **样式**: Tailwind CSS (自定义动画如 `glow-pulse`, `btn-press-active` 等均在 `index.css` 声明)
- **图标**: Lucide React
- **持久化**: HTML5 LocalStorage + IndexedDB (原生 API)
- **零额外依赖**: 拖拽、日历渲染等功能均由原生 JavaScript 实现保持项目轻量

## 🚀 快速启动

1. 确保在本地安装了 [Node.js](https://nodejs.org/)。
2. 克隆本仓库：
   ```bash
   git clone https://github.com/Tyleraltight/EasyNote.git
   ```
3. 进入项目目录并安装依赖：
   ```bash
   cd EasyNote
   npm install
   ```
4. 启动本地开发服务器：
   ```bash
   npm run dev
   ```
5. 打开浏览器访问终端输出的 URL (通常为 `http://localhost:5173`)。

## 💡 设计理念

- **KISS 原则 (Keep It Simple, Stupid)**：极简且高度内聚的代码基础，不引入不必要的状态管理或第三方沉重库。
- **现代化审美**：精心挑选的色彩主题、多状态微交互、圆角控制和阴影系统，打造直观且极具质感的 SaaS 级用户界面。
