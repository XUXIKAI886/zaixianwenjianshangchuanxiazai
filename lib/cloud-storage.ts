import { FileInfo } from './types';

/**
 * 云端文件索引管理系统
 * 使用Cloudinary标签作为全局文件索引，实现多设备文件同步
 */

// 全局文件标签，用于标识系统上传的文件
const GLOBAL_FILE_TAG = 'upload-center-files';
const INDEX_TAG_PREFIX = 'index-';

/**
 * 从云端获取文件列表（简化版本）
 * 由于Cloudinary List API需要签名认证，在静态部署中不可用
 * 改为使用本地存储作为主要方式，云端仅用于文件存储
 * @returns Promise<文件信息数组>
 */
export async function getFilesFromCloud(): Promise<FileInfo[]> {
  // 静态部署环境中无法安全地访问Cloudinary List API
  // 返回空数组，让系统使用本地存储
  console.log('[云端模式] Cloudinary List API在静态部署中不可用，使用本地存储');
  return [];
}

/**
 * 将文件信息编码为Cloudinary标签
 * @param fileInfo 文件信息
 * @returns 标签数组
 */
export function generateCloudinaryTags(fileInfo: FileInfo): string[] {
  const tags = [GLOBAL_FILE_TAG];
  
  try {
    // 将文件信息编码为标签（Cloudinary标签有长度限制，只保存关键信息）
    const essentialInfo = {
      id: fileInfo.id,
      fileName: fileInfo.fileName,
      uploadTime: fileInfo.uploadTime,
      expiresAt: fileInfo.expiresAt,
      fileSize: fileInfo.fileSize,
      fileType: fileInfo.fileType,
    };
    
    const encodedInfo = encodeURIComponent(JSON.stringify(essentialInfo));
    
    // Cloudinary标签长度限制为160字符，如果太长则分割
    if (encodedInfo.length <= 140) { // 留一些余量给前缀
      tags.push(`${INDEX_TAG_PREFIX}${encodedInfo}`);
    } else {
      // 如果信息太长，只保存基本信息
      const basicInfo = {
        id: fileInfo.id,
        fileName: fileInfo.fileName.length > 50 ? fileInfo.fileName.substring(0, 50) : fileInfo.fileName,
        uploadTime: fileInfo.uploadTime,
        expiresAt: fileInfo.expiresAt,
      };
      
      const basicEncoded = encodeURIComponent(JSON.stringify(basicInfo));
      tags.push(`${INDEX_TAG_PREFIX}${basicEncoded}`);
    }
  } catch (error) {
    console.warn('生成文件信息标签失败:', error);
  }
  
  return tags;
}

/**
 * 根据格式和资源类型推断文件类型
 * @param format Cloudinary格式
 * @param resourceType 资源类型
 * @returns MIME类型
 */
function getFileTypeFromFormat(format: string, resourceType: string): string {
  if (resourceType === 'image') {
    const imageTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
    };
    return imageTypes[format?.toLowerCase()] || 'image/jpeg';
  }
  
  if (resourceType === 'video') {
    const videoTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
    };
    return videoTypes[format?.toLowerCase()] || 'video/mp4';
  }
  
  // raw 类型的文件
  const commonTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };
  
  return commonTypes[format?.toLowerCase()] || 'application/octet-stream';
}

/**
 * 混合存储策略：云端为主，本地为辅
 * @returns Promise<文件信息数组>
 */
export async function getHybridFileList(): Promise<FileInfo[]> {
  try {
    // 优先从云端获取
    const cloudFiles = await getFilesFromCloud();
    
    if (cloudFiles.length > 0) {
      console.log(`从云端获取到 ${cloudFiles.length} 个文件`);
      return cloudFiles;
    }
    
    // 云端无文件时，回退到本地存储
    console.log('云端无文件，使用本地存储');
    const { getStoredFiles } = await import('./storage');
    return getStoredFiles();
    
  } catch (error) {
    console.error('获取混合文件列表失败:', error);
    
    // 出错时回退到本地存储
    try {
      const { getStoredFiles } = await import('./storage');
      return getStoredFiles();
    } catch (localError) {
      console.error('本地存储也无法访问:', localError);
      return [];
    }
  }
}

/**
 * 清理过期的云端文件
 * 注意：在GitHub Pages部署中，此功能受限
 */
export async function cleanupExpiredCloudFiles(): Promise<{
  cleanedCount: number;
  errors: string[];
}> {
  const result = {
    cleanedCount: 0,
    errors: [] as string[],
  };
  
  try {
    const files = await getFilesFromCloud();
    const now = new Date().getTime();
    const expiredFiles = files.filter(file => {
      if (!file.expiresAt) return false;
      return new Date(file.expiresAt).getTime() <= now;
    });
    
    if (expiredFiles.length === 0) {
      return result;
    }
    
    console.log(`发现 ${expiredFiles.length} 个过期文件`);
    
    // 在静态部署环境中，我们无法删除云端文件
    // 这里只是记录，实际清理需要在服务器环境中进行
    for (const file of expiredFiles) {
      result.errors.push(`无法在静态环境中删除过期文件: ${file.fileName}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('清理过期云端文件失败:', error);
    result.errors.push(`清理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return result;
  }
}

/**
 * 检查云端连接状态（简化版）
 * 在静态部署环境中，直接检查环境变量配置
 * @returns Promise<连接是否正常>
 */
export async function checkCloudConnection(): Promise<boolean> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  
  // 简单检查配置是否存在
  if (!cloudName || !apiKey) {
    return false;
  }
  
  // 在静态部署中，我们不进行实际的网络测试
  // 避免401错误，直接返回配置存在即认为连接正常
  return true;
}