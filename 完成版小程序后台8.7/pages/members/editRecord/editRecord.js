Page({
  data: {
    record: null,
    products: [],
    productIndex: 0,
    loading: true
  },

  onLoad: function(options) {
    this.loadRecordDetail(options.id);
    this.loadProducts();
  },

  loadRecordDetail: function(recordId) {
    const db = wx.cloud.database();
    db.collection('prepaidRecords').doc(recordId).get({
      success: res => {
        this.setData({
          record: res.data,
          loading: false
        });
        
        // 如果是产品预存，设置产品选择器的初始值
        if (res.data.type === 'product') {
          const productIndex = this.data.products.indexOf(res.data.productName);
          if (productIndex !== -1) {
            this.setData({
              productIndex: productIndex
            });
          }
        }
      },
      fail: err => {
        console.error('加载预存记录详情失败：', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        this.setData({
          loading: false
        });
      }
    });
  },

  loadProducts: function() {
    const db = wx.cloud.database();
    db.collection('shopProducts').get({
      success: res => {
        const products = res.data.map(item => item.name);
        this.setData({
          products: products
        });
      },
      fail: err => {
        console.error('加载产品列表失败：', err);
        wx.showToast({
          title: '加载产品失败',
          icon: 'none'
        });
      }
    });
  },

  bindProductChange: function(e) {
    this.setData({
      productIndex: e.detail.value
    });
  },

  submitForm: function(e) {
    const formData = e.detail.value;
    
    // 表单验证
    if (!formData.customerName) {
      wx.showToast({
        title: '请输入客户姓名',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.customerPhone) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.record.type === 'cash') {
      if (!formData.amount || !formData.balance) {
        wx.showToast({
          title: '请输入金额信息',
          icon: 'none'
        });
        return;
      }
    } else {
      if (!formData.quantity || !formData.balance) {
        wx.showToast({
          title: '请输入数量信息',
          icon: 'none'
        });
        return;
      }
    }
    
    // 构建更新数据
    const updateData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      remark: formData.remark || '',
      updateTime: db.serverDate()
    };
    
    if (this.data.record.type === 'cash') {
      updateData.amount = parseFloat(formData.amount);
      updateData.balance = parseFloat(formData.balance);
    } else {
      updateData.productName = this.data.products[this.data.productIndex];
      updateData.quantity = parseInt(formData.quantity);
      updateData.balance = parseInt(formData.balance);
    }
    
    // 更新数据库
    const db = wx.cloud.database();
    db.collection('prepaidRecords').doc(this.data.record._id).update({
      data: updateData,
      success: () => {
        wx.showToast({
          title: '更新成功',
          icon: 'success',
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        });
      },
      fail: err => {
        console.error('更新预存记录失败：', err);
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      }
    });
  },

  cancelEdit: function() {
    wx.navigateBack();
  }
}) 