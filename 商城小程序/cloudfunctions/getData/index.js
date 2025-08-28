const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 通用数据访问云函数
 * 用于解决CloudBase免费版本的数据访问限制
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { collection, action = 'get', where = {}, data = {}, limit = 20, skip = 0, orderBy = {}, docId = null } = event
  
  // 基础权限检查
  if (!collection) {
    return {
      success: false,
      error: '缺少必要参数：collection'
    }
  }
  
  try {
    let result
    
    switch (action) {
      case 'get':
        // 查询数据
        let query = db.collection(collection)
        
        // 添加查询条件
        if (Object.keys(where).length > 0) {
          query = query.where(where)
        }
        
        // 添加排序
        if (Object.keys(orderBy).length > 0) {
          for (const [field, order] of Object.entries(orderBy)) {
            query = query.orderBy(field, order)
          }
        }
        
        // 添加分页
        if (skip > 0) {
          query = query.skip(skip)
        }
        
        if (limit > 0) {
          query = query.limit(limit)
        }
        
        result = await query.get()
        break
        
      case 'getById':
        // 根据ID查询单条数据
        if (!docId) {
          throw new Error('缺少必要参数：docId')
        }
        result = await db.collection(collection).doc(docId).get()
        break
        
      case 'add':
        // 添加数据
        const addData = {
          ...data,
          _openid: wxContext.OPENID,
          createTime: new Date(),
          updateTime: new Date()
        }
        result = await db.collection(collection).add({
          data: addData
        })
        break
        
      case 'update':
        // 更新数据
        if (!docId) {
          throw new Error('缺少必要参数：docId')
        }
        const updateData = {
          ...data,
          updateTime: new Date()
        }
        result = await db.collection(collection).doc(docId).update({
          data: updateData
        })
        break
        
      case 'remove':
        // 删除数据
        if (!docId) {
          throw new Error('缺少必要参数：docId')
        }
        result = await db.collection(collection).doc(docId).remove()
        break
        
      case 'count':
        // 统计数量
        let countQuery = db.collection(collection)
        if (Object.keys(where).length > 0) {
          countQuery = countQuery.where(where)
        }
        result = await countQuery.count()
        break
        
      default:
        throw new Error(`不支持的操作类型：${action}`)
    }
    
    return {
      success: true,
      data: result.data || result,
      total: result.total || 0,
      openid: wxContext.OPENID
    }
    
  } catch (error) {
    console.error('数据访问错误:', error)
    return {
      success: false,
      error: error.message,
      openid: wxContext.OPENID
    }
  }
} 