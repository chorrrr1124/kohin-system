#!/bin/bash

echo "🚀 开始部署 Kohin 商城系统..."

# 检查 Node.js 版本
echo "📋 检查环境..."
node --version
npm --version

# 部署云函数
echo "🔧 部署云函数..."
cd cloudfunctions/getCosSts
npm install
cd ../uploadImageToCos
npm install
cd ../..

# 构建 Web 端
echo "🌐 构建 Web 端后台..."
cd web7.27/miniprogram-admin
npm install
npm run build
cd ../..

# 安装小程序依赖
echo "📱 准备小程序项目..."
cd 商城小程序
npm install
cd ../完成版小程序后台8.7
npm install
cd ../..

echo "✅ 部署准备完成！"
echo ""
echo "📋 下一步操作："
echo "1. 使用微信开发者工具打开小程序项目进行部署"
echo "2. 使用云开发CLI部署云函数和静态网站"
echo "3. 配置云开发环境变量"
echo ""
echo "�� 详细文档请查看 README.md" 