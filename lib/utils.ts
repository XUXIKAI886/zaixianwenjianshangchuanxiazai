import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  FileIcon, 
  Image, 
  FileText, 
  FileSpreadsheet, 
  FileVideo, 
  FileAudio,
  Archive,
  Code,
  Presentation
} from 'lucide-react';

// 合并CSS类名的工具函数
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化文件大小 - 将字节转换为人类可读格式
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期时间 - 转换为本地化格式
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// 生成唯一ID - 基于时间戳和随机数
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 验证文件大小 - 检查文件是否超过指定大小限制
export function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

// 获取文件扩展名
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return fileName.substring(lastDotIndex + 1).toLowerCase();
}

// 验证文件类型 - 检查文件是否为允许的类型
export function validateFileType(file: File, allowedTypes?: string[]): boolean {
  if (!allowedTypes || allowedTypes.length === 0) return true;
  
  const fileExtension = getFileExtension(file.name);
  const mimeType = file.type;
  
  return allowedTypes.some(type => {
    // 检查扩展名
    if (type.startsWith('.')) {
      return fileExtension === type.substring(1);
    }
    // 检查MIME类型
    return mimeType.includes(type);
  });
}

// 获取文件图标类型 - 根据文件扩展名返回对应的图标类型
export function getFileIconType(fileName: string): string {
  const extension = getFileExtension(fileName);
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  const spreadsheetTypes = ['xls', 'xlsx', 'csv'];
  const presentationTypes = ['ppt', 'pptx'];
  const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];
  const videoTypes = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
  const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
  const codeTypes = ['js', 'ts', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp'];
  
  if (imageTypes.includes(extension)) return 'image';
  if (documentTypes.includes(extension)) return 'document';
  if (spreadsheetTypes.includes(extension)) return 'spreadsheet';
  if (presentationTypes.includes(extension)) return 'presentation';
  if (archiveTypes.includes(extension)) return 'archive';
  if (videoTypes.includes(extension)) return 'video';
  if (audioTypes.includes(extension)) return 'audio';
  if (codeTypes.includes(extension)) return 'code';
  
  return 'file';
}

// 根据文件类型获取对应的Lucide图标组件
export function getFileIcon(fileType: string) {
  // 根据MIME类型判断
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return FileVideo;
  if (fileType.startsWith('audio/')) return FileAudio;
  
  // 根据具体类型判断
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('document') || fileType.includes('word')) return FileText;
  if (fileType.includes('sheet') || fileType.includes('excel')) return FileSpreadsheet;
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return Presentation;
  if (fileType.includes('zip') || fileType.includes('archive')) return Archive;
  if (fileType.includes('javascript') || fileType.includes('json') || fileType.includes('xml')) return Code;
  
  return FileIcon; // 默认文件图标
}

// 截断文件名 - 如果文件名过长则进行截断
export function truncateFileName(fileName: string, maxLength: number = 30): string {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = getFileExtension(fileName);
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4) + '...';
  
  return `${truncatedName}.${extension}`;
}

// 计算上传耗时
export function calculateUploadTime(startTime: number, endTime: number): string {
  const duration = endTime - startTime;
  
  if (duration < 1000) {
    return '< 1秒';
  } else if (duration < 60000) {
    return `${Math.round(duration / 1000)}秒`;
  } else {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.round((duration % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  }
}

// 复制文本到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'absolute';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    return false;
  }
}

// 下载文件
export function downloadFile(url: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}