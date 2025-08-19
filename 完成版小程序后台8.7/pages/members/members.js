// pages/members/members.js
Page({
  data: {
    records: [],
    groupedRecords: [], // 按客户分组后的记录
    loading: true,
    searchValue: ''
  },

  onLoad: function(options) {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    console.log('预存记录页面加载');
    this.loadRecords();
  },

  onShow: function () {
    // 检查登录状态（30天过期）
    const app = getApp();
    if (!app.checkLoginStatus()) {
      return; // 未登录会自动跳转到登录页面
    }
    
    console.log('预存记录页面显示');
    
    // 加载预存记录
    this.loadRecords();
    
    // 监听预存记录更新事件
    if (app && app.globalData && app.globalData.eventBus) {
      app.globalData.eventBus.on('prepaidRecordsUpdated', this.handleRecordsUpdated.bind(this));
    }
  },
  
  onHide: function() {
    // 取消事件监听
    const app = getApp();
    if (app && app.globalData && app.globalData.eventBus) {
      app.globalData.eventBus.off('prepaidRecordsUpdated');
    }
  },
  
  // 处理预存记录更新事件
  handleRecordsUpdated: function(records) {
    console.log('收到预存记录更新事件，记录数:', records.length);
    
    // 格式化时间
    const formattedRecords = records.map(record => {
      try {
        return Object.assign({}, record, {
          createTime: this.formatTime(new Date(record.createTime))
        });
      } catch (error) {
        console.error('格式化时间出错:', error, record);
        return Object.assign({}, record, {
          createTime: '未知日期'
        });
      }
    });
    
    this.setData({
      records: formattedRecords,
      loading: false
    });
    
    // 按客户分组记录
    this.groupRecordsByCustomer(formattedRecords);
  },

  // 格式化时间
  formatTime: function(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 加载预存记录
  loadRecords: function() {
    const that = this;
    const db = wx.cloud.database();
    
    this.setData({ loading: true });
    
    console.log('开始加载预存记录...');
    
    // 直接查询数据，不尝试创建集合
    // 小程序端不支持db.createCollection方法
    this.queryPrepaidRecords(db);
  },
  
  // 查询预存记录
  queryPrepaidRecords: function(db) {
    const that = this;
    
    console.log('开始查询预存记录...');
    
    // 先尝试直接获取全局数据
    const app = getApp();
    if (app && app.globalData && app.globalData.prepaidRecords && app.globalData.prepaidRecords.length > 0) {
      console.log('从全局数据获取预存记录:', app.globalData.prepaidRecords.length, '条');
      
      // 处理全局数据
      try {
        const records = app.globalData.prepaidRecords.map(record => {
          try {
            return Object.assign({}, record, {
              createTime: that.formatTime(new Date(record.createTime))
            });
          } catch (error) {
            console.error('格式化时间出错:', error, record);
            return Object.assign({}, record, {
              createTime: '未知日期'
            });
          }
        });
        
        that.setData({
          records: records,
          loading: false
        });
        
        // 按客户分组记录
        that.groupRecordsByCustomer(records);
        
        // 返回，不再查询数据库
        return;
      } catch (error) {
        console.error('处理全局数据出错:', error);
        // 出错时继续查询数据库
      }
    }
    
    // 从数据库查询
    db.collection('prepaidRecords')
      .orderBy('createTime', 'desc')
      .get({
        success: res => {
          console.log('预存记录查询结果:', res.data);
          
          // 格式化时间
          const records = res.data.map(record => {
            try {
              return {
                ...record,
                createTime: that.formatTime(new Date(record.createTime))
              };
            } catch (error) {
              console.error('格式化时间出错:', error, record);
              return {
                ...record,
                createTime: '未知日期'
              };
            }
          });
          
          that.setData({
            records: records,
            loading: false
          });
          
          // 按客户分组记录
          that.groupRecordsByCustomer(records);
          
          // 更新全局数据
          if (app && app.globalData) {
            app.globalData.prepaidRecords = res.data;
            // 同时更新本地存储
            wx.setStorageSync('prepaidRecords', res.data);
          }
        },
        fail: err => {
          console.error('加载预存记录失败：', err);
          
          // 尝试从本地存储加载
          const localRecords = wx.getStorageSync('prepaidRecords') || [];
          console.log('尝试从本地存储加载:', localRecords.length, '条');
          
          if (localRecords.length > 0) {
            // 处理本地数据
            const records = localRecords.map(record => {
              try {
                return {
                  ...record,
                  createTime: that.formatTime(new Date(record.createTime))
                };
              } catch (error) {
                return {
                  ...record,
                  createTime: '未知日期'
                };
              }
            });
            
            that.setData({
              records: records,
              loading: false
            });
            
            // 按客户分组记录
            that.groupRecordsByCustomer(records);
          } else {
            wx.showToast({
              title: '加载失败',
              icon: 'none'
            });
            that.setData({ loading: false });
          }
        }
      });
  },
  
  // 刷新记录
  refreshRecords: function() {
    console.log('手动刷新预存记录');
    
    // 先清空缓存数据
    const app = getApp();
    if (app && app.globalData) {
      app.globalData.prepaidRecords = null;
    }
    
    // 清除本地存储
    try {
      wx.removeStorageSync('prepaidRecords');
      console.log('已清除本地缓存的预存记录');
    } catch (e) {
      console.error('清除本地缓存失败:', e);
    }
    
    // 强制从云端重新加载
    if (app && app.loadPrepaidRecordsFromCloud) {
      app.loadPrepaidRecordsFromCloud(true); // 传入true表示强制刷新
      
      // 显示加载中提示
      wx.showLoading({
        title: '刷新中...',
        mask: true
      });
      
      // 等待数据加载完成
      setTimeout(() => {
        // 重新加载页面数据
        this.loadRecords();
        
        wx.hideLoading();
        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        });
      }, 1000);
    } else {
      // 直接重新加载页面数据
      this.loadRecords();
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }
  },

  // 按客户分组记录
  groupRecordsByCustomer: function(records) {
    console.log('开始按客户分组记录，总记录数:', records.length);
    
    // 检查每条记录的类型
    records.forEach((record, index) => {
      console.log(`记录[${index}] ID:${record._id} 类型:${record.type || '未设置'} 产品名称:${record.productName || '未设置'}`);
      if (record.type === 'product') {
        console.log(`  产品预存: 数量=${record.quantity}, 余额=${record.balance}`);
      } else {
        console.log(`  金额预存: 金额=${record.amount}, 余额=${record.balance}`);
      }
    });
    
    // 创建一个以客户手机号为键的对象，存储分组后的记录
    const customerGroups = {};
    
    // 按客户手机号分组记录，同一客户的不同类型记录合并显示
    records.forEach(record => {
      console.log('处理记录:', record);
      
      // 确保有电话号码
      const phone = record.customerPhone || '未知';
      const recordType = record.type || 'cash';
      
      // 使用手机号作为分组键，同一客户的不同类型会合并显示
      const groupKey = phone;
      
      if (!customerGroups[groupKey]) {
        customerGroups[groupKey] = {
          customerName: record.customerName || '未知客户',
          customerPhone: phone,
          latestTime: record.createTime,
          records: [],
          // 金额预存相关字段
          cashAmount: 0,
          cashRecords: [],
          // 产品预存相关字段
          productRecords: [],
          productSummary: {}, // 按产品名称分组的汇总信息
          // 混合类型标识
          hasMultipleTypes: false,
          types: new Set() // 记录包含的类型
        };
      }
      
      // 添加记录到总记录列表
      customerGroups[groupKey].records.push(record);
      
      // 更新最新时间 - 比较当前记录时间和已有的最新时间
      const currentTime = new Date(record.createTime);
      const existingTime = new Date(customerGroups[groupKey].latestTime);
      if (currentTime > existingTime) {
        customerGroups[groupKey].latestTime = record.createTime;
      }
      
      // 记录类型到集合中
      customerGroups[groupKey].types.add(recordType);
      
      // 根据类型分别处理记录
      if (recordType === 'cash') {
        customerGroups[groupKey].cashRecords.push(record);
      } else if (recordType === 'product') {
        customerGroups[groupKey].productRecords.push(record);
      }
      
      // 检查是否为混合类型
      if (customerGroups[groupKey].types.size > 1) {
        customerGroups[groupKey].hasMultipleTypes = true;
      }
      
      // 根据记录类型累计数量和余额
      if (recordType === 'product') {
        // 产品类型预存
        const recordQuantity = parseInt(record.quantity) || 0;
        const recordBalance = parseInt(record.balance) || 0;
        const productName = record.productName || '未知产品';
        
        console.log('产品预存记录:', productName, 
                    '数量:', recordQuantity, 
                    '余额:', recordBalance);
        
        // 按产品名称分组汇总
        if (!customerGroups[groupKey].productSummary[productName]) {
          customerGroups[groupKey].productSummary[productName] = {
            productName: productName,
            totalQuantity: 0,
            totalBalance: 0,
            recordCount: 0
          };
        }
        
        customerGroups[groupKey].productSummary[productName].totalQuantity += recordQuantity;
        customerGroups[groupKey].productSummary[productName].totalBalance += recordBalance;
        customerGroups[groupKey].productSummary[productName].recordCount += 1;
        
        console.log(`累计产品 ${productName} 到客户 ${phone} 分组`);
      } else if (recordType === 'cash') {
        // 现金预存
        const recordAmount = parseFloat(record.amount) || 0;
        console.log('累加金额:', recordAmount, '到客户:', phone);
        customerGroups[groupKey].cashAmount += recordAmount;
        
        console.log(`累计金额 ${recordAmount} 到客户 ${phone} 分组`);
      } else {
        console.log('未知记录类型:', recordType, '记录:', record);
      }
    });
    
    // 将分组后的结果转换为数组，并处理产品汇总数据
    const groupedRecords = Object.values(customerGroups).map(group => {
      // 将产品汇总对象转换为数组，方便在WXML中遍历
      group.productSummaryArray = Object.values(group.productSummary);
      return group;
    });
    
    // 按照最新预存时间进行降序排序（最新的在前面）
    groupedRecords.sort((a, b) => {
      const timeA = new Date(a.latestTime);
      const timeB = new Date(b.latestTime);
      return timeB - timeA; // 降序排序，最新的时间在前
    });
    
    // 检查分组后的记录类型
    groupedRecords.forEach((group, index) => {
      console.log(`分组[${index}] 客户:${group.customerName} 手机:${group.customerPhone}`);
      console.log(`  记录类型: ${Array.from(group.types).join(', ')}`);
      console.log(`  是否混合类型: ${group.hasMultipleTypes}`);
      
      if (group.cashAmount > 0) {
        console.log(`  金额预存: 总金额=${group.cashAmount} (${group.cashRecords.length}条记录)`);
      }
      
      const productNames = Object.keys(group.productSummary);
      if (productNames.length > 0) {
        productNames.forEach(productName => {
          const summary = group.productSummary[productName];
          console.log(`  产品预存 [${productName}]: 总数量=${summary.totalQuantity}, 总余额=${summary.totalBalance} (${summary.recordCount}条记录)`);
        });
      }
    });
    
    // 按最新时间排序
    try {
      groupedRecords.sort((a, b) => {
        try {
          const dateA = new Date(a.latestTime).getTime();
          const dateB = new Date(b.latestTime).getTime();
          
          if (isNaN(dateA) || isNaN(dateB)) {
            // 如果日期无效，尝试字符串比较
            return String(b.latestTime).localeCompare(String(a.latestTime));
          }
          
          return dateB - dateA;
        } catch (error) {
          console.error('排序比较出错:', error, a.latestTime, b.latestTime);
          return 0;
        }
      });
    } catch (error) {
      console.error('排序出错:', error);
    }
    
    this.setData({ groupedRecords });
  },

  searchRecords: function(e) {
    const searchValue = e.detail.value.toLowerCase();
    this.setData({ searchValue });
    
    const db = wx.cloud.database();
    const _ = db.command;
    
    this.setData({ loading: true });
    
    db.collection('prepaidRecords')
      .where(_.or([
        {
          customerName: db.RegExp({
            regexp: searchValue,
            options: 'i'
          })
        },
        {
          customerPhone: db.RegExp({
            regexp: searchValue,
            options: 'i'
          })
        }
      ]))
      .orderBy('createTime', 'desc')
      .get({
        success: res => {
          // 格式化时间
          const records = res.data.map(record => ({
            ...record,
            createTime: this.formatTime(new Date(record.createTime))
          }));
          
          this.setData({
            records: records,
            loading: false
          });
          
          // 按客户分组记录
          this.groupRecordsByCustomer(records);
        },
        fail: err => {
          console.error('搜索预存记录失败：', err);
          this.setData({ loading: false });
        }
      });
  },

  addRecord: function() {
    wx.navigateTo({
      url: '/pages/members/addRecord/addRecord'
    });
  },

  // 查看客户的所有预存记录
  viewCustomerRecords: function(e) {
    console.log('点击查看客户记录');
    const phone = e.currentTarget.dataset.phone;
    console.log('客户电话:', phone);
    
    const customerRecords = this.data.groupedRecords.find(group => group.customerPhone === phone);
    console.log('找到的客户记录:', customerRecords);
    
    if (customerRecords) {
      // 先设置全局数据并跳转，地址信息在详情页面获取
      const app = getApp();
      app.globalData = app.globalData || {};
      app.globalData.customerRecords = customerRecords;
      
      console.log('准备跳转到详情页面');
      wx.navigateTo({
        url: './recordDetail/recordDetail?phone=' + phone,
        success: () => {
          console.log('跳转成功');
        },
        fail: (err) => {
          console.error('跳转失败:', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    } else {
      console.log('未找到客户记录');
      wx.showToast({
        title: '未找到相关记录',
        icon: 'none'
      });
    }
  },

  // 获取客户地址信息
  getCustomerAddress: function(customerId, callback) {
    if (!customerId) {
      callback('');
      return;
    }
    
    const db = wx.cloud.database();
    db.collection('customers').doc(customerId).get({
      success: res => {
        const customer = res.data;
        let address = '';
        
        // 处理contacts字段，可能是字符串也可能是数组
        let contacts = [];
        if (customer && customer.contacts) {
          console.log('members页面-原始contacts数据:', customer.contacts, '类型:', typeof customer.contacts);
          
          if (typeof customer.contacts === 'string') {
            try {
              contacts = JSON.parse(customer.contacts);
              console.log('members页面-解析JSON字符串后的contacts:', contacts);
            } catch (e) {
              console.error('members页面-解析contacts JSON失败:', e);
              contacts = [];
            }
          } else if (Array.isArray(customer.contacts)) {
            contacts = customer.contacts;
            console.log('members页面-contacts已经是数组:', contacts);
          }
        }
        
        if (contacts && contacts.length > 0) {
          console.log('members页面-客户有联系人信息，联系人数量:', contacts.length);
          
          // 查找默认联系人或第一个有地址的联系人
          const defaultContact = contacts.find(c => c.isDefault) || contacts[0];
          console.log('members页面-选择的联系人:', defaultContact);
          
          if (defaultContact) {
            const addressParts = [];
                         if (defaultContact.province) {
               console.log('members页面-省份:', defaultContact.province);
               addressParts.push(defaultContact.province);
             }
             if (defaultContact.city) {
               console.log('members页面-城市:', defaultContact.city);
               addressParts.push(defaultContact.city);
             }
             // 处理区域信息，可能是district字段或region数组
             if (defaultContact.district) {
               console.log('members页面-区域(district):', defaultContact.district);
               addressParts.push(defaultContact.district);
             } else if (defaultContact.region && Array.isArray(defaultContact.region) && defaultContact.region.length >= 3) {
               console.log('members页面-区域(region):', defaultContact.region[2]);
               addressParts.push(defaultContact.region[2]); // 取第三个元素作为区域
             }
            if (defaultContact.address || defaultContact.addressDetail) {
              const detailAddr = defaultContact.address || defaultContact.addressDetail;
              console.log('members页面-详细地址:', detailAddr);
              addressParts.push(detailAddr);
            }
            address = addressParts.join(' ');
            console.log('members页面-组合后的完整地址:', address);
          } else {
            console.log('members页面-没有找到有效的联系人');
          }
        } else {
          console.log('members页面-客户没有联系人信息');
        }
        
        callback(address);
      },
      fail: err => {
        console.error('获取客户地址失败:', err);
        callback('');
      }
    });
  },

  // 查看记录详情（保留原有方法，用于兼容性）
  viewRecordDetail: function(e) {
    const recordId = e.currentTarget.dataset.id;
    console.log('查看记录详情，ID:', recordId); // 添加日志
    if (!recordId) {
      wx.showToast({
        title: '记录ID无效',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: './recordDetail/recordDetail?id=' + recordId
    });
  },

  editRecord: function(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/members/editRecord/editRecord?id=${recordId}`
    });
  },

  deleteRecord: function(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条预存记录吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database();
          db.collection('prepaidRecords').doc(recordId).remove({
            success: () => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadRecords();
            },
            fail: err => {
              console.error('删除预存记录失败：', err);
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
})