// 用户数据同步云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const users = db.collection('users');
const customers = db.collection('customers');

exports.main = async (event, context) => {
  console.log('=== 用户数据同步云函数开始 ===');
  console.log('接收到的参数:', JSON.stringify(event, null, 2));
  
  try {
    const { action, userData, phoneNumber } = event || {};
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    if (!openid) {
      return {
        success: false,
        message: '缺少用户身份信息'
      };
    }

    switch (action) {
      case 'createOrUpdateUser':
        return await createOrUpdateUser(openid, userData, phoneNumber);
      
      case 'getUserData':
        return await getUserData(openid);
      
      case 'syncToCustomers':
        return await syncToCustomers(openid, userData);
      
      case 'getAllUsers':
        return await getAllUsers();
      
      default:
        return {
          success: false,
          message: '不支持的操作类型'
        };
    }
  } catch (error) {
    console.error('用户数据同步失败:', error);
    return {
      success: false,
      message: error.message || '用户数据同步失败'
    };
  }
};

// 创建或更新用户数据
async function createOrUpdateUser(openid, userData, phoneNumber) {
  try {
    const now = new Date();
    const userRecord = {
      openid,
      nickName: userData.nickName || '',
      avatarUrl: userData.avatarUrl || '',
      phone: phoneNumber || userData.phone || '',
      gender: userData.gender || 0,
      city: userData.city || '',
      province: userData.province || '',
      country: userData.country || '',
      points: userData.points || 0,
      balance: userData.balance || 0,
      vipLevel: userData.vipLevel || 1,
      totalSpent: userData.totalSpent || 0,
      orderCount: userData.orderCount || 0,
      lastLoginTime: now,
      status: 'active',
      createTime: userData.createTime || now,
      updateTime: now
    };

    // 检查用户是否已存在
    const existingUser = await users.where({ openid }).get();
    
    if (existingUser.data && existingUser.data.length > 0) {
      // 更新现有用户
      const userId = existingUser.data[0]._id;
      await users.doc(userId).update({
        data: {
          ...userRecord,
          createTime: existingUser.data[0].createTime // 保持原始创建时间
        }
      });
      
      console.log('用户数据更新成功:', userId);
      return {
        success: true,
        action: 'updated',
        userId,
        userData: userRecord
      };
    } else {
      // 创建新用户
      const result = await users.add({
        data: userRecord
      });
      
      console.log('用户数据创建成功:', result._id);
      return {
        success: true,
        action: 'created',
        userId: result._id,
        userData: userRecord
      };
    }
  } catch (error) {
    console.error('创建或更新用户失败:', error);
    throw error;
  }
}

// 获取用户数据
async function getUserData(openid) {
  try {
    const result = await users.where({ openid }).get();
    
    if (result.data && result.data.length > 0) {
      return {
        success: true,
        userData: result.data[0]
      };
    } else {
      return {
        success: false,
        message: '用户不存在'
      };
    }
  } catch (error) {
    console.error('获取用户数据失败:', error);
    throw error;
  }
}

// 同步用户数据到客户表
async function syncToCustomers(openid, userData) {
  try {
    const userResult = await users.where({ openid }).get();
    
    if (!userResult.data || userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在，无法同步到客户表'
      };
    }
    
    const user = userResult.data[0];
    const now = new Date();
    
    // 检查客户表中是否已存在该用户
    const existingCustomer = await customers.where({ 
      phone: user.phone 
    }).get();
    
    const customerData = {
      name: user.nickName || '未设置',
      phone: user.phone || '',
      email: user.email || '',
      gender: user.gender === 1 ? '男' : user.gender === 2 ? '女' : '未知',
      address: user.address || '',
      points: user.points || 0,
      balance: user.balance || 0,
      vipLevel: user.vipLevel || 1,
      totalSpent: user.totalSpent || 0,
      orderCount: user.orderCount || 0,
      lastLoginTime: user.lastLoginTime,
      source: '小程序用户',
      status: 'active',
      createTime: user.createTime || now,
      updateTime: now,
      openid: user.openid // 关联字段
    };
    
    if (existingCustomer.data && existingCustomer.data.length > 0) {
      // 更新现有客户
      const customerId = existingCustomer.data[0]._id;
      await customers.doc(customerId).update({
        data: {
          ...customerData,
          createTime: existingCustomer.data[0].createTime
        }
      });
      
      console.log('客户数据更新成功:', customerId);
      return {
        success: true,
        action: 'updated',
        customerId,
        customerData
      };
    } else {
      // 创建新客户
      const result = await customers.add({
        data: customerData
      });
      
      console.log('客户数据创建成功:', result._id);
      return {
        success: true,
        action: 'created',
        customerId: result._id,
        customerData
      };
    }
  } catch (error) {
    console.error('同步到客户表失败:', error);
    throw error;
  }
}

// 获取所有用户数据（用于管理端）
async function getAllUsers() {
  try {
    const result = await users.orderBy('createTime', 'desc').get();
    
    return {
      success: true,
      users: result.data || [],
      total: result.data ? result.data.length : 0
    };
  } catch (error) {
    console.error('获取所有用户失败:', error);
    throw error;
  }
}
