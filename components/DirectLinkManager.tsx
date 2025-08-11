'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileUploader } from './FileUploader';
import { UploadedFileCard } from './UploadedFileCard';
import { FileInfo } from '@/lib/types';
import { getStoredFiles, saveFileToStorage, deleteFileFromStorage } from '@/lib/storage';
import { deleteFileFromCloudinary } from '@/lib/cloudinary';
import { useSimpleToast } from '@/components/ui/simple-toast';
import { RefreshCw, Share2 } from 'lucide-react';

export function DirectLinkManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useSimpleToast();

  // 加载文件列表
  const loadFiles = useCallback(() => {
    try {
      const storedFiles = getStoredFiles();
      setFiles(storedFiles);
    } catch (error) {
      console.error('加载文件列表失败:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载文件
  useEffect(() => {
    loadFiles();

    // 设置定时器清理过期文件
    const intervalId = setInterval(() => {
      loadFiles(); // 重新加载会自动清理过期文件
    }, 60000); // 每分钟检查一次

    return () => clearInterval(intervalId);
  }, [loadFiles]);

  // 处理文件上传完成
  const handleUploadComplete = useCallback((fileInfo: FileInfo) => {
    setFiles(prevFiles => {
      const newFiles = [fileInfo, ...prevFiles];
      return newFiles;
    });

    // 显示上传成功提示，包含直接链接
    showToast({
      type: "success",
      title: "文件上传成功！",
      description: "文件已上传到云端，下方显示直接下载链接",
    });
  }, [showToast]);

  // 处理文件删除
  const handleDeleteFile = useCallback(async (fileId: string) => {
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) return;

    try {
      // 从云端删除文件
      await deleteFileFromCloudinary(fileToDelete.publicId, fileToDelete.fileType);
      
      // 从本地存储删除
      deleteFileFromStorage(fileId);
      
      // 更新状态
      setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
      
      showToast({
        type: "success", 
        title: "文件已删除",
        description: `${fileToDelete.fileName} 已从云端删除`,
      });
    } catch (error) {
      console.error('删除文件失败:', error);
      showToast({
        type: "error",
        title: "删除失败", 
        description: "删除文件时发生错误，请重试",
      });
    }
  }, [files, showToast]);

  // 生成页面链接分享
  const generatePageShare = useCallback(() => {
    const shareText = `文件分享中心 - 已上传 ${files.length} 个文件`;
    const shareUrl = window.location.href;
    
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // 移动设备使用原生分享
      navigator.share({
        title: shareText,
        url: shareUrl,
      }).catch(error => {
        console.log('分享失败:', error);
        copyToClipboard(shareUrl);
      });
    } else {
      // 桌面设备复制链接
      copyToClipboard(shareUrl);
    }
  }, [files.length]);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast({
          type: "success",
          title: "链接已复制",
          description: "页面链接已复制到剪贴板",
        });
      });
    } else {
      // 备用方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast({
          type: "success",
          title: "链接已复制", 
          description: "页面链接已复制到剪贴板",
        });
      } catch (err) {
        showToast({
          type: "error",
          title: "复制失败",
          description: "请手动复制浏览器地址栏中的链接",
        });
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 页面标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          呈尚策划 关键词描述文件上传下载中心
        </h1>
        <p className="text-gray-600">
          上传文件获取永久下载链接，任何设备都能直接访问
        </p>
      </div>

      {/* 文件上传区域 */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📤 上传文件
          </h2>
          <FileUploader
            onUploadComplete={handleUploadComplete}
            maxFileSize={50}
          />
        </div>
      </div>

      {/* 文件列表区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              📁 已上传的文件 ({files.length})
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={generatePageShare}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                <Share2 className="w-4 h-4 mr-1" />
                分享页面
              </button>
              <button
                onClick={loadFiles}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 rounded-md disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文件</h3>
              <p className="text-gray-500">
                上传文件后，这里将显示永久下载链接
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {files.map((file) => (
                <UploadedFileCard
                  key={file.id}
                  file={file}
                  onDelete={handleDeleteFile}
                />
              ))}
            </div>
          )}
        </div>

        {/* 使用说明 */}
        {files.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-blue-50">
            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                🌟 多设备访问说明
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 每个文件都有永久的下载链接，可在任何设备上直接访问</li>
                <li>• 复制文件卡片中的"直接下载链接"即可分享给其他人</li>
                <li>• 点击"分享页面"可以分享整个页面给其他人查看所有文件</li>
                <li>• 文件将在24小时后自动过期删除</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}