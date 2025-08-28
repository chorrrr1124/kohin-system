// 快速修复优惠券数据不显示问题
console.log('🔧 开始修复优惠券数据问题...');

// 1. 强制重新初始化数据库
async function forceInitDatabase() {
  try {
    const app = window.cloudbase?.app || window.app;
    if (!app) {
      console.error('❌ 未找到CloudBase实例');
      return false;
    }
    
    console.log('🔧 调用initDatabase云函数...');
    const result = await app.callFunction({
      name: 'initDatabase',
      data: {}
    });
    
    console.log('✅ 数据库初始化成功:', result);
    return true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    return false;
  }
}

// 2. 强制刷新优惠券数据
async function forceRefreshCoupons() {
  try {
    const app = window.cloudbase?.app || window.app;
    if (!app) {
      console.error('❌ 未找到CloudBase实例');
      return;
    }
    
    const db = app.database();
    
    // 尝试多种查询方式
    console.log('🔍 尝试多种查询方式...');
    
    // 方式1：无条件查询
    const result1 = await db.collection('mall_coupons').get();
    console.log('✅ 无条件查询结果:', result1.data?.length || 0, '条数据');
    
    // 方式2：使用limit查询
    const result2 = await db.collection('mall_coupons').limit(10).get();
    console.log('✅ limit查询结果:', result2.data?.length || 0, '条数据');
    
    // 方式3：检查其他可能的集合名
    const collections = ['coupons', 'user_coupons', 'mall_coupons', 'coupon_templates'];
    
    for (const collectionName of collections) {
      try {
        const result = await db.collection(collectionName).limit(1).get();
        if (result.data && result.data.length > 0) {
          console.log(`🎉 在 ${collectionName} 集合中找到数据:`, result.data[0]);
          return result.data;
        }
      } catch (error) {
        console.log(`❌ ${collectionName} 集合查询失败:`, error.message);
      }
    }
    
    console.log('⚠️ 所有集合都没有找到数据');
    
  } catch (error) {
    console.error('❌ 强制刷新失败:', error);
  }
}

// 3. 检查并修复权限问题
async function checkAndFixPermissions() {
  try {
    const app = window.cloudbase?.app || window.app;
    if (!app) {
      console.error('❌ 未找到CloudBase实例');
      return;
    }
    
    const auth = app.auth();
    const loginState = await auth.getLoginState();
    
    if (!loginState || !loginState.isLoggedIn) {
      console.log('🔐 用户未登录，尝试匿名登录...');
      await auth.signInAnonymously();
      console.log('✅ 匿名登录成功');
    } else {
      console.log('✅ 用户已登录:', loginState.user?.uid);
    }
    
  } catch (error) {
    console.error('❌ 权限检查失败:', error);
  }
}

// 4. 主修复函数
async function mainFix() {
  console.log('🚀 开始执行主修复流程...');
  
  // 步骤1：检查权限
  await checkAndFixPermissions();
  
  // 步骤2：强制初始化数据库
  const initSuccess = await forceInitDatabase();
  
  // 步骤3：等待一下让数据库初始化完成
  if (initSuccess) {
    console.log('⏳ 等待数据库初始化完成...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 步骤4：强制刷新数据
  await forceRefreshCoupons();
  
  console.log('🎉 修复流程完成！');
  console.log('💡 如果问题仍然存在，请检查：');
  console.log('   1. 云开发控制台中的数据库权限设置');
  console.log('   2. 环境ID是否正确');
  console.log('   3. 云函数是否正确部署');
}

// 5. 执行修复
mainFix().catch(error => {
  console.error('❌ 修复过程中发生错误:', error);
});

// 6. 提供手动执行函数
window.fixCoupons = {
  initDatabase: forceInitDatabase,
  refreshData: forceRefreshCoupons,
  checkPermissions: checkAndFixPermissions,
  runAll: mainFix
};

console.log('🔧 修复脚本加载完成！');
console.log('💡 可以使用以下命令手动执行：');
console.log('   window.fixCoupons.runAll() - 执行完整修复');
console.log('   window.fixCoupons.initDatabase() - 只初始化数据库');
console.log('   window.fixCoupons.refreshData() - 只刷新数据'); 