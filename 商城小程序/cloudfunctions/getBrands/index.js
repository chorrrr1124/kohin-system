// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { limit = 20 } = event
    
    // 直接从商品数据中提取品牌
    const productsResult = await db.collection('shopProducts')
      .field({ brand: true })
      .get()
    
    const brandsSet = new Set()
    productsResult.data.forEach(item => {
      if (item.brand && item.brand.trim() !== '') {
        brandsSet.add(item.brand.trim())
      }
    })
    
    // 转换为标准格式
    const brands = Array.from(brandsSet).map((brand, index) => ({
      _id: `brand_${index + 1}`,
      name: brand,
      code: brand.toLowerCase().replace(/\s+/g, '_'),
      sort: index + 1,
      status: 'active'
    }))
    
    let result = { data: brands }
    
    // 如果从商品中没有提取到品牌，返回默认品牌
    if (brands.length === 0) {
      result.data = [
          { 
            _id: '1', 
            name: 'Apple', 
            code: 'apple',
            sort: 1,
            status: 'active'
          },
          { 
            _id: '2', 
            name: 'Samsung', 
            code: 'samsung',
            sort: 2,
            status: 'active'
          },
          { 
            _id: '3', 
            name: 'Huawei', 
            code: 'huawei',
            sort: 3,
            status: 'active'
          },
          { 
            _id: '4', 
            name: 'Xiaomi', 
            code: 'xiaomi',
            sort: 4,
            status: 'active'
          },
          { 
            _id: '5', 
            name: 'Nike', 
            code: 'nike',
            sort: 5,
            status: 'active'
          },
          { 
            _id: '6', 
            name: 'Adidas', 
            code: 'adidas',
            sort: 6,
            status: 'active'
          }
        ]
    } else {
      result.data = brands
    }

    return {
      success: true,
      data: result.data,
      message: '获取品牌成功'
    }
  } catch (error) {
    console.error('获取品牌失败:', error)
    return {
      success: false,
      data: [
        { _id: '1', name: 'Apple', code: 'apple' },
        { _id: '2', name: 'Samsung', code: 'samsung' },
        { _id: '3', name: 'Huawei', code: 'huawei' },
        { _id: '4', name: 'Xiaomi', code: 'xiaomi' },
        { _id: '5', name: 'Nike', code: 'nike' },
        { _id: '6', name: 'Adidas', code: 'adidas' }
      ],
      message: '获取品牌失败，使用默认品牌'
    }
  }
}