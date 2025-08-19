Page({
  data: {
    date: '',
    productId: '',
    productName: '',
    records: [],
    loading: true,
    stats: {
      in: 0,
      out: 0,
      total: 0
    }
  },

  onLoad: function(options) {
    if (options.date && options.id) {
      const date = options.date;
      const productId = options.id;
      const productName = options.name ? decodeURIComponent(options.name) : '未知产品';
      
      // 格式化日期为易读形式
      const [year, month, day] = date.split('-');
      const formattedDate = `${year}年${month}月${day}日`;
      
      this.setData({
        date,
        formattedDate,
        productId,
        productName
      });
      
      wx.setNavigationBarTitle({
        title: `${formattedDate}出入库记录`
      });
      
      this.loadDayRecords();
    } else {
      wx.showToast({
        title: '参数不完整',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载指定日期的记录
  loadDayRecords: function() {
    const db = wx.cloud.database();
    
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });
    
    try {
      // 构建日期范围，查询当天00:00:00到23:59:59的记录
      const dateParts = this.data.date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // 月份从0开始
      const day = parseInt(dateParts[2]);
      
      const startOfDay = new Date(year, month, day, 0, 0, 0);
      const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
      
      console.log('查询日期范围:', startOfDay.toLocaleString(), '至', endOfDay.toLocaleString());
      
      // 查询特定产品在指定日期的记录
      db.collection('records')
        .where({
          productId: this.data.productId,
          createTime: db.command.gte(startOfDay).and(db.command.lte(endOfDay))
        })
        .orderBy('createTime', 'desc')
        .get()
        .then(res => {
          console.log('获取到的记录数量:', res.data.length);
          
          // 处理记录数据
          const formattedRecords = res.data.map(record => {
            const recordTime = new Date(record.createTime);
            return Object.assign({}, record, {
              formattedTime: `${recordTime.getHours().toString().padStart(2, '0')}:${recordTime.getMinutes().toString().padStart(2, '0')}`
            });
          });
          
          // 计算统计数据
          let inTotal = 0;
          let outTotal = 0;
          
          formattedRecords.forEach(record => {
            const quantity = Number(record.quantity) || 0;
            if (record.type === 'in') {
              inTotal += quantity;
            } else if (record.type === 'out') {
              outTotal += quantity;
            }
          });
          
          this.setData({
            records: formattedRecords,
            loading: false,
            stats: {
              in: inTotal,
              out: outTotal,
              total: inTotal - outTotal
            }
          });
        })
        .catch(err => {
          console.error('查询记录失败:', err);
          this.setData({ loading: false });
          wx.showToast({
            title: '查询失败',
            icon: 'none'
          });
        })
        .finally(() => {
          wx.hideLoading();
        });
    } catch (err) {
      console.error('加载记录失败:', err);
      this.setData({ loading: false });
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  }
}); 