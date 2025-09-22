const fs = require('fs');

// 读取文件
let content = fs.readFileSync('src/pages/UsersPage.jsx', 'utf8');

// 更新 getCustomerNatureDisplay 函数
const newFunction = `  // 获取客户性质的显示文本
  const getCustomerNatureDisplay = (customer) => {
    // 直接使用数据库中的 nature 字段，因为已经通过云函数统一更新
    return customer.nature || customer.type || "零售客户";
  };`;

// 替换函数
content = content.replace(
  /\/\/ 获取客户性质的显示文本[\s\S]*?return customer\.nature \|\| customer\.type \|\| "零售客户";\s*};/,
  newFunction
);

// 写回文件
fs.writeFileSync('src/pages/UsersPage.jsx', content);

console.log('✅ 已更新客户类型显示逻辑');
