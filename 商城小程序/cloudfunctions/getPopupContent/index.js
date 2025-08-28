// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取弹窗内容
    const result = await db.collection('popupContent').doc('main').get()
    
    if (result.data) {
      return {
        success: true,
        data: result.data.content,
        message: '获取弹窗内容成功'
      }
    } else {
      // 如果没有数据，返回默认内容
      return {
        success: true,
        data: {
          brand: {
            name: '丘大叔柠檬茶',
            logo: '/images/general/148L.png'
          },
          privacy: {
            title: '温馨提示',
            greeting: '亲爱的用户，欢迎使用丘大叔柠檬茶小程序',
            agreementIntro: '我们依据相关法律法规制定了《丘大叔柠檬茶用户协议》和《丘大叔柠檬茶隐私协议》，请您在使用我们的产品前仔细阅读并充分理解相关条款，以了解您的权利。',
            necessaryInfo: '根据《常见类型移动互联网应用程序必要个人信息范围规定》，丘大叔柠檬茶小程序属于网上购物类，基本功能为"购买商品"，必要个人信息包括：注册用户移动电话号码；收货人姓名(名称)、地址、联系电话；支付时间、支付金额、支付渠道等支付信息。',
            minimalPrinciple: '我们严格遵循最小必要原则，在法律规定的必要信息范围内及与实现业务相关联的个人信息范围内处理个人信息。您可以通过《丘大叔柠檬茶用户隐私政策》了解我们处理您个人信息的情况，以及您所享有的相关权利。如您是未成年人，请您和您的监护人仔细阅读本政策，并在征得您的监护人授权同意的前提下使用我们的服务或向我们提供个人信息。',
            agreementScope: '您同意《丘大叔柠檬茶用户隐私政策》仅代表您已了解应用提供的功能，以及功能运行所需的必要个人信息，并不代表您已同意我们可以收集非必要个人信息，非必要个人信息会根据您的明确同意进行收集。',
            rejectButton: '拒绝',
            agreeButton: '同意'
          },
          benefit: {
            title: '注册福利',
            titlePrefix: '[新会员]',
            subTitle: '全新升级',
            newBadge: 'NEW',
            greeting: '欢迎加入丘大叔柠檬茶',
            benefitIntro: '新会员专享福利',
            benefitDetails: '21元优惠券包',
            benefitDescription: '包含多种优惠券，让您享受更多优惠',
            privacyNote: '我已阅读并同意《用户协议》和《隐私政策》',
            privacyDetail: '允许我们在必要场景下,合理使用您的个人信息,且阅读并同意《隐私条款》、《会员协议》等内容',
            loginButton: '手机号一键登录',
            skipButton: '暂时跳过'
          },
          phone: {
            title: '获取手机号',
            greeting: '申请获取并验证手机号',
            description: '为了提供更好的服务，我们需要获取您的手机号',
            currentPhone: '当前微信绑定号码',
            infoIcon: 'i',
            allowButton: '允许',
            rejectButton: '不允许',
            otherPhoneButton: '使用其它号码'
          }
        },
        message: '使用默认弹窗内容'
      }
    }
  } catch (error) {
    console.error('获取弹窗内容失败:', error)
    return {
      success: false,
      error: error.message,
      message: '获取弹窗内容失败'
    }
  }
} 