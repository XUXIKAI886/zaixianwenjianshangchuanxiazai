# 在线文件上传下载系统

一个基于 Next.js 14 的现代化文件管理系统，支持拖拽上传、云端存储、文件搜索和批量管理功能。

## 功能特性

- **🚀 拖拽上传**: 支持拖拽文件或点击选择，批量上传多个文件
- **☁️ 云端存储**: 使用 Cloudinary 提供稳定可靠的文件存储服务
- **🔍 智能搜索**: 实时搜索文件名，支持排序和筛选
- **📱 响应式设计**: 完美适配桌面端和移动端设备
- **🗂️ 批量管理**: 支持批量选择、删除和管理文件
- **📊 进度显示**: 实时显示上传进度和状态
- **🔗 一键分享**: 生成直链，方便文件分享和下载
- **💾 本地缓存**: 使用 localStorage 缓存文件列表，提升用户体验

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS
- **UI组件**: shadcn/ui + Radix UI
- **文件存储**: Cloudinary
- **图标库**: Lucide React
- **文件上传**: react-dropzone

## 项目结构

```
file-upload-download/
├── app/                      # Next.js App Router
│   ├── api/                 # API 路由
│   │   └── delete-file/     # 文件删除接口
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 主页面
├── components/              # React 组件
│   ├── ui/                  # shadcn/ui 基础组件
│   ├── FileUploader.tsx     # 文件上传组件
│   ├── FileList.tsx         # 文件列表组件
│   ├── FileSearchSort.tsx   # 搜索排序组件
│   └── FileManager.tsx      # 主管理组件
├── lib/                     # 工具库
│   ├── types.ts             # TypeScript 类型定义
│   ├── utils.ts             # 通用工具函数
│   ├── storage.ts           # LocalStorage 管理
│   └── cloudinary.ts        # Cloudinary 集成
└── public/                  # 静态资源
```

## 快速开始

### 1. 环境要求

- Node.js 18.0 或更高版本
- npm、yarn 或 pnpm 包管理器

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install

# 或使用 pnpm
pnpm install
```

### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```env
# Cloudinary 配置 (必填)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Cloudinary 配置指南

1. 访问 [Cloudinary 官网](https://cloudinary.com) 注册账号
2. 登录后进入 Dashboard
3. 复制以下信息到 `.env.local` 文件：
   - **Cloud Name**: 在 Dashboard 顶部显示
   - **API Key**: 在 Account Details 中查看
   - **API Secret**: 在 Account Details 中查看（点击 "Reveal" 显示）

4. **创建上传预设（重要步骤）**：
   - 进入 Settings > Upload > Upload presets
   - 点击 "Add upload preset"
   - **Preset name**: `file-upload-preset` （必须完全一致）
   - **Signing Mode**: 选择 `Unsigned`
   - **Use filename or externally defined Public ID**: 选择 `Yes`
   - **Unique filename**: 选择 `Yes`
   - **Overwrite**: 选择 `No`
   - 点击 "Save" 保存预设

### 5. 启动开发服务器

```bash
# 开发模式
npm run dev

# 或
yarn dev

# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 6. 构建和部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 使用说明

### 上传文件

1. **拖拽上传**: 直接拖拽文件到上传区域
2. **点击上传**: 点击 "选择文件" 按钮选择文件
3. **批量上传**: 同时选择多个文件进行批量上传
4. **进度监控**: 实时查看上传进度和状态

### 管理文件

1. **搜索文件**: 在搜索框输入文件名进行筛选
2. **排序文件**: 按文件名、大小、上传时间排序
3. **选择文件**: 使用复选框选择单个或多个文件
4. **文件操作**:
   - 🔗 **复制链接**: 复制文件的直接访问链接
   - 📥 **下载文件**: 下载文件到本地
   - 🔗 **新窗口打开**: 在新标签页预览文件
   - 🗑️ **删除文件**: 删除单个或批量删除文件

### 文件限制

- **单文件大小**: 最大 50MB
- **支持格式**: 所有格式（图片、文档、音频、视频等）
- **并发上传**: 支持多文件同时上传

## 部署指南

### Vercel 部署

1. 将代码推送到 GitHub 仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量（与本地 `.env.local` 相同）
4. 部署完成

### Netlify 部署

1. 构建项目：`npm run build`
2. 上传 `out` 目录到 Netlify
3. 配置环境变量

### 自定义服务器部署

1. 构建项目：`npm run build`
2. 将构建产物部署到服务器
3. 配置环境变量
4. 启动服务：`npm run start`

## 常见问题

### Q: 上传失败怎么办？

A: 请检查：
1. Cloudinary 环境变量是否正确配置
2. 上传预设 `file-upload-preset` 是否已创建
3. 文件大小是否超过 50MB 限制
4. 网络连接是否正常

### Q: 文件无法删除？

A: 请确认：
1. `CLOUDINARY_API_SECRET` 环境变量已正确设置
2. Cloudinary 账号权限正常
3. 文件确实存在于 Cloudinary

### Q: 页面显示配置错误？

A: 检查 `.env.local` 文件：
1. 文件位置是否在项目根目录
2. 环境变量名称是否正确
3. 变量值是否包含特殊字符（需要引号包裹）

## 技术支持

如遇到问题，请检查：

1. **控制台错误**: 打开浏览器开发者工具查看错误信息
2. **网络请求**: 检查 Network 标签下的 API 请求状态
3. **Cloudinary 控制台**: 查看文件是否成功上传到云端

## 开源协议

本项目采用 MIT 协议开源。

## 更新日志

### v1.0.0 (2024-08-11)

- ✨ 初始版本发布
- 🚀 支持拖拽上传文件
- ☁️ 集成 Cloudinary 云存储
- 🔍 实现文件搜索和排序
- 📱 响应式设计支持
- 🗂️ 批量文件管理功能