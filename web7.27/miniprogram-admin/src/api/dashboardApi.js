import { app, ensureLogin } from '../utils/cloudbase';

export const getDashboardStats = async () => {
  try {
    await ensureLogin();
    const db = app.database();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    // 计算当月开始时间
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const currentMonthStr = currentMonth.toISOString();
    
    const [
      totalCustomersResult,
      monthlyNewCustomersResult,
      todayOrdersResult,
      todayPendingOrdersResult,
      todayCompletedOrdersResult,
      totalPrepaidRecordsResult,
      activePrepaidRecordsResult,
      totalProductsResult,
      lowStockProductsResult,
      todayRevenueResult,
      monthlyRevenueResult
    ] = await Promise.all([
      db.collection('customers').count(),
      db.collection('customers').where({
        createTime: db.command.gte(currentMonthStr)
      }).count(),
      db.collection('orders').where({
        createTime: db.command.gte(todayStr)
      }).count(),
      db.collection('orders').where({
        createTime: db.command.gte(todayStr),
        status: 'pending'
      }).count(),
      db.collection('orders').where({
        createTime: db.command.gte(todayStr),
        status: 'completed'
      }).count(),
      db.collection('prepaidRecords').count(),
      db.collection('prepaidRecords').where({
        expireDate: db.command.gte(new Date().toISOString().split('T')[0])
      }).count(),
      db.collection('products').count(),
      db.collection('products').where({
        stock: db.command.lt(10)
      }).count(),
      db.collection('orders').where({
        createTime: db.command.gte(todayStr),
        status: 'completed'
      }).get(),
      // 修改：查询当月的已完成订单
      db.collection('orders').where({
        createTime: db.command.gte(currentMonthStr),
        status: 'completed'
      }).get()
    ]);
    
    const todayRevenue = todayRevenueResult.data.reduce((sum, order) => {
      return sum + (order.total || 0);
    }, 0);
    
    // 修改：计算当月收入
    const monthlyRevenue = monthlyRevenueResult.data.reduce((sum, order) => {
      return sum + (order.total || 0);
    }, 0);
    
    const activePrepaidRecords = await db.collection('prepaidRecords')
      .where({
        expireDate: db.command.gte(new Date().toISOString().split('T')[0])
      })
      .get();
    
    const totalPrepaidBalance = activePrepaidRecords.data.reduce((sum, record) => {
      return sum + (record.balance || 0);
    }, 0);
    
    const customersByNatureResult = await db.collection('customers').get();
    const customersByNature = {};
    customersByNatureResult.data.forEach(customer => {
      const nature = customer.nature || '未分类';
      customersByNature[nature] = (customersByNature[nature] || 0) + 1;
    });
    
    const ordersByStatusResult = await db.collection('orders').get();
    const ordersByStatus = {};
    ordersByStatusResult.data.forEach(order => {
      const status = order.status || '未知';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });
    
    return {
      totalCustomers: totalCustomersResult.total,
      monthlyNewCustomers: monthlyNewCustomersResult.total,
      todayOrders: todayOrdersResult.total,
      todayPendingOrders: todayPendingOrdersResult.total,
      todayCompletedOrders: todayCompletedOrdersResult.total,
      totalPrepaidRecords: totalPrepaidRecordsResult.total,
      activePrepaidRecords: activePrepaidRecordsResult.total,
      totalPrepaidBalance,
      todayRevenue,
      monthlyRevenue, // 修改：返回当月收入
      lowStockProducts: lowStockProductsResult.total,
      totalProducts: totalProductsResult.total,
      customersByNature,
      ordersByStatus,
      recentStats: {
        last7Days: 0,
        last30Days: 0
      },
      dailyRevenue: [],
      monthlyOrders: []
    };
    
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    throw error;
  }
};

export const getRecentOrders = async (limit = 5) => {
  try {
    await ensureLogin();
    const db = app.database();
    
    const result = await db.collection('orders')
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get();
    
    const ordersWithCustomers = await Promise.all(
      result.data.map(async (order) => {
        try {
          const customerResult = await db.collection('customers')
            .doc(order.customerId)
            .get();
          
          return {
            id: order._id,
            customerName: customerResult.data[0]?.name || order.customer || '未知客户',
            amount: order.total || 0,
            status: order.status || '未知',
            createTime: order.createTime
          };
        } catch (error) {
          console.error('获取客户信息失败:', error);
          return {
            id: order._id,
            customerName: order.customer || '未知客户',
            amount: order.total || 0,
            status: order.status || '未知',
            createTime: order.createTime
          };
        }
      })
    );
    
    return ordersWithCustomers;
    
  } catch (error) {
    console.error('获取最近订单失败:', error);
    throw error;
  }
};

export const getLowStockProducts = async (limit = 10) => {
  try {
    await ensureLogin();
    const db = app.database();
    
    const result = await db.collection('products')
      .where({
        stock: db.command.lt(10)
      })
      .limit(limit)
      .get();
    
    return result.data.map(product => ({
      id: product._id,
      name: product.name || '未知商品',
      stock: product.stock || 0,
      minStock: 10
    }));
    
  } catch (error) {
    console.error('获取库存预警商品失败:', error);
    throw error;
  }
};

export const getCustomerStats = async () => {
  try {
    await ensureLogin();
    const db = app.database();
    
    const totalResult = await db.collection('customers').count();
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const currentMonthStr = currentMonth.toISOString();
    
    const newCustomersResult = await db.collection('customers')
      .where({
        createTime: db.command.gte(currentMonthStr)
      })
      .count();
    
    const ordersResult = await db.collection('orders')
      .field({ customerId: true })
      .get();
    const activeCustomerIds = [...new Set(ordersResult.data.map(order => order.customerId))];
    
    const revenueResult = await db.collection('orders')
      .where({ status: 'completed' })
      .get();
    const totalRevenue = revenueResult.data.reduce((sum, order) => sum + (order.total || 0), 0);
    
    return {
      totalCustomers: totalResult.total,
      newCustomersThisMonth: newCustomersResult.total,
      activeCustomers: activeCustomerIds.length,
      totalRevenue
    };
    
  } catch (error) {
    console.error('获取客户统计数据失败:', error);
    throw error;
  }
};
