'use client';

import React from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Copy } from 'lucide-react';

interface ConfigGuideProps {
  missingVars: string[];
  onRetry: () => void;
}

export function ConfigGuide({ missingVars, onRetry }: ConfigGuideProps) {
  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板！');
      }).catch(() => {
        alert('复制失败，请手动复制');
      });
    } else {
      // 对于不支持 Clipboard API 的浏览器
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('已复制到剪贴板！');
      } catch (err) {
        alert('复制失败，请手动复制');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">配置缺失</h1>
          <p className="text-gray-600">
            系统需要配置Cloudinary环境变量才能正常运行。
          </p>
        </div>

        {/* 缺失的环境变量 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">缺失的环境变量:</h3>
          <div className="space-y-2">
            {missingVars.map((varName, index) => (
              <div key={index} className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <code className="bg-red-50 px-2 py-1 rounded text-sm">{varName}</code>
              </div>
            ))}
          </div>
        </div>

        {/* 配置步骤 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">配置步骤:</h3>
          <div className="space-y-6">
            
            {/* 步骤1 */}
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-4">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">访问 Cloudinary官网 注册账号</h4>
                <a 
                  href="https://cloudinary.com/users/register/free" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  前往注册 <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>

            {/* 步骤2 */}
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-4">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">在控制台获取 Cloud Name 和 API 密钥</h4>
                <p className="text-gray-600 text-sm mb-2">
                  登录后进入 Dashboard，在右上角可以找到：
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Cloud Name: 您的云名称（如：dgar33q4s）</li>
                  <li>• API Key: API密钥</li>
                </ul>
              </div>
            </div>

            {/* 步骤3 */}
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-4">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">在GitHub仓库中设置Secrets</h4>
                <p className="text-gray-600 text-sm mb-3">
                  访问您的GitHub仓库设置页面：
                </p>
                <div className="space-y-2 mb-3">
                  <a 
                    href="https://github.com/XUXIKAI886/zaixianwenjianshangchuanxiazai/settings/secrets/actions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    前往仓库Secrets设置 <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
                <p className="text-gray-600 text-sm mb-3">点击 "New repository secret" 分别添加以下变量：</p>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm font-medium">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</div>
                        <div className="text-xs text-gray-500">值：您的Cloud Name</div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME')}
                        className="text-gray-400 hover:text-gray-600"
                        title="复制变量名"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm font-medium">NEXT_PUBLIC_CLOUDINARY_API_KEY</div>
                        <div className="text-xs text-gray-500">值：您的API Key</div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard('NEXT_PUBLIC_CLOUDINARY_API_KEY')}
                        className="text-gray-400 hover:text-gray-600"
                        title="复制变量名"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 步骤4 */}
            <div className="flex">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-4">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">创建Cloudinary上传预设</h4>
                <p className="text-gray-600 text-sm mb-2">
                  在Cloudinary控制台中：
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4 mb-3">
                  <li>• 进入 Settings → Upload → Upload presets</li>
                  <li>• 创建名为 <code className="bg-gray-100 px-1 rounded">upload-preset</code> 的预设</li>
                  <li>• 设置为 <strong>Unsigned</strong> 模式</li>
                  <li>• 保存预设</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 重要提示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">重要提示</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 配置完成后，GitHub Actions会自动重新部署（需要2-5分钟）</li>
                <li>• 变量名必须完全匹配（区分大小写）</li>
                <li>• 预设名称必须为 <code>upload-preset</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            我已完成配置，重新检查
          </button>
          <a
            href="https://github.com/XUXIKAI886/zaixianwenjianshangchuanxiazai/settings/secrets/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 inline-flex items-center"
          >
            前往配置 <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
}