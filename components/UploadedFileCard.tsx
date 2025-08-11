'use client';

import React, { useState } from 'react';
import { FileIcon, Download, Copy, ExternalLink, Clock, Trash2 } from 'lucide-react';
import { FileInfo } from '@/lib/types';
import { CountdownTimer } from './ui/countdown-timer';
import { formatFileSize, getFileIcon } from '@/lib/utils';

interface UploadedFileCardProps {
  file: FileInfo;
  onDelete?: (fileId: string) => void;
  showDeleteButton?: boolean;
}

export function UploadedFileCard({ file, onDelete, showDeleteButton = true }: UploadedFileCardProps) {
  const [copying, setCopying] = useState(false);

  // 复制下载链接
  const copyDownloadLink = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(file.cloudinaryUrl);
      alert('下载链接已复制到剪贴板！');
    } catch (error) {
      // 备用方案
      const textArea = document.createElement('textarea');
      textArea.value = file.cloudinaryUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('下载链接已复制到剪贴板！');
      } catch (err) {
        alert('复制失败，请手动复制链接');
      }
      document.body.removeChild(textArea);
    } finally {
      setTimeout(() => setCopying(false), 1000);
    }
  };

  // 处理文件删除
  const handleDelete = () => {
    if (window.confirm(`确定要删除文件 "${file.fileName}" 吗？`)) {
      onDelete?.(file.id);
    }
  };

  // 直接下载文件
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.cloudinaryUrl;
    link.download = file.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 在新窗口打开文件
  const handlePreview = () => {
    window.open(file.cloudinaryUrl, '_blank');
  };

  const FileIconComponent = getFileIcon(file.fileType);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* 文件信息头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <FileIconComponent className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate" title={file.fileName}>
              {file.fileName}
            </h3>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.fileSize)} • {new Date(file.uploadTime).toLocaleString()}
            </p>
          </div>
        </div>

        {showDeleteButton && onDelete && (
          <button
            onClick={handleDelete}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 rounded"
            title="删除文件"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 倒计时显示 */}
      <div className="mb-3">
        <CountdownTimer 
          expiresAt={file.expiresAt} 
          onExpired={() => onDelete?.(file.id)}
        />
      </div>

      {/* 直接下载链接显示 */}
      <div className="mb-3 p-2 bg-gray-50 rounded border">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-2">
            <p className="text-xs text-gray-600 mb-1">直接下载链接：</p>
            <p className="text-xs font-mono text-gray-800 truncate" title={file.cloudinaryUrl}>
              {file.cloudinaryUrl}
            </p>
          </div>
          <button
            onClick={copyDownloadLink}
            disabled={copying}
            className="flex-shrink-0 p-1 text-gray-500 hover:text-blue-600 rounded"
            title="复制链接"
          >
            <Copy className={`w-4 h-4 ${copying ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex space-x-2">
        <button
          onClick={handleDownload}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          <Download className="w-4 h-4 mr-1" />
          下载
        </button>
        
        <button
          onClick={handlePreview}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          预览
        </button>

        <button
          onClick={copyDownloadLink}
          disabled={copying}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
        >
          {copying ? '已复制' : '复制链接'}
        </button>
      </div>

      {/* 使用说明 */}
      <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
        💡 <strong>多设备访问：</strong>复制上方链接即可在任何设备上直接下载此文件
      </div>
    </div>
  );
}