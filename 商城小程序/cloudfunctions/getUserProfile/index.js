// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')

// 获取用户资料
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  if (!_openid) {
    return { success: false, message: 'missing openid' }
  }

  try {
    // 查找用户记录
    const { data } = await users.where({ _openid }).get()
    
    if (data && data.length > 0) {
      const userData = data[0]
      return { 
        success: true, 
        data: {
          nickName: userData.nickName || '',
          gender: userData.gender || 0,
          birthday: userData.birthday || '',
          address: userData.address || '',
          phone: userData.phone || '',
          mobile: userData.mobile || '',
          avatarUrl: userData.avatarUrl || '',
          points: userData.points || 0,
          balance: userData.balance || 0,
          coupons: userData.coupons || 0,
          vipLevel: userData.vipLevel || 1,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        }
      }
    } else {
      return { 
        success: false, 
        message: '用户不存在',
        data: null
      }
    }
  } catch (e) {
    console.error('获取用户资料失败:', e)
    return { 
      success: false, 
      message: e.message || '获取用户资料失败',
      data: null
    }
  }
} 