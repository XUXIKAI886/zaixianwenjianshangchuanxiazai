/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/zaixianwenjianshangchuanxiazai/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/zaixianwenjianshangchuanxiazai' : '',
  
  // 在静态导出模式中，确保环境变量被嵌入到构建中
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  },
};

module.exports = nextConfig;