# Vercel部署指南

## 🚀 快速部署到Vercel

### 方法一：一键部署（推荐）

点击下面的按钮，一键部署到Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FXUXIKAI886%2Fzaixianwenjianshangchuanxiazai&env=NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,NEXT_PUBLIC_CLOUDINARY_API_KEY&envDescription=Cloudinary%E9%85%8D%E7%BD%AE%E4%BF%A1%E6%81%AF&envLink=https%3A%2F%2Fcloudinary.com%2Fconsole)

### 方法二：手动部署

1. **Fork此仓库** 到您的GitHub账号

2. **访问Vercel控制台**
   - 前往 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录

3. **导入项目**
   - 点击 "New Project"
   - 选择您Fork的仓库
   - 点击 "Import"

4. **配置环境变量**
   在部署配置页面添加以下环境变量：
   
   | 变量名 | 值 | 说明 |
   |--------|----|----|
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dgar33q4s` | 您的Cloudinary云名称 |
   | `NEXT_PUBLIC_CLOUDINARY_API_KEY` | `491222612688495` | 您的Cloudinary API Key |

5. **点击Deploy**
   - Vercel会自动构建和部署项目
   - 部署完成后会提供访问链接

## 🔧 Cloudinary配置

### 1. 获取Cloudinary凭据

1. 访问 [Cloudinary Console](https://cloudinary.com/console)
2. 在Dashboard页面找到：
   - **Cloud Name**: 您的云名称
   - **API Key**: API密钥

### 2. 创建上传预设

1. 进入 **Settings** → **Upload** → **Upload presets**
2. 点击 **Add upload preset**
3. 配置如下：
   - **Preset name**: `upload-preset`
   - **Signing Mode**: **Unsigned** ⚠️重要
   - **Use filename as public ID**: 启用（可选）
4. 点击 **Save**

## 🌐 访问您的应用

部署完成后，Vercel会提供一个类似这样的URL：
```
https://your-project-name.vercel.app
```

## 🔄 自动部署

配置完成后：
- 每次推送代码到GitHub主分支
- Vercel会自动重新部署
- 无需手动操作

## ❌ 故障排除

### 1. 环境变量问题
如果仍显示"配置缺失"：
1. 检查Vercel项目设置中的环境变量
2. 确保变量名完全匹配（区分大小写）
3. 重新部署项目

### 2. 上传失败
如果上传文件报400错误：
1. 检查Cloudinary预设名称是否为 `upload-preset`
2. 确保预设为 `Unsigned` 模式
3. 检查API Key是否正确

### 3. 多设备同步问题
- 同步功能基于浏览器localStorage
- 需要30秒内自动检测
- 可以手动点击"刷新"按钮强制同步

## 📞 技术支持

如果遇到问题：
1. 检查浏览器控制台错误信息
2. 确认Cloudinary配置正确
3. 验证环境变量设置

---

**Vercel的优势**：
- ✅ 更稳定的环境变量支持
- ✅ 自动HTTPS和CDN
- ✅ 快速的全球部署
- ✅ 实时部署状态和日志
- ✅ 简单的回滚功能