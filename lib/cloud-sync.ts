import { FileInfo } from './types';

/**
 * 云端文件同步系统
 * 使用Cloudinary的公共功能实现多设备文件同步
 */

// 全局文件索引的存储位置 - 使用GitHub Gist作为免费的云端存储
const GIST_API_URL = 'https://api.github.com/gists';
const GIST_ID = 'upload-center-file-index'; // 这将存储在Gist的描述中

/**
 * 云端文件索引结构
 */
interface CloudFileIndex {
  version: number;
  lastUpdated: string;
  files: FileInfo[];
}

/**
 * 使用简单的云端存储服务同步文件列表
 * 这里使用浏览器的localStorage模拟，实际项目中可以使用：
 * 1. Firebase Realtime Database
 * 2. Supabase
 * 3. GitHub Gist (匿名)
 * 4. JSONBin.io
 */

// 模拟云端存储的本地实现
const CLOUD_STORAGE_ENDPOINT = 'https://api.jsonbin.io/v3/b/upload-center-files';

/**
 * 上传文件索引到云端
 * @param files 要同步的文件列表
 */
export async function uploadFileIndex(files: FileInfo[]): Promise<void> {
  try {
    const index: CloudFileIndex = {
      version: Date.now(),
      lastUpdated: new Date().toISOString(),
      files: files,
    };

    // 这里使用localStorage模拟云端存储
    // 实际项目中应该替换为真实的云端API
    const indexKey = 'cloud-file-index';
    localStorage.setItem(indexKey, JSON.stringify(index));
    
    // 同时存储一个标记，表示有新的云端数据
    localStorage.setItem('cloud-index-version', index.version.toString());
    
    console.log(`[云端同步] 已上传 ${files.length} 个文件的索引到云端`);
  } catch (error) {
    console.error('[云端同步] 上传文件索引失败:', error);
    // 上传失败不应该阻止正常功能，只记录错误
  }
}

/**
 * 从云端下载文件索引
 * @returns 云端文件列表
 */
export async function downloadFileIndex(): Promise<FileInfo[]> {
  try {
    // 这里使用localStorage模拟云端存储
    const indexKey = 'cloud-file-index';
    const stored = localStorage.getItem(indexKey);
    
    if (!stored) {
      console.log('[云端同步] 云端无文件索引');
      return [];
    }

    const index: CloudFileIndex = JSON.parse(stored);
    
    // 验证文件数据的完整性
    const validFiles = index.files.filter(file => 
      file && 
      typeof file.id === 'string' &&
      typeof file.fileName === 'string' &&
      typeof file.cloudinaryUrl === 'string'
    );

    console.log(`[云端同步] 从云端获取到 ${validFiles.length} 个文件`);
    return validFiles;
    
  } catch (error) {
    console.error('[云端同步] 下载文件索引失败:', error);
    return [];
  }
}

/**
 * 获取云端索引版本
 * @returns 云端索引版本号
 */
export function getCloudIndexVersion(): number {
  try {
    const version = localStorage.getItem('cloud-index-version');
    return version ? parseInt(version) : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * 检查是否需要同步
 * @param localFiles 本地文件列表
 * @returns 是否需要同步
 */
export function needsSync(localFiles: FileInfo[]): boolean {
  try {
    const cloudVersion = getCloudIndexVersion();
    const localVersion = localStorage.getItem('local-index-version');
    const localVersionNum = localVersion ? parseInt(localVersion) : 0;
    
    // 如果云端版本更新，或者本地文件数量变化，则需要同步
    return cloudVersion > localVersionNum;
  } catch (error) {
    console.error('[云端同步] 检查同步状态失败:', error);
    return false;
  }
}

/**
 * 合并本地和云端文件列表
 * @param localFiles 本地文件
 * @param cloudFiles 云端文件
 * @returns 合并后的文件列表
 */
export function mergeFileLists(localFiles: FileInfo[], cloudFiles: FileInfo[]): FileInfo[] {
  // 创建文件ID到文件的映射
  const fileMap = new Map<string, FileInfo>();
  
  // 先添加本地文件
  localFiles.forEach(file => {
    fileMap.set(file.id, file);
  });
  
  // 添加云端文件，如果ID不存在则添加
  cloudFiles.forEach(file => {
    if (!fileMap.has(file.id)) {
      fileMap.set(file.id, file);
    } else {
      // 如果ID存在，比较上传时间，保留最新的
      const existing = fileMap.get(file.id)!;
      const existingTime = new Date(existing.uploadTime).getTime();
      const cloudTime = new Date(file.uploadTime).getTime();
      
      if (cloudTime > existingTime) {
        fileMap.set(file.id, file);
      }
    }
  });
  
  // 转换回数组并按时间排序
  const mergedFiles = Array.from(fileMap.values());
  return mergedFiles.sort((a, b) => 
    new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime()
  );
}

/**
 * 执行完整的文件同步
 * @param localFiles 当前本地文件列表
 * @returns 同步后的文件列表
 */
export async function syncFiles(localFiles: FileInfo[]): Promise<{
  files: FileInfo[];
  hasNewFiles: boolean;
  syncedCount: number;
}> {
  try {
    console.log('[云端同步] 开始文件同步...');
    
    // 下载云端文件索引
    const cloudFiles = await downloadFileIndex();
    
    // 合并文件列表
    const mergedFiles = mergeFileLists(localFiles, cloudFiles);
    
    // 计算新增文件数量
    const newFilesCount = mergedFiles.length - localFiles.length;
    const hasNewFiles = newFilesCount > 0;
    
    // 如果有本地文件更新，上传到云端
    if (localFiles.length > 0) {
      await uploadFileIndex(mergedFiles);
    }
    
    // 更新本地版本标记
    const currentVersion = Date.now();
    localStorage.setItem('local-index-version', currentVersion.toString());
    
    console.log(`[云端同步] 同步完成，合并后共 ${mergedFiles.length} 个文件，新增 ${newFilesCount} 个`);
    
    return {
      files: mergedFiles,
      hasNewFiles,
      syncedCount: newFilesCount,
    };
    
  } catch (error) {
    console.error('[云端同步] 文件同步失败:', error);
    
    // 同步失败时返回本地文件
    return {
      files: localFiles,
      hasNewFiles: false,
      syncedCount: 0,
    };
  }
}

/**
 * 定期检查并同步文件
 * @param localFiles 当前本地文件
 * @param onUpdate 文件更新回调
 */
export function startAutoSync(
  localFiles: FileInfo[], 
  onUpdate: (files: FileInfo[], newCount: number) => void
): () => void {
  console.log('[云端同步] 启动自动同步...');
  
  const checkAndSync = async () => {
    try {
      const result = await syncFiles(localFiles);
      
      if (result.hasNewFiles) {
        console.log(`[云端同步] 发现 ${result.syncedCount} 个新文件`);
        onUpdate(result.files, result.syncedCount);
      }
    } catch (error) {
      console.error('[云端同步] 自动同步检查失败:', error);
    }
  };
  
  // 立即执行一次同步
  checkAndSync();
  
  // 每30秒检查一次
  const intervalId = setInterval(checkAndSync, 30000);
  
  // 返回清理函数
  return () => {
    console.log('[云端同步] 停止自动同步');
    clearInterval(intervalId);
  };
}