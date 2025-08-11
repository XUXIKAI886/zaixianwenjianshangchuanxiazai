'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { uploadFileToCloudinary } from '@/lib/cloudinary';
import { saveFileToStorage } from '@/lib/storage';
import { validateFileSize, validateFileType, generateId, formatFileSize } from '@/lib/utils';
import { FileUploaderProps, UploadProgress, FileInfo } from '@/lib/types';

export function FileUploader({ 
  onUploadComplete, 
  onUploadProgress,
  maxFileSize = 50,
  acceptedTypes
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadProgress[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: File[]) => {
    setErrors([]);
    const validFiles: File[] = [];
    const currentErrors: string[] = [];

    // 验证文件
    files.forEach(file => {
      if (!validateFileSize(file, maxFileSize)) {
        currentErrors.push(`${file.name}: 文件大小超出限制 (${formatFileSize(file.size)} > ${maxFileSize}MB)`);
        return;
      }

      if (!validateFileType(file, acceptedTypes)) {
        const acceptedStr = acceptedTypes?.join(', ') || '所有类型';
        currentErrors.push(`${file.name}: 文件类型不支持，支持的类型: ${acceptedStr}`);
        return;
      }

      validFiles.push(file);
    });

    if (currentErrors.length > 0) {
      setErrors(currentErrors);
    }

    // 上传有效文件
    for (const file of validFiles) {
      const fileId = generateId();
      const progressInfo: UploadProgress = {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      };

      // 添加到上传队列
      setUploadingFiles(prev => [...prev, progressInfo]);

      try {
        // 上传到Cloudinary
        const uploadResult = await uploadFileToCloudinary(file, (progress) => {
          // 更新上传进度
          setUploadingFiles(prev => 
            prev.map(item => 
              item.fileName === file.name 
                ? { ...item, progress }
                : item
            )
          );
          
          if (onUploadProgress) {
            onUploadProgress({ ...progressInfo, progress });
          }
        });

        // 创建文件信息对象
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24小时后过期
        
        const fileInfo: FileInfo = {
          id: fileId,
          fileName: file.name,
          uploadTime: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          fileSize: file.size,
          cloudinaryUrl: uploadResult.url,
          fileType: file.type,
          publicId: uploadResult.publicId,
        };

        // 保存到本地存储
        saveFileToStorage(fileInfo);

        // 更新状态为完成
        setUploadingFiles(prev => 
          prev.map(item => 
            item.fileName === file.name 
              ? { ...item, progress: 100, status: 'completed' }
              : item
          )
        );

        // 通知父组件上传完成
        onUploadComplete(fileInfo);

        // 延迟移除完成的上传项
        setTimeout(() => {
          setUploadingFiles(prev => 
            prev.filter(item => item.fileName !== file.name)
          );
        }, 2000);

      } catch (error) {
        console.error('文件上传失败:', error);
        
        // 更新状态为错误
        setUploadingFiles(prev => 
          prev.map(item => 
            item.fileName === file.name 
              ? { ...item, status: 'error' }
              : item
          )
        );

        // 添加错误信息
        const errorMessage = error instanceof Error ? error.message : '上传失败';
        setErrors(prev => [...prev, `${file.name}: ${errorMessage}`]);

        // 延迟移除错误的上传项
        setTimeout(() => {
          setUploadingFiles(prev => 
            prev.filter(item => item.fileName !== file.name)
          );
        }, 5000);
      }
    }
  }, [maxFileSize, acceptedTypes, onUploadComplete, onUploadProgress]);

  // 设置dropzone配置
  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFileUpload(acceptedFiles);
  }, [handleFileUpload]);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  // 获取拖拽区域的样式类
  const getDropzoneClassName = () => {
    let className = 'file-upload-area cursor-pointer transition-all duration-200';
    
    if (isDragActive || isDragAccept) {
      className += ' drag-over border-primary bg-primary/10';
    } else if (isDragReject) {
      className += ' border-red-500 bg-red-50';
    }
    
    return className;
  };

  return (
    <div className="w-full space-y-4">
      {/* 拖拽上传区域 */}
      <div {...getRootProps()} className={getDropzoneClassName()}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="h-12 w-12 text-gray-400" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? '松开以上传文件' : '拖拽文件到此处或点击选择文件'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              支持单个或多个文件上传，最大 {maxFileSize}MB
            </p>
            {acceptedTypes && acceptedTypes.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                支持格式: {acceptedTypes.join(', ')}
              </p>
            )}
          </div>
          <Button type="button" variant="outline">
            <FileIcon className="w-4 h-4 mr-2" />
            选择文件
          </Button>
        </div>
      </div>

      {/* 上传进度显示 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">正在上传:</h3>
          {uploadingFiles.map((uploadFile, index) => (
            <div key={`${uploadFile.fileName}-${index}`} className="p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate flex-1 mr-2">
                  {uploadFile.fileName}
                </span>
                <div className="flex items-center">
                  {uploadFile.status === 'uploading' && (
                    <span className="text-xs text-blue-600">{uploadFile.progress}%</span>
                  )}
                  {uploadFile.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
              <Progress 
                value={uploadFile.progress} 
                className={
                  uploadFile.status === 'error' 
                    ? '[&>div]:bg-red-500' 
                    : uploadFile.status === 'completed'
                    ? '[&>div]:bg-green-500'
                    : ''
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* 错误信息显示 */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-red-700">上传错误:</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}