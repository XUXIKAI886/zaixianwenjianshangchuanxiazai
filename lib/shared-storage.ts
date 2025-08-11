import { FileInfo } from './types';

/**
 * 共享文件存储系统
 * 使用Cloudinary作为文件存储，通过简单的数据库或API实现文件索引同步
 * 
 * 注意：在GitHub Pages静态部署环境中，这个功能有限制
 * 但仍然可以通过上传时的标签和手动刷新实现基本的多设备访问
 */

// 共享存储键（可以考虑使用云端存储服务）
const SHARED_STORAGE_KEY = 'shared-file-index';

/**
 * 生成用于多设备同步的分享链接
 * @param files 要分享的文件列表
 * @returns 分享链接
 */
export function generateShareLink(files: FileInfo[]): string {
  try {
    // 创建分享数据
    const shareData = {
      timestamp: new Date().toISOString(),
      files: files.map(file => ({
        id: file.id,
        fileName: file.fileName,
        uploadTime: file.uploadTime,
        expiresAt: file.expiresAt,
        fileSize: file.fileSize,
        cloudinaryUrl: file.cloudinaryUrl,
        fileType: file.fileType,
        publicId: file.publicId,
      })),
    };
    
    // 编码为URL参数
    const encoded = btoa(JSON.stringify(shareData));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?share=${encoded}`;
  } catch (error) {
    console.error('生成分享链接失败:', error);
    throw new Error('无法生成分享链接');
  }
}

/**
 * 从分享链接解析文件列表
 * @param shareParam URL中的share参数
 * @returns 解析出的文件列表
 */
export function parseShareLink(shareParam: string): FileInfo[] {
  try {
    const decoded = atob(shareParam);
    const shareData = JSON.parse(decoded);
    
    if (!shareData.files || !Array.isArray(shareData.files)) {
      throw new Error('分享数据格式无效');
    }
    
    // 验证文件数据并转换
    const files: FileInfo[] = shareData.files
      .filter((file: any) => 
        file && 
        typeof file.id === 'string' &&
        typeof file.fileName === 'string' &&
        typeof file.cloudinaryUrl === 'string'
      )
      .map((file: any) => ({
        id: file.id,
        fileName: file.fileName,
        uploadTime: file.uploadTime || new Date().toISOString(),
        expiresAt: file.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        fileSize: file.fileSize || 0,
        cloudinaryUrl: file.cloudinaryUrl,
        fileType: file.fileType || 'application/octet-stream',
        publicId: file.publicId || '',
      }));
    
    return files;
  } catch (error) {
    console.error('解析分享链接失败:', error);
    throw new Error('无效的分享链接');
  }
}

/**
 * 检查当前URL是否包含分享参数
 * @returns 分享的文件列表，如果没有则返回null
 */
export function checkForSharedFiles(): FileInfo[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');
    
    if (!shareParam) return null;
    
    return parseShareLink(shareParam);
  } catch (error) {
    console.error('检查分享文件失败:', error);
    return null;
  }
}

/**
 * 清除URL中的分享参数
 */
export function clearShareParams(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('清除分享参数失败:', error);
  }
}

/**
 * 获取可分享的文件数量统计
 * @param files 文件列表
 * @returns 统计信息
 */
export function getShareableStats(files: FileInfo[]): {
  totalFiles: number;
  totalSize: number;
  validFiles: number;
} {
  const now = new Date().getTime();
  let validFiles = 0;
  let totalSize = 0;
  
  files.forEach(file => {
    const expiryTime = new Date(file.expiresAt || '').getTime();
    if (expiryTime > now) {
      validFiles++;
      totalSize += file.fileSize || 0;
    }
  });
  
  return {
    totalFiles: files.length,
    totalSize,
    validFiles,
  };
}

/**
 * 设备间文件同步说明
 */
export const SYNC_INSTRUCTIONS = {
  title: '多设备文件访问',
  steps: [
    '在设备A上传文件',
    '点击"生成分享链接"按钮',
    '将链接发送到设备B（QQ、微信、邮件等）',
    '在设备B打开链接即可访问所有文件',
  ],
  notes: [
    '分享链接包含所有当前文件的访问信息',
    '链接中不包含文件内容，仅包含访问地址',
    '文件仍然存储在云端，安全可靠',
    '过期文件不会包含在分享链接中',
  ],
};

/**
 * 生成QR码数据URL（用于移动设备扫码访问）
 * @param shareLink 分享链接
 * @returns QR码数据URL
 */
export function generateQRCodeDataUrl(shareLink: string): string {
  // 这里返回一个占位符，实际项目中可以集成QR码生成库
  // 比如 qrcode.js 或使用在线QR码生成服务
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`;
  return qrApiUrl;
}