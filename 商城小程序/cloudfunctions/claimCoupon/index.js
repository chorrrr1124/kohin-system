// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const { couponId, condition } = event
    
    if (!OPENID) {
      return {
        success: false,
        message: '用户未登录'
      }
    }
    
    if (!couponId) {
      return {
        success: false,
        message: '优惠券ID不能为空'
      }
    }
    
    // 检查优惠券是否存在且有效
    const couponResult = await db.collection('mall_coupons')
      .doc(couponId)
      .get()
    
    if (!couponResult.data || couponResult.data.length === 0) {
      return {
        success: false,
        message: '优惠券不存在'
      }
    }
    
    const coupon = couponResult.data[0]
    
    // 检查优惠券状态
    if (coupon.status !== 'active') {
      return {
        success: false,
        message: '优惠券已失效'
      }
    }
    
    // 检查优惠券是否在有效期内
    const now = new Date()
    if (coupon.startTime && now < new Date(coupon.startTime)) {
      return {
        success: false,
        message: '优惠券还未开始'
      }
    }
    
    if (coupon.endTime && now > new Date(coupon.endTime)) {
      return {
        success: false,
        message: '优惠券已过期'
      }
    }
    
    // 检查用户是否已经拥有该优惠券
    const existingCoupon = await db.collection('user_coupons')
      .where({
        _openid: OPENID,
        couponId: couponId,
        status: 'unused'
      })
      .get()
    
    if (existingCoupon.data && existingCoupon.data.length > 0) {
      return {
        success: false,
        message: '您已拥有该优惠券'
      }
    }
    
    // 创建用户优惠券记录
    const userCouponData = {
      _openid: OPENID,
      couponId: couponId,
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
      condition: condition || '自动领取' // 记录领取条件
    }
    
    const result = await db.collection('user_coupons').add(userCouponData)
    
    if (result._id) {
      return {
        success: true,
        message: '优惠券领取成功',
        data: {
          couponId: result._id,
          couponName: coupon.name
        }
      }
    } else {
      return {
        success: false,
        message: '优惠券领取失败'
      }
    }
    
  } catch (error) {
    console.error('领取优惠券失败:', error)
    return {
      success: false,
      message: '领取优惠券失败: ' + error.message
    }
  }
} 