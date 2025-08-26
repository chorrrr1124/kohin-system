// 定时检查优惠券发放条件云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 定时检查优惠券发放条件
 * 主要用于检查生日、周年等时间相关的条件
 */
exports.main = async (event, context) => {
  try {
    console.log('开始定时检查优惠券发放条件...');
    
    // 获取所有启用了自动发放的优惠券
    const { data: autoCoupons } = await db.collection('mall_coupons')
      .where({
        autoIssue: true,
        status: 'active'
      })
      .get();
    
    if (!autoCoupons || autoCoupons.length === 0) {
      console.log('没有需要自动发放的优惠券');
      return { success: true, message: '没有需要自动发放的优惠券' };
    }
    
    let totalIssued = 0;
    
    for (const coupon of autoCoupons) {
      const { issueRules } = coupon;
      if (!issueRules) continue;
      
      // 检查生日条件
      if (issueRules.birthday) {
        const birthdayIssued = await checkBirthdayCoupons(coupon);
        totalIssued += birthdayIssued;
      }
      
      // 检查周年条件
      if (issueRules.anniversary) {
        const anniversaryIssued = await checkAnniversaryCoupons(coupon);
        totalIssued += anniversaryIssued;
      }
    }
    
    console.log(`定时检查完成，共发放${totalIssued}张优惠券`);
    
    return {
      success: true,
      totalIssued,
      message: `定时检查完成，共发放${totalIssued}张优惠券`
    };
    
  } catch (error) {
    console.error('定时检查优惠券发放条件失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 检查生日优惠券发放
 */
async function checkBirthdayCoupons(coupon) {
  try {
    const today = new Date();
    const month = today.getMonth() + 1; // getMonth() 返回 0-11
    const day = today.getDate();
    
    // 获取今天生日的用户
    const { data: birthdayUsers } = await db.collection('mall_users')
      .where({
        birthday: db.RegExp({
          regexp: `.*-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}.*`,
          options: 'i'
        })
      })
      .get();
    
    if (!birthdayUsers || birthdayUsers.length === 0) {
      return 0;
    }
    
    let issuedCount = 0;
    
    for (const user of birthdayUsers) {
      // 检查用户是否已经拥有此优惠券
      const { data: existingCoupons } = await db.collection('user_coupons')
        .where({
          _openid: user._openid,
          couponId: coupon._id,
          status: { $in: ['unused', 'used'] }
        })
        .get();
      
      if (existingCoupons && existingCoupons.length > 0) {
        continue; // 用户已有此优惠券
      }
      
      // 发放生日优惠券
      const userCoupon = {
        _openid: user._openid,
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
        triggerAction: 'birthdayCheck',
        triggerData: { 
          birthday: user.birthday,
          checkDate: today.toISOString()
        }
      };
      
      await db.collection('user_coupons').add(userCoupon);
      issuedCount++;
      
      console.log(`为用户 ${user._openid} 发放生日优惠券: ${coupon.name}`);
    }
    
    return issuedCount;
    
  } catch (error) {
    console.error('检查生日优惠券失败:', error);
    return 0;
  }
}

/**
 * 检查周年优惠券发放
 */
async function checkAnniversaryCoupons(coupon) {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    // 获取所有用户
    const { data: allUsers } = await db.collection('mall_users').get();
    
    if (!allUsers || allUsers.length === 0) {
      return 0;
    }
    
    let issuedCount = 0;
    
    for (const user of allUsers) {
      if (!user.createTime) continue;
      
      const createTime = new Date(user.createTime);
      const createYear = createTime.getFullYear();
      const createMonth = createTime.getMonth() + 1;
      const createDay = createTime.getDate();
      
      // 检查是否是注册周年
      const yearsDiff = currentYear - createYear;
      if (yearsDiff > 0 && currentMonth === createMonth && currentDay === createDay) {
        // 检查用户是否已经拥有此优惠券
        const { data: existingCoupons } = await db.collection('user_coupons')
          .where({
            _openid: user._openid,
            couponId: coupon._id,
            status: { $in: ['unused', 'used'] }
          })
          .get();
        
        if (existingCoupons && existingCoupons.length > 0) {
          continue; // 用户已有此优惠券
        }
        
        // 发放周年优惠券
        const userCoupon = {
          _openid: user._openid,
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
          triggerAction: 'anniversaryCheck',
          triggerData: { 
            originalCreateTime: user.createTime,
            anniversaryYear: yearsDiff,
            checkDate: today.toISOString()
          }
        };
        
        await db.collection('user_coupons').add(userCoupon);
        issuedCount++;
        
        console.log(`为用户 ${user._openid} 发放${yearsDiff}周年优惠券: ${coupon.name}`);
      }
    }
    
    return issuedCount;
    
  } catch (error) {
    console.error('检查周年优惠券失败:', error);
    return 0;
  }
} 