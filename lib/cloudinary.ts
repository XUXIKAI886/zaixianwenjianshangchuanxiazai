import { CloudinaryUploadResponse, FileInfo } from './types';
import { generateCloudinaryTags } from './cloud-storage';

/**
 * 上传文件到Cloudinary（支持云端文件索引）
 * @param file 要上传的文件
 * @param fileInfo 文件信息（用于生成云端标签）
 * @param onProgress 上传进度回调函数
 * @returns Promise<上传结果>
 */
export async function uploadFileToCloudinary(
  file: File, 
  fileInfo?: FileInfo,
  onProgress?: (progress: number) => void
): Promise<{
  url: string;
  publicId: string;
  secureUrl: string;
}> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    throw new Error('Cloudinary配置缺失：请设置NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME环境变量');
  }

  // 创建FormData - 使用无签名上传预设
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'upload-preset'); // 使用您需要创建的无签名预设
  formData.append('resource_type', 'auto'); // 自动检测资源类型
  
  // 如果提供了文件信息，添加简单标签
  if (fileInfo) {
    const tags = ['upload-center', `file-${fileInfo.id.substring(0, 8)}`];
    formData.append('tags', tags.join(','));
  }

  try {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 设置上传进度监听
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }
      
      // 设置完成处理
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              publicId: response.public_id,
              secureUrl: response.secure_url,
            });
          } catch (parseError) {
            reject(new Error('解析响应数据失败'));
          }
        } else {
          reject(new Error(`上传失败: HTTP ${xhr.status}`));
        }
      };
      
      // 设置错误处理
      xhr.onerror = function() {
        reject(new Error('网络错误，请检查网络连接'));
      };
      
      // 设置超时处理
      xhr.timeout = 300000; // 5分钟超时
      xhr.ontimeout = function() {
        reject(new Error('上传超时，请重试'));
      };
      
      // 发送请求
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    throw new Error('文件上传失败，请重试');
  }
}

/**
 * 从Cloudinary删除文件（GitHub Pages静态部署版本）
 * 注意：静态部署无法安全地删除Cloudinary文件，此函数仅作占位符
 * @param publicId Cloudinary公共ID
 * @param fileType 文件类型，用于确定资源类型
 * @returns Promise<删除结果>
 */
export async function deleteFileFromCloudinary(publicId: string, fileType?: string): Promise<void> {
  console.log(`[静态部署] 无法从Cloudinary删除文件: ${publicId}`);
  console.log('文件仍保留在Cloudinary中，只从本地存储移除');
  // 在静态部署中，我们无法安全地删除Cloudinary文件
  // 文件将继续保留在云端，但会从本地列表中移除
  return Promise.resolve();
}

/**
 * 批量删除文件
 * @param files 包含publicId和fileType的文件信息数组
 * @returns Promise<批量删除结果>
 */
export async function batchDeleteFilesFromCloudinary(files: {publicId: string, fileType?: string}[]): Promise<{
  successCount: number;
  failedCount: number;
  errors: string[];
}> {
  const results = {
    successCount: 0,
    failedCount: 0,
    errors: [] as string[],
  };

  // 并发删除文件，但限制并发数量
  const concurrencyLimit = 5;
  const chunks = [];
  
  for (let i = 0; i < files.length; i += concurrencyLimit) {
    chunks.push(files.slice(i, i + concurrencyLimit));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (file) => {
      try {
        await deleteFileFromCloudinary(file.publicId, file.fileType);
        results.successCount++;
      } catch (error) {
        results.failedCount++;
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        results.errors.push(`${file.publicId}: ${errorMessage}`);
      }
    });
    
    await Promise.all(promises);
  }

  return results;
}

/**
 * 生成Cloudinary转换URL
 * @param originalUrl 原始URL
 * @param transformations 转换参数
 * @returns 转换后的URL
 */
export function generateTransformedUrl(
  originalUrl: string, 
  transformations: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }
): string {
  // 解析原始URL
  const urlParts = originalUrl.split('/upload/');
  if (urlParts.length !== 2) {
    return originalUrl; // 无法解析，返回原始URL
  }

  const [baseUrl, pathWithPublicId] = urlParts;
  
  // 构建转换参数
  const transformParts: string[] = [];
  
  if (transformations.width) {
    transformParts.push(`w_${transformations.width}`);
  }
  
  if (transformations.height) {
    transformParts.push(`h_${transformations.height}`);
  }
  
  if (transformations.quality) {
    transformParts.push(`q_${transformations.quality}`);
  }
  
  if (transformations.format) {
    transformParts.push(`f_${transformations.format}`);
  }

  const transformString = transformParts.join(',');
  
  return transformString 
    ? `${baseUrl}/upload/${transformString}/${pathWithPublicId}`
    : originalUrl;
}

/**
 * 获取文件预览URL（用于图片缩略图）
 * @param originalUrl 原始文件URL
 * @returns 预览URL
 */
export function getPreviewUrl(originalUrl: string): string {
  return generateTransformedUrl(originalUrl, {
    width: 200,
    height: 200,
    quality: 70,
    format: 'auto',
  });
}

/**
 * 验证Cloudinary配置
 * @returns 配置是否有效
 */
export function validateCloudinaryConfig(): {
  isValid: boolean;
  missingVars: string[];
} {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  
  const missingVars = [];
  
  if (!cloudName || cloudName === 'your-cloud-name' || cloudName.trim() === '') {
    missingVars.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
  }
  
  if (!apiKey || apiKey === 'your-api-key' || apiKey.trim() === '') {
    missingVars.push('NEXT_PUBLIC_CLOUDINARY_API_KEY');
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * 获取文件信息（不包含敏感数据）
 * @param publicId 公共ID
 * @returns Promise<文件信息>
 */
export async function getFileInfo(publicId: string): Promise<{
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  url: string;
  secureUrl: string;
} | null> {
  try {
    const response = await fetch('/api/file-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });
    
    if (!response.ok) {
      throw new Error('获取文件信息失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取文件信息失败:', error);
    return null;
  }
}