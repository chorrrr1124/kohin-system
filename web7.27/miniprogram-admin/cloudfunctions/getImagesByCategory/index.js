const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log("获取分类图片API接收到的参数:", JSON.stringify(event, null, 2));
  
  const { category = 'all', limit = 20, offset = 0 } = event;
  
  try {
    const collection = db.collection("images");
    let query = collection.where({ isActive: true });
    
    if (category && category !== 'all') {
      query = query.where({ category: category });
    }
    
    const result = await query
      .orderBy("createTime", "desc")
      .skip(offset)
      .limit(limit)
      .get();
    
    // 获取总数
    const countResult = await collection
      .where({ 
        isActive: true,
        ...(category && category !== 'all' ? { category: category } : {})
      })
      .count();
    
    return {
      success: true,
      data: {
        images: result.data,
        total: countResult.total,
        hasMore: result.data.length === limit
      }
    };
  } catch (error) {
    console.error("获取分类图片失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
