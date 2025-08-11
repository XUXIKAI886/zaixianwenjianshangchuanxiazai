# 在线文件上传下载系统 - 技术实现规范

## 问题陈述

### 业务问题
用户需要一个简单易用的在线文件传输平台，能够上传任意格式文件并通过网页链接进行下载分享。

### 当前状态
目前没有现成的文件传输解决方案，需要从零构建一个完整的在线文件管理系统。

### 预期结果
- 用户能够通过拖拽或点击的方式上传任意格式文件
- 系统自动展示文件信息（名称、时间、大小）
- 支持文件搜索、排序、删除等管理功能
- 任何人都可以通过网页链接下载已上传的文件

## 解决方案概述

### 解决方案策略
构建基于Next.js的静态Web应用，使用Cloudinary作为文件存储后端，LocalStorage管理文件元数据，实现完整的文件上传下载功能。

### 核心系统改动
1. 创建Next.js 14项目结构与配置
2. 集成Cloudinary文件存储服务
3. 实现文件上传/下载/管理核心功能组件
4. 配置GitHub Pages静态部署

### 成功指标
- 支持最大50MB文件上传
- 拖拽上传响应时间 < 1秒
- 文件列表搜索响应 < 500ms
- 支持批量文件操作
- 移动端兼容性良好

## 技术实现

### 项目结构设计
```
file-upload-download/
├── .next/                     # Next.js构建输出
├── .claude/                   # Claude规范文档
│   └── specs/
│       └── file-upload-download/
├── app/                       # Next.js 14 App Router
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局组件
│   └── page.tsx              # 主页面组件
├── components/               # React组件目录
│   ├── ui/                   # shadcn/ui组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── progress.tsx
│   │   └── toast.tsx
│   ├── FileUploader.tsx      # 文件上传组件
│   ├── FileList.tsx          # 文件列表组件
│   ├── FileSearchSort.tsx    # 搜索排序组件
│   └── FileManager.tsx       # 文件管理主组件
├── lib/                      # 工具库目录
│   ├── utils.ts              # 通用工具函数
│   ├── cloudinary.ts         # Cloudinary集成
│   ├── storage.ts            # LocalStorage管理
│   └── types.ts              # TypeScript类型定义
├── public/                   # 静态资源
│   └── favicon.ico
├── .env.local               # 环境变量配置
├── .gitignore              # Git忽略文件
├── components.json         # shadcn/ui配置
├── next.config.js          # Next.js配置
├── package.json            # 项目依赖
├── tailwind.config.ts      # Tailwind配置
└── tsconfig.json           # TypeScript配置
```

### 数据结构定义
```typescript
// lib/types.ts
export interface FileInfo {
  id: string;                 // 文件唯一标识符
  fileName: string;           // 原始文件名
  uploadTime: string;         // ISO格式上传时间
  fileSize: number;           // 文件大小（字节）
  cloudinaryUrl: string;      // Cloudinary存储URL
  fileType: string;           // MIME类型
  publicId: string;           // Cloudinary公共ID（用于删除）
}

export interface UploadProgress {
  fileName: string;
  progress: number;           // 0-100
  status: 'uploading' | 'completed' | 'error';
}

export interface FilterOptions {
  searchTerm: string;
  sortBy: 'fileName' | 'uploadTime' | 'fileSize';
  sortOrder: 'asc' | 'desc';
}
```

### 核心组件实现

#### 1. FileManager.tsx (主文件管理组件)
```typescript
// components/FileManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import { FileSearchSort } from './FileSearchSort';
import { FileInfo, FilterOptions } from '@/lib/types';
import { getStoredFiles, deleteFileFromStorage } from '@/lib/storage';
import { deleteFileFromCloudinary } from '@/lib/cloudinary';

export function FileManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    sortBy: 'uploadTime',
    sortOrder: 'desc'
  });

  // 组件生命周期和事件处理逻辑
}
```

#### 2. FileUploader.tsx (文件上传组件)
```typescript
// components/FileUploader.tsx
'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { uploadFileToCloudinary } from '@/lib/cloudinary';
import { saveFileToStorage } from '@/lib/storage';

interface FileUploaderProps {
  onUploadComplete: (fileInfo: FileInfo) => void;
}

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  // 拖拽上传和文件上传逻辑实现
}
```

#### 3. FileList.tsx (文件列表组件)
```typescript
// components/FileList.tsx
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileInfo } from '@/lib/types';
import { formatFileSize, formatDate } from '@/lib/utils';

interface FileListProps {
  files: FileInfo[];
  onDelete: (fileId: string) => void;
  onBatchDelete: (fileIds: string[]) => void;
}

export function FileList({ files, onDelete, onBatchDelete }: FileListProps) {
  // 文件列表展示和操作逻辑
}
```

### API集成方案 (Cloudinary)

