// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const carts = db.collection('user_carts')

// 更新用户购物车数据
exports.main = async (event, context) => {
  const { action, productData, productId, quantity } = event || {}
  const wxContext = cloud.getWXContext()
  const _openid = wxContext.OPENID

  console.log('=== updateUserCart 云函数开始 ===')
  console.log('接收到的参数:', { action, productData, productId, quantity })
  console.log('用户openid:', _openid)

  if (!_openid) {
    console.log('错误: 缺少openid')
    return { ok: false, message: 'missing openid' }
  }

  try {
    // 查询用户购物车
    console.log('查询用户购物车...')
    const { data } = await carts.where({ _openid }).get()
    console.log('查询结果:', data)
    
    let cartData
    if (data && data.length > 0) {
      cartData = data[0]
      console.log('找到现有购物车:', cartData)
    } else {
      // 创建新的购物车记录
      console.log('创建新购物车记录...')
      const result = await carts.add({
        data: {
          _openid,
          items: [],
          createTime: Date.now(),
          updateTime: Date.now()
        }
      })
      cartData = {
        _id: result._id,
        _openid,
        items: [],
        createTime: Date.now(),
        updateTime: Date.now()
      }
      console.log('新购物车创建成功:', cartData)
    }

    let items = cartData.items || []
    console.log('当前购物车商品:', items)

    switch (action) {
      case 'add':
        // 添加商品到购物车
        console.log('执行添加商品操作...')
        if (!productData) {
          console.log('错误: 缺少商品数据')
          return { ok: false, message: 'missing product data' }
        }
        
        const existingIndex = items.findIndex(item => item._id === productData._id)
        if (existingIndex >= 0) {
          // 商品已存在，增加数量
          console.log('商品已存在，增加数量')
          items[existingIndex].quantity += (productData.quantity || 1)
        } else {
          // 新商品，添加到购物车
          console.log('添加新商品到购物车')
          items.push({
            ...productData,
            quantity: productData.quantity || 1,
            selected: true,
            addTime: Date.now()
          })
        }
        break

      case 'remove':
        // 从购物车移除商品
        console.log('执行移除商品操作...')
        if (!productId) {
          console.log('错误: 缺少商品ID')
          return { ok: false, message: 'missing product id' }
        }
        items = items.filter(item => item._id !== productId)
        break

      case 'updateQuantity':
        // 更新商品数量
        console.log('执行更新数量操作...')
        if (!productId || quantity === undefined) {
          console.log('错误: 缺少商品ID或数量')
          return { ok: false, message: 'missing product id or quantity' }
        }
        
        const itemIndex = items.findIndex(item => item._id === productId)
        if (itemIndex >= 0) {
          if (quantity <= 0) {
            // 数量为0或负数，移除商品
            items.splice(itemIndex, 1)
          } else {
            items[itemIndex].quantity = quantity
          }
        }
        break

      case 'clear':
        // 清空购物车
        console.log('执行清空购物车操作...')
        items = []
        break

      case 'updateSelection':
        // 更新商品选中状态
        console.log('执行更新选中状态操作...')
        if (!productId) {
          console.log('错误: 缺少商品ID')
          return { ok: false, message: 'missing product id' }
        }
        
        const selectionIndex = items.findIndex(item => item._id === productId)
        if (selectionIndex >= 0) {
          items[selectionIndex].selected = !items[selectionIndex].selected
        }
        break

      default:
        console.log('错误: 无效的操作类型:', action)
        return { ok: false, message: 'invalid action' }
    }

    console.log('更新后的购物车商品:', items)

    // 更新购物车数据
    console.log('保存购物车数据到数据库...')
    await carts.doc(cartData._id).update({
      data: {
        items,
        updateTime: Date.now()
      }
    })
    console.log('购物车数据保存成功')

    const result = {
      ok: true,
      data: items,
      count: items.length,
      message: '购物车更新成功'
    }
    console.log('返回结果:', result)
    return result

  } catch (error) {
    console.error('更新用户购物车失败:', error)
    return {
      ok: false,
      message: '更新购物车失败',
      error: error.message
    }
  }
}