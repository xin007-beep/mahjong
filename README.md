# 单机大众麻将

一个为平板横屏体验设计的 React + Tailwind CSS 单机麻将项目。

## 启动

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

`vite.config.js` 已设置 `base: "./"`，构建产物更适合静态托管、离线包或 WebView 包装。

## GitHub Actions 自动产出 APK

仓库已包含工作流 [android-apk.yml](/C:/Users/tong/Documents/Playground/mahjong-tablet-js/.github/workflows/android-apk.yml)。

使用方式：

1. 把整个项目目录推到你自己的 GitHub 仓库根目录。
2. 打开 GitHub 仓库的 `Actions`。
3. 运行 `Build Android APK` 工作流，或者直接向 `main` / `master` 推送代码。
4. 等待任务完成后，在工作流页面下载 `mahjong-tablet-debug-apk` artifact。

这个流程会在 GitHub Runner 上：

1. 安装 Node 依赖。
2. 运行测试。
3. 打包网页资源。
4. 用 Capacitor 生成 Android 容器。
5. 用 Gradle 构建 `debug APK`。

## APK 打包思路

这个项目本身是纯前端网页。要在 GitHub 上进一步打包为 APK，推荐两条路径：

1. 用 Capacitor 把 `dist/` 包装成 Android WebView 应用。
2. 部署为 HTTPS 站点后，用 TWA 或 WebView 容器生成 Android 包。

项目中的音效函数已预留占位，后续可以直接接入真实音频资源。
