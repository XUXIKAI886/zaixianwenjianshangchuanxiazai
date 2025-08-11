import { FileInfo } from './types';
import { deleteFileFromCloudinary } from './cloudinary';

// 本地存储键名
const STORAGE_KEY = 'uploaded-files';

// 检查是否在客户端环境
const isClient = typeof window !== 'undefined';

/**
 * 清理过期文件
 * @param files 文件列表
 * @returns 清理后的文件列表
 */
async function cleanupExpiredFiles(files: FileInfo[]): Promise<FileInfo[]> {
  const now = new Date().getTime();
  const expiredFiles: FileInfo[] = [];
  const validFiles: FileInfo[] = [];
  
  for (const file of files) {
    // 如果没有expiresAt字段，为旧数据添加过期时间（当前时间+24小时）
    if (!file.expiresAt) {
      file.expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    }
    
    const expiryTime = new Date(file.expiresAt).getTime();
    if (now >= expiryTime) {
      expiredFiles.push(file);
    } else {
      validFiles.push(file);
    }
  }
  
  // 异步删除过期文件（不阻塞UI）
  if (expiredFiles.length > 0) {
    console.log(`发现 ${expiredFiles.length} 个过期文件，正在删除...`);
    
    // 后台异步删除Cloudinary文件
    Promise.all(
      expiredFiles.map(async (file) => {
        try {
          await deleteFileFromCloudinary(file.publicId, file.fileType);
          console.log(`已删除过期文件: ${file.fileName}`);
        } catch (error) {
          console.error(`删除过期文件失败: ${file.fileName}`, error);
        }
      })
    );
    
    // 立即更新本地存储
    if (isClient && validFiles.length !== files.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validFiles));
      } catch (error) {
        console.error('更新存储失败:', error);
      }
    }
  }
  
  return validFiles;
}

/**
 * 同步清理过期文件（用于读取时）
 * @param files 文件列表
 * @returns 清理后的文件列表
 */
function cleanupExpiredFilesSync(files: FileInfo[]): FileInfo[] {
  const now = new Date().getTime();
  const validFiles: FileInfo[] = [];
  let hasExpiredFiles = false;
  
  for (const file of files) {
    // 如果没有expiresAt字段，为旧数据添加过期时间（当前时间+24小时）
    if (!file.expiresAt) {
      file.expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    }
    
    const expiryTime = new Date(file.expiresAt).getTime();
    if (now >= expiryTime) {
      hasExpiredFiles = true;
      
      // 异步删除Cloudinary文件（不阻塞）
      deleteFileFromCloudinary(file.publicId, file.fileType)
        .then(() => console.log(`已删除过期文件: ${file.fileName}`))
        .catch(error => console.error(`删除过期文件失败: ${file.fileName}`, error));
    } else {
      validFiles.push(file);
    }
  }
  
  // 如果有过期文件，更新本地存储
  if (hasExpiredFiles && isClient) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validFiles));
      console.log(`已清理 ${files.length - validFiles.length} 个过期文件`);
    } catch (error) {
      console.error('更新存储失败:', error);
    }
  }
  
  return validFiles;
}

/**
 * 获取存储的文件列表
 * @returns 文件信息数组
 */
