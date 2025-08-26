// 自动发放优惠券云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 自动发放优惠券
 * 根据用户行为自动触发优惠券发放
 */
exports.main = async (event, context) => {
  const { action, userId, data } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    // 获取所有启用了自动发放的优惠券
    const { data: autoCoupons } = await db.collection('mall_coupons')
      .where({
        autoIssue: true,
        status: 'active'
      })
      .get();
    
    if (!autoCoupons || autoCoupons.length === 0) {
      return { success: true, message: '没有需要自动发放的优惠券' };
    }
    
    const issuedCoupons = [];
    
    for (const coupon of autoCoupons) {
      // 检查是否应该发放给当前用户
      if (await shouldIssueCoupon(coupon, action, userId, data, wxContext)) {
        // 检查用户是否已经拥有此优惠券
        const { data: existingCoupons } = await db.collection('user_coupons')
          .where({
            _openid: userId || wxContext.OPENID,
            couponId: coupon._id,
            status: { $in: ['unused', 'used'] }
          })
          .get();
        
        if (existingCoupons && existingCoupons.length > 0) {
          continue; // 用户已有此优惠券
        }
        
        // 发放优惠券
        const userCoupon = {
          _openid: userId || wxContext.OPENID,
          couponId: coupon._id,
          couponName: coupon.name,
          couponType: coupon.type,
          value: coupon.value,
          minAmount: coupon.minAmount,
          startTime: coupon.startTime,
          endTime: coupon.endTime,
          expireTime: coupon.endTime,
          status: 'unused',
          issuedAt: new Date(),
          createTime: new Date(),
          triggerAction: action, // 记录触发动作
          triggerData: data // 记录触发数据
        };
        
        await db.collection('user_coupons').add(userCoupon);
        issuedCoupons.push(coupon.name);
      }
    }
    
    return {
      success: true,
      issuedCoupons,
      message: issuedCoupons.length > 0 ? `成功发放${issuedCoupons.length}张优惠券` : '没有符合条件的优惠券'
    };
    
  } catch (error) {
    console.error('自动发放优惠券失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 判断是否应该发放优惠券
 */
async function shouldIssueCoupon(coupon, action, userId, data, wxContext) {
  const { issueRules, ruleDetails } = coupon;
  if (!issueRules) return false;
  
  const openid = userId || wxContext.OPENID;
  
  // 新用户注册
  if (issueRules.newUser && action === 'userRegister') {
    return true;
  }
  
  // 首次下单
  if (issueRules.firstOrder && action === 'firstOrder') {
    return true;
  }
  
  // 订单金额达标
  if (issueRules.orderAmount && action === 'orderCompleted') {
    const orderAmount = data.orderAmount || 0;
    const minAmount = ruleDetails.minOrderAmount || 0;
    return orderAmount >= minAmount;
  }
  
  // 订单数量达标
  if (issueRules.orderCount && action === 'orderCompleted') {
    const { data: userOrders } = await db.collection('mall_orders')
      .where({
        _openid: openid,
        status: 'completed'
      })
      .count();
    
    const minCount = ruleDetails.minOrderCount || 0;
    return userOrders.total >= minCount;
  }
  
  // 用户等级达标
  if (issueRules.userLevel && action === 'userLevelUp') {
    const { data: userInfo } = await db.collection('mall_users')
      .where({ _openid: openid })
      .get();
    
    if (userInfo && userInfo.length > 0) {
      const userLevel = userInfo[0].level || 'bronze';
      const requiredLevel = ruleDetails.userLevel || 'bronze';
      
      const levelOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
      return levelOrder[userLevel] >= levelOrder[requiredLevel];
    }
  }
  
  // 参与活动
  if (issueRules.activityParticipation && action === 'activityParticipate') {
    const activityName = data.activityName || '';
    const requiredActivity = ruleDetails.activityName || '';
    return activityName === requiredActivity;
  }
  
  // 推荐新用户
  if (issueRules.referral && action === 'userReferral') {
    const { data: referrals } = await db.collection('user_referrals')
      .where({
        referrerId: openid,
        status: 'completed'
      })
      .count();
    
    const requiredCount = ruleDetails.referralCount || 0;
    return referrals.total >= requiredCount;
  }
  
  // 生日当天
  if (issueRules.birthday && action === 'birthdayCheck') {
    const { data: userInfo } = await db.collection('mall_users')
      .where({ _openid: openid })
      .get();
    
    if (userInfo && userInfo.length > 0 && userInfo[0].birthday) {
      const today = new Date();
      const birthday = new Date(userInfo[0].birthday);
      return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
    }
  }
  
  // 注册周年
  if (issueRules.anniversary && action === 'anniversaryCheck') {
    const { data: userInfo } = await db.collection('mall_users')
      .where({ _openid: openid })
      .get();
    
    if (userInfo && userInfo.length > 0 && userInfo[0].createTime) {
      const today = new Date();
      const createTime = new Date(userInfo[0].createTime);
      const yearsDiff = today.getFullYear() - createTime.getFullYear();
      const monthsDiff = today.getMonth() - createTime.getMonth();
      const daysDiff = today.getDate() - createTime.getDate();
      
      return yearsDiff > 0 && monthsDiff === 0 && daysDiff === 0;
    }
  }
  
  // 自定义条件
  if (issueRules.customCondition && action === 'customCheck') {
    // 这里可以根据具体业务逻辑实现自定义条件判断
    return true; // 暂时返回true，实际使用时需要根据具体条件判断
  }
  
  return false;
} 