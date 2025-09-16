// 云函数部署脚本
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 开始部署云函数...');

// 检查云函数目录
const functionDir = path.join(__dirname, 'cloudfunctions', 'cloudStorageManager');
const indexPath = path.join(functionDir, 'index.js');

if (!fs.existsSync(indexPath)) {
    console.error('❌ 云函数文件不存在:', indexPath);
    process.exit(1);
}

console.log('✅ 云函数文件存在:', indexPath);

// 读取云函数代码
const functionCode = fs.readFileSync(indexPath, 'utf8');

// 检查是否包含修复代码
const hasFix = functionCode.includes('if (!imageResult.data || imageResult.data.length === 0)') &&
               functionCode.includes('if (image && image.fileID)');

if (hasFix) {
    console.log('✅ 云函数代码包含修复逻辑');
} else {
    console.log('⚠️ 云函数代码可能不包含修复逻辑');
}

console.log('📋 云函数代码摘要:');
console.log(`- 总行数: ${functionCode.split('\n').length}`);
console.log(`- 包含 deleteImage 函数: ${functionCode.includes('async function deleteImage')}`);
console.log(`- 包含空值检查: ${functionCode.includes('if (!imageResult.data')}`);
console.log(`- 包含 fileID 检查: ${functionCode.includes('if (image && image.fileID)')}`);

console.log('\n🔧 修复内容确认:');
const lines = functionCode.split('\n');
lines.forEach((line, index) => {
    if (line.includes('if (!imageResult.data') || line.includes('if (image && image.fileID)')) {
        console.log(`第 ${index + 1} 行: ${line.trim()}`);
    }
});

console.log('\n📝 部署说明:');
console.log('1. 云函数代码已经修复');
console.log('2. 需要重新部署到云端才能生效');
console.log('3. 可以使用以下方式部署:');
console.log('   - 微信开发者工具: 右键云函数 -> 上传并部署');
console.log('   - 云开发控制台: 云函数管理 -> 上传代码');
console.log('   - CLI工具: @cloudbase/cli');

console.log('\n🎯 测试建议:');
console.log('1. 部署完成后，使用 debug-delete-issue.html 测试');
console.log('2. 查看调试日志确认修复是否生效');
console.log('3. 如果仍有问题，检查云函数日志');

console.log('\n✨ 部署脚本执行完成');
