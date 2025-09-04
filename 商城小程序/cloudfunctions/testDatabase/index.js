// 测试数据库连接和权限
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  console.log('=== 测试数据库连接 ===')
  console.log('用户openid:', _openid)

  try {
    // 测试查询user_carts集合
    console.log('测试查询user_carts集合...')
    const cartsResult = await db.collection('user_carts').where({ _openid }).get()
    console.log('user_carts查询结果:', cartsResult)

    // 测试创建user_carts集合（如果不存在）
    try {
      console.log('尝试创建user_carts集合...')
      await db.createCollection('user_carts')
      console.log('user_carts集合创建成功')
    } catch (error) {
      console.log('user_carts集合创建失败或已存在:', error.message)
    }

    // 测试添加测试数据
    try {
      console.log('尝试添加测试购物车数据...')
      const testResult = await db.collection('user_carts').add({
        data: {
          _openid,
          items: [],
          createTime: Date.now(),
          updateTime: Date.now()
        }
      })
      console.log('测试数据添加成功:', testResult)

      // 删除测试数据
      await db.collection('user_carts').doc(testResult._id).remove()
      console.log('测试数据删除成功')
    } catch (error) {
      console.log('测试数据操作失败:', error.message)
    }

    // 列出所有集合
    try {
      console.log('获取所有集合列表...')
      const collections = await db.listCollections()
      console.log('所有集合:', collections)
    } catch (error) {
      console.log('获取集合列表失败:', error.message)
    }

    return {
      success: true,
      message: '数据库测试完成',
      openid: _openid,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('数据库测试失败:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
} 