export function getStoredFiles(): FileInfo[] {
  if (!isClient) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const files = JSON.parse(stored);
    // 验证数据格式并过滤无效数据
    const validFiles = files.filter((file: any) => 
      file && 
      typeof file.id === 'string' &&
      typeof file.fileName === 'string' &&
      typeof file.cloudinaryUrl === 'string'
    );
    
    // 自动清理过期文件
    return cleanupExpiredFilesSync(validFiles);
  } catch (error) {
    console.error('读取文件列表失败:', error);
    // 清除损坏的数据
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * 保存文件信息到存储
 * @param fileInfo 要保存的文件信息
 */
export function saveFileToStorage(fileInfo: FileInfo): void {
  if (!isClient) {
    console.warn('无法在服务器端保存文件信息');
    return;
  }

  try {
    const files = getStoredFiles();
    // 检查是否已存在相同ID的文件
    const existingIndex = files.findIndex(file => file.id === fileInfo.id);
    
    if (existingIndex >= 0) {
      // 更新现有文件信息
      files[existingIndex] = fileInfo;
    } else {
      // 添加新文件信息
      files.push(fileInfo);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('保存文件信息失败:', error);
    throw new Error('保存文件信息失败，可能是存储空间不足');
  }
}

/**
 * 从存储中删除文件
 * @param fileId 要删除的文件ID
 */
export function deleteFileFromStorage(fileId: string): void {
  if (!isClient) {
    console.warn('无法在服务器端删除文件信息');
    return;
  }

  try {
    const files = getStoredFiles();
    const updatedFiles = files.filter(file => file.id !== fileId);
    
    // 只有实际删除了文件才更新存储
    if (updatedFiles.length !== files.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
    }
  } catch (error) {
    console.error('删除文件信息失败:', error);
    throw new Error('删除文件信息失败');
  }
}

/**
 * 批量删除文件
 * @param fileIds 要删除的文件ID数组
 */
export function batchDeleteFilesFromStorage(fileIds: string[]): void {
  if (!isClient) {
    console.warn('无法在服务器端删除文件信息');
    return;
  }

  if (!fileIds || fileIds.length === 0) return;

  try {
    const files = getStoredFiles();
    const updatedFiles = files.filter(file => !fileIds.includes(file.id));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
  } catch (error) {
    console.error('批量删除文件失败:', error);
    throw new Error('批量删除文件失败');
  }
}

/**
 * 根据ID获取单个文件信息
 * @param fileId 文件ID
 * @returns 文件信息或undefined
 */
export function getFileById(fileId: string): FileInfo | undefined {
  const files = getStoredFiles();
  return files.find(file => file.id === fileId);
}

/**
 * 更新文件信息
 * @param fileId 文件ID
 * @param updates 要更新的字段
 */
export function updateFileInStorage(fileId: string, updates: Partial<FileInfo>): void {
  if (!isClient) {
    console.warn('无法在服务器端更新文件信息');
    return;
  }

  try {
    const files = getStoredFiles();
    const fileIndex = files.findIndex(file => file.id === fileId);
    
    if (fileIndex === -1) {
      throw new Error('文件不存在');
    }
    
    // 合并更新
    files[fileIndex] = { ...files[fileIndex], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    console.error('更新文件信息失败:', error);
    throw new Error('更新文件信息失败');
  }
}

/**
 * 清空所有存储的文件信息
 */
export function clearAllFiles(): void {
  if (!isClient) {
    console.warn('无法在服务器端清空文件信息');
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清空文件列表失败:', error);
    throw new Error('清空文件列表失败');
  }
}

/**
 * 获取存储统计信息
 * @returns 存储统计
 */
export function getStorageStats(): {
  totalFiles: number;
  totalSize: number;
  storageUsed: string;
} {
  const files = getStoredFiles();
  const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
  
  let storageUsed = '0';
  try {
    if (isClient) {
      const storageData = localStorage.getItem(STORAGE_KEY) || '';
      storageUsed = (new Blob([storageData]).size / 1024).toFixed(2) + 'KB';
    }
  } catch (error) {
    console.warn('无法计算存储使用量:', error);
  }
  
  return {
    totalFiles: files.length,
    totalSize,
    storageUsed,
  };
}

/**
 * 导出文件列表为JSON
 * @returns JSON字符串
 */
export function exportFilesAsJson(): string {
  const files = getStoredFiles();
  return JSON.stringify(files, null, 2);
}

/**
 * 从JSON导入文件列表
 * @param jsonData JSON字符串
 * @param merge 是否合并到现有列表
 */
export function importFilesFromJson(jsonData: string, merge: boolean = false): void {
  if (!isClient) {
    throw new Error('无法在服务器端导入文件');
  }

  try {
    const importedFiles: FileInfo[] = JSON.parse(jsonData);
    
    // 验证导入的数据格式
    if (!Array.isArray(importedFiles)) {
      throw new Error('导入的数据格式不正确');
    }
    
    const validFiles = importedFiles.filter((file: any) => 
      file && 
      typeof file.id === 'string' &&
      typeof file.fileName === 'string' &&
      typeof file.cloudinaryUrl === 'string'
    );
    
    if (validFiles.length !== importedFiles.length) {
      console.warn(`导入数据中有 ${importedFiles.length - validFiles.length} 个无效文件被跳过`);
    }
    
    let finalFiles = validFiles;
    
    if (merge) {
      const existingFiles = getStoredFiles();
      const existingIds = new Set(existingFiles.map(f => f.id));
      
      // 只添加不存在的文件
      const newFiles = validFiles.filter(file => !existingIds.has(file.id));
      finalFiles = [...existingFiles, ...newFiles];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalFiles));
  } catch (error) {
    console.error('导入文件列表失败:', error);
    throw new Error('导入文件列表失败，请检查数据格式');
  }
}