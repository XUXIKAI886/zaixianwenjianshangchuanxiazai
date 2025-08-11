import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SimpleToastProvider } from '@/components/ui/simple-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '呈尚策划 关键词描述文件上传下载中心',
  description: '呈尚策划专业关键词描述服务，支持拖拽上传文件，自动保存到云端，随时随地访问和分享',
  keywords: '呈尚策划,关键词描述,文件上传,文件下载,云存储,文件分享,在线传输',
  authors: [{ name: '呈尚策划' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <SimpleToastProvider>
          <main className="min-h-screen">
            {children}
          </main>
        </SimpleToastProvider>
        
        {/* 页脚 */}
        <footer className="border-t bg-white">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-gray-600">
              <p>© 2024 呈尚策划 关键词描述文件上传下载中心. 技术支持：Next.js + Cloudinary</p>
              <p className="mt-1">
                呈尚策划 • 专业关键词描述 • 安全快速的文件存储与分享
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}