/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel部署配置
  images: {
    unoptimized: true,
  },
  
  // 确保环境变量正确传递
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  },
  
  // 优化构建
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;