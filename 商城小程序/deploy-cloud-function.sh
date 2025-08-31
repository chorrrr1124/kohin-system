#!/bin/bash

echo "🚀 开始部署云函数..."

# 进入云函数目录
cd cloudfunctions/decryptPhoneNumber

echo "📦 安装依赖..."
npm install

echo "🔧 检查配置文件..."
if [ -f "config.json" ]; then
    echo "✅ 权限配置文件存在"
    cat config.json
else
    echo "❌ 权限配置文件不存在"
    exit 1
fi

echo "📝 检查云函数代码..."
if [ -f "index.js" ]; then
    echo "✅ 云函数代码存在"
else
    echo "❌ 云函数代码不存在"
    exit 1
fi

echo "✅ 云函数准备完成"
echo ""
echo "📋 部署说明："
echo "1. 在微信开发者工具中打开项目"
echo "2. 右键点击 cloudfunctions/decryptPhoneNumber 文件夹"
echo "3. 选择 '上传并部署：云端安装依赖'"
echo "4. 等待部署完成"
echo ""
echo "🔍 部署后检查："
echo "1. 在云开发控制台查看云函数是否部署成功"
echo "2. 检查云函数权限配置是否正确"
echo "3. 测试手机号获取功能"
echo ""
echo "📞 如果仍有问题，请检查："
echo "- 云开发环境ID是否正确"
echo "- 小程序是否已开通手机号快速验证功能"
echo "- 云函数是否具有微信API调用权限" 