#### Cloudinary配置
```typescript
// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 文件上传函数
export async function uploadFileToCloudinary(file: File): Promise<{
  url: string;
  publicId: string;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'file-upload-preset');
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  if (!response.ok) {
    throw new Error('文件上传失败');
  }
  
  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

// 文件删除函数
export async function deleteFileFromCloudinary(publicId: string): Promise<void> {
  const response = await fetch('/api/delete-file', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publicId }),
  });
  
  if (!response.ok) {
    throw new Error('文件删除失败');
  }
}
```

#### API路由实现
```typescript
// app/api/delete-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: NextRequest) {
  try {
    const { publicId } = await request.json();
    
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: '文件删除失败' },
      { status: 500 }
    );
  }
}
```

### 数据流设计

#### LocalStorage数据管理
```typescript
// lib/storage.ts
import { FileInfo } from './types';

const STORAGE_KEY = 'uploaded-files';

// 获取存储的文件列表
export function getStoredFiles(): FileInfo[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('读取文件列表失败:', error);
    return [];
  }
}

// 保存文件信息到存储
export function saveFileToStorage(fileInfo: FileInfo): void {
  try {
    const files = getStoredFiles();
    const updatedFiles = [...files, fileInfo];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
  } catch (error) {
    console.error('保存文件信息失败:', error);
  }
}

// 从存储中删除文件
export function deleteFileFromStorage(fileId: string): void {
  try {
    const files = getStoredFiles();
    const updatedFiles = files.filter(file => file.id !== fileId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
  } catch (error) {
    console.error('删除文件信息失败:', error);
  }
}

// 批量删除文件
export function batchDeleteFilesFromStorage(fileIds: string[]): void {
  try {
    const files = getStoredFiles();
    const updatedFiles = files.filter(file => !fileIds.includes(file.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
  } catch (error) {
    console.error('批量删除文件失败:', error);
  }
}
```

### 工具函数实现
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期时间
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 验证文件大小
export function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
```

### 配置文件实现

#### Next.js配置
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/file-upload-download/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/file-upload-download' : '',
};

module.exports = nextConfig;
```

#### 包依赖配置
```json
// package.json
{
  "name": "file-upload-download",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.1",
    "lucide-react": "^0.427.0",
    "react-dropzone": "^14.2.3",
    "cloudinary": "^2.5.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-table": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.5"
  }
}
```

#### 环境变量配置
```env
# .env.local
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 实现序列

### 第一阶段：项目初始化和基础配置
1. **创建Next.js项目结构** - 初始化项目目录和基础配置文件
2. **安装和配置依赖包** - 安装所需的npm包和shadcn/ui组件
3. **设置Cloudinary集成** - 配置API密钥和上传预设
4. **创建基础UI组件** - 使用shadcn/ui搭建表格、按钮、对话框等组件

### 第二阶段：核心功能实现
1. **实现文件上传功能** - 创建FileUploader组件，支持拖拽和点击上传
2. **集成Cloudinary存储** - 实现文件上传到Cloudinary的API调用
3. **实现LocalStorage管理** - 创建文件信息的本地存储和读取功能
4. **创建文件列表组件** - 实现FileList组件展示已上传文件

### 第三阶段：高级功能和优化
1. **实现搜索和排序功能** - 创建FileSearchSort组件
2. **添加文件删除功能** - 实现单个和批量删除操作
3. **优化用户体验** - 添加上传进度、错误处理、加载状态
4. **响应式设计优化** - 确保移动端兼容性

### 第四阶段：部署和测试
1. **配置GitHub Pages部署** - 设置构建和部署脚本
2. **性能优化** - 代码分割、懒加载、缓存策略
3. **端到端测试** - 验证所有功能在生产环境的正常运行
4. **文档和维护** - 创建使用说明和维护指南

## 验证计划

### 单元测试
- **文件上传测试**：验证不同格式和大小文件的上传功能
- **存储管理测试**：验证LocalStorage的读写和删除操作
- **工具函数测试**：验证文件大小格式化、日期格式化等辅助函数
- **组件渲染测试**：验证各个React组件的正确渲染

### 集成测试
- **端到端文件流程**：从上传到下载的完整用户旅程测试
- **Cloudinary集成**：验证文件存储和删除的API调用
- **搜索排序功能**：验证文件筛选和排序的准确性
- **批量操作测试**：验证多文件选择和批量删除功能

### 业务逻辑验证
- **文件大小限制**：验证50MB文件大小限制的正确执行
- **文件格式支持**：验证各种文件格式的正常上传和下载
- **数据持久化**：验证页面刷新后文件列表的数据保持
- **用户交互流程**：验证拖拽上传、搜索、排序等交互的流畅性

---

**文档创建时间**：2025-08-11  
**规范状态**：就绪 ✅  
**下一步**：开始代码实现