# GitHub Pages 部署指南

## 🚀 自动部署设置

### 1. 启用GitHub Pages
1. 访问仓库设置页面：https://github.com/XUXIKAI886/zaixianwenjianshangchuanxiazai/settings/pages
2. 在"Source"中选择"GitHub Actions"

### 2. 配置环境变量
在仓库设置中配置以下Secrets（https://github.com/XUXIKAI886/zaixianwenjianshangchuanxiazai/settings/secrets/actions）：

**必需的环境变量：**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`：您的Cloudinary云名称（例如：dgar33q4s）
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`：您的Cloudinary API密钥（例如：491222612688495）

**配置步骤：**
1. 点击"New repository secret"
2. 分别添加上述两个变量
3. 变量名称必须完全匹配（区分大小写）

### 3. 创建Cloudinary上传预设
在Cloudinary控制台中：
1. 进入Settings → Upload → Upload presets  
2. 创建名为`file-upload-preset`的无签名预设
3. 设置为`Unsigned`模式

## 📋 部署限制说明

### ⚠️ GitHub Pages静态部署限制
由于GitHub Pages只支持静态网站，以下功能有限制：

**受限功能：**
- ❌ **文件删除**：无法从Cloudinary删除文件（仅从本地列表移除）
- ❌ **自动过期清理**：无法自动删除云端过期文件
- ⚠️ **API调用限制**：所有操作都在客户端进行

**正常功能：**
- ✅ **文件上传**：完全支持
- ✅ **文件预览**：完全支持  
- ✅ **文件下载**：完全支持
- ✅ **搜索排序**：完全支持
- ✅ **倒计时显示**：完全支持
- ✅ **响应式设计**：完全支持

### 💡 安全说明
- 删除功能被禁用是为了保护API密钥安全
- 文件会在Cloudinary中保留，只从本地列表中移除
- 可以手动在Cloudinary控制台中管理文件

## 🔗 部署完成后的访问地址
部署成功后，您的网站将在以下地址可访问：
**https://xuxikai886.github.io/zaixianwenjianshangchuanxiazai/**

## 📝 部署流程
1. 推送代码到main分支后自动触发部署
2. GitHub Actions自动构建和部署
3. 大约2-5分钟后网站更新生效

## 🔧 本地测试静态构建
可以在本地测试静态构建：
```bash
npm run build
npm run start
```

## 📞 技术支持
如遇到部署问题，请检查：
1. GitHub Actions运行日志
2. Cloudinary环境变量配置
3. Upload Preset设置