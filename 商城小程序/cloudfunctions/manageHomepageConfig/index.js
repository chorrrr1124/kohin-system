// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event
  
  try {
    switch (action) {
      case 'get':
        return await getHomepageConfig(data)
      case 'update':
        return await updateHomepageConfig(data)
      default:
        return {
          success: false,
          message: '不支持的操作'
        }
    }
  } catch (error) {
    console.error('操作失败:', error)
    return {
      success: false,
      message: '操作失败',
      error: error.message
    }
  }
}

// 获取首页配置
async function getHomepageConfig(data) {
  try {
    const result = await db.collection('homepage_config')
      .where({ type: 'promo' })
      .orderBy('updateTime', 'desc')
      .limit(1)
      .get()

    if (result.data.length > 0) {
      return {
        success: true,
        data: result.data[0].config,
        message: '获取首页配置成功'
      }
    } else {
      // 返回默认配置
      return {
        success: true,
        data: {
          title: '夏日消暑·就喝「丘大叔」',
          subtitle: 'Lemon tea for Uncle Q',
          heroImageUrl: '/images/default-banner.jpg',
          giftNote: '【赠6元代金券×1】',
          validityNote: '*自购买之日起3年内有效，可转赠可自用',
          prices: [
            { price: 30, originalPrice: 30 },
            { price: 86, originalPrice: 100 },
            { price: 66, originalPrice: 66 },
            { price: 168, originalPrice: 200 }
          ]
        },
        message: '使用默认配置'
      }
    }
  } catch (error) {
    console.error('获取首页配置失败:', error)
    throw error
  }
}

// 更新首页配置
async function updateHomepageConfig(data) {
  try {
    const { config } = data
    
    // 检查是否已存在配置
    const existing = await db.collection('homepage_config')
      .where({ type: 'promo' })
      .get()

    if (existing.data.length > 0) {
      // 更新现有配置
      await db.collection('homepage_config')
        .doc(existing.data[0]._id)
        .update({
          config: config,
          updateTime: new Date()
        })
    } else {
      // 创建新配置
      await db.collection('homepage_config').add({
        type: 'promo',
        config: config,
        createTime: new Date(),
        updateTime: new Date()
      })
    }

    return {
      success: true,
      message: '首页配置更新成功'
    }
  } catch (error) {
    console.error('更新首页配置失败:', error)
    throw error
  }
} 