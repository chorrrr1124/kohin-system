// 测试数据库连接和优惠券数据
// 在浏览器控制台中运行此脚本

console.log('🔍 开始测试数据库连接...');

// 1. 检查CloudBase实例
try {
  const app = window.cloudbase?.app || window.app;
  console.log('📱 CloudBase实例:', app);
  
  if (!app) {
    console.error('❌ 未找到CloudBase实例');
    return;
  }
  
  // 2. 检查数据库实例
  const db = app.database();
  console.log('📊 数据库实例:', db);
  
  if (!db) {
    console.error('❌ 未找到数据库实例');
    return;
  }
  
  // 3. 检查集合是否存在
  console.log('🔍 检查mall_coupons集合...');
  
  // 4. 尝试查询数据
  db.collection('mall_coupons')
    .limit(1)
    .get()
    .then(result => {
      console.log('✅ 查询成功:', result);
      console.log('📊 数据数量:', result.data?.length || 0);
      console.log('📝 数据内容:', result.data);
      
      if (result.data && result.data.length > 0) {
        console.log('🎉 找到优惠券数据！');
        console.log('📋 第一条数据:', result.data[0]);
      } else {
        console.log('⚠️ 集合存在但没有数据');
      }
    })
    .catch(error => {
      console.error('❌ 查询失败:', error);
      console.error('❌ 错误代码:', error.code);
      console.error('❌ 错误信息:', error.message);
      
      // 如果是集合不存在的错误
      if (error.code === 'DATABASE_COLLECTION_NOT_EXIST') {
        console.log('🔧 集合不存在，需要初始化数据库');
      }
    });
    
} catch (error) {
  console.error('❌ 测试过程中发生错误:', error);
}

// 5. 检查其他相关集合
console.log('🔍 检查其他相关集合...');

const collections = ['coupons', 'user_coupons', 'mall_coupons'];

collections.forEach(collectionName => {
  console.log(`🔍 检查 ${collectionName} 集合...`);
  
  try {
    const app = window.cloudbase?.app || window.app;
    if (app) {
      const db = app.database();
      db.collection(collectionName)
        .limit(1)
        .get()
        .then(result => {
          console.log(`✅ ${collectionName} 集合查询成功:`, result.data?.length || 0, '条数据');
        })
        .catch(error => {
          console.log(`❌ ${collectionName} 集合查询失败:`, error.message);
        });
    }
  } catch (error) {
    console.log(`❌ 检查 ${collectionName} 集合时出错:`, error.message);
  }
});

console.log('🔍 数据库测试完成，请查看上方输出结果'); 