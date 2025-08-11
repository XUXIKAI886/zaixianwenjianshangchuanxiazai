import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // 验证环境变量
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
        !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Cloudinary配置缺失' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { publicId, fileType } = body;

    if (!publicId) {
      return NextResponse.json(
        { error: '缺少必要参数：publicId' },
        { status: 400 }
      );
    }

    // 根据文件类型确定资源类型
    const getResourceType = (fileType?: string): string => {
      if (!fileType) return 'raw';
      if (fileType.startsWith('image/')) return 'image';
      if (fileType.startsWith('video/')) return 'video';
      return 'raw';
    };

    const resourceType = getResourceType(fileType);

    // 从Cloudinary删除文件
    try {
      const result = await cloudinary.uploader.destroy(publicId, { 
        resource_type: resourceType as any
      });

      // 检查删除结果
      if (result.result === 'ok') {
        return NextResponse.json({ 
          success: true, 
          message: '文件删除成功' 
        });
      } else if (result.result === 'not found') {
        return NextResponse.json({ 
          success: true, 
          message: '文件不存在（可能已被删除）' 
        });
      } else {
        return NextResponse.json(
          { error: `删除失败：${result.result}` },
          { status: 400 }
        );
      }
    } catch (cloudinaryError: any) {
      console.error('Cloudinary删除失败:', cloudinaryError);
      return NextResponse.json(
        { error: `Cloudinary错误：${cloudinaryError.message || '未知错误'}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('删除文件API错误:', error);
    return NextResponse.json(
      { error: error.message || '删除文件失败' },
      { status: 500 }
    );
  }
}

// 支持预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}