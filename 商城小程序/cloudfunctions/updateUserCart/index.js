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

  if (!_openid) {
    return { ok: false, message: 'missing openid' }
  }

  try {
    // 查询用户购物车
    const { data } = await carts.where({ _openid }).get()
    
    let cartData
    if (data && data.length > 0) {
      cartData = data[0]
    } else {
      // 创建新的购物车记录
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
    }

    let items = cartData.items || []

    switch (action) {
      case 'add':
        // 添加商品到购物车
        if (!productData) {
          return { ok: false, message: 'missing product data' }
        }
        
        const existingIndex = items.findIndex(item => item._id === productData._id)
        if (existingIndex >= 0) {
          // 商品已存在，增加数量
          items[existingIndex].quantity += (productData.quantity || 1)
        } else {
          // 新商品，添加到购物车
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
        if (!productId) {
          return { ok: false, message: 'missing product id' }
        }
        items = items.filter(item => item._id !== productId)
        break

      case 'updateQuantity':
        // 更新商品数量
        if (!productId || quantity === undefined) {
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
        items = []
        break

      case 'updateSelection':
        // 更新商品选中状态
        if (!productId) {
          return { ok: false, message: 'missing product id' }
        }
        
        const selectionIndex = items.findIndex(item => item._id === productId)
        if (selectionIndex >= 0) {
          items[selectionIndex].selected = !items[selectionIndex].selected
        }
        break

      default:
        return { ok: false, message: 'invalid action' }
    }

    // 更新购物车数据
    await carts.doc(cartData._id).update({
      data: {
        items,
        updateTime: Date.now()
      }
    })

    return {
      ok: true,
      data: items,
      count: items.length,
      message: '购物车更新成功'
    }
  } catch (error) {
    console.error('更新用户购物车失败:', error)
    return {
      ok: false,
      message: '更新购物车失败',
      error: error.message
    }
  }
}