'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import { FileSearchSort } from './FileSearchSort';
import { FileInfo, FilterOptions } from '@/lib/types';
import { getStoredFiles, deleteFileFromStorage, batchDeleteFilesFromStorage } from '@/lib/storage';
import { deleteFileFromCloudinary, batchDeleteFilesFromCloudinary } from '@/lib/cloudinary';
import { useSimpleToast } from '@/components/ui/simple-toast';

export function FileManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    sortBy: 'uploadTime',
    sortOrder: 'desc'
  });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useSimpleToast();

  // 从本地存储加载文件列表
  const loadFiles = useCallback(() => {
    try {
      const storedFiles = getStoredFiles();
      setFiles(storedFiles);
      setLoading(false);
    } catch (error) {
      console.error('加载文件列表失败:', error);
      setLoading(false);
    }
  }, []);

  // 初始化时加载文件
  useEffect(() => {
    loadFiles();
    
    // 设置定时器，每分钟检查一次过期文件和提醒
    const intervalId = setInterval(() => {
      const currentFiles = getStoredFiles();
      const now = new Date().getTime();
      
      // 检查即将过期的文件（剩余时间少于1小时）
      const expiringFiles = currentFiles.filter(file => {
        const expiryTime = new Date(file.expiresAt || '').getTime();
        const timeLeft = expiryTime - now;
        return timeLeft > 0 && timeLeft < 60 * 60 * 1000; // 少于1小时
      });
      
      // 如果有即将过期的文件，显示提醒（但不要频繁提醒）
      if (expiringFiles.length > 0) {
        const lastWarning = localStorage.getItem('lastExpiryWarning');
        const lastWarningTime = lastWarning ? parseInt(lastWarning) : 0;
        
        // 每10分钟最多提醒一次
        if (now - lastWarningTime > 10 * 60 * 1000) {
          showToast({
            type: "info",
            title: "文件即将过期",
            description: `有 ${expiringFiles.length} 个文件将在1小时内过期并自动删除`,
          });
          localStorage.setItem('lastExpiryWarning', now.toString());
        }
      }
      
      loadFiles(); // 重新加载文件列表，会自动清理过期文件
    }, 60000); // 60秒
    
    return () => clearInterval(intervalId);
  }, [showToast]);

  // 应用筛选和排序
  const applyFilters = useCallback((fileList: FileInfo[], currentFilters: FilterOptions) => {
    let filtered = [...fileList];

    // 应用搜索筛选
    if (currentFilters.searchTerm) {
      const searchLower = currentFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(file =>
        file.fileName.toLowerCase().includes(searchLower)
      );
    }

    // 应用排序
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (currentFilters.sortBy) {
        case 'fileName':
          aValue = a.fileName.toLowerCase();
          bValue = b.fileName.toLowerCase();
          break;
        case 'fileSize':
          aValue = a.fileSize;
          bValue = b.fileSize;
          break;
        case 'uploadTime':
        default:
          aValue = new Date(a.uploadTime).getTime();
          bValue = new Date(b.uploadTime).getTime();
          break;
      }

      if (currentFilters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, []);

  // 当文件列表或筛选条件改变时更新筛选后的文件列表
  useEffect(() => {
    const filtered = applyFilters(files, filters);
    setFilteredFiles(filtered);
  }, [files, filters]);

  // 处理文件上传完成
  const handleUploadComplete = (fileInfo: FileInfo) => {
    setFiles(prevFiles => {
      const newFiles = [fileInfo, ...prevFiles];
      return newFiles;
    });
  };

  // 处理筛选条件变化
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // 处理单个文件删除
  const handleDeleteFile = async (fileId: string) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const fileToDelete = files.find(f => f.id === fileId);
      if (!fileToDelete) {
        throw new Error('文件不存在');
      }

      // 从Cloudinary删除文件
      await deleteFileFromCloudinary(fileToDelete.publicId, fileToDelete.fileType);
      
      // 从本地存储删除文件信息
      deleteFileFromStorage(fileId);
      
      // 更新状态
      setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
      
      // 显示成功提示
      showToast({
        type: "success",
        title: "删除成功",
        description: `文件 "${fileToDelete.fileName}" 已成功删除`,
      });
      
    } catch (error) {
      console.error('删除文件失败:', error);
      // 显示错误提示
      showToast({
        type: "error",
        title: "删除失败",
        description: "删除文件失败，请重试",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 处理批量删除文件
  const handleBatchDelete = async (fileIds: string[]) => {
    if (isDeleting || fileIds.length === 0) return;
    
    setIsDeleting(true);
    
    try {
      const filesToDelete = files.filter(f => fileIds.includes(f.id));
      const fileInfos = filesToDelete.map(f => ({ publicId: f.publicId, fileType: f.fileType }));

      // 从Cloudinary批量删除文件
      const result = await batchDeleteFilesFromCloudinary(fileInfos);
      
      // 从本地存储批量删除文件信息
      batchDeleteFilesFromStorage(fileIds);
      
      // 更新状态
      setFiles(prevFiles => prevFiles.filter(f => !fileIds.includes(f.id)));
      
      // 显示批量删除结果
      if (result.failedCount > 0) {
        console.warn(`批量删除完成，成功: ${result.successCount}，失败: ${result.failedCount}`);
        console.warn('失败详情:', result.errors);
        showToast({
          type: "info",
          title: "批量删除完成",
          description: `成功删除 ${result.successCount} 个文件，失败 ${result.failedCount} 个文件`,
        });
      } else {
        console.log(`成功删除 ${result.successCount} 个文件`);
        showToast({
          type: "success",
          title: "批量删除成功",
          description: `成功删除 ${result.successCount} 个文件`,
        });
      }
      
    } catch (error) {
      console.error('批量删除文件失败:', error);
      showToast({
        type: "error",
        title: "批量删除失败",
        description: "批量删除文件失败，请重试",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 刷新文件列表
  const handleRefresh = () => {
    setLoading(true);
    loadFiles();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          呈尚策划 关键词描述文件上传下载中心
        </h1>
        <p className="text-gray-600">
          支持拖拽上传文件，自动保存到云端，随时随地访问和分享
        </p>
      </div>

      {/* 文件上传区域 */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            上传文件
          </h2>
          <FileUploader
            onUploadComplete={handleUploadComplete}
            maxFileSize={50}
          />
        </div>
      </div>

      {/* 文件管理区域 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              文件列表
            </h2>
            <button
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              disabled={loading}
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>
          
          {/* 搜索和排序组件 */}
          <FileSearchSort
            onFilterChange={handleFilterChange}
            totalCount={files.length}
            filteredCount={filteredFiles.length}
          />
        </div>

        {/* 文件列表 */}
        <div className="p-6">
          <FileList
            files={filteredFiles}
            onDelete={handleDeleteFile}
            onBatchDelete={handleBatchDelete}
            loading={loading}
          />
        </div>
      </div>

      {/* 页脚信息 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          使用 Cloudinary 提供文件存储服务 • 支持最大 50MB 文件上传
        </p>
      </div>
    </div>
  );
}