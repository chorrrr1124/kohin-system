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
      case 'list':
        return await getBanners(data)
      case 'create':
        return await createBanner(data)
      case 'update':
        return await updateBanner(data)
      case 'delete':
        return await deleteBanner(data)
      case 'toggleStatus':
        return await toggleBannerStatus(data)
      default:
        return {
          success: false,
          message: '无效的操作类型'
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

// 获取轮播图列表
async function getBanners(data) {
  const { limit = 20, status } = data || {}
  
  let query = db.collection('homepage_carousel')
  
  if (status) {
    query = query.where({ status })
  }
  
  const result = await query
    .orderBy('sort', 'asc')
    .orderBy('createTime', 'desc')
    .limit(limit)
    .get()

  return {
    success: true,
    data: result.data,
    message: '获取轮播图列表成功'
  }
}

// 创建轮播图
async function createBanner(data) {
  const {
    title,
    imageUrl,
    linkType,
    linkUrl,
    sort = 0,
    startTime,
    endTime,
    status = 'active'
  } = data

  if (!title || !imageUrl) {
    return {
      success: false,
      message: '标题和图片不能为空'
    }
  }

  const bannerData = {
    title,
    imageUrl,
    linkType: linkType || 'page',
    linkUrl: linkUrl || '',
    sort,
    startTime: new Date(startTime || new Date()),
    endTime: new Date(endTime || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)), // 默认一年后
    status,
    createTime: new Date(),
    updateTime: new Date()
  }

  const result = await db.collection('homepage_carousel').add({
    data: bannerData
  })

  return {
    success: true,
    data: { _id: result._id, ...bannerData },
    message: '创建轮播图成功'
  }
}

// 更新轮播图
async function updateBanner(data) {
  const { _id, ...updateData } = data

  if (!_id) {
    return {
      success: false,
      message: 'ID不能为空'
    }
  }

  // 处理时间字段
  if (updateData.startTime) {
    updateData.startTime = new Date(updateData.startTime)
  }
  if (updateData.endTime) {
    updateData.endTime = new Date(updateData.endTime)
  }

  updateData.updateTime = new Date()

  const result = await db.collection('homepage_carousel')
    .doc(_id)
    .update({
      data: updateData
    })

  return {
    success: true,
    data: result,
    message: '更新轮播图成功'
  }
}

// 删除轮播图
async function deleteBanner(data) {
  const { _id } = data

  if (!_id) {
    return {
      success: false,
      message: 'ID不能为空'
    }
  }

  const result = await db.collection('homepage_carousel')
    .doc(_id)
    .remove()

  return {
    success: true,
    data: result,
    message: '删除轮播图成功'
  }
}

// 切换轮播图状态
async function toggleBannerStatus(data) {
  const { _id, status } = data

  if (!_id || !status) {
    return {
      success: false,
      message: 'ID和状态不能为空'
    }
  }

  const result = await db.collection('homepage_carousel')
    .doc(_id)
    .update({
      data: {
        status,
        updateTime: new Date()
      }
    })

  return {
    success: true,
    data: result,
    message: '状态更新成功'
  }
}