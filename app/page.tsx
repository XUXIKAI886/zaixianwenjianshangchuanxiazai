'use client';

import { FileManager } from '@/components/FileManager';
import { ConfigGuide } from '@/components/ConfigGuide';
import { validateCloudinaryConfig } from '@/lib/cloudinary';
import { Cloud } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [configValid, setConfigValid] = useState<boolean | null>(null);
  const [missingVars, setMissingVars] = useState<string[]>([]);

  const checkConfig = () => {
    // 检查Cloudinary配置
    const { isValid, missingVars: missing } = validateCloudinaryConfig();
    setConfigValid(isValid);
    setMissingVars(missing);
  };

  useEffect(() => {
    checkConfig();
  }, []);

  // 如果配置无效，显示配置引导页面
  if (configValid === false) {
    return <ConfigGuide missingVars={missingVars} onRetry={checkConfig} />;
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