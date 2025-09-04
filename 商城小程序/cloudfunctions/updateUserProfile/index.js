// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')

// 更新用户资料
exports.main = async (event, context) => {
  const { profile = {} } = event || {}
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  if (!_openid) {
    return { success: false, message: 'missing openid' }
  }

  const now = Date.now()
  const updateData = {
    nickName: profile.name || '',
    gender: profile.gender === '女' ? 2 : (profile.gender === '男' ? 1 : 0),
    birthday: profile.birthday || '',
    address: profile.address || '',
    updatedAt: now
  }

  try {
    // 查找用户记录
    const { data } = await users.where({ _openid }).get()
    
    if (data && data.length > 0) {
      // 更新现有用户记录
      await users.doc(data[0]._id).update({ 
        data: updateData 
      })
      
      return { 
        success: true, 
        action: 'updated', 
        _openid,
        message: '用户资料更新成功'
      }
    } else {
      // 如果用户不存在，创建新记录
      await users.add({
        data: {
          _openid,
          points: 0,
          balance: 0,
          coupons: 0,
          vipLevel: 1,
          createdAt: now,
          ...updateData
        }
      })
      
      return { 
        success: true, 
        action: 'created', 
        _openid,
        message: '用户资料创建成功'
      }
    }
  } catch (e) {
    console.error('更新用户资料失败:', e)
    return { 
      success: false, 
      message: e.message || '更新用户资料失败'
    }
  }
} 