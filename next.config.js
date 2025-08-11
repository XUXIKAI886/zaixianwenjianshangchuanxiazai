/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/file-upload-download/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/file-upload-download' : '',
};

module.exports = nextConfig;