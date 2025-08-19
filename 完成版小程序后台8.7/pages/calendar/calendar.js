// pages/calendar/calendar.js
Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    days: [],
    records: {},
    // 自定义弹窗相关数据
    showModal: false,
    modalTitle: '',
    modalContent: '',
    showCancel: false,
    
    // 可滚动弹窗相关数据
    showScrollableModal: false,
    scrollableModalTitle: '',
    scrollableModalContent: '',
    scrollableModalShowCancel: false,
    scrollableModalConfirmText: '关闭',
    scrollableModalEnablePagination: false,
    scrollableModalPageData: [],
    scrollableModalPageSize: 5
  },

  onLoad() {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    this.loadRecords();
  },

  onShow() {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    // 页面显示时刷新数据
    this.loadRecords();
  },

  // 生成日历数据
  generateCalendarDays() {
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
        isToday: false,
        holiday: this.getHoliday(prevYear, prevMonth, day)
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
        isToday: isCurrentYearMonth && i === today.getDate(),
        holiday: this.getHoliday(year, month, i)
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
        isToday: false,
        holiday: this.getHoliday(nextYear, nextMonth, i)
      });
    }
    
    return days;
  },

  // 根据日期获取节假日信息
  getHoliday(year, month, day) {
    // 简单的中国主要节假日判断
    const dateStr = `${month}-${day}`;
    const holidays = {
      '1-1': '元旦',
      '5-1': '劳动节',
      '10-1': '国庆节'
    };

    // 春节需要特殊处理，这里简化处理（实际春节是农历计算）
    if ((year === 2023 && month === 1 && day >= 21 && day <= 27) ||
        (year === 2024 && month === 2 && day >= 10 && day <= 17) ||
        (year === 2025 && month === 1 && day >= 29 && day <= 31) ||
        (year === 2025 && month === 2 && day >= 1 && day <= 4)) {
      return '春节';
    }

    // 清明节（公历）
    if ((month === 4 && day >= 4 && day <= 6)) {
      return '清明节';
    }

    // 中秋节（简化处理）
    if ((year === 2023 && month === 9 && day >= 29 && day <= 30) ||
        (year === 2024 && month === 9 && day >= 17 && day <= 19) ||
        (year === 2025 && month === 10 && day >= 6 && day <= 8)) {
      return '中秋节';
    }

    // 国庆中秋同一天特殊情况
    if (year === 2023 && month === 9 && day === 29) {
      return '中秋国庆';
    }

    // 端午节（简化处理）
    if ((year === 2023 && month === 6 && day >= 22 && day <= 24) ||
        (year === 2024 && month === 6 && day >= 10 && day <= 12) ||
        (year === 2025 && month === 5 && day >= 31) ||
        (year === 2025 && month === 6 && day === 1)) {
      return '端午节';
    }

    return holidays[dateStr] || '';
  },

  // 加载记录
  async loadRecords() {
    const db = wx.cloud.database();
    const _ = db.command;
    
    try {
      wx.showLoading({
        title: '加载中...'
      });

      // 生成日历天数
      const days = this.generateCalendarDays();

      // 获取当月第一天和最后一天
      const startDate = new Date(this.data.year, this.data.month - 1, 1);
      const endDate = new Date(this.data.year, this.data.month, 0, 23, 59, 59, 999); // 设置为当月最后一天的最后一毫秒

      console.log('查询出入库记录时间范围:', startDate.toLocaleString(), '至', endDate.toLocaleString());

      // 先检查records集合是否存在
      try {
        console.log('开始查询出入库记录...');
        // 查询当月记录 - 获取更多数据，最多1000条
        const recordsResult = await db.collection('records')
          .where({
            createTime: _.gte(startDate).and(_.lte(endDate))
          })
          .limit(1000) // 增加查询数量上限
          .orderBy('createTime', 'desc')
          .get();

        console.log('获取到的出入库记录数量：', recordsResult.data.length);
        
        // 验证获取到的数据
        if (!recordsResult.data) {
          console.error('查询出入库记录返回了空数据');
          recordsResult.data = [];
        }

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
          console.log(`处理记录 - 日期: ${dateStr}, 类型: ${record.type}, 数量: ${quantity}, ${record.productName || '未知产品'}`);
          
          if (record.type === 'in') {
            recordMap[dateStr].in += quantity;
          } else if (record.type === 'out') {
            recordMap[dateStr].out += quantity;
          } else {
            console.warn(`未知记录类型: ${record.type}, 记录ID: ${record._id}`);
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
          records: recordMap
        });

        console.log('处理后的日历数据：', Object.keys(recordMap).length, '天有记录');
        // 输出每天的出入库数量
        Object.keys(recordMap).forEach(date => {
          console.log(`${date}: 入库 ${recordMap[date].in} 个, 出库 ${recordMap[date].out} 个, 共 ${recordMap[date].records.length} 条记录`);
        });
        
      } catch (queryErr) {
        console.error('查询出入库记录失败:', queryErr);
        wx.showToast({
          title: '查询记录失败',
          icon: 'none'
        });
      }

    } catch (err) {
      console.error('加载记录失败：', err);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 上个月
  prevMonth() {
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
  nextMonth() {
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

  // 查看某天详情
  viewDayDetail(e) {
    const date = e.currentTarget.dataset.date;
    const dayRecords = this.data.records[date];
    
    if (!dayRecords || !dayRecords.records.length) {
      wx.showToast({
        title: '暂无记录',
        icon: 'none'
      });
      return;
    }

    const title = `${date} 出入库明细`;
    const recordCount = dayRecords.records.length;

    // 如果记录数量少于等于5条，使用普通弹窗
    if (recordCount <= 5) {
      const records = dayRecords.records.map((record, index) => {
        const icon = record.type === 'in' ? '📥' : '📤';
        const action = record.type === 'in' ? '入库' : '出库';
        const productName = record.productName || '未知产品';
        const quantity = record.quantity;
        const time = record.formattedTime ? ` ${record.formattedTime}` : '';
        const note = record.orderNote ? ("\n📋 备注：" + record.orderNote) : '';
        
        return icon + " " + productName + "\n⏰ 时间：" + (time || '未知') + "\n📦 操作：" + action + " " + quantity + "个" + note;
      }).join('\n\n');

      this.setData({
        showModal: true,
        modalTitle: title,
        modalContent: records,
        showCancel: false
      });
    } else {
      // 记录数量多时使用可滚动分页弹窗
      const formattedRecords = dayRecords.records.map(record => {
        return {
          icon: record.type === 'in' ? '📥' : '📤',
          productName: record.productName || '未知产品',
          action: record.type === 'in' ? '入库' : '出库',
          quantity: record.quantity,
          time: record.formattedTime || '未知',
          orderNote: record.orderNote || ''
        };
      });

      this.setData({
        showScrollableModal: true,
        scrollableModalTitle: title,
        scrollableModalContent: '',
        scrollableModalShowCancel: false,
        scrollableModalConfirmText: '关闭',
        scrollableModalEnablePagination: true,
        scrollableModalPageData: formattedRecords,
        scrollableModalPageSize: 5
      });
    }
  },

  // 自定义弹窗事件处理
  onModalConfirm: function() {
    this.setData({
      showModal: false
    });
  },

  onModalCancel: function() {
    this.setData({
      showModal: false
    });
  },

  onModalClose: function() {
    this.setData({
      showModal: false
    });
  },

  // 可滚动弹窗事件处理
  onScrollableModalConfirm() {
    this.setData({
      showScrollableModal: false,
      scrollableModalPageData: [],
      scrollableModalEnablePagination: false
    });
  },

  onScrollableModalClose() {
    this.setData({
      showScrollableModal: false,
      scrollableModalPageData: [],
      scrollableModalEnablePagination: false
    });
  }
});