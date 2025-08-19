// pages/admin/addProduct/addProduct.js
Page({
  data: {
    isEdit: false,
    tempImagePath: '',
    submitting: false, // 防止重复提交
    hasUnsavedChanges: false, // 是否有未保存的更改
    originalProductData: {}, // 原始产品数据，用于对比
    product: {
      id: '',
      name: '',
      brand: '',
      type: '',
      category: '',
      specification: '',
      stock: 0,
      price: 0,
      remark: '',
      imagePath: ''
    }
  },

  onLoad: function (options) {
    var self = this;
    // 添加键盘快捷键监听
    this.setupKeyboardShortcuts();
    
    // 判断是否为编辑模式
    if (options.isEdit && options.id) {
      const app = getApp();
      console.log('编辑产品，ID:', options.id);
      
      // 先尝试从globalData.products中查找产品
      let product = app.globalData.products.find(function(p) { return p.id === options.id || p._id === options.id; });
      
      if (product) {
        console.log('从全局数据找到产品:', product);
        this.setData({
          isEdit: true,
          product: product,
          originalProductData: JSON.parse(JSON.stringify(product)), // 深拷贝原始数据
          tempImagePath: product.imagePath || ''
        });
      } else {
        // 如果在products中找不到，则从shopProducts集合中查找
        const db = wx.cloud.database();
        // 创建一个查询条件，同时匹配_id和id字段
        const _ = db.command;
        db.collection('shopProducts').where(_.or([
          { _id: options.id },
          { id: options.id }
        ])).get({
          success: function(res) {
            if (res.data && res.data.length > 0) {
              console.log('从数据库找到产品:', res.data[0]);
              self.setData({
                isEdit: true,
                product: res.data[0],
                originalProductData: JSON.parse(JSON.stringify(res.data[0])), // 深拷贝原始数据
                tempImagePath: res.data[0].imagePath || ''
              });
            } else {
              console.error('未找到商城产品，ID:', options.id);
              wx.showToast({
                title: '获取产品信息失败',
                icon: 'none'
              });
              // 返回上一页
              setTimeout(function() {
                wx.navigateBack();
              }, 1500);
            }
          },
          fail: function(err) {
            console.error('获取商城产品失败：', err);
            wx.showToast({
              title: '获取产品信息失败',
              icon: 'none'
            });
            // 返回上一页
            setTimeout(function() {
              wx.navigateBack();
            }, 1500);
          }
        });
      }
    }
  },
  
  // 选择图片
  chooseImage: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        // 返回选定照片的本地文件路径列表
        self.setData({
          tempImagePath: res.tempFilePaths[0]
        });
        
        // 检查是否有未保存的更改
        self.checkForUnsavedChanges();
      }
    });
  },
  
  // 预览图片
  previewImage: function() {
    if (this.data.tempImagePath) {
      wx.previewImage({
        urls: [this.data.tempImagePath]
      });
    }
  },
  
  // 删除图片
  deleteImage: function() {
    this.setData({
      tempImagePath: ''
    });
    
    // 检查是否有未保存的更改
    self.checkForUnsavedChanges();
  },

  // 提交表单
  submitForm: function (e) {
    // 防止重复提交
    if (this.data.submitting) {
      console.log('表单正在提交中，防止重复点击');
      wx.showToast({
        title: '正在保存中...',
        icon: 'loading',
        duration: 1000
      });
      return;
    }
    var self = this;
    // 从页面数据中获取表单数据，而不是从事件对象中获取
    const formData = this.data.product;
    
    // 表单验证
    if (!formData.name) {
      wx.showToast({
        title: '请输入产品名称',
        icon: 'none'
      });
      return;
    }
    
    if (!formData.stock || isNaN(parseInt(formData.stock))) {
      wx.showToast({
        title: '请输入有效的库存数量',
        icon: 'none'
      });
      return;
    }
    
    // 设置提交状态，防止重复点击
    this.setData({
      submitting: true
    });

    // 显示保存中提示
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    const app = getApp();
    const db = wx.cloud.database();
    
    // 处理表单数据
    const productData = {
      name: formData.name,
      brand: formData.brand || '',
      type: formData.type || '',
      category: formData.category || '',
      specification: formData.specification || '',
      stock: parseInt(formData.stock),
      price: parseFloat(formData.price) || 0,
      remark: formData.remark || '',
      imagePath: this.data.tempImagePath || '',
      createTime: db.serverDate(),
      onSale: true
    };
    
    if (this.data.isEdit) {
      // 编辑现有产品
      productData.id = this.data.product.id || this.data.product._id;
      const docId = this.data.product._id || this.data.product.id;
      
      db.collection('products').doc(docId).update({
        data: productData,
        success: function(res) {
          // 更新本地数据
          const index = app.globalData.products.findIndex(function(p) { return 
            p.id === productData.id || p._id === docId || p.id === docId;
          });
          if (index !== -1) {
            app.globalData.products[index] = productData;
            wx.setStorageSync('products', app.globalData.products);
          }
          
          // 同时更新shopProducts集合中的数据
          db.collection('shopProducts').doc(self.data.product._id || productData.id).update({
            data: productData,
            success: function() {
              console.log('商城产品更新成功');
            },
            fail: function(err) {
              console.error('更新商城产品失败：', err);
            }
          });
          
          // 重置提交状态
          wx.hideLoading();
          self.setData({
            submitting: false,
            hasUnsavedChanges: false // 保存成功后重置未保存标志
          });
          
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          
          // 返回上一页
          setTimeout(function() {
            wx.navigateBack();
          }, 1500);
        },
        fail: function(err) {
          console.error('更新产品失败：', err);
          
          // 重置提交状态
          wx.hideLoading();
          self.setData({
            submitting: false
          });

          wx.showToast({
            title: '更新失败',
            icon: 'none'
          });
        }
      });
    } else {
      // 添加新产品到products集合
      db.collection('products').add({
        data: productData,
        success: function(res) {
          // 添加ID
          productData._id = res._id;
          productData.id = res._id;
          
          // 更新本地数据
          app.globalData.products.push(productData);
          wx.setStorageSync('products', app.globalData.products);
          
          // 同时添加到shopProducts集合
          db.collection('shopProducts').add({
            data: Object.assign({}, productData, {
              id: productData.id,  // 确保ID被正确传递
              _id: productData._id // 确保_id被正确传递
            }),
            success: function(shopRes) {
              console.log('商品同步到商城成功，ID:', productData.id);
              
              // 确保同步库存使用正确的产品ID，在商城产品添加成功后调用
              // 添加ID有效性检查
              if (productData.id) {
                console.log('准备同步库存，产品ID:', productData.id);
                app.syncInventory(productData.id, productData.stock);
              } else if (shopRes._id) {
                // 如果productData.id不存在，尝试使用shopRes._id
                console.log('使用shopRes._id同步库存:', shopRes._id);
                app.syncInventory(shopRes._id, productData.stock);
              } else {
                console.error('无法同步库存：无法获取有效的产品ID');
                wx.showToast({
                  title: '库存同步失败',
                  icon: 'none'
                });
              }
            },
            fail: function(err) {
              console.error('同步到商城失败：', err);
            }
          });
          
          // 如果是新增产品且有初始库存，添加入库记录
          if (productData.stock > 0) {
            const record = {
              productId: productData.id,
              productName: productData.name,
              quantity: productData.stock,
              type: 'in',
              createTime: db.serverDate()
            };
            
            db.collection('records').add({
              data: record,
              success: function(res) {
                record._id = res._id;
                app.globalData.records.unshift(record);
                wx.setStorageSync('records', app.globalData.records);
              }
            });
          }
          
          // 重置提交状态
          wx.hideLoading();
          self.setData({
            submitting: false,
            hasUnsavedChanges: false // 保存成功后重置未保存标志
          });
          
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          
          // 返回上一页
          setTimeout(function() {
            wx.navigateBack();
          }, 1500);
        },
        fail: function(err) {
          console.error('添加产品失败：', err);
          
          // 重置提交状态
          wx.hideLoading();
          self.setData({
            submitting: false
          });

          wx.showToast({
            title: '添加失败',
            icon: 'none'
          });
        }
      });
    }
  },

  // 删除产品
  deleteProduct: function() {
    var self = this;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除产品"${self.data.product.name}"吗？\n删除后不可恢复，且会从商城中移除。`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: function(result) {
        if (result.confirm) {
          const app = getApp();
          const db = wx.cloud.database();
          const docId = self.data.product._id || self.data.product.id;
          
          // 显示加载提示
          wx.showLoading({
            title: '删除中...'
          });
          
          // 从products集合删除
          db.collection('products').doc(docId).remove({
            success: function(res) {
              console.log('从products集合删除成功:', res);
              
              // 从shopProducts集合删除
              db.collection('shopProducts').doc(docId).remove({
                success: function() {
                  console.log('从shopProducts集合删除成功');
                },
                fail: function(err) {
                  console.error('从shopProducts集合删除失败：', err);
                }
              });
              
              // 从本地数据中删除
              const productIndex = app.globalData.products.findIndex(function(p) { return 
                p.id === self.data.product.id || p._id === docId || p.id === docId;
              });
              if (productIndex !== -1) {
                app.globalData.products.splice(productIndex, 1);
                wx.setStorageSync('products', app.globalData.products);
              }
              
              // 从商城产品中删除
              if (app.globalData.shopProducts) {
                const shopProductIndex = app.globalData.shopProducts.findIndex(function(p) { return 
                  p.id === self.data.product.id || p._id === docId || p.id === docId;
                });
                if (shopProductIndex !== -1) {
                  app.globalData.shopProducts.splice(shopProductIndex, 1);
                  wx.setStorageSync('shopProducts', app.globalData.shopProducts);
                }
              }
              
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 返回上一页
              setTimeout(function() {
                wx.navigateBack();
              }, 1500);
            },
            fail: function(err) {
              console.error('删除产品失败：', err);
              wx.hideLoading();
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

  // 📝 表单字段变化处理
  onFieldChange: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    var self = this;    
    // 更新产品数据
    this.setData({
      [`product.${field}`]: value
    });
    
    // 检查是否有未保存的更改
    setTimeout(function() {
      self.checkForUnsavedChanges();
    }, 100); // 延迟检查，确保数据更新完成
  },

  // 🚫 取消操作
  cancelAction: function() {
    if (this.data.hasUnsavedChanges) {
      // 有未保存的更改，显示确认对话框
      wx.showModal({
        title: '确认取消',
        content: '您有未保存的更改，确定要取消吗？',
        confirmText: '确定取消',
        confirmColor: '#ff4d4f',
        cancelText: '继续编辑',
        success: function(result) {
          if (result.confirm) {
            // 用户确认取消，返回上一页
            console.log('用户确认取消编辑');
            wx.navigateBack();
          }
          // 如果用户点击"继续编辑"，什么也不做
        }
      });
    } else {
      // 没有未保存的更改，直接返回
      wx.navigateBack();
    }
  },

  // 🔄 检查表单数据是否有变化
  checkForUnsavedChanges: function() {
    if (this.data.isEdit) {
      // 编辑模式：对比当前数据和原始数据
      const current = this.data.product;
      const original = this.data.originalProductData;
      
      const hasChanges = 
        current.name !== original.name ||
        current.brand !== original.brand ||
        current.type !== original.type ||
        current.category !== original.category ||
        current.specification !== original.specification ||
        current.stock !== original.stock ||
        current.price !== original.price ||
        current.remark !== original.remark ||
        this.data.tempImagePath !== original.imagePath;
      
      this.setData({
        hasUnsavedChanges: hasChanges
      });
    } else {
      // 新建模式：检查是否有任何内容
      const current = this.data.product;
      const hasContent = 
        current.name || 
        current.brand || 
        current.type || 
        current.category || 
        current.specification || 
        current.stock > 0 || 
        current.price > 0 || 
        current.remark || 
        this.data.tempImagePath;
      
      this.setData({
        hasUnsavedChanges: hasContent
      });
    }
  },

  onShow: function () {
    // 启用页面返回拦截
    this.enableBackInterception();
  },

  onHide: function () {
    // 禁用页面返回拦截
    this.disableBackInterception();
  },

  onUnload: function () {
    // 清理键盘监听
    this.cleanupKeyboardShortcuts();
    // 禁用页面返回拦截
    this.disableBackInterception();
  },

  // 🔒 启用返回拦截
  enableBackInterception: function() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 重写onUnload方法来拦截返回
    currentPage.onUnload = (function(original) {
      return function() {
        if (this.data && this.data.hasUnsavedChanges) {
          // 有未保存更改，显示确认对话框
          wx.showModal({
            title: '确认退出',
            content: '您有未保存的更改，确定要退出吗？',
            confirmText: '确定退出',
            confirmColor: '#ff4d4f',
            cancelText: '继续编辑',
            success: function(result) {
              if (result.confirm) {
                // 恢复原始onUnload并执行
                this.onUnload = original;
                wx.navigateBack();
              }
            }
          });
          return false; // 阻止默认返回
        } else {
          // 没有未保存更改，正常返回
          if (original) {
            original.call(this);
          }
        }
      };
    })(currentPage.onUnload);
  },

  // 🔓 禁用返回拦截
  disableBackInterception: function() {
    // 清理拦截逻辑
    // 注意：这里简化处理，实际项目中可能需要更复杂的逻辑
  },

  // 🎹 设置键盘快捷键
  setupKeyboardShortcuts: function() {
    var self = this;
    // 在开发者工具中监听键盘事件
    if (typeof document !== 'undefined') {
      this.keydownHandler = function(e) {
        // Ctrl + S 或 Cmd + S 保存
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          console.log('快捷键保存触发');
          
          // 模拟表单提交（需要构造表单数据）
          const formData = self.getCurrentFormData();
          if (formData) {
            self.submitForm({ detail: { value: formData } });
          }
        }
      };
      
      document.addEventListener('keydown', this.keydownHandler);
    }
  },

  // 🧹 清理键盘快捷键
  cleanupKeyboardShortcuts: function() {
    if (typeof document !== 'undefined' && this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  },

  // 📝 获取当前表单数据（用于快捷键保存）
  getCurrentFormData: function() {
    try {
      // 从当前data中构造表单数据
      return {
        name: this.data.product.name || '',
        brand: this.data.product.brand || '',
        type: this.data.product.type || '',
        category: this.data.product.category || '',
        specification: this.data.product.specification || '',
        stock: this.data.product.stock || 0,
        price: this.data.product.price || 0,
        remark: this.data.product.remark || ''
      };
    } catch (error) {
      console.error('获取表单数据失败:', error);
      return null;
    }
  }
});