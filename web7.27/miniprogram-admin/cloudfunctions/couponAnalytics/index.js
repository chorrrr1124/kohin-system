const cloudbase = require('@cloudbase/node-sdk');

// 初始化云开发环境
const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});

const db = app.database();

exports.main = async (event, context) => {
  console.log('优惠券分析云函数开始执行...');
  
  try {
    const { action } = event;
    
    switch (action) {
      case 'getAnalytics':
        return await getCouponAnalytics();
      case 'getMonthlyTrend':
        return await getMonthlyTrend();
      case 'getTopCoupons':
        return await getTopCoupons();
      default:
        return {
          success: false,
          error: '未知的操作类型'
        };
    }
  } catch (error) {
    console.error('优惠券分析云函数执行失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 获取优惠券分析数据
async function getCouponAnalytics() {
  try {
    console.log('开始获取优惠券分析数据...');
    
    // 获取所有优惠券
    const couponsResult = await db.collection('mall_coupons').get();
    const coupons = couponsResult.data;
    
    console.log(`找到 ${coupons.length} 个优惠券`);
    
    // 计算统计数据
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(coupon => coupon.status === 'active').length;
    
    // 计算总使用次数
    const totalUsage = coupons.reduce((sum, coupon) => sum + (coupon.usedCount || 0), 0);
    
    // 计算转化率（使用次数 / 总发行量）
    const totalIssued = coupons.reduce((sum, coupon) => sum + (coupon.totalCount || 0), 0);
    const conversionRate = totalIssued > 0 ? ((totalUsage / totalIssued) * 100).toFixed(1) : 0;
    
    // 获取月度趋势数据
    const monthlyTrend = await getMonthlyTrendData();
    
    // 获取热门优惠券
    const topCoupons = await getTopCouponsData();
    
    const analyticsData = {
      totalCoupons,
      activeCoupons,
      totalUsage,
      conversionRate: parseFloat(conversionRate),
      monthlyTrend,
      topCoupons
    };
    
    console.log('优惠券分析数据计算完成:', analyticsData);
    
    return {
      success: true,
      data: analyticsData
    };
    
  } catch (error) {
    console.error('获取优惠券分析数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取月度趋势数据
async function getMonthlyTrendData() {
  try {
    console.log('开始获取月度趋势数据...');
    
    // 获取最近6个月的订单数据
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const ordersResult = await db.collection('orders')
      .where({
        createTime: db.command.gte(sixMonthsAgo)
      })
      .get();
    
    const orders = ordersResult.data;
    console.log(`找到 ${orders.length} 个订单`);
    
    // 按月份统计优惠券使用情况
    const monthlyData = {};
    
    orders.forEach(order => {
      if (order.coupons && order.coupons.length > 0) {
        const orderDate = new Date(order.createTime);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += order.coupons.length;
      }
    });
    
    // 生成最近6个月的数据
    const monthlyTrend = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = `${date.getMonth() + 1}月`;
      
      monthlyTrend.push({
        month: monthName,
        usage: monthlyData[monthKey] || 0
      });
    }
    
    console.log('月度趋势数据:', monthlyTrend);
    return monthlyTrend;
    
  } catch (error) {
    console.error('获取月度趋势数据失败:', error);
    // 返回模拟数据作为降级方案
    return [
      { month: '1月', usage: 0 },
      { month: '2月', usage: 0 },
      { month: '3月', usage: 0 },
      { month: '4月', usage: 0 },
      { month: '5月', usage: 0 },
      { month: '6月', usage: 0 }
    ];
  }
}

// 获取热门优惠券数据
async function getTopCouponsData() {
  try {
    console.log('开始获取热门优惠券数据...');
    
    // 获取所有优惠券，按使用次数排序
    const couponsResult = await db.collection('mall_coupons')
      .orderBy('usedCount', 'desc')
      .limit(5)
      .get();
    
    const coupons = couponsResult.data;
    console.log(`找到 ${coupons.length} 个热门优惠券`);
    
    const topCoupons = coupons.map(coupon => {
      const conversion = coupon.totalCount > 0 
        ? ((coupon.usedCount || 0) / coupon.totalCount * 100).toFixed(1)
        : 0;
      
      return {
        name: coupon.name,
        usage: coupon.usedCount || 0,
        conversion: parseFloat(conversion)
      };
    });
    
    console.log('热门优惠券数据:', topCoupons);
    return topCoupons;
    
  } catch (error) {
    console.error('获取热门优惠券数据失败:', error);
    // 返回模拟数据作为降级方案
    return [
      { name: '暂无数据', usage: 0, conversion: 0 }
    ];
  }
}

// 获取月度趋势（单独接口）
async function getMonthlyTrend() {
  try {
    const monthlyTrend = await getMonthlyTrendData();
    return {
      success: true,
      data: monthlyTrend
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 获取热门优惠券（单独接口）
async function getTopCoupons() {
  try {
    const topCoupons = await getTopCouponsData();
    return {
      success: true,
      data: topCoupons
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
