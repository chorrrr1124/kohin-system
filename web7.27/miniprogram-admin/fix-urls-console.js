// 在浏览器控制台中执行此脚本来修复图片URL
// 复制以下代码到浏览器控制台并执行

console.log('🔧 开始修复图片URL...');

// 获取所有图片元素
const imageElements = document.querySelectorAll('img[src*="mock-cdn.example.com"]');
console.log(`📊 找到 ${imageElements.length} 个需要修复的图片元素`);

// 修复每个图片元素
imageElements.forEach((img, index) => {
  const oldSrc = img.src;
  console.log(`🔍 处理第 ${index + 1} 个图片: ${oldSrc}`);
  
  // 从URL中提取文件名
  const fileName = oldSrc.split('/').pop();
  console.log(`📁 文件名: ${fileName}`);
  
  // 生成新的CloudBase URL
  const newSrc = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/${fileName}`;
  console.log(`✅ 新URL: ${newSrc}`);
  
  // 更新图片源
  img.src = newSrc;
  
  // 添加错误处理
  img.onerror = function() {
    console.log(`❌ 图片加载失败: ${newSrc}`);
    // 尝试其他可能的路径
    const altSrc = `https://636c-cloudbase-3g4w6lls8a5ce59b-1327524326.tcb.qcloud.la/images/general/${fileName}`;
    console.log(`🔄 尝试备用URL: ${altSrc}`);
    this.src = altSrc;
  };
  
  img.onload = function() {
    console.log(`✅ 图片加载成功: ${newSrc}`);
  };
});

console.log('🎯 图片URL修复完成！');

// 同时修复页面上的文本显示
const loadFailedElements = document.querySelectorAll('*:contains("加载失败")');
console.log(`📊 找到 ${loadFailedElements.length} 个"加载失败"元素`);

// 如果页面有"加载失败"的文本，尝试刷新
setTimeout(() => {
  console.log('🔄 尝试刷新页面...');
  window.location.reload();
}, 2000);
