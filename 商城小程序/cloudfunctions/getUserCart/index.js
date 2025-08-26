// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const carts = db.collection('user_carts')

// 获取用户购物车数据
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  if (!_openid) {
    return { ok: false, message: 'missing openid' }
  }

  try {
    // 查询用户购物车数据
    const { data } = await carts.where({ _openid }).get()
    
    if (data && data.length > 0) {
      return {
        ok: true,
        data: data[0].items || [],
        message: '获取购物车成功'
      }
    } else {
      return {
        ok: true,
        data: [],
        message: '购物车为空'
      }
    }
  } catch (error) {
    console.error('获取用户购物车失败:', error)
    return {
      ok: false,
      message: '获取购物车失败',
      error: error.message
    }
  }
}