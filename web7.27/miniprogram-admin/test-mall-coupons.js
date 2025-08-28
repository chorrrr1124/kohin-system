// 测试mall_coupons集合数据获取
import { app, ensureLogin, getDatabase } from './src/utils/cloudbase.js';

async function testMallCoupons() {
  console.log('🧪 开始测试mall_coupons集合数据获取...');
  
  try {
    // 1. 确保登录
    console.log('🔐 确保登录...');
    const loginState = await ensureLogin();
    console.log('✅ 登录状态:', loginState);
    
    // 2. 获取数据库实例
    console.log('📊 获取数据库实例...');
    const db = getDatabase();
    console.log('✅ 数据库实例:', db);
    
    // 3. 查询mall_coupons集合
    console.log('🔍 查询mall_coupons集合...');
    const result = await db.collection('mall_coupons').get();
    console.log('📋 查询结果:', result);
    console.log('📊 数据数量:', result.data?.length || 0);
    
    if (result.data && result.data.length > 0) {
      console.log('📝 第一条数据:');
      console.log(JSON.stringify(result.data[0], null, 2));
      
      // 4. 测试排序查询
      console.log('🔍 测试排序查询...');
      const sortedResult = await db.collection('mall_coupons')
        .orderBy('createTime', 'desc')
        .get();
      console.log('📋 排序查询结果数量:', sortedResult.data?.length || 0);
      
      // 5. 测试条件查询
      console.log('🔍 测试条件查询...');
      const activeResult = await db.collection('mall_coupons')
        .where({
          status: 'active'
        })
        .get();
      console.log('📋 生效中优惠券数量:', activeResult.data?.length || 0);
      
    } else {
      console.log('⚠️ mall_coupons集合中没有数据');
      
      // 6. 检查集合是否存在
      console.log('🔍 检查集合是否存在...');
      try {
        const countResult = await db.collection('mall_coupons').count();
        console.log('📊 集合存在，文档总数:', countResult.total);
      } catch (countError) {
        console.log('❌ 集合不存在或无法访问:', countError.message);
      }
    }
    
    // 7. 测试其他相关集合
    console.log('🔍 测试其他相关集合...');
    const collections = ['coupons', 'user_coupons', 'users'];
    
    for (const collection of collections) {
      try {
        const testResult = await db.collection(collection).count();
        console.log(`✅ ${collection}集合存在，文档数: ${testResult.total}`);
      } catch (error) {
        console.log(`❌ ${collection}集合不存在: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('❌ 错误代码:', error.code);
    console.error('❌ 错误信息:', error.message);
  }
}

// 运行测试
testMallCoupons().then(() => {
  console.log('🏁 测试完成');
}).catch(error => {
  console.error('💥 测试异常:', error);
}); 