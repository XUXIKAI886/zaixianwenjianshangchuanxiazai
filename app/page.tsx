'use client';

import { FileManager } from '@/components/FileManager';
import { validateCloudinaryConfig } from '@/lib/cloudinary';
import { AlertCircle, Cloud } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [configValid, setConfigValid] = useState<boolean | null>(null);
  const [missingVars, setMissingVars] = useState<string[]>([]);

  useEffect(() => {
    // 检查Cloudinary配置
    const { isValid, missingVars: missing } = validateCloudinaryConfig();
    setConfigValid(isValid);
    setMissingVars(missing);
  }, []);

  // 如果配置无效，显示配置提示
  if (configValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                配置缺失
              </h1>
            </div>
            
            <p className="text-gray-600 mb-4">
              系统需要配置Cloudinary环境变量才能正常运行。
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-red-800 mb-2">缺失的环境变量:</h3>
              <ul className="list-disc list-inside text-sm text-red-700">
                {missingVars.map((varName) => (
                  <li key={varName}>{varName}</li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <h3 className="font-medium text-gray-900">配置步骤:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>访问 <a href="https://cloudinary.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Cloudinary官网</a> 注册账号</li>
                <li>在控制台获取 Cloud Name 和 API 密钥</li>
                <li>在项目根目录创建 .env.local 文件</li>
                <li>添加以下环境变量：
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret`}
                  </pre>
                </li>
                <li>重启开发服务器</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 加载中状态
  if (configValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Cloud className="h-12 w-12 text-blue-500 mx-auto animate-pulse mb-4" />
          <p className="text-gray-600">正在初始化系统...</p>
        </div>
      </div>
    );
  }

  // 正常渲染文件管理器
  return <FileManager />;
}