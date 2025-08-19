Page({
  data: {
    productId: '',
    productName: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    days: [],
    records: {},
    loading: true,
    // 弹窗相关数据
    showScrollableModal: false,
    scrollableModalTitle: '',
    scrollableModalContent: '',
    scrollableModalShowCancel: false,
    scrollableModalConfirmText: '关闭',
    scrollableModalEnablePagination: true,
    scrollableModalPageData: [],
    scrollableModalPageSize: 10
  },

  onLoad: function(options) {
    // 获取传递的产品ID和名称
    if (options.id) {
      const productId = options.id;
      const productName = options.name ? decodeURIComponent(options.name) : '未知产品';
      
      this.setData({
        productId: productId,
        productName: productName
      });
      
      wx.setNavigationBarTitle({
        title: `${productName}出入库日历`
      });
      
      // 加载数据
      this.loadRecords();
    } else {
      wx.showToast({
        title: '产品信息不完整',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow: function() {
    // 页面显示时刷新数据
    if (this.data.productId) {
      this.loadRecords();
    }
  },

  // 生成日历数据
  generateCalendarDays: function() {
    const { year, month } = this.data;
    const days = [];
    
    // 获取当月第一天是星期几
    const firstDay = new Date(year, month - 1, 1).getDay();
    // 获取当月天数
    const daysInMonth = new Date(year, month, 0).getDate();
    // 获取上个月天数
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
    
    // 添加上个月的日期
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      days.push({
        day,
        fullDate: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // 添加当月日期
    const today = new Date();
    const isCurrentYearMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        fullDate: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: true,
        isToday: isCurrentYearMonth && i === today.getDate()
      });
    }
    
    // 添加下个月的日期
    const remainingDays = 42 - days.length; // 保持6行
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      days.push({
        day: i,
        fullDate: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return days;
  },

  // 加载记录
  loadRecords: function() {
    const db = wx.cloud.database();
    const _ = db.command;
    
    this.setData({ loading: true });
    
    try {
      wx.showLoading({
        title: '加载中...'
      });

      // 生成日历天数
      const days = this.generateCalendarDays();

      // 获取当月第一天和最后一天
      const startDate = new Date(this.data.year, this.data.month - 1, 1);
      const endDate = new Date(this.data.year, this.data.month, 0, 23, 59, 59, 999); // 设置为当月最后一天的最后一毫秒

      console.log('查询产品出入库记录时间范围:', startDate.toLocaleString(), '至', endDate.toLocaleString());
      console.log('查询产品ID:', this.data.productId);

      // 查询特定产品的当月记录
      db.collection('records')
        .where({
          createTime: _.gte(startDate).and(_.lte(endDate)),
          productId: this.data.productId
        })
        .limit(1000) // 增加查询数量上限
        .orderBy('createTime', 'desc')
        .get()
        .then(recordsResult => {
          console.log('获取到的产品出入库记录数量：', recordsResult.data.length);
          
          // 按日期分组统计
          const recordMap = {};
          recordsResult.data.forEach(record => {
            // 确保createTime存在
            if (!record.createTime) {
              console.warn('发现没有createTime的记录:', record);
              return;
            }
            
            const date = new Date(record.createTime);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            if (!recordMap[dateStr]) {
              recordMap[dateStr] = {
                in: 0,
                out: 0,
                records: []
              };
            }
            
            const quantity = Number(record.quantity) || 0;
            
            if (record.type === 'in') {
              recordMap[dateStr].in += quantity;
            } else if (record.type === 'out') {
              recordMap[dateStr].out += quantity;
            }
            
            recordMap[dateStr].records.push(Object.assign({}, record, {
              formattedTime: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
            }));
          });

          // 将记录数据添加到日历天数中
          days.forEach(day => {
            if (recordMap[day.fullDate]) {
              day.records = recordMap[day.fullDate];
            }
          });

          this.setData({ 
            days,
            records: recordMap,
            loading: false
          });

          console.log('处理后的日历数据：', Object.keys(recordMap).length, '天有记录');
        })
        .catch(err => {
          console.error('查询产品出入库记录失败:', err);
          this.setData({ loading: false });
          wx.showToast({
            title: '查询记录失败',
            icon: 'none'
          });
        })
        .finally(() => {
          wx.hideLoading();
        });
    } catch (err) {
      console.error('加载记录失败：', err);
      this.setData({ loading: false });
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 上个月
  prevMonth: function() {
    let { year, month } = this.data;
    if (month === 1) {
      year--;
      month = 12;
    } else {
      month--;
    }
    this.setData({ year, month }, () => {
      this.loadRecords();
    });
  },

  // 下个月
  nextMonth: function() {
    let { year, month } = this.data;
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
    this.setData({ year, month }, () => {
      this.loadRecords();
    });
  },

  // 查看日期详情
  viewDayDetail: function(e) {
    const fullDate = e.currentTarget.dataset.date;
    const dayRecords = this.data.records[fullDate];
    
    if (!dayRecords || dayRecords.records.length === 0) {
      wx.showToast({
        title: '当天没有记录',
        icon: 'none'
      });
      return;
    }

    const title = `${fullDate} 出入库明细`;
    
    // 格式化记录数据用于弹窗显示
    const formattedRecords = dayRecords.records.map(record => {
      const icon = record.type === 'in' ? '📥' : '📤';
      const action = record.type === 'in' ? '入库' : '出库';
      const productName = this.data.productName;
      const quantity = record.quantity;
      const time = record.formattedTime || '未知时间';
      
      return {
        icon: icon,
        productName: productName,
        time: time,
        action: action,
        quantity: quantity,
        orderNote: record.orderNote || ''
      };
    });

    // 显示可滚动分页弹窗
    this.setData({
      showScrollableModal: true,
      scrollableModalTitle: title,
      scrollableModalContent: '',
      scrollableModalShowCancel: false,
      scrollableModalConfirmText: '关闭',
      scrollableModalEnablePagination: true,
      scrollableModalPageData: formattedRecords,
      scrollableModalPageSize: 10
    });
  },

  // 弹窗确认回调
  onScrollableModalConfirm: function() {
    this.setData({
      showScrollableModal: false,
      scrollableModalPageData: [],
      scrollableModalEnablePagination: true
    });
  },

  // 弹窗关闭回调
  onScrollableModalClose: function() {
    this.setData({
      showScrollableModal: false,
      scrollableModalPageData: [],
      scrollableModalEnablePagination: true
    });
  }
}); 