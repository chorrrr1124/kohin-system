// pages/productRecords/productRecords.js
Page({
  data: {
    productId: '',
    productName: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    days: [],
    dayRecords: {},
    currentMonthRecords: [],
    recordType: 'all', // 'all', 'in', 'out'
    
    // 可滚动弹窗相关数据
    showScrollableModal: false,
    modalTitle: '',
    modalContent: '',
    modalPageData: [],
    modalEnablePagination: false,
    modalPageSize: 5
  },

  onLoad: function (options) {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    // 获取传递的产品ID和名称
    if (options.id && options.name) {
      // 解码产品名称，修复URL编码导致的乱码问题
      const decodedName = decodeURIComponent(options.name);
      this.setData({
        productId: options.id,
        productName: decodedName
      });
      this.loadCalendarData();
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

  onShow: function () {
    this.loadCalendarData();
  },

  // 加载日历数据
  loadCalendarData: function () {
    // 获取当前年月
    const year = this.data.year;
    const month = this.data.month;
    
    // 生成日历数据
    this.generateCalendarDays(year, month);
    
    // 加载当月产品记录
    this.loadMonthRecords(year, month);
  },

  // 生成日历天数
  generateCalendarDays: function (year, month) {
    // 获取当月第一天是星期几
    const firstDay = new Date(year, month - 1, 1).getDay();
    // 获取当月天数
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 生成日历数组
    const days = [];
    
    // 填充前面的空白
    for (let i = 0; i < firstDay; i++) {
      days.push({
        day: '',
        isCurrentMonth: false
      });
    }
    
    // 填充当月日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday: year === new Date().getFullYear() && 
                 month === new Date().getMonth() + 1 && 
                 i === new Date().getDate()
      });
    }
    
    this.setData({
      days: days,
      year: year,
      month: month
    });
  },

  // 加载当月产品记录
  loadMonthRecords: function (year, month) {
    // 获取所有记录
    const allRecords = wx.getStorageSync('records') || [];
    
    // 筛选当月记录和特定产品
    const startDate = new Date(year, month - 1, 1).getTime();
    const endDate = new Date(year, month, 0, 23, 59, 59).getTime();
    
    let monthRecords = allRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= startDate && 
             recordDate <= endDate && 
             record.productId === this.data.productId;
    });
    
    // 根据记录类型筛选
    if (this.data.recordType !== 'all') {
      monthRecords = monthRecords.filter(record => record.type === this.data.recordType);
    }
    
    // 按日期分组记录
    const dayRecords = {};
    
    monthRecords.forEach(record => {
      const date = new Date(record.timestamp);
      const day = date.getDate();
      
      if (!dayRecords[day]) {
        dayRecords[day] = [];
      }
      
      dayRecords[day].push(record);
    });
    
    this.setData({
      dayRecords: dayRecords,
      currentMonthRecords: monthRecords
    });
  },

  // 切换到上个月
  prevMonth: function () {
    let year = this.data.year;
    let month = this.data.month - 1;
    
    if (month < 1) {
      month = 12;
      year--;
    }
    
    this.setData({
      year: year,
      month: month
    });
    
    this.loadCalendarData();
  },

  // 切换到下个月
  nextMonth: function () {
    let year = this.data.year;
    let month = this.data.month + 1;
    
    if (month > 12) {
      month = 1;
      year++;
    }
    
    this.setData({
      year: year,
      month: month
    });
    
    this.loadCalendarData();
  },

  // 切换记录类型
  switchRecordType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      recordType: type
    });
    this.loadMonthRecords(this.data.year, this.data.month);
  },

  // 查看某天的记录
  viewDayRecords: function (e) {
    const day = e.currentTarget.dataset.day;
    
    if (!day) return; // 空白格子不处理
    
    const records = this.data.dayRecords[day] || [];
    
    if (records.length === 0) {
      wx.showToast({
        title: '当天没有记录',
        icon: 'none'
      });
      return;
    }
    
    // 按时间倒序排序记录，最新的记录在最前面
    records.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // 格式化记录内容
    const title = `${this.data.year}年${this.data.month}月${day}日出入库明细`;
    
    // 格式化记录数据用于分页显示
    const formattedRecords = records.map(record => {
      const date = new Date(record.timestamp);
      const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      const icon = record.type === 'in' ? '📥' : '📤';
      const typeText = record.type === 'in' ? '入库' : '出库';
      const quantity = record.quantity || 0;
      
      return {
        icon,
        time,
        typeText,
        quantity,
        orderNote: record.orderNote || '',
        productName: this.data.productName
      };
    });
    
    // 如果记录数量少于5条，使用普通内容模式
    if (records.length <= 5) {
      let content = '';
      formattedRecords.forEach((record, index) => {
        let recordInfo = `${record.icon} ${record.productName}\n⏰ 时间：${record.time}\n📦 操作：${record.typeText} ${record.quantity}个`;
        
        if (record.orderNote) {
          recordInfo += `\n📋 备注：${record.orderNote}`;
        }
        
        content += recordInfo;
        
        if (index < formattedRecords.length - 1) {
          content += '\n\n';
        }
      });

      this.setData({
        modalTitle: title,
        modalContent: content,
        showScrollableModal: true,
        modalEnablePagination: false
      });
    } else {
      // 记录数量多时使用分页模式
      this.setData({
        modalTitle: title,
        modalContent: '',
        modalPageData: formattedRecords,
        showScrollableModal: true,
        modalEnablePagination: true,
        modalPageSize: 5
      });
    }
  },

  // 关闭可滚动弹窗
  onScrollableModalClose() {
    this.setData({
      showScrollableModal: false,
      modalPageData: [],
      modalEnablePagination: false
    });
  }
});