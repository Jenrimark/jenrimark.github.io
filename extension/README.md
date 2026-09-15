# Jenrimark View 书签桥（Chrome 扩展）

为 [/view/](/view/) 起始页提供**本机书签自动同步**。仅使用 `bookmarks` 权限，数据不上传服务器。

## 安装（本机）

1. 解压 `jenrimark-view-extension.zip`（解压后文件夹内应有 `manifest.json`）
2. Chrome 打开 `chrome://extensions`
3. 开启右上角 **开发者模式**
4. **加载已解压的扩展程序** → 选择解压后的文件夹
5. 打开你的 `/view/` 页面，状态应显示「已连接浏览器扩展」

## 换设备

在任意设备的 `/view/` 页面点击 **下载扩展 (.zip)**，解压后按上述步骤安装。

## 开发

扩展源码在本仓库 `extension/` 目录。网站构建时会自动打包为：

`public/downloads/jenrimark-view-extension.zip`

手动打包：

```bash
npm run zip:extension
```

## 权限说明

| 权限 | 用途 |
|------|------|
| `bookmarks` | 读取书签树，书签变更时刷新页面 |
| `host_permissions` | 仅在 `localhost`、公网域名/IP 与你的站点 `/view/` 注入脚本 |

## 添加新域名

当前公网入口：`gd02.frp0.cc:23332` 与 `120.24.93.79:23332`（并存）。

若更换或新增访问域名/IP，需同时修改：

1. `extension/manifest.json` → `host_permissions` 与 `content_scripts.matches`
2. `extension/content.js` → `ALLOWED_ORIGIN_PREFIXES`

然后重新 `npm run zip:extension` 并部署网站。
