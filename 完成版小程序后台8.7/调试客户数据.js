// 调试客户数据 - 查看2小姐的具体数据结构
// 在客户管理页面的开发者工具Console中运行这段代码

console.log('=== 开始调试客户数据 ===');

// 获取当前页面实例
const currentPage = getCurrentPages()[getCurrentPages().length - 1];
console.log('当前页面:', currentPage.route);

if (currentPage.data && currentPage.data.customers) {
  const customers = currentPage.data.customers;
  console.log('客户总数:', customers.length);
  
  // 查找2小姐
  const target = customers.find(c => c.name && c.name.includes('2小姐'));
  if (target) {
    console.log('=== 找到2小姐，数据结构如下 ===');
    console.log('完整数据:', target);
    console.log('客户名称:', target.name);
    console.log('phone字段:', target.phone);
    console.log('contact字段:', target.contact);
    console.log('contacts字段类型:', typeof target.contacts);
    console.log('contacts字段内容:', target.contacts);
    
    if (target.contacts) {
      if (typeof target.contacts === 'string') {
        try {
          const parsed = JSON.parse(target.contacts);
          console.log('解析后的contacts:', parsed);
          if (parsed[0]) {
            console.log('第一个联系人姓名:', parsed[0].name);
            console.log('第一个联系人电话:', parsed[0].phone);
            console.log('姓名是否为空字符串:', parsed[0].name === '');
            console.log('姓名trim后:', `"${parsed[0].name ? parsed[0].name.trim() : ''}"`);
          }
        } catch (e) {
          console.log('解析contacts失败:', e);
        }
      } else if (Array.isArray(target.contacts)) {
        console.log('contacts是数组:', target.contacts);
        if (target.contacts[0]) {
          console.log('第一个联系人姓名:', target.contacts[0].name);
          console.log('第一个联系人电话:', target.contacts[0].phone);
          console.log('姓名是否为空字符串:', target.contacts[0].name === '');
          console.log('姓名trim后:', `"${target.contacts[0].name ? target.contacts[0].name.trim() : ''}"`);
        }
      }
    }
    
    // 模拟当前的显示逻辑
    console.log('=== 当前显示逻辑测试 ===');
    let displayContact = '未设置';
    
    if (target.contacts && target.contacts.length > 0 && target.contacts[0].name && target.contacts[0].name.trim()) {
      displayContact = target.contacts[0].name;
      console.log('使用contacts[0].name:', displayContact);
    } else if (target.contact && target.contact.trim()) {
      displayContact = target.contact;
      console.log('使用contact字段:', displayContact);
    } else if (target.phone || (target.contacts && target.contacts.length > 0 && target.contacts[0] && target.contacts[0].phone)) {
      displayContact = target.phone || target.contacts[0].phone;
      console.log('使用电话号码作为联系人:', displayContact);
    }
    
    console.log('最终显示的联系人:', displayContact);
  } else {
    console.log('未找到2小姐');
    // 显示所有客户名称
    console.log('所有客户名称:');
    customers.forEach((c, i) => {
      console.log(`${i}: ${c.name}`);
    });
  }
} else {
  console.log('无法获取客户数据');
} 