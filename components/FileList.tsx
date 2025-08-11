'use client';

import React, { useState } from 'react';
import { 
  Download, 
  Trash2, 
  Copy, 
  FileText, 
  Image, 
  FileVideo, 
  FileAudio,
  Archive,
  Code,
  FileSpreadsheet,
  FileImage,
  MoreVertical,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileListProps, FileInfo } from '@/lib/types';
import { formatFileSize, formatDate, getFileIconType, copyToClipboard, downloadFile, truncateFileName } from '@/lib/utils';
import { CountdownTimer } from '@/components/ui/countdown-timer';

export function FileList({ files, onDelete, onBatchDelete, loading }: FileListProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // 获取文件图标组件
  const getFileIcon = (fileInfo: FileInfo) => {
    const iconType = getFileIconType(fileInfo.fileName);
    const iconClass = "h-5 w-5";
    
    switch (iconType) {
      case 'image':
        return <FileImage className={`${iconClass} text-green-600`} />;
      case 'video':
        return <FileVideo className={`${iconClass} text-purple-600`} />;
      case 'audio':
        return <FileAudio className={`${iconClass} text-yellow-600`} />;
      case 'document':
        return <FileText className={`${iconClass} text-blue-600`} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={`${iconClass} text-emerald-600`} />;
      case 'archive':
        return <Archive className={`${iconClass} text-orange-600`} />;
      case 'code':
        return <Code className={`${iconClass} text-gray-600`} />;
      default:
        return <FileText className={`${iconClass} text-gray-600`} />;
    }
  };

  // 处理单个文件选择
  const handleFileSelect = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(files.map(file => file.id));
    } else {
      setSelectedFiles([]);
    }
  };

  // 复制文件链接
  const handleCopyLink = async (file: FileInfo) => {
    const success = await copyToClipboard(file.cloudinaryUrl);
    if (success) {
      // TODO: 显示成功提示
      console.log('链接已复制到剪贴板');
    } else {
      // TODO: 显示错误提示
      console.error('复制链接失败');
    }
  };

  // 下载文件
  const handleDownload = (file: FileInfo) => {
    downloadFile(file.cloudinaryUrl, file.fileName);
  };

  // 预览文件
  const handlePreview = (file: FileInfo) => {
    window.open(file.cloudinaryUrl, '_blank');
  };

  // 检查文件是否可预览
  const isPreviewable = (file: FileInfo): boolean => {
    return file.fileType.startsWith('image/');
  };

  // 删除文件（直接确认）
  const handleDeleteClick = (file: FileInfo) => {
    confirmDelete(file);
  };

  // 确认删除单个文件
  const confirmDelete = (file: FileInfo) => {
    if (window.confirm(`确定要删除文件 "${file.fileName}" 吗？此操作无法撤销。`)) {
      onDelete(file.id);
    }
  };

  // 批量删除文件（直接确认）
  const handleBatchDeleteClick = () => {
    if (selectedFiles.length > 0) {
      confirmBatchDelete();
    }
  };

  // 确认批量删除
  const confirmBatchDelete = () => {
    if (selectedFiles.length === 0) return;
    
    if (window.confirm(`确定要删除选中的 ${selectedFiles.length} 个文件吗？此操作无法撤销。`)) {
      onBatchDelete(selectedFiles);
      setSelectedFiles([]);
    }
  };

  // 在新窗口打开文件
  const handleOpenFile = (file: FileInfo) => {
    window.open(file.cloudinaryUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无文件</h3>
        <p className="text-gray-500">上传一些文件开始使用吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 批量操作工具栏 */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-700">
            已选择 {selectedFiles.length} 个文件
          </span>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBatchDeleteClick}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除选中
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedFiles([])}
            >
              取消选择
            </Button>
          </div>
        </div>
      )}

      {/* 文件列表表格 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedFiles.length === files.length && files.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>文件名</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>上传时间</TableHead>
              <TableHead>剩余时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={(checked) => handleFileSelect(file.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file)}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {truncateFileName(file.fileName)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {file.fileType || '未知类型'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {formatFileSize(file.fileSize)}
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {formatDate(file.uploadTime)}
                </TableCell>
                <TableCell>
                  <CountdownTimer 
                    expiresAt={file.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()} 
                    onExpired={() => {
                      // 文件过期时可以触发重新加载
                      console.log(`文件 ${file.fileName} 已过期`);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenFile(file)}
                      title="在新窗口打开"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {isPreviewable(file) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(file)}
                        title="预览图片"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      title="下载文件"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(file)}
                      title="复制链接"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(file)}
                      title="删除文件"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>


    </div>
  );
}