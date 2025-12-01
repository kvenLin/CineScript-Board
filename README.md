# CineScript & Board AI

<div align="center">
  <h3>视觉叙事，重塑想象</h3>
  <p>描述你的构想。上传角色。几秒钟内生成专业的分镜脚本。</p>
  <p>
    <a href="https://kvenlin.github.io/CineScript-Board/">在线体验</a>
  </p>
</div>

## 📖 简介

CineScript & Board AI 是一款旨在彻底改变电影制作人和讲故事者前期制作流程的强大工具。通过利用 Google Gemini AI 的能力，它将文本描述转化为视觉分镜脚本，让创作者能够即时可视化他们的叙事。

## ✨ 功能特性

-   **AI 驱动生成**：利用 Google Gemini 将文本故事转化为完整的视觉分镜脚本。
-   **角色一致性**：上传角色参考图，保持画面间角色形象的视觉一致性。
-   **风格自定义**：为你的分镜脚本定义特定的视觉风格（如赛博朋克、水彩、黑色电影等）。
-   **交互式编辑**：
    -   **魔法编辑 (Magic Edit)**：框选图片区域并通过文字提示词进行修改。
    -   **重新生成**：对单帧画面进行精细控制。
-   **多语言支持**：全面支持中文和英文界面。
-   **导出选项**：将完整的分镜脚本资产打包下载为 ZIP 文件。
-   **安全的 API Key 管理**：支持环境变量配置和手动输入 API Key。

## 🛠️ 技术栈

-   **前端框架**: React 19
-   **构建工具**: Vite
-   **样式库**: TailwindCSS
-   **图标库**: Lucide React
-   **AI 模型**: Google Gemini (via `@google/genai` SDK)
-   **工具库**: JSZip (用于打包下载)

## 🚀 快速开始

### 前置要求

-   Node.js (推荐 v18 或更高版本)
-   Google Gemini API Key ([从 Google AI Studio 获取](https://aistudio.google.com/))

### 安装步骤

1.  **克隆仓库**

    ```bash
    git clone https://github.com/kvenlin/CineScript-Board.git
    cd CineScript-Board
    ```

2.  **安装依赖**

    ```bash
    npm install
    ```

3.  **配置环境变量**

    在项目根目录创建 `.env` 文件并添加你的 API Key：

    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

    *注意：你也可以直接在应用界面的设置中手动输入 API Key。*

4.  **启动开发服务器**

    ```bash
    npm run dev
    ```

    打开 http://localhost:3000 即可访问应用。

## 📦 部署

本项目已配置 GitHub Actions，支持自动部署到 GitHub Pages。

1.  将你的代码推送到 `main` 分支。
2.  部署工作流会自动构建应用并将其部署。
3.  访问在线地址：`https://kvenlin.github.io/CineScript-Board/`。

*请确保在 GitHub 仓库的 Secrets 设置中添加 `GEMINI_API_KEY`，以便在生产环境中正常使用（尽管对于公开部署，建议用户在 UI 中手动输入 Key）。*

## 📄 许可证

[MIT License](LICENSE)
