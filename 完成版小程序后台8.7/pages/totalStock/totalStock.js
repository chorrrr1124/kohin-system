// pages/totalStock/totalStock.js
Page({
  data: {
    categoryStats: [],
    totalCount: 0
  },

  onLoad: function() {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadCategoryStats();
  },

  // 加载各分类的库存统计
  loadCategoryStats: function() {
    const app = getApp();
    const products = app.globalData.products || [];
    
    // 按类别分组并计算每个类别的产品数量
    const categoryMap = {};
    
    products.forEach(product => {
      const type = product.type || '未分类';
      if (!categoryMap[type]) {
        categoryMap[type] = {
          name: type,
          count: 0,
          products: []
        };
      }
      categoryMap[type].count++;
      categoryMap[type].products.push(product);
    });
    
    // 转换为数组并按数量降序排序
    const categoryStats = Object.values(categoryMap).sort((a, b) => b.count - a.count);
    
    this.setData({
      categoryStats: categoryStats,
      totalCount: products.length
    });
  },
  
  // 查看某个分类的详细产品列表
  viewCategoryDetail: function(e) {
    const categoryName = e.currentTarget.dataset.category;
    const categoryData = this.data.categoryStats.find(item => item.name === categoryName);
    
    if (categoryData) {
      // 将产品数据转换为字符串以便传递
      const productsStr = JSON.stringify(categoryData.products);
      wx.navigateTo({
        url: `/pages/categoryDetail/categoryDetail?category=${categoryName}&products=${encodeURIComponent(productsStr)}`
      });
    }
  }
});