// pages/productIn/productIn.js
Page({
  data: {
    categories: [],
    products: [],
    currentCategory: '全部',
    brands: [],
    currentBrand: '全部'
  },

  onLoad: function() {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadProducts();
    this.getLastOutTime();
  },

  onShow: function() {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadProducts();
    this.getLastOutTime();
  },
  
  // 获取最新出库时间
  getLastOutTime: function() {
    const records = wx.getStorageSync('records') || [];
    const outRecords = records.filter(record => record.type === 'out');
    
    if (outRecords.length > 0) {
      // 获取最新的出库记录
      const latestRecord = outRecords[0]; // 假设记录是按时间倒序排列的
      const date = new Date(latestRecord.timestamp);
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      this.setData({
        lastOutTime: formattedDate
      });
    }
  },

  // 加载产品数据
  loadProducts: function() {
    const app = getApp();
    const products = app.globalData.products || [];
    
    // 提取所有产品类型
    const allTypes = products.map(p => p.type);
    const uniqueCategories = ['全部'].concat(Array.from(new Set(allTypes))).filter(Boolean);
    
    // 根据当前选择的类型筛选产品
    let filteredProducts = products;
    if (this.data.currentCategory !== '全部') {
      filteredProducts = products.filter(p => p.type === this.data.currentCategory);
      
      // 提取当前类别下的所有品牌
      const allBrands = filteredProducts.map(p => p.brand);
      const uniqueBrands = ['全部'].concat(Array.from(new Set(allBrands))).filter(Boolean);
      this.setData({ brands: uniqueBrands });
      
      // 根据选中的品牌进行二次筛选
      if (this.data.currentBrand !== '全部') {
        filteredProducts = filteredProducts.filter(p => p.brand === this.data.currentBrand);
      }
    } else {
      // 全部类别时，提取所有品牌
      const allBrands = products.map(p => p.brand);
      const uniqueBrands = ['全部'].concat(Array.from(new Set(allBrands))).filter(Boolean);
      this.setData({ brands: uniqueBrands });
      
      // 根据选中的品牌进行筛选
      if (this.data.currentBrand !== '全部') {
        filteredProducts = filteredProducts.filter(p => p.brand === this.data.currentBrand);
      }
    }
    
    this.setData({
      products: filteredProducts,
      categories: uniqueCategories
    });
  },

  // 切换产品类别
  switchCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      currentBrand: '全部'
    });
    this.loadProducts();
  },
  
  // 切换品牌
  switchBrand: function(e) {
    const brand = e.currentTarget.dataset.brand;
    this.setData({
      currentBrand: brand
    });
    this.loadProducts();
  },

  // 产品入库
  productIn: function(e) {
    const index = e.currentTarget.dataset.index;
    const product = this.data.products[index];
    
    wx.showModal({
      title: '产品入库',
      content: '',
      editable: true,
      placeholderText: `请输入${product.name}的入库数量`,
      success: (res) => {
        if (res.confirm) {
          const quantity = parseInt(res.content);
          
          if (isNaN(quantity) || quantity <= 0) {
            wx.showToast({
              title: '请输入有效数量',
              icon: 'none'
            });
            return;
          }
          
          // 更新库存
          const app = getApp();
          const allProducts = app.globalData.products;
          const productIndex = allProducts.findIndex(p => p.id === product.id);
          
          if (productIndex !== -1) {
            // 计算新库存
            const newStock = allProducts[productIndex].stock + quantity;
            
            // 更新本地数据
            allProducts[productIndex].stock = newStock;
            app.globalData.products = allProducts;
            wx.setStorageSync('products', allProducts);
            
            // 获取正确的产品ID（优先使用数据库_id）
            const actualProductId = product._id || product.id;
            console.log('准备同步库存，产品信息:', {
              name: product.name,
              id: product.id,
              _id: product._id,
              actualProductId: actualProductId,
              newStock: newStock
            });
            
            // 同步更新云端数据和商城产品库存
            app.syncInventory(actualProductId, newStock);
            
            // 添加入库记录
            const record = {
              id: Date.now().toString(),
              productId: actualProductId,
              productName: product.name,
              quantity: quantity,
              timestamp: Date.now(),
              type: 'in' // 标记为入库类型
            };
            
            // 获取现有记录并添加新记录
            const records = wx.getStorageSync('records') || [];
            records.unshift(record);
            wx.setStorageSync('records', records);
            
            // 同步到云数据库
            const db = wx.cloud.database();
            db.collection('records').add({
              data: {
                productId: actualProductId,
                productName: product.name,
                quantity: quantity,
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0],
                type: 'in'
              },
              success: () => {
                console.log('入库记录已同步到云端');
              },
              fail: (err) => {
                console.error('同步入库记录失败', err);
              }
            });
            
            wx.showToast({
              title: '入库成功',
              icon: 'success'
            });
            
            // 刷新产品列表
            this.loadProducts();
          }
        }
      }
    });
  }
});