import { FileInfo } from './types';

/**
 * 云端文件索引管理系统
 * 使用Cloudinary标签作为全局文件索引，实现多设备文件同步
 */

// 全局文件标签，用于标识系统上传的文件
const GLOBAL_FILE_TAG = 'upload-center-files';
const INDEX_TAG_PREFIX = 'index-';

/**
 * 从Cloudinary获取所有文件列表
 * @returns Promise<文件信息数组>
 */
export async function getFilesFromCloud(): Promise<FileInfo[]> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.error('Cloudinary配置缺失');
    return [];
  }

  try {
    // 使用Cloudinary的搜索API获取带有指定标签的所有文件
    const searchUrl = `https://res.cloudinary.com/${cloudName}/image/list/${GLOBAL_FILE_TAG}.json`;
    
    let allFiles: FileInfo[] = [];
    
    // 同时搜索三种资源类型
    const resourceTypes = ['image', 'video', 'raw'];
    
    for (const resourceType of resourceTypes) {
      try {
        const typeSearchUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/list/${GLOBAL_FILE_TAG}.json`;
        const response = await fetch(typeSearchUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.resources && Array.isArray(data.resources)) {
            // 转换Cloudinary响应为FileInfo格式
            const files: FileInfo[] = data.resources.map((resource: any) => {
              // 尝试从标签中解析文件信息
              const indexTag = resource.tags?.find((tag: string) => tag.startsWith(INDEX_TAG_PREFIX));
              let fileInfo: Partial<FileInfo> = {};
              
              if (indexTag) {
                try {
                  const encodedInfo = indexTag.replace(INDEX_TAG_PREFIX, '');
                  const decodedInfo = decodeURIComponent(encodedInfo);
                  fileInfo = JSON.parse(decodedInfo);
                } catch (error) {
                  console.warn('解析文件信息标签失败:', error);
                }
              }
              
              // 生成文件信息，优先使用标签中的信息
              return {
                id: fileInfo.id || resource.public_id,
                fileName: fileInfo.fileName || resource.public_id.split('/').pop() || 'unknown',
                uploadTime: fileInfo.uploadTime || resource.created_at || new Date().toISOString(),
                expiresAt: fileInfo.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                fileSize: fileInfo.fileSize || resource.bytes || 0,
                cloudinaryUrl: resource.secure_url || resource.url,
                fileType: fileInfo.fileType || getFileTypeFromFormat(resource.format, resourceType),
                publicId: resource.public_id,
              } as FileInfo;
            });
            
            allFiles.push(...files);
          }
        }
      } catch (error) {
        console.warn(`搜索${resourceType}类型文件失败:`, error);
      }
    }
    
    // 去重并按上传时间排序
    const uniqueFiles = Array.from(
      new Map(allFiles.map(file => [file.id, file])).values()
    );
    
    return uniqueFiles.sort((a, b) => 
      new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
    );
    
  } catch (error) {
    console.error('从云端获取文件列表失败:', error);
    return [];
  }
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
 * 检查云端连接状态
 * @returns Promise<连接是否正常>
 */
export async function checkCloudConnection(): Promise<boolean> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    return false;
  }
  
  try {
    const testUrl = `https://res.cloudinary.com/${cloudName}/image/list/nonexistent-tag-test.json`;
    const response = await fetch(testUrl);
    
    // 即使标签不存在，返回200也表示连接正常
    return response.ok;
  } catch (error) {
    console.error('云端连接测试失败:', error);
    return false;
  }
}