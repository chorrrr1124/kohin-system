// 创建弹窗内容集合的简单脚本
// 这个脚本使用web端的配置来创建数据库集合

console.log('=== 弹窗内容集合创建工具 ===');

// 弹窗内容数据结构
const popupContentStructure = {
  collectionName: 'popupContent',
  documentId: 'main',
  data: {
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
  }
};

console.log('📋 集合信息:');
console.log('集合名称:', popupContentStructure.collectionName);
console.log('文档ID:', popupContentStructure.documentId);
console.log('弹窗类型:', Object.keys(popupContentStructure.data.content).join(', '));
console.log('');

console.log('🔧 创建步骤:');
console.log('1. 在CloudBase控制台中创建集合');
console.log('2. 在web端保存弹窗内容');
console.log('3. 测试小程序弹窗功能');
console.log('');

console.log('📝 详细操作说明:');
console.log('');
console.log('步骤1: 创建数据库集合');
console.log('1. 登录腾讯云CloudBase控制台');
console.log('2. 选择环境: cloudbase-3g4w6lls8a5ce59b');
console.log('3. 进入"数据库" → "集合管理"');
console.log('4. 点击"新建集合"');
console.log('5. 集合名称输入: popupContent');
console.log('6. 权限设置选择: "仅创建者可读写"');
console.log('7. 点击"确定"创建集合');
console.log('');

console.log('步骤2: 在web端保存弹窗内容');
console.log('1. 打开web端管理系统');
console.log('2. 进入"弹窗内容管理"页面');
console.log('3. 编辑三个弹窗的文本内容');
console.log('4. 点击"保存内容"按钮');
console.log('5. 确认显示"保存成功"提示');
console.log('');

console.log('步骤3: 测试小程序功能');
console.log('1. 部署getPopupContent云函数');
console.log('2. 在小程序中测试弹窗显示');
console.log('3. 验证内容是否正确同步');
console.log('');

console.log('📊 数据结构预览:');
console.log(JSON.stringify(popupContentStructure.data, null, 2));
console.log('');

console.log('⚠️ 注意事项:');
console.log('1. 确保环境ID正确: cloudbase-3g4w6lls8a5ce59b');
console.log('2. 集合名称必须完全匹配: popupContent');
console.log('3. 文档ID必须为: main');
console.log('4. 权限设置建议选择"仅创建者可读写"');
console.log('');

console.log('🔍 故障排除:');
console.log('如果集合创建失败，可能的原因:');
console.log('- 环境ID不正确');
console.log('- 没有创建集合的权限');
console.log('- 网络连接问题');
console.log('- 控制台访问受限');
console.log('');

console.log('📞 获取帮助:');
console.log('1. 检查CloudBase控制台权限');
console.log('2. 联系系统管理员');
console.log('3. 查看CloudBase官方文档');
console.log('');

console.log('=== 集合创建说明完成 ===');
console.log('请按照上述步骤在CloudBase控制台中创建集合！'); 