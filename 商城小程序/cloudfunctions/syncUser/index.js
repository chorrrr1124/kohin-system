// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')

// upsert 用户信息
exports.main = async (event, context) => {
  const { userInfo = {} } = event || {}
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  if (!_openid) {
    return { ok: false, message: 'missing openid' }
  }

  const now = Date.now()
  const patch = {
    nickName: userInfo.nickName || '',
    avatarUrl: userInfo.avatarUrl || '',
    gender: userInfo.gender || 0,
    country: userInfo.country || '',
    province: userInfo.province || '',
    city: userInfo.city || '',
    updatedAt: now
  }

  try {
    // 以 _openid 作为主键进行 upsert
    const { data } = await users.where({ _openid }).get()
    if (data && data.length > 0) {
      await users.doc(data[0]._id).update({ data: patch })
      return { ok: true, action: 'updated', _openid }
    } else {
      await users.add({
        data: {
          _openid,
          points: 0,
          balance: 0,
          coupons: 0,
          vipLevel: 1,
          createdAt: now,
          ...patch
        }
      })
      return { ok: true, action: 'created', _openid }
    }
  } catch (e) {
    console.error(e)
    return { ok: false, message: e.message }
  }
} 