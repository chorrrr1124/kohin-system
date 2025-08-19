// pages/records/records.js
Page({
  data: {
    records: [],
    recordType: 'out' // 默认显示出库记录
  },

  onLoad: function (options) {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadRecords();
  },

  onShow: function () {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadRecords();
  },

  // 切换记录类型
  switchRecordType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      recordType: type
    });
    this.loadRecords();
  },

  // 加载记录
  loadRecords: function () {
    const db = wx.cloud.database();
    
    // 显示加载状态
    wx.showLoading({
      title: '加载中...'
    });
    
    console.log('开始加载出入库记录，当前类型:', this.data.recordType);
    
    let query = {};
    if (this.data.recordType !== 'all') {
      query.type = this.data.recordType;
    }
    
    // 先验证records集合是否存在
    db.collection('records').count()
      .then(countRes => {
        console.log(`records集合共有 ${countRes.total} 条记录`);
        
        // 查询记录，增加限制到1000条
        return db.collection('records')
          .where(query)
          .limit(1000) // 增加查询数量上限
          .orderBy('createTime', 'desc')
          .get();
      })
      .then(res => {
        console.log(`成功获取 ${res.data.length} 条记录`);
        
        // 格式化时间
        const formattedRecords = res.data.map(record => {
          const date = new Date(record.createTime);
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          console.log(`处理记录: ${record.productName || '未知产品'}, 类型: ${record.type}, 数量: ${record.quantity}, 时间: ${formattedDate}`);
          
          return Object.assign({}, record, {
            formattedTime: formattedDate
          });
        });
        
        // 按日期降序排序
        formattedRecords.sort((a, b) => {
          return new Date(b.createTime) - new Date(a.createTime);
        });
        
        this.setData({
          records: formattedRecords
        });
        
        // 更新本地存储
        wx.setStorageSync('records', res.data);
        
        // 隐藏加载状态
        wx.hideLoading();
      })
      .catch(err => {
        console.error('加载记录失败：', err);
        
        // 如果云数据库加载失败，尝试从本地存储加载
        const allRecords = wx.getStorageSync('records') || [];
        console.log(`从本地存储加载 ${allRecords.length} 条记录`);
        
        const currentType = this.data.recordType;
        
        const filteredRecords = allRecords.filter(record => {
          return currentType === 'all' || record.type === currentType;
        });
        
        const formattedRecords = filteredRecords.map(record => {
          const date = new Date(record.createTime);
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          
          return Object.assign({}, record, {
            formattedTime: formattedDate
          });
        });
        
        this.setData({
          records: formattedRecords
        });
        
        // 隐藏加载状态
        wx.hideLoading();
        
        // 提示用户
        wx.showToast({
          title: '使用本地数据',
          icon: 'none'
        });
      });
  },

  // 查看记录详情
  viewRecordDetail: function (e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.records[index];
    const recordTypeText = this.data.recordType === 'out' ? '出库' : '入库';
    
    wx.showModal({
      title: `${recordTypeText}详情`,
      content: `产品: ${record.productName}\n数量: ${record.quantity}\n时间: ${record.formattedTime}`,
      showCancel: false
    });
  }
});

