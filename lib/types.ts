// 文件信息接口
export interface FileInfo {
  id: string;                 // 文件唯一标识符
  fileName: string;           // 原始文件名
  uploadTime: string;         // ISO格式上传时间
  expiresAt: string;          // ISO格式过期时间（24小时后）
  fileSize: number;           // 文件大小（字节）
  cloudinaryUrl: string;      // Cloudinary存储URL
  fileType: string;           // MIME类型
  publicId: string;           // Cloudinary公共ID（用于删除）
}

// 上传进度接口
export interface UploadProgress {
  fileName: string;           // 文件名
  progress: number;           // 上传进度 0-100
  status: 'uploading' | 'completed' | 'error';  // 上传状态
}

// 筛选选项接口
export interface FilterOptions {
  searchTerm: string;         // 搜索关键词
  sortBy: 'fileName' | 'uploadTime' | 'fileSize';  // 排序字段
  sortOrder: 'asc' | 'desc';  // 排序方向
}

// Cloudinary上传响应接口
export interface CloudinaryUploadResponse {
  url: string;                // 文件访问URL
  public_id: string;          // Cloudinary公共ID
  secure_url: string;         // HTTPS访问URL
  resource_type: string;      // 资源类型
  format: string;             // 文件格式
  bytes: number;              // 文件大小
  created_at: string;         // 创建时间
}

// 文件上传结果接口
export interface UploadResult {
  success: boolean;           // 是否成功
  fileInfo?: FileInfo;        // 文件信息（成功时）
  error?: string;             // 错误信息（失败时）
}

// 批量操作结果接口
export interface BatchOperationResult {
  success: boolean;           // 是否成功
  successCount: number;       // 成功数量
  failedCount: number;        // 失败数量
  errors: string[];           // 错误列表
}

// 组件属性接口
export interface FileUploaderProps {
  onUploadComplete: (fileInfo: FileInfo) => void;  // 上传完成回调
  onUploadProgress?: (progress: UploadProgress) => void;  // 上传进度回调
  maxFileSize?: number;       // 最大文件大小（MB）
  acceptedTypes?: string[];   // 允许的文件类型
}

export interface FileListProps {
  files: FileInfo[];          // 文件列表
  onDelete: (fileId: string) => void;  // 删除文件回调
  onBatchDelete: (fileIds: string[]) => void;  // 批量删除回调
  loading?: boolean;          // 加载状态
}

export interface FileSearchSortProps {
  onFilterChange: (filters: FilterOptions) => void;  // 筛选条件变更回调
  totalCount: number;         // 文件总数
  filteredCount: number;      // 筛选后文件数
}