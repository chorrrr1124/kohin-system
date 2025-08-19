Page({
  data: {
    order: {},
    loading: true,
    orderStatusText: {
      'pending': '待付款',
      'pending_shipment': '待发货',
      'shipped': '已发货',
      'completed': '已完成'
    }
  },

  onLoad: function(options) {
    // 获取订单ID并加载数据
    console.log('订单详情页面加载，接收到的参数:', options);
    // 检查多种可能的参数名称
    const orderId = options.id || options._id || options.orderId || options.orderid;
    if (orderId) {
      console.log('准备加载订单数据，ID:', orderId);
      this.loadOrderData(orderId);
    } else {
      console.log('未接收到订单ID参数');
      wx.showToast({
        title: '订单信息不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  onShow: function() {
    // 刷新数据，以获取可能的更新
    // 检查多种可能的订单ID
    const orderId = this.data.order.id || this.data.order._id;
    if (orderId) {
      this.loadOrderData(orderId);
    }
  },

  // 检查并创建集合
  checkAndCreateCollection: function(collectionName) {
    return new Promise((resolve) => {
      const db = wx.cloud.database();
      
      // 直接尝试查询，如果集合不存在会自动创建
      db.collection(collectionName).count({
        success: function(res) {
          console.log(`集合 ${collectionName} 已存在，记录数：${res.total}`);
          resolve();
        },
        fail: function(err) {
          console.log(`集合 ${collectionName} 不存在或无法访问`);
          // 尝试直接进行操作，集合会自动创建
                    resolve();
        }
      });
    });
  },

  // 加载订单数据
  loadOrderData: function(orderId) {
    this.setData({
      loading: true
    });
    
    // 获取应用实例，先尝试从本地缓存获取以加速加载
    const app = getApp();
    const cachedOrders = app.globalData.orders || [];
    
    // 如果内存中有订单数据，先尝试从内存中查找
    if (cachedOrders.length > 0) {
      const orderFromCache = cachedOrders.find(o => o.id === orderId || o._id === orderId);
      if (orderFromCache) {
        console.log('从缓存中找到订单数据:', orderFromCache);
        // 显示缓存数据，同时在后台继续加载最新数据
        this.setData({
          order: orderFromCache,
          loading: false,
          fromCache: true
        });
      }
    }
    
    console.log('从云数据库加载订单数据，订单ID:', orderId);
    
    // 无论是否有缓存数据，都从数据库加载最新数据
      const db = wx.cloud.database();
      
    // 优化查询：同时使用_id和id字段查询
    const _ = db.command;
    db.collection('orders').where(
      _.or([
        { _id: orderId },
        { id: orderId }
      ])
    ).get({
        success: res => {
          if (res.data && res.data.length > 0) {
          console.log('云数据库查询成功:', res.data[0]);
            const order = res.data[0];
            
            // 过滤掉临时记录
            if (order._isTemporary) {
              this.setData({
                loading: false
              });
              
            if (!this.data.order || !this.data.order.id) {
              wx.showToast({
                title: '订单不存在',
                icon: 'none'
              });
              
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            }
              
              return;
            }
            
          // 更新到缓存中，提高下次访问速度
          if (cachedOrders.length > 0) {
            const cachedIndex = cachedOrders.findIndex(o => o.id === order.id || o._id === order._id);
            if (cachedIndex !== -1) {
              cachedOrders[cachedIndex] = order;
          } else {
              cachedOrders.push(order);
            }
            app.globalData.orders = cachedOrders;
                  
            // 异步更新本地存储
                    setTimeout(() => {
              wx.setStorageSync('orders', cachedOrders);
            }, 0);
                  }
                  
                  this.setData({
                    order: order,
            loading: false,
            fromCloud: true
                  });
                } else {
          console.log('云数据库中未找到订单，使用本地数据');
          
          if (!this.data.order || !this.data.order.id) {
            // 如果前面没有从缓存中找到，尝试从本地存储获取
            const localOrders = wx.getStorageSync('orders') || [];
            const localOrder = localOrders.find(o => o.id === orderId || o._id === orderId);
                  
            if (localOrder) {
                    this.setData({
                order: localOrder,
                loading: false,
                fromLocal: true
                    });
                  } else {
                    this.setData({
                      loading: false
                    });
                    
                    wx.showToast({
                      title: '订单不存在',
                      icon: 'none'
                    });
                    
                    setTimeout(() => {
                      wx.navigateBack();
                    }, 1500);
                  }
                } else {
            // 如果已经从缓存加载了订单，但云端没有，标记为仅本地数据
                  this.setData({
              loading: false,
              fromCloud: false,
              onlyLocal: true
            });
          }
          }
        },
        fail: err => {
        console.error('查询云数据库失败:', err);
          
        if (!this.data.order || !this.data.order.id) {
          // 如果前面没有从缓存中找到，尝试从本地存储获取
          const localOrders = wx.getStorageSync('orders') || [];
          const localOrder = localOrders.find(o => o.id === orderId || o._id === orderId);
          
          if (localOrder) {
            this.setData({
              order: localOrder,
              loading: false,
              fromLocal: true
            });
          } else {
            this.setData({
              loading: false
            });
            
            wx.showToast({
              title: '加载失败',
              icon: 'none'
            });
          }
        } else {
          // 如果已经从缓存加载了订单，但云端查询失败，标记为仅本地数据
          this.setData({
            loading: false,
            loadError: true
          });
          }
        }
    });
  },
  
  // 查看客户详情
  viewCustomer: function() {
    const customerId = this.data.order.customerId;
    if (customerId) {
      wx.navigateTo({
        url: `/pages/customers/customerDetail/customerDetail?id=${customerId}`
      });
    }
  },
  

  
  // 更新订单状态
  updateOrderStatus: function() {
    const order = this.data.order;
    
    // 根据当前状态更新为下一状态
    let newStatus = '';
    let statusText = '';
    
    switch(order.status) {
      case 'pending':
        newStatus = 'pending_shipment';
        statusText = '已付款，待发货';
        break;
      case 'pending_shipment':
        newStatus = 'shipped';
        statusText = '已发货';
        break;
      case 'shipped':
        newStatus = 'completed';
        statusText = '已完成';
        break;
      default:
        newStatus = order.status;
        statusText = '状态未变更';
    }
    
    // 检查是否需要扣减预存产品数量（当订单状态从已发货变为已完成时）
    const needDeductPrepaid = (order.status === 'shipped' && newStatus === 'completed' && 
                              order.isPrepaidProduct && order.customerId);
    
    // 如果状态没有变化，直接返回
    if (newStatus === order.status) {
      wx.showToast({
        title: '状态未变更',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '更新中...',
      mask: true
    });
    
    // 更新全局数据和本地存储
    const app = getApp();
    let orders = app.globalData.orders || [];
    
    // 如果全局数据为空，尝试从本地存储获取
    if (orders.length === 0) {
      orders = wx.getStorageSync('orders') || [];
    }
    
    // 查找并更新订单
    const orderIndex = orders.findIndex(o => o.id === order.id);
    
    if (orderIndex !== -1) {
      orders[orderIndex].status = newStatus;
      
      // 更新全局数据
      app.globalData.orders = orders;
      
      // 更新本地存储
      wx.setStorageSync('orders', orders);
    }
    
    // 更新云数据库
    const db = wx.cloud.database();
    
    if (order._id) {
      // 如果有_id字段，使用doc方法更新
      db.collection('orders').doc(order._id).update({
        data: {
          status: newStatus
        },
        success: res => {
          console.log('订单状态更新成功', res);
          
          // 如果需要扣减预存产品数量
          if (needDeductPrepaid) {
            // 检查订单中是否包含客户信息和商品信息
            if (!order.items || order.items.length === 0) {
              console.error('无法扣减预存产品：订单中没有商品项');
              wx.showToast({
                title: '订单中没有商品项',
                icon: 'none'
              });
              return;
            }
            
            // 获取客户电话信息，尝试多种可能的来源
            let customerPhone = null;
            // 直接从order对象中获取
            if (order.customerPhone) {
              customerPhone = order.customerPhone;
            } 
            // 从customer对象中获取
            else if (order.customer) {
              if (order.customer.phone) {
                customerPhone = order.customer.phone;
              } else if (order.customer.contacts && order.customer.contacts.length > 0) {
                customerPhone = order.customer.contacts[0].phone;
              }
            }
            
            console.log('准备扣减预存产品，参数:', {
              customerId: order.customerId,
              customerPhone: customerPhone,
              productName: order.items[0].name,
              quantity: order.items[0].quantity,
              orderId: order._id || order.id
            });
            
            // 先尝试查询客户信息，确保数据一致
            const callCloudFunction = () => {
              // 调用云函数扣减预存产品数量
              /*
              wx.cloud.callFunction({
                name: 'updatePrepaidProduct',
                data: {
                  customerId: order.customerId,
                  customerPhone: customerPhone,
                  productName: order.items[0].name,
                  quantity: order.items[0].quantity,
                  orderId: order._id || order.id
                },
                success: prepaidRes => {
                  console.log('预存产品数量扣减结果:', prepaidRes);
                  
                  if (prepaidRes.result && prepaidRes.result.success) {
                    console.log('预存产品数量扣减成功:', prepaidRes.result);
                    
                    // 强制添加出库记录 - 确保云函数没创建时这里也会创建
                    const record = {
                      productId: '',
                      productName: order.items[0].name,
                      quantity: order.items[0].quantity,
                      type: 'out',
                      createTime: db.serverDate(),
                      orderId: order._id || order.id,
                      orderNote: `预存产品扣减(页面): ${order.id}`,
                      customerInfo: order.customerId || order.customerPhone || order.customer
                    };
                    
                    console.log('准备创建预存产品扣减出库记录:', record);
                    
                    db.collection('records').add({
                      data: record,
                      success: (addRes) => {
                        console.log('预存产品扣减出库记录创建成功, ID:', addRes._id);
                        
                        // 直接刷新出入库记录 - 通知用户添加成功
                        wx.showToast({
                          title: '预存产品已扣减',
                          icon: 'success'
                        });
                      },
                      fail: (err) => {
                        console.error('预存产品扣减出库记录创建失败:', err);
                        wx.showToast({
                          title: '预存扣减记录创建失败',
                          icon: 'none'
                        });
                      }
                    });
                    
                    // 同时扣除实际库存数量
                    console.log('开始扣除产品库存数量:', order.items[0].name, order.items[0].quantity);
                    
                    // 查询产品信息以获取产品ID
                    db.collection('products').where({
                      name: order.items[0].name
                    }).get().then(productRes => {
                      if (productRes.data && productRes.data.length > 0) {
                        const product = productRes.data[0];
                        console.log('找到产品信息:', product);
                        
                        const newStock = Math.max(0, product.stock - order.items[0].quantity);
                        
                        // 更新产品库存
                        db.collection('products').doc(product._id).update({
                          data: {
                            stock: newStock
                          },
                          success: () => {
                            console.log(`成功更新产品 ${product.name} 库存为 ${newStock}`);
                            
                            // 获取APP实例以便调用同步库存方法
                            const app = getApp();
                            if (app && app.syncInventory) {
                              // 同时同步更新shopProducts集合中的库存
                              app.syncInventory(product._id, newStock);
                              console.log('已调用syncInventory方法同步更新shopProducts集合库存');
                            }
                            
                            // 更新本地缓存中的产品库存
                            const products = app.globalData.products || [];
                            const productIndex = products.findIndex(p => p._id === product._id);
                            if (productIndex !== -1) {
                              products[productIndex].stock = newStock;
                              // 更新全局数据
                              app.globalData.products = products;
                              // 更新本地存储
                              wx.setStorageSync('products', products);
                              console.log('成功更新本地产品库存缓存');
                            }
                          },
                          fail: err => {
                            console.error(`更新产品 ${product.name} 库存失败:`, err);
                          }
                        });
                      } else {
                        console.error('未找到产品信息:', order.items[0].name);
                      }
                    }).catch(err => {
                      console.error('查询产品信息失败:', err);
                    });
                    
                    // 更新本地预存记录
                    if (prepaidRes.result.updatedRecords) {
                      console.log('开始更新本地预存记录');
                      const prepaidRecords = app.globalData.prepaidRecords || [];
                      prepaidRes.result.updatedRecords.forEach(record => {
                        const index = prepaidRecords.findIndex(r => r._id === record.recordId);
                        if (index !== -1) {
                          prepaidRecords[index].balance = record.remainingBalance;
                          console.log(`更新预存记录 ${record.recordId} 余额为 ${record.remainingBalance}`);
                        }
                      });
                      app.globalData.prepaidRecords = prepaidRecords;
                      wx.setStorageSync('prepaidRecords', prepaidRecords);
                      console.log('本地预存记录更新完成');
                    }
                  } else {
                    console.error('预存产品扣减失败:', prepaidRes.result);
                    wx.showToast({
                      title: prepaidRes.result.message || '预存产品扣减失败',
                      icon: 'none'
                    });
                  }
                },
                fail: prepaidErr => {
                  console.error('预存产品数量扣减失败:', prepaidErr);
                  wx.showToast({
                    title: '预存产品扣减失败',
                    icon: 'none'
                  });
                }
              });
              */
              
              // 直接显示成功信息
              wx.showToast({
                title: '状态已更新',
                icon: 'success'
              });
            };
            
            // 如果有客户ID，先尝试查询客户完整信息
            if (order.customerId) {
              try {
                db.collection('customers').doc(order.customerId).get({
                  success: res => {
                    const customerData = res.data;
                    console.log('获取到客户完整信息:', customerData);
                    
                    // 尝试获取更准确的电话号码
                    if (customerData && !customerPhone) {
                      if (customerData.phone) {
                        customerPhone = customerData.phone;
                      } else if (customerData.contacts && customerData.contacts.length > 0) {
                        customerPhone = customerData.contacts[0].phone;
                      }
                    }
                    
                    callCloudFunction();
                  },
                  fail: err => {
                    console.error('获取客户信息失败:', err);
                    callCloudFunction();
                  }
                });
              } catch (err) {
                console.error('查询客户信息出错:', err);
                callCloudFunction();
              }
            } else {
              callCloudFunction();
            }
          }
          
          // 更新页面数据
          order.status = newStatus;
          this.setData({
            order: order
          });
          
          wx.hideLoading();
          wx.showToast({
            title: statusText,
            icon: 'success'
          });
        },
        fail: err => {
          console.error('订单状态更新失败：', err);
          
          // 即使云数据库更新失败，也更新本地数据
          order.status = newStatus;
          this.setData({
            order: order
          });
          
          wx.hideLoading();
          wx.showToast({
            title: '本地更新成功',
            icon: 'success'
          });
        }
      });
    } else {
      // 如果没有_id字段，使用where查询更新
      db.collection('orders').where({
        id: order.id
      }).update({
        data: {
          status: newStatus
        },
        success: res => {
          console.log('订单状态更新成功', res);
          
          // 更新页面数据
          order.status = newStatus;
          this.setData({
            order: order
          });
          
          wx.hideLoading();
          wx.showToast({
            title: statusText,
            icon: 'success'
          });
        },
        fail: err => {
          console.error('订单状态更新失败：', err);
          
          // 即使云数据库更新失败，也更新本地数据
          order.status = newStatus;
          this.setData({
            order: order
          });
          
          wx.hideLoading();
          wx.showToast({
            title: '本地更新成功',
            icon: 'success'
          });
        }
      });
    }
  },
  
  // 编辑订单
  editOrder: function() {
    const orderId = this.data.order.id;
    wx.navigateTo({
      url: `/pages/orders/addOrder/addOrder?id=${orderId}`
    });
  },

  // 直接扣减预存产品数量（临时解决方案）
  directDeductPrepaid: function() {
    const order = this.data.order;
    
    // 检查订单数据
    if (!order.items || order.items.length === 0) {
      wx.showToast({
        title: '订单中没有商品项',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '手动扣减预存',
      content: `确定要手动扣减 ${order.items[0].name} 预存数量 ${order.items[0].quantity} 个吗？`,
      success: (res) => {
        if (res.confirm) {
          this.manualDeductPrepaid();
        }
      }
    });
  },
  
  // 执行手动扣减预存逻辑
  manualDeductPrepaid: function() {
    const order = this.data.order;
    
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    const db = wx.cloud.database();
    
    // 直接查询预存记录
    db.collection('prepaidRecords').where({
      productName: order.items[0].name,
      type: 'product',
      balance: db.command.gt(0)
    }).get().then(res => {
      console.log('查询到的预存记录:', res.data);
      
      if (!res.data || res.data.length === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '未找到预存记录',
          icon: 'none'
        });
        return;
      }
      
      // 找到可用的记录
      const records = res.data;
      let remainingQuantity = order.items[0].quantity;
      let updatedRecords = [];
      
      // 处理每一条记录
      const processRecords = (index) => {
        if (index >= records.length || remainingQuantity <= 0) {
          // 所有记录处理完毕或数量已满足
          wx.hideLoading();
          if (remainingQuantity > 0) {
            wx.showToast({
              title: `余额不足，还需${remainingQuantity}个`,
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: '扣减成功',
              icon: 'success'
            });
          }
          return;
        }
        
        const record = records[index];
        const deductAmount = Math.min(record.balance, remainingQuantity);
        
        db.collection('prepaidRecords').doc(record._id).update({
          data: {
            balance: db.command.inc(-deductAmount),
            usageRecords: db.command.push({
              date: db.serverDate(),
              quantity: deductAmount,
              orderId: order._id || order.id,
              remark: '手动扣减(订单消费)',
              type: 'consume'
            })
          }
        }).then(res => {
          console.log(`记录 ${record._id} 扣减成功:`, res);
          remainingQuantity -= deductAmount;
          updatedRecords.push({
            recordId: record._id,
            deductAmount: deductAmount,
            remainingBalance: record.balance - deductAmount
          });
          
          // 添加出库记录
          console.log(`准备创建手动扣减预存产品出库记录，产品: ${order.items[0].name}, 数量: ${deductAmount}`);
          
          const outRecord = {
            productId: '',
            productName: order.items[0].name,
            quantity: deductAmount,
            type: 'out',
            createTime: db.serverDate(),
            orderId: order._id || order.id,
            orderNote: `手动扣减预存产品(${new Date().toLocaleString()}): ${order.id}`,
            customerInfo: order.customerId || order.customerPhone || order.customer
          };
          
          db.collection('records').add({
            data: outRecord,
            success: (res) => {
              console.log('手动扣减预存产品出库记录创建成功, ID:', res._id);
              
              // 如果当前是最后一个处理的记录，显示成功提示
              if (remainingQuantity <= 0 || index === records.length - 1) {
                setTimeout(() => {
                  wx.showToast({
                    title: '出入库记录已同步',
                    icon: 'success',
                    duration: 2000
                  });
                }, 500);
              }
            },
            fail: (err) => {
              console.error('手动扣减预存产品出库记录创建失败:', err);
            }
          });
          
          // 同时扣除实际库存数量
          db.collection('products').where({
            name: order.items[0].name
          }).get().then(productRes => {
            if (productRes.data && productRes.data.length > 0) {
              const product = productRes.data[0];
              console.log('找到产品信息:', product);
              
              // 计算本次扣减的数量
              const newStock = Math.max(0, product.stock - deductAmount);
              
              // 更新产品库存
              db.collection('products').doc(product._id).update({
                data: {
                  stock: newStock
                },
                success: () => {
                  console.log(`手动扣减: 成功更新产品 ${product.name} 库存为 ${newStock}`);
                  
                  // 获取APP实例以便调用同步库存方法
                  const app = getApp();
                  if (app && app.syncInventory) {
                    // 同时同步更新shopProducts集合中的库存
                    app.syncInventory(product._id, newStock);
                    console.log('手动扣减: 已调用syncInventory方法同步更新shopProducts集合库存');
                  }
                  
                  // 更新本地缓存中的产品库存
                  const products = app.globalData.products || [];
                  const productIndex = products.findIndex(p => p._id === product._id);
                  if (productIndex !== -1) {
                    products[productIndex].stock = newStock;
                    // 更新全局数据
                    app.globalData.products = products;
                    // 更新本地存储
                    wx.setStorageSync('products', products);
                    console.log('手动扣减: 成功更新本地产品库存缓存');
                  }
                },
                fail: err => {
                  console.error(`手动扣减: 更新产品 ${product.name} 库存失败:`, err);
                }
              });
            } else {
              console.error('手动扣减: 未找到产品信息:', order.items[0].name);
            }
          }).catch(err => {
            console.error('手动扣减: 查询产品信息失败:', err);
          });
          
          // 处理下一条记录
          processRecords(index + 1);
        }).catch(err => {
          console.error(`记录 ${record._id} 扣减失败:`, err);
          // 继续处理下一条
          processRecords(index + 1);
        });
      };
      
      // 开始处理记录
      processRecords(0);
    }).catch(err => {
      console.error('查询预存记录失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '查询预存记录失败',
        icon: 'none'
      });
    });
  },

  processOrder: function() {
    const that = this;
    const order = that.data.order;
    
    // 如果是待付款状态，提供支付选项
    if (order.status === 'pending') {
      this.showPaymentOptions();
      return;
    }
    
    // 其他状态的正常流转
    this.updateOrderStatus();
  },
  
  // 显示支付选项
  showPaymentOptions: function() {
    // 直接确认付款，不再显示微信支付选项
    this.confirmPayment();
  },
  
  // 确认已付款
  confirmPayment: function() {
    wx.showModal({
      title: '确认付款',
      content: '确认该订单已经付款？',
      success: res => {
        if (res.confirm) {
          this.updateOrderStatus();
        }
      }
    });
  },
  
  // 更新订单状态
  updateOrderStatus: function() {
    const that = this;
    const order = that.data.order;
    const app = getApp();
    const orders = app.globalData.orders || [];
    
    // 显示加载提示，防止用户重复点击
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    // 根据当前订单状态确定下一状态
    let newStatus = '';
    let statusText = '';
    
    switch(order.status) {
      case 'pending':
        newStatus = 'pending_shipment';
        statusText = '已付款，待发货';
        break;
      case 'pending_shipment':
        newStatus = 'shipped';
        statusText = '已发货';
        break;
      case 'shipped':
        newStatus = 'completed';
        statusText = '已完成';
        break;
      default:
        newStatus = order.status;
        statusText = '状态未变更';
    }
    
    // 更新内存中订单状态
    const orderIndex = orders.findIndex(o => o.id === order.id || o._id === order._id);
    if (orderIndex !== -1) {
      // 更新内存中的订单状态
      orders[orderIndex].status = newStatus;
      
      // 优化：先更新本地UI，给用户快速反馈
      that.setData({
        order: Object.assign({}, order, {
          status: newStatus
        })
      });
        
      // 立即更新全局数据
      app.globalData.orders = orders;
      
      // 异步更新本地存储
      setTimeout(() => {
        wx.setStorageSync('orders', orders);
      }, 0);
    } else {
      // 如果在全局数据中没找到，就添加到全局数据
      orders.push(Object.assign({}, order, { status: newStatus }));
    }
    
    // 更新本地存储
    wx.setStorageSync('orders', orders);
    
    // 更新云端数据
    const db = wx.cloud.database();
    
    // 首先尝试通过_id更新
    if (order._id) {
      db.collection('orders').doc(order._id).update({
        data: {
          status: newStatus,
          updateTime: db.serverDate()
        },
        success: res => {
          console.log('订单状态更新成功');
          wx.hideLoading();
          wx.showToast({
            title: statusText,
            icon: 'success'
          });
        },
        fail: err => {
          console.error('订单状态更新失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '更新失败，请重试',
            icon: 'none'
          });
        }
      });
    } else {
      // 如果没有_id，通过id字段查找并更新
      db.collection('orders').where({
        id: order.id
      }).update({
        data: {
          status: newStatus,
          updateTime: db.serverDate()
        },
        success: res => {
          console.log('订单状态更新成功');
          wx.hideLoading();
          wx.showToast({
            title: statusText,
            icon: 'success'
          });
        },
        fail: err => {
          console.error('订单状态更新失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '更新失败，请重试',
            icon: 'none'
          });
        }
      });
    }
  },

  // 删除订单（双重确认）
  deleteOrder: function() {
    const that = this;
    const orderId = this.data.order.id;
    
    if (!orderId) {
      wx.showToast({
        title: '订单信息错误',
        icon: 'none'
      });
      return;
    }

    // 第一次确认
    wx.showModal({
      title: '删除确认',
      content: '确定要删除这个订单吗？此操作将同时删除相关的出库记录。',
      confirmText: '继续',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          // 第二次确认
          wx.showModal({
            title: '最终确认',
            content: '删除后无法恢复，请再次确认是否删除该订单？',
            confirmText: '确认删除',
            confirmColor: '#ff4757',
            cancelText: '取消',
            success(res) {
              if (res.confirm) {
                that.performDelete(orderId);
              }
            }
          });
        }
      }
    });
  },

  // 执行删除操作
  performDelete: function(orderId) {
    const that = this;
    
    wx.showLoading({ 
      title: '正在删除...', 
      mask: true 
    });

    const db = wx.cloud.database();
    
    // 删除订单
    db.collection('orders').where({ id: orderId }).remove({
      success: function() {
        console.log('订单删除成功');
        
        // 同步删除相关出库记录
        db.collection('records').where({ orderId: orderId }).remove({
          complete: function() {
            console.log('相关记录删除完成');
            
            // 更新全局缓存和本地缓存
            const app = getApp();
            let orders = app.globalData.orders || [];
            orders = orders.filter(o => o.id !== orderId);
            app.globalData.orders = orders;
            wx.setStorageSync('orders', orders);
            
            wx.hideLoading();
            wx.showToast({ 
              title: '删除成功', 
              icon: 'success',
              duration: 1500
            });
            
            // 延迟返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        });
      },
      fail: function(err) {
        console.error('订单删除失败:', err);
        wx.hideLoading();
        wx.showToast({ 
          title: '删除失败，请重试', 
          icon: 'none' 
        });
      }
    });
  }
})