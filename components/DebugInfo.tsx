'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function DebugInfo() {
  const [showDebug, setShowDebug] = useState(false);

  const envVars = {
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME': process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '未设置',
    'NEXT_PUBLIC_CLOUDINARY_API_KEY': process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '未设置',
    'NODE_ENV': process.env.NODE_ENV || '未知',
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        {showDebug ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
        {showDebug ? '隐藏' : '显示'} 调试信息
      </button>
      
      {showDebug && (
        <div className="mt-3 p-3 bg-gray-50 rounded border text-xs">
          <h4 className="font-medium text-gray-700 mb-2">环境变量状态:</h4>
          <div className="space-y-1 font-mono">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}:</span>
                <span className={value === '未设置' ? 'text-red-600' : 'text-green-600'}>
                  {value === '未设置' ? '❌ 未设置' : '✅ 已设置'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-gray-600">
            <p>• 如果显示"已设置"但仍提示配置缺失，可能是GitHub Actions构建问题</p>
            <p>• 请检查GitHub Secrets是否正确配置，名称需完全匹配</p>
            <p>• 配置后需等待2-5分钟重新部署</p>
          </div>
        </div>
      )}
    </div>
  );
}