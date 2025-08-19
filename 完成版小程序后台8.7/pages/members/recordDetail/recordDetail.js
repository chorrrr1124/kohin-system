Page({
  data: {
    record: null,
    records: [], // 客户的所有记录
    loading: true,
    recordId: '',
    customerPhone: ''
  },

  onLoad: function(options) {
    console.log('记录详情页面加载，参数：', options);
    
    // 添加超时保护，确保不会永远卡在加载状态
    setTimeout(() => {
      if (this.data.loading) {
        console.log('加载超时，强制停止加载状态');
        this.setData({
          loading: false
        });
        wx.showToast({
          title: '加载超时，请重试',
          icon: 'none'
        });
      }
    }, 10000); // 10秒超时
    
    // 处理按客户电话查看的情况
    if (options.phone) {
      this.setData({
        customerPhone: options.phone
      });
      this.loadCustomerRecords(options.phone);
      return;
    }
    
    // 处理按记录ID查看的情况（兼容旧方式）
    if (!options.id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({
      recordId: options.id
    });
    this.loadRecordDetail(options.id);
  },

  // 格式化时间
  formatTime: function(date) {
    try {
      // 确保传入的是Date对象
      if (!(date instanceof Date)) {
        date = new Date(date);
      }
      
      // 检查是否是有效日期
      if (isNaN(date.getTime())) {
        return '无效日期';
      }
      
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('格式化时间出错:', error, '原始数据:', date);
      return '日期错误';
    }
  },

  // 格式化日期时间（包含时分秒）
  formatDateTime: function(date) {
    try {
      // 处理不同类型的日期对象
      let targetDate;
      
      if (!date) {
        return '未知时间';
      }
      
      console.log('格式化日期时间，原始数据:', date, '类型:', typeof date);
      
      // 处理微信云数据库的日期对象格式
      if (typeof date === 'object' && date.$date) {
        console.log('检测到云数据库日期格式，$date:', date.$date);
        targetDate = new Date(date.$date);
      } else if (typeof date === 'object' && date.seconds) {
        // Firestore Timestamp格式
        console.log('检测到Firestore时间戳格式');
        targetDate = new Date(date.seconds * 1000);
      } else if (date instanceof Date) {
        console.log('已经是Date对象');
        targetDate = date;
      } else if (typeof date === 'string' || typeof date === 'number') {
        console.log('字符串或数字日期');
        targetDate = new Date(date);
      } else {
        console.log('未知日期格式，尝试直接转换');
        targetDate = new Date(date);
      }
      
      // 检查是否是有效日期
      if (isNaN(targetDate.getTime())) {
        console.error('无法解析的日期:', date);
        return '无效日期';
      }
      
      const year = targetDate.getFullYear();
      const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
      const day = targetDate.getDate().toString().padStart(2, '0');
      const hours = targetDate.getHours().toString().padStart(2, '0');
      const minutes = targetDate.getMinutes().toString().padStart(2, '0');
      const seconds = targetDate.getSeconds().toString().padStart(2, '0');
      
      const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      console.log('格式化后的日期时间:', formattedDateTime);
      return formattedDateTime;
    } catch (error) {
      console.error('格式化日期时间出错:', error, '原始数据:', date);
      return '时间错误';
    }
  },

  // 加载单条记录详情（旧方法，保留兼容性）
  loadRecordDetail: function(recordId) {
    if (!recordId) {
      wx.showToast({
        title: '记录ID无效',
        icon: 'none'
      });
      return;
    }

    console.log('开始加载记录详情，ID:', recordId);
    const db = wx.cloud.database();
    db.collection('prepaidRecords').doc(recordId).get({
      success: async res => {
        console.log('加载记录详情成功：', res.data);
        
        // 检查并打印使用记录信息
        if (res.data.usageRecords && res.data.usageRecords.length > 0) {
          console.log(`该记录有 ${res.data.usageRecords.length} 条使用记录：`, JSON.stringify(res.data.usageRecords));
        } else {
          console.log('该记录暂无使用记录');
          // 确保usageRecords是一个数组
          res.data.usageRecords = res.data.usageRecords || [];
        }
        
        // 格式化时间
        const record = Object.assign({}, res.data, {
          createTime: this.formatTime(new Date(res.data.createTime))
        });
        
        // 如果有使用记录，也格式化使用记录的时间
        if (record.usageRecords && record.usageRecords.length > 0) {
          // 先格式化时间
          let usageRecords = record.usageRecords.map(usage => {
            let formattedUsage = Object.assign({}, usage);
            
            // 使用新的日期时间格式化函数
            console.log('处理使用记录日期，原始date:', usage.date);
            formattedUsage.date = this.formatDateTime(usage.date);
            
            return formattedUsage;
          });
          // 查找所有需要补全的orderId
          const needFetch = usageRecords.filter(u => u.orderId && (!u.address || !u.receiver || !u.phone)).map(u => u.orderId);
          const uniqueOrderIds = Array.from(new Set(needFetch));
          let orderMap = {};
          if (uniqueOrderIds.length > 0) {
            // 批量查订单
            const orderRes = await db.collection('orders').where({ id: db.command.in(uniqueOrderIds) }).get();
            orderRes.data.forEach(order => {
              orderMap[order.id] = order;
            });
          }
          // 补全 usageRecords
          usageRecords = usageRecords.map(u => {
            if (u.orderId && orderMap[u.orderId]) {
              const order = orderMap[u.orderId];
              
              // 只有在缺少信息时才从订单中补全
              if (!u.receiver && order.address && order.address.name) {
                u.receiver = order.address.name;
              }
              
              if (!u.phone && order.address && order.address.phone) {
                u.phone = order.address.phone;
              }
              
              if (!u.address) {
                if (order.address && order.address.detail) {
                  u.address = order.address.detail;
                } else if (order.address) {
                  u.address = order.address;
                }
              }
              
              // 如果还是没有收货人信息，尝试使用客户信息作为备选
              if (!u.receiver && order.customer) {
                u.receiver = order.customer;
              }
              
              if (!u.phone && order.customerPhone) {
                u.phone = order.customerPhone;
              }
            }
            return u;
          });
          record.usageRecords = usageRecords;
        }

        // 获取客户地址信息
        console.log('准备获取客户地址，记录信息:', record);
        this.getCustomerAddress(record.customerId, (customerAddress) => {
          console.log('地址获取回调，获得地址:', customerAddress);
          record.customerAddress = customerAddress;
          console.log('设置记录数据，包含地址:', record);
          this.setData({
            record: record,
            loading: false
          });
          console.log('页面数据已更新，当前record:', this.data.record);
        });
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

  // 加载客户的所有记录（新方法）
  loadCustomerRecords: function(phone) {
    console.log('加载客户记录, 电话:', phone);
    
    try {
      // 优先使用全局变量中存储的客户记录数据
      const app = getApp();
      if (app.globalData && app.globalData.customerRecords) {
        console.log('使用全局数据:', app.globalData.customerRecords);
        const customerData = app.globalData.customerRecords;
        
        // 检查数据有效性
        if (!customerData.records || !Array.isArray(customerData.records) || customerData.records.length === 0) {
          console.log('全局数据无效，尝试从数据库查询');
          this.loadFromDatabase(phone);
          return;
        }
        
        // 先显示数据，避免卡在加载状态
        if (customerData.records.length === 1) {
          let record = { ...customerData.records[0] };
          console.log('全局数据单条记录模式，准备获取地址，customerId:', record.customerId);
          
          // 格式化使用记录的日期
          if (record.usageRecords && record.usageRecords.length > 0) {
            console.log('格式化全局数据单条记录的使用记录日期');
            record.usageRecords = record.usageRecords.map(usage => ({
              ...usage,
              date: this.formatDateTime(usage.date)
            }));
          }
          
          this.setData({
            record: record,
            loading: false
          });
          
          // 异步获取地址信息
          const customerId = record.customerId;
          this.getCustomerAddress(customerId, (customerAddress) => {
            console.log('全局数据单条记录地址获取回调，地址:', customerAddress);
            // 更新完整的record对象以确保页面重新渲染
            const updatedRecord = { ...this.data.record };
            updatedRecord.customerAddress = customerAddress;
            this.setData({
              record: updatedRecord
            });
            console.log('全局数据单条记录地址已更新:', this.data.record);
          });
          return;
        }
        
        // 有多条记录，显示记录列表
        const customerId = customerData.records && customerData.records.length > 0 ? customerData.records[0].customerId : null;
        console.log('全局数据多条记录模式，准备获取地址，customerId:', customerId);
        
        // 格式化每条记录的使用记录日期
        const formattedRecords = customerData.records.map(record => {
          const formattedRecord = { ...record };
          if (formattedRecord.usageRecords && formattedRecord.usageRecords.length > 0) {
            console.log('格式化全局数据多条记录的使用记录日期');
            formattedRecord.usageRecords = formattedRecord.usageRecords.map(usage => ({
              ...usage,
              date: this.formatDateTime(usage.date)
            }));
          }
          return formattedRecord;
        });
        
        this.setData({
          records: formattedRecords,
          record: {
            customerName: customerData.customerName,
            customerPhone: customerData.customerPhone,
            customerAddress: '', // 先设置为空，异步获取
            totalQuantity: customerData.totalQuantity,
            totalBalance: customerData.totalBalance,
            productName: customerData.productName
          },
          loading: false
        });
        
        // 异步获取地址信息
        this.getCustomerAddress(customerId, (customerAddress) => {
          console.log('全局数据多条记录地址获取回调，地址:', customerAddress);
          // 更新完整的record对象以确保页面重新渲染
          const updatedRecord = { ...this.data.record };
          updatedRecord.customerAddress = customerAddress;
          this.setData({
            record: updatedRecord
          });
          console.log('全局数据多条记录地址已更新:', this.data.record);
        });
        return;
      }
      
      // 如果没有全局数据，从数据库查询
      this.loadFromDatabase(phone);
      
    } catch (error) {
      console.error('加载客户记录出错:', error);
      this.setData({
        loading: false
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 从数据库加载数据
  loadFromDatabase: function(phone) {
    console.log('从数据库查询客户记录');
    const db = wx.cloud.database();
    db.collection('prepaidRecords')
      .where({
        customerPhone: phone
      })
      .orderBy('createTime', 'desc')
      .get({
        success: res => {
          console.log('数据库查询成功:', res.data.length, '条记录');
          if (res.data.length === 0) {
            this.setData({
              loading: false
            });
            wx.showToast({
              title: '未找到记录',
              icon: 'none'
            });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
            return;
          }
          
          // 格式化时间
          const records = res.data.map(record => {
            const formattedRecord = {
              ...record,
              createTime: this.formatTime(new Date(record.createTime))
            };
            
            // 如果有使用记录，也格式化使用记录的时间
            if (formattedRecord.usageRecords && formattedRecord.usageRecords.length > 0) {
              formattedRecord.usageRecords = formattedRecord.usageRecords.map(usage => ({
                ...usage,
                date: this.formatDateTime(usage.date)
              }));
            }
            
            return formattedRecord;
          });
          
          // 如果只有一条记录，直接显示
          if (records.length === 1) {
            const record = records[0];
            console.log('单条记录模式，准备获取地址，record.customerId:', record.customerId);
            this.setData({
              record: record,
              loading: false
            });
            
            // 异步获取地址信息
            this.getCustomerAddress(record.customerId, (customerAddress) => {
              console.log('单条记录地址获取回调，地址:', customerAddress);
              // 更新完整的record对象以确保页面重新渲染
              const updatedRecord = { ...this.data.record };
              updatedRecord.customerAddress = customerAddress;
              this.setData({
                record: updatedRecord
              });
              console.log('单条记录地址已更新:', this.data.record);
            });
            return;
          }
          
          // 有多条记录，先显示记录列表
          console.log('多条记录模式，准备获取地址，customerId:', records[0].customerId);
          this.setData({
            records: records,
            record: {
              customerName: records[0].customerName,
              customerPhone: records[0].customerPhone,
              customerAddress: '' // 先设置为空，异步获取
            },
            loading: false
          });
          
          // 异步获取地址信息
          this.getCustomerAddress(records[0].customerId, (customerAddress) => {
            console.log('多条记录地址获取回调，地址:', customerAddress);
            // 更新完整的record对象以确保页面重新渲染
            const updatedRecord = { ...this.data.record };
            updatedRecord.customerAddress = customerAddress;
            this.setData({
              record: updatedRecord
            });
            console.log('多条记录地址已更新:', this.data.record);
          });
        },
        fail: err => {
          console.error('加载客户预存记录失败：', err);
          this.setData({
            loading: false
          });
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      });
  },



  editRecord: function() {
    const recordId = this.data.record._id;
    wx.navigateTo({
      url: `/pages/members/editRecord/editRecord?id=${recordId}`
    });
  },

  deleteRecord: function() {
    const recordId = this.data.record._id;
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
                icon: 'success',
                success: () => {
                  setTimeout(() => {
                    wx.navigateBack();
                  }, 1500);
                }
              });
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
  },
  
  // 查看单条记录详情
  viewSingleRecord: function(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.records[index];
    
    this.setData({
      record: record,
      records: []
    });
  },

  // 跳转到订单详情
  goOrderDetail: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orders/orderDetail/orderDetail?id=${orderId}`
    });
  },

  // 获取客户地址信息
  getCustomerAddress: function(customerId, callback) {
    console.log('开始获取客户地址, customerId:', customerId);
    
    if (!customerId) {
      console.log('customerId为空，返回空地址');
      callback('');
      return;
    }
    
    const db = wx.cloud.database();
    db.collection('customers').doc(customerId).get({
      success: res => {
        console.log('获取客户信息成功:', res.data);
        const customer = res.data;
        let address = '';
        
        // 处理contacts字段，可能是字符串也可能是数组
        let contacts = [];
        if (customer && customer.contacts) {
          console.log('原始contacts数据:', customer.contacts, '类型:', typeof customer.contacts);
          
          if (typeof customer.contacts === 'string') {
            try {
              contacts = JSON.parse(customer.contacts);
              console.log('解析JSON字符串后的contacts:', contacts);
            } catch (e) {
              console.error('解析contacts JSON失败:', e);
              contacts = [];
            }
          } else if (Array.isArray(customer.contacts)) {
            contacts = customer.contacts;
            console.log('contacts已经是数组:', contacts);
          }
        }
        
        if (contacts && contacts.length > 0) {
          console.log('客户有联系人信息，联系人数量:', contacts.length);
          
          // 查找默认联系人或第一个有地址的联系人
          const defaultContact = contacts.find(c => c.isDefault) || contacts[0];
          console.log('选择的联系人:', defaultContact);
          
          if (defaultContact) {
            const addressParts = [];
            if (defaultContact.province) {
              console.log('省份:', defaultContact.province);
              addressParts.push(defaultContact.province);
            }
            if (defaultContact.city) {
              console.log('城市:', defaultContact.city);
              addressParts.push(defaultContact.city);
            }
            // 处理区域信息，可能是district字段或region数组
            if (defaultContact.district) {
              console.log('区域(district):', defaultContact.district);
              addressParts.push(defaultContact.district);
            } else if (defaultContact.region && Array.isArray(defaultContact.region) && defaultContact.region.length >= 3) {
              console.log('区域(region):', defaultContact.region[2]);
              addressParts.push(defaultContact.region[2]); // 取第三个元素作为区域
            }
            if (defaultContact.address || defaultContact.addressDetail) {
              const detailAddr = defaultContact.address || defaultContact.addressDetail;
              console.log('详细地址:', detailAddr);
              addressParts.push(detailAddr);
            }
            address = addressParts.join(' ');
            console.log('组合后的完整地址:', address);
          } else {
            console.log('没有找到有效的联系人');
          }
        } else {
          console.log('客户没有联系人信息');
        }
        
        console.log('最终返回的地址:', address);
        callback(address);
      },
      fail: err => {
        console.error('获取客户地址失败:', err);
        callback('');
      }
    });
  },

  // 删除单条预存记录
  deleteSingleRecord: function(e) {
    console.log('点击删除按钮');
    console.log('事件对象:', e);
    
    const recordId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    console.log('记录ID:', recordId);
    console.log('记录索引:', index);
    console.log('当前记录列表:', this.data.records);
    
    // 检查索引是否有效
    if (index === undefined || index === null || !this.data.records || !this.data.records[index]) {
      console.error('无效的记录索引或记录不存在');
      wx.showToast({
        title: '记录信息错误',
        icon: 'none'
      });
      return;
    }
    
    const record = this.data.records[index];
    console.log('要删除的记录:', record);
    
    const typeText = record.type === 'product' ? '产品预存' : '金额预存';
    const detailText = record.type === 'product' ? 
      `${record.productName} 数量${record.quantity}` : 
      `金额¥${record.amount}`;
    
    console.log('显示确认删除对话框');
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条${typeText}记录吗？\n\n${detailText}\n预存时间：${record.createTime}\n\n此操作不可恢复！`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        console.log('用户选择:', res.confirm ? '确认删除' : '取消删除');
        if (res.confirm) {
          this.performDeleteSingleRecord(recordId, index);
        }
      },
      fail: (err) => {
        console.error('显示确认对话框失败:', err);
      }
    });
  },

  // 执行删除单条记录
  performDeleteSingleRecord: function(recordId, index) {
    console.log('开始执行删除操作, recordId:', recordId, 'index:', index);
    
    wx.showLoading({
      title: '正在删除...',
      mask: true
    });
    
    const db = wx.cloud.database();
    db.collection('prepaidRecords').doc(recordId).remove({
      success: () => {
        console.log('数据库删除成功');
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 2000
        });
        
        // 从本地数据中移除该记录
        const newRecords = JSON.parse(JSON.stringify(this.data.records));
        newRecords.splice(index, 1);
        console.log('删除后剩余记录数:', newRecords.length);
        
        if (newRecords.length === 0) {
          // 如果没有记录了，返回上一页
          console.log('没有记录了，返回上一页');
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else if (newRecords.length === 1) {
          // 如果只剩一条记录，切换到单条记录显示模式
          console.log('只剩一条记录，切换到单条记录显示');
          this.setData({
            record: newRecords[0],
            records: []
          });
        } else {
          // 更新记录列表
          console.log('更新记录列表');
          this.setData({
            records: newRecords
          });
        }
        
        // 刷新父页面数据
        const app = getApp();
        if (app && app.globalData && app.globalData.eventBus) {
          console.log('触发父页面数据刷新');
          app.loadPrepaidRecordsFromCloud(true);
        }
      },
      fail: err => {
        console.error('删除预存记录失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      }
    });
  },

  // 删除单条记录（直接模式，用于单条记录显示时）
  deleteSingleRecordDirect: function(e) {
    console.log('点击删除单条记录');
    const recordId = e.currentTarget.dataset.id;
    const record = this.data.record;
    
    console.log('要删除的记录ID:', recordId);
    console.log('当前记录:', record);
    
    if (!record || !recordId) {
      console.error('记录信息错误');
      wx.showToast({
        title: '记录信息错误',
        icon: 'none'
      });
      return;
    }
    
    const typeText = record.type === 'product' ? '产品预存' : '金额预存';
    const detailText = record.type === 'product' ? 
      `${record.productName} 数量${record.quantity}` : 
      `金额¥${record.amount}`;
    
    console.log('显示确认删除对话框');
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条${typeText}记录吗？\n\n${detailText}\n预存时间：${record.createTime}\n\n此操作不可恢复！`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        console.log('用户选择:', res.confirm ? '确认删除' : '取消删除');
        if (res.confirm) {
          this.performDeleteSingleRecordDirect(recordId);
        }
      },
      fail: (err) => {
        console.error('显示确认对话框失败:', err);
      }
    });
  },

  // 执行删除单条记录（直接模式）
  performDeleteSingleRecordDirect: function(recordId) {
    console.log('开始执行删除操作, recordId:', recordId);
    
    wx.showLoading({
      title: '正在删除...',
      mask: true
    });
    
    const db = wx.cloud.database();
    db.collection('prepaidRecords').doc(recordId).remove({
      success: () => {
        console.log('数据库删除成功');
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 2000
        });
        
        // 刷新父页面数据
        const app = getApp();
        if (app && app.globalData && app.globalData.eventBus) {
          console.log('触发父页面数据刷新');
          app.loadPrepaidRecordsFromCloud(true);
        }
        
        // 删除成功后返回上一页
        setTimeout(() => {
          console.log('删除成功，返回上一页');
          wx.navigateBack();
        }, 1500);
      },
      fail: err => {
        console.error('删除预存记录失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      }
    });
  }
}) 