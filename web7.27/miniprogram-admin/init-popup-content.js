// 弹窗内容数据库初始化脚本
const cloudbase = require('@cloudbase/node-sdk');

// 配置信息
const config = {
  env: 'cloudbase-3g4w6lls8a5ce59b', // 从web端界面看到的环境ID
  secretId: process.env.CLOUDBASE_SECRET_ID,
  secretKey: process.env.CLOUDBASE_SECRET_KEY
};

// 初始化CloudBase
const app = cloudbase.init(config);
const db = app.database();

// 弹窗内容数据
const popupContentData = {
  _id: 'main',
  content: {
    privacy: {
      title: '温馨提示',
      greeting: '亲爱的用户，欢迎使用丘大叔柠檬茶小程序',
      agreementIntro: '我们依据相关法律法规制定了《丘大叔柠檬茶用户协议》和《丘大叔柠檬茶隐私协议》，请您在使用我们的产品前仔细阅读并充分理解相关条款，以了解您的权利。',
      necessaryInfo: '根据《常见类型移动互联网应用程序必要个人信息范围规定》，丘大叔柠檬茶小程序属于网上购物类，基本功能为"购买商品"，必要个人信息包括：注册用户移动电话号码；收货人姓名（名称）、地址、联系电话；支付时间、支付金额、支付渠道等支付信息。',
      minimalPrinciple: '我们严格遵循最小必要原则，在法律规定的必要信息范围内及与实现业务相关联的个人信息范围内处理个人信息。您可以通过《丘大叔柠檬茶用户隐私政策》了解我们处理您个人信息的情况，以及您所享有的相关权利。如您是未成年人，请您和您的监护人仔细阅读本政策，并在征得您的监护人授权同意的前提下使用我们的服务或向我们提供个人信息。',
      agreementScope: '您同意《丘大叔柠檬茶用户隐私政策》仅代表您已了解应用提供的功能，以及功能运行所需的必要个人信息，并不代表您已同意我们可以收集非必要个人信息，非必要个人信息会根据您的明确同意进行收集。'
    },
    benefit: {
      title: '注册福利',
      greeting: '欢迎加入丘大叔柠檬茶',
      benefitIntro: '新会员专享福利',
      benefitDetails: '21元优惠券包',
      benefitDescription: '包含多种优惠券，让您享受更多优惠',
      privacyNote: '我已阅读并同意《用户协议》和《隐私政策》',
      loginButton: '手机号一键登录',
      skipButton: '暂时跳过'
    },
    phone: {
      title: '获取手机号',
      greeting: '申请获取并验证手机号',
      description: '为了提供更好的服务，我们需要获取您的手机号',
      currentPhone: '当前微信绑定号码',
      allowButton: '允许',
      rejectButton: '不允许',
      otherPhoneButton: '使用其它号码'
    }
  },
  updateTime: new Date().toISOString()
};

// 初始化函数
async function initPopupContent() {
  try {
    console.log('🚀 开始初始化弹窗内容数据库...');
    
    // 1. 检查集合是否存在
    console.log('📋 检查 popupContent 集合...');
    try {
      const collections = await db.listCollections();
      const collectionNames = collections.data.map(col => col.name);
      
      if (collectionNames.includes('popupContent')) {
        console.log('✅ popupContent 集合已存在');
      } else {
        console.log('❌ popupContent 集合不存在，需要创建');
      }
    } catch (error) {
      console.log('⚠️ 无法检查集合列表，可能权限不足');
    }
    
    // 2. 尝试创建或更新数据
    console.log('💾 保存弹窗内容数据...');
    
    try {
      // 先尝试获取现有数据
      const existingData = await db.collection('popupContent').doc('main').get();
      
      if (existingData.data && existingData.data.length > 0) {
        // 更新现有数据
        console.log('📝 更新现有弹窗内容...');
        const result = await db.collection('popupContent').doc('main').update({
          content: popupContentData.content,
          updateTime: popupContentData.updateTime
        });
        console.log('✅ 弹窗内容更新成功');
        console.log('📊 更新结果:', result);
      } else {
        // 创建新数据
        console.log('🆕 创建新的弹窗内容...');
        const result = await db.collection('popupContent').add(popupContentData);
        console.log('✅ 弹窗内容创建成功');
        console.log('📊 创建结果:', result);
      }
    } catch (error) {
      console.log('❌ 保存数据失败:', error.message);
      
      // 尝试使用 set 方法
      try {
        console.log('🔄 尝试使用 set 方法...');
        const result = await db.collection('popupContent').doc('main').set(popupContentData);
        console.log('✅ 使用 set 方法成功');
        console.log('📊 结果:', result);
      } catch (setError) {
        console.log('❌ set 方法也失败:', setError.message);
        throw setError;
      }
    }
    
    // 3. 验证数据是否保存成功
    console.log('🔍 验证数据保存结果...');
    try {
      const savedData = await db.collection('popupContent').doc('main').get();
      if (savedData.data && savedData.data.length > 0) {
        const data = savedData.data[0];
        console.log('✅ 数据验证成功');
        console.log('📅 更新时间:', data.updateTime);
        console.log('🔢 弹窗数量:', Object.keys(data.content).length);
        console.log('📋 弹窗类型:', Object.keys(data.content).join(', '));
      } else {
        console.log('❌ 数据验证失败：未找到保存的数据');
      }
    } catch (error) {
      console.log('❌ 数据验证失败:', error.message);
    }
    
    console.log('\n🎉 弹窗内容数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    console.error('错误详情:', error.stack);
    
    // 提供故障排除建议
    console.log('\n🔧 故障排除建议:');
    console.log('1. 检查环境ID是否正确');
    console.log('2. 确认API密钥是否有效');
    console.log('3. 检查数据库权限设置');
    console.log('4. 确认网络连接正常');
  }
}

// 测试连接函数
async function testConnection() {
  try {
    console.log('🔗 测试数据库连接...');
    
    // 尝试获取数据库信息
    const collections = await db.listCollections();
    console.log('✅ 数据库连接成功');
    console.log('📊 集合数量:', collections.data.length);
    console.log('📋 集合列表:', collections.data.map(col => col.name));
    
    return true;
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('=== 弹窗内容数据库初始化工具 ===');
  console.log('环境ID:', config.env);
  console.log('时间:', new Date().toLocaleString());
  console.log('');
  
  // 检查环境变量
  if (!config.secretId || !config.secretKey) {
    console.log('⚠️ 警告: 未设置 CLOUDBASE_SECRET_ID 或 CLOUDBASE_SECRET_KEY');
    console.log('请设置环境变量或直接在代码中配置密钥');
    console.log('');
  }
  
  // 测试连接
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ 无法连接到数据库，请检查配置');
    return;
  }
  
  // 初始化数据
  await initPopupContent();
  
  console.log('\n=== 初始化完成 ===');
  console.log('现在可以在web端和小程序中测试弹窗内容管理功能了！');
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

// 导出函数供其他模块使用
module.exports = {
  initPopupContent,
  testConnection,
  popupContentData
}; 