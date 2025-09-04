#!/bin/bash

# COS图片管理功能部署脚本

echo "🚀 开始部署COS图片管理功能..."

# 检查是否在正确的目录
if [ ! -f "app.js" ]; then
    echo "❌ 请在商城小程序根目录下运行此脚本"
    exit 1
fi

echo "📁 当前目录: $(pwd)"

# 1. 部署getCosImages云函数
echo "📦 部署getCosImages云函数..."
if [ -d "cloudfunctions/getCosImages" ]; then
    echo "✅ getCosImages云函数目录已存在"
    echo "请在微信开发者工具中右键 cloudfunctions/getCosImages 选择'上传并部署：云端安装依赖'"
else
    echo "❌ getCosImages云函数目录不存在"
    exit 1
fi

# 2. 检查工具类文件
echo "🔧 检查工具类文件..."
if [ -f "utils/cosImageService.js" ]; then
    echo "✅ cosImageService.js 已存在"
else
    echo "❌ cosImageService.js 不存在"
    exit 1
fi

# 3. 检查示例页面
echo "📱 检查示例页面..."
if [ -d "pages/cos-images" ]; then
    echo "✅ cos-images示例页面已存在"
else
    echo "❌ cos-images示例页面不存在"
    exit 1
fi

# 4. 更新app.json（如果需要）
echo "📝 检查app.json配置..."
if grep -q "cos-images" app.json; then
    echo "✅ cos-images页面已在app.json中配置"
else
    echo "⚠️  请手动在app.json的pages数组中添加 'pages/cos-images/cos-images'"
fi

echo ""
echo "🎉 部署准备完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 在微信开发者工具中部署 getCosImages 云函数"
echo "2. 在app.json中添加 cos-images 页面路径（如果还没有）"
echo "3. 在Web端上传一些测试图片到COS"
echo "4. 在小程序中测试图片获取功能"
echo ""
echo "🔗 相关文档："
echo "- COS图片管理使用说明.md"
echo "- 云函数部署指南.md"
echo ""
echo "✨ 部署完成后，可以通过以下方式测试："
echo "- 在小程序中访问 cos-images 页面"
echo "- 查看是否能正确获取和显示COS中的图片"
