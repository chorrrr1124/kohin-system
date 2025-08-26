// 优惠券管理API
import { app } from '../utils/cloudbase';

// 获取所有优惠券
export const getAllCoupons = async () => {
  try {
    const db = app.database();
    const { data } = await db.collection('mall_coupons').get();
    return { success: true, data };
  } catch (error) {
    console.error('获取优惠券列表失败:', error);
    return { success: false, error: error.message };
  }
};

// 添加新优惠券
export const addCoupon = async (couponData) => {
  try {
    const db = app.database();
    
    // 转换字段格式以匹配小程序的数据结构
    const transformedData = {
      name: couponData.name,
      type: couponData.type, // 'fixed' 或 'percentage'
      value: couponData.discount, // 优惠金额或折扣比例
      minAmount: couponData.minSpend, // 最低消费金额
      startTime: new Date(), // 开始时间
      endTime: couponData.expiryDate ? new Date(couponData.expiryDate) : null, // 结束时间
      description: couponData.description || '本券不可与其他优惠同享',
      status: 'active',
      totalCount: 999999, // 总数量，设置一个较大的值
      usedCount: 0, // 已使用数量
      createTime: new Date(),
      updateTime: new Date(),
      // 新增条件规则字段
      autoIssue: couponData.autoIssue || false,
      issueRules: couponData.issueRules || {},
      ruleDetails: couponData.ruleDetails || {}
    };
    
    const result = await db.collection('mall_coupons').add(transformedData);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('添加优惠券失败:', error);
    return { success: false, error: error.message };
  }
};

// 更新优惠券
export const updateCoupon = async (id, couponData) => {
  try {
    const db = app.database();
    
    // 转换字段格式
    const transformedData = {
      name: couponData.name,
      type: couponData.type,
      value: couponData.discount,
      minAmount: couponData.minSpend,
      endTime: couponData.expiryDate ? new Date(couponData.expiryDate) : null,
      description: couponData.description || '本券不可与其他优惠同享',
      updateTime: new Date(),
      // 更新条件规则字段
      autoIssue: couponData.autoIssue,
      issueRules: couponData.issueRules,
      ruleDetails: couponData.ruleDetails
    };
    
    await db.collection('mall_coupons').doc(id).update(transformedData);
    return { success: true };
  } catch (error) {
    console.error('更新优惠券失败:', error);
    return { success: false, error: error.message };
  }
};

// 删除优惠券
export const deleteCoupon = async (id) => {
  try {
    const db = app.database();
    await db.collection('mall_coupons').doc(id).remove();
    return { success: true };
  } catch (error) {
    console.error('删除优惠券失败:', error);
    return { success: false, error: error.message };
  }
};

// 发放优惠券给用户
export const issueCouponToUser = async (couponId, userId) => {
  try {
    const db = app.database();
    // 先检查优惠券是否存在且有效
    const { data: couponData } = await db.collection('mall_coupons').doc(couponId).get();
    
    if (!couponData.length || couponData[0].status !== 'active') {
      return { success: false, error: '优惠券不存在或已失效' };
    }
    
    const coupon = couponData[0];
    
    // 创建用户优惠券记录，使用小程序的数据结构
    await db.collection('user_coupons').add({
      _openid: userId, // 使用_openid字段
      couponId,
      couponName: coupon.name,
      couponType: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount,
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      expireTime: coupon.endTime, // 小程序使用的过期时间字段
      status: 'unused',
      issuedAt: new Date(),
      createTime: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('发放优惠券失败:', error);
    return { success: false, error: error.message };
  }
};

// 批量发放优惠券
export const issueCouponToMultipleUsers = async (couponId, userIds) => {
  try {
    const db = app.database();
    // 先检查优惠券是否存在且有效
    const { data: couponData } = await db.collection('mall_coupons').doc(couponId).get();
    
    if (!couponData.length || couponData[0].status !== 'active') {
      return { success: false, error: '优惠券不存在或已失效' };
    }
    
    const coupon = couponData[0];
    
    // 批量创建用户优惠券记录，使用小程序的数据结构
    const userCoupons = userIds.map(userId => ({
      _openid: userId, // 使用_openid字段
      couponId,
      couponName: coupon.name,
      couponType: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount,
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      expireTime: coupon.endTime, // 小程序使用的过期时间字段
      status: 'unused',
      issuedAt: new Date(),
      createTime: new Date()
    }));
    
    // 分批添加，避免一次性添加过多数据
    const batchSize = 20;
    for (let i = 0; i < userCoupons.length; i += batchSize) {
      const batch = userCoupons.slice(i, i + batchSize);
      await Promise.all(batch.map(item => db.collection('user_coupons').add(item)));
    }
    
    return { success: true };
  } catch (error) {
    console.error('批量发放优惠券失败:', error);
    return { success: false, error: error.message };
  }
};

// 获取用户优惠券列表
export const getUserCoupons = async (userId) => {
  try {
    const db = app.database();
    const { data } = await db.collection('user_coupons').where({ _openid: userId }).get();
    return { success: true, data };
  } catch (error) {
    console.error('获取用户优惠券失败:', error);
    return { success: false, error: error.message };
  }
};