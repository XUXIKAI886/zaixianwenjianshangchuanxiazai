'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileUploader } from './FileUploader';
import { FileList } from './FileList';
import { FileSearchSort } from './FileSearchSort';
import { FileInfo, FilterOptions } from '@/lib/types';
import { getStoredFiles, deleteFileFromStorage, batchDeleteFilesFromStorage, saveFileToStorage } from '@/lib/storage';
import { checkCloudConnection } from '@/lib/cloud-storage';
import { generateShareLink, checkForSharedFiles, clearShareParams, getShareableStats } from '@/lib/shared-storage';
import { syncFiles, startAutoSync, uploadFileIndex } from '@/lib/cloud-sync';
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
  const [cloudStatus, setCloudStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const { showToast } = useSimpleToast();

  // 加载文件列表（集成云端自动同步）
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      
      // 检查云端连接状态
      const isConnected = await checkCloudConnection();
      setCloudStatus(isConnected ? 'connected' : 'offline');
      
      // 首先获取本地文件
      const localFiles = getStoredFiles();
      
      // 检查是否有通过URL分享的文件
      const sharedFiles = checkForSharedFiles();
      let currentFiles = localFiles;
      
      if (sharedFiles && sharedFiles.length > 0) {
        // 如果有分享文件，合并到本地存储
        const existingIds = new Set(localFiles.map(f => f.id));
        const newSharedFiles = sharedFiles.filter(file => !existingIds.has(file.id));
        
        // 保存新的分享文件到本地存储
        for (const file of newSharedFiles) {
          saveFileToStorage(file);
        }
        
        // 合并所有文件
        currentFiles = [...localFiles, ...newSharedFiles];
        
        // 清除URL参数
        clearShareParams();
        
        // 显示导入提示
        if (newSharedFiles.length > 0) {
          showToast({
            type: "success",
            title: "文件导入成功",
            description: `已导入 ${newSharedFiles.length} 个分享文件`,
          });
        }
      }
      
      // 执行云端同步
      if (isConnected) {
        try {
          const syncResult = await syncFiles(currentFiles);
          
          if (syncResult.hasNewFiles) {
            // 保存同步后的文件到本地存储
            for (const file of syncResult.files) {
              saveFileToStorage(file);
            }
            
            currentFiles = syncResult.files;
            
            showToast({
              type: "success",
              title: "多设备同步完成",
              description: `发现 ${syncResult.syncedCount} 个新文件`,
            });
          }
        } catch (syncError) {
          console.warn('云端同步失败，使用本地文件:', syncError);
          showToast({
            type: "warning",
            title: "同步异常",
            description: "云端同步失败，显示本地文件",
          });
        }
      }
      
      setFiles(currentFiles);
      setLoading(false);
    } catch (error) {
      console.error('加载文件列表失败:', error);
      
      // 出错时仅使用本地存储
      try {
        const localFiles = getStoredFiles();
        setFiles(localFiles);
        setCloudStatus('offline');
      } catch (localError) {
        console.error('本地存储也无法访问:', localError);
        setFiles([]);
      }
      
      setLoading(false);
    }
  }, [showToast]);

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
      
      // 重新加载文件列表，会自动清理过期文件
      loadFiles().catch(console.error);
    }, 60000); // 60秒
    
    // 启动自动同步
    let stopAutoSync: (() => void) | null = null;
    
    const setupAutoSync = async () => {
      const isConnected = await checkCloudConnection();
      if (isConnected) {
        const currentFiles = getStoredFiles();
        stopAutoSync = startAutoSync(currentFiles, (syncedFiles, newCount) => {
          setFiles(syncedFiles);
          
          // 保存同步的文件到本地存储
          for (const file of syncedFiles) {
            saveFileToStorage(file);
          }
          
          if (newCount > 0) {
            showToast({
              type: "success",
              title: "发现新文件",
              description: `从其他设备同步了 ${newCount} 个新文件`,
            });
          }
        });
      }
    };
    
    setupAutoSync();
    
    return () => {
      clearInterval(intervalId);
      if (stopAutoSync) {
        stopAutoSync();
      }
    };
  }, [showToast, loadFiles]);

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
  const handleUploadComplete = async (fileInfo: FileInfo) => {
    setFiles(prevFiles => {
      const newFiles = [fileInfo, ...prevFiles];
      
      // 异步上传文件索引到云端（不阻塞UI）
      uploadFileIndex(newFiles).then(() => {
        console.log('[多设备同步] 文件上传后已同步到云端');
      }).catch(error => {
        console.warn('[多设备同步] 同步到云端失败:', error);
      });
      
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
  const handleRefresh = async () => {
    setLoading(true);
    await loadFiles();
  };

  // 生成分享链接
  const handleGenerateShareLink = () => {
    try {
      const validFiles = files.filter(file => {
        const now = new Date().getTime();
        const expiryTime = new Date(file.expiresAt || '').getTime();
        return expiryTime > now; // 只分享未过期的文件
      });

      if (validFiles.length === 0) {
        showToast({
          type: "warning",
          title: "没有可分享的文件",
          description: "请先上传一些文件",
        });
        return;
      }

      const shareLink = generateShareLink(validFiles);
      
      // 复制到剪贴板
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareLink).then(() => {
          showToast({
            type: "success",
            title: "分享链接已复制",
            description: `已复制包含 ${validFiles.length} 个文件的分享链接`,
          });
        }).catch(() => {
          // 失败时显示链接
          window.prompt('分享链接（请手动复制）:', shareLink);
        });
      } else {
        // 不支持剪贴板API时显示链接
        window.prompt('分享链接（请手动复制）:', shareLink);
      }
    } catch (error) {
      console.error('生成分享链接失败:', error);
      showToast({
        type: "error",
        title: "生成分享链接失败",
        description: "请重试",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              呈尚策划 关键词描述文件上传下载中心
            </h1>
            <p className="text-gray-600">
              支持拖拽上传文件，自动保存到云端，随时随地访问和分享
            </p>
          </div>
          
          {/* 云端连接状态指示器 */}
          <div className="flex items-center space-x-2 text-sm">
            {cloudStatus === 'checking' && (
              <div className="flex items-center text-yellow-600">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                检查连接...
              </div>
            )}
            {cloudStatus === 'connected' && (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                云端已连接
              </div>
            )}
            {cloudStatus === 'offline' && (
              <div className="flex items-center text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                离线模式
              </div>
            )}
          </div>
        </div>
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
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerateShareLink}
                className="px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                disabled={files.length === 0}
                title="生成多设备分享链接"
              >
                生成分享链接
              </button>
              <button
                onClick={handleRefresh}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                disabled={loading}
              >
                {loading ? '加载中...' : '刷新'}
              </button>
            </div>
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