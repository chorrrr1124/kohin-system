// 深入诊断数据库问题
console.log('🔍 开始深入诊断数据库问题...');

// 1. 检查当前环境配置
try {
  const app = window.cloudbase?.app || window.app;
  console.log('📱 CloudBase实例:', app);
  
  if (!app) {
    console.error('❌ 未找到CloudBase实例');
    return;
  }
  
  // 2. 检查环境ID
  const envId = app.config?.env || '未知';
  console.log('🌍 当前环境ID:', envId);
  
  // 3. 检查登录状态
  const auth = app.auth();
  auth.getLoginState().then(loginState => {
    console.log('👤 登录状态:', loginState);
    
    if (loginState && loginState.isLoggedIn) {
      console.log('✅ 用户已登录');
      console.log('🆔 用户ID:', loginState.user?.uid);
      console.log('🔐 登录类型:', loginState.user?.isAnonymous ? '匿名' : '实名');
    } else {
      console.log('❌ 用户未登录');
    }
  }).catch(error => {
    console.error('❌ 获取登录状态失败:', error);
  });
  
  // 4. 尝试列出所有集合
  console.log('🔍 尝试列出所有集合...');
  const db = app.database();
  
  // 5. 检查mall_coupons集合的详细信息
  console.log('🔍 检查mall_coupons集合详细信息...');
  
  // 尝试获取集合的统计信息
  db.collection('mall_coupons')
    .count()
    .then(result => {
      console.log('📊 mall_coupons集合统计:', result);
      console.log('🔢 总记录数:', result.total);
    })
    .catch(error => {
      console.error('❌ 获取集合统计失败:', error);
      console.error('❌ 错误代码:', error.code);
      console.error('❌ 错误信息:', error.message);
    });
  
  // 6. 尝试不同的查询方式
  console.log('🔍 尝试不同的查询方式...');
  
  // 方式1：不带任何条件的查询
  db.collection('mall_coupons')
    .get()
    .then(result => {
      console.log('✅ 无条件查询成功:', result);
      console.log('📊 数据数量:', result.data?.length || 0);
    })
    .catch(error => {
      console.error('❌ 无条件查询失败:', error);
    });
  
  // 方式2：尝试查询其他可能存在的集合
  const possibleCollections = ['coupons', 'user_coupons', 'mall_coupons', 'coupon_templates'];
  
  possibleCollections.forEach(collectionName => {
    console.log(`🔍 检查集合: ${collectionName}`);
    
    db.collection(collectionName)
      .limit(1)
      .get()
      .then(result => {
        console.log(`✅ ${collectionName} 查询成功:`, result.data?.length || 0, '条数据');
        if (result.data && result.data.length > 0) {
          console.log(`📝 ${collectionName} 第一条数据:`, result.data[0]);
        }
      })
      .catch(error => {
        console.log(`❌ ${collectionName} 查询失败:`, error.message);
      });
  });
  
  // 7. 检查云函数调用
  console.log('🔍 尝试调用initDatabase云函数...');
  
  app.callFunction({
    name: 'initDatabase',
    data: {}
  }).then(result => {
    console.log('✅ initDatabase云函数调用成功:', result);
  }).catch(error => {
    console.error('❌ initDatabase云函数调用失败:', error);
  });
  
} catch (error) {
  console.error('❌ 诊断过程中发生错误:', error);
}

console.log('🔍 深入诊断完成，请查看上方输出结果'); 