// pages/admin/homepageSettings/homepageSettings.js
Page({
  data: {
    carouselImages: [],
    promoData: {
      title: '夏日消暑·就喝「丘大叔」',
      subtitle: 'Lemon tea for Uncle Q',
      giftNote: '【赠6元代金券×1】',
      validityNote: '*自购买之日起3年内有效，可转赠可自用',
      prices: [
        { price: 30, originalPrice: 30 },
        { price: 86, originalPrice: 100 },
        { price: 66, originalPrice: 66 },
        { price: 168, originalPrice: 200 }
      ]
    },
    
    // 轮播图编辑相关
    showCarouselModal: false,
    isEditMode: false,
    currentCarousel: {},
    gradientOptions: [
      {
        name: '绿色渐变',
        value: 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)'
      },
      {
        name: '蓝色渐变',
        value: 'linear-gradient(135deg, rgba(33, 150, 243, 0.85) 0%, rgba(63, 81, 181, 0.85) 50%, rgba(103, 58, 183, 0.85) 100%)'
      },
      {
        name: '橙色渐变',
        value: 'linear-gradient(135deg, rgba(255, 152, 0, 0.85) 0%, rgba(255, 87, 34, 0.85) 50%, rgba(244, 67, 54, 0.85) 100%)'
      },
      {
        name: '紫色渐变',
        value: 'linear-gradient(135deg, rgba(156, 39, 176, 0.85) 0%, rgba(123, 31, 162, 0.85) 50%, rgba(81, 45, 168, 0.85) 100%)'
      },
      {
        name: '粉色渐变',
        value: 'linear-gradient(135deg, rgba(233, 30, 99, 0.85) 0%, rgba(236, 64, 122, 0.85) 50%, rgba(240, 98, 146, 0.85) 100%)'
      }
    ],
    
    // 推广内容编辑相关
    showPromoModal: false,
    editingPromo: {}
  },

  onLoad() {
    this.loadCarouselImages();
    this.loadPromoContent();
  },

  // 加载轮播图数据
  loadCarouselImages() {
    wx.cloud.database().collection('homepage_carousel')
      .orderBy('sort', 'asc')
      .get()
      .then(res => {
        this.setData({
          carouselImages: res.data || []
        });
      })
      .catch(err => {
        console.error('加载轮播图失败:', err);
        wx.showToast({
          title: '加载轮播图失败',
          icon: 'error'
        });
      });
  },

  // 加载推广内容
  loadPromoContent() {
    wx.cloud.database().collection('homepage_promo')
      .limit(1)
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          this.setData({
            promoData: { ...this.data.promoData, ...res.data[0] }
          });
        }
      })
      .catch(err => {
        console.error('加载推广内容失败:', err);
      });
  },

  // 添加轮播图
  addCarouselImage() {
    this.setData({
      showCarouselModal: true,
      isEditMode: false,
      currentCarousel: {
        title: '',
        subtitle: '',
        imageUrl: '',
        gradient: this.data.gradientOptions[0].value,
        gradientIndex: 0,
        sort: this.data.carouselImages.length + 1,
        status: 'active'
      }
    });
  },

  // 编辑轮播图
  editCarouselItem(e) {
    const item = e.currentTarget.dataset.item;
    const gradientIndex = this.data.gradientOptions.findIndex(opt => opt.value === item.gradient) || 0;
    
    this.setData({
      showCarouselModal: true,
      isEditMode: true,
      currentCarousel: {
        ...item,
        gradientIndex
      }
    });
  },

  // 删除轮播图
  deleteCarouselItem(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此轮播图吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.database().collection('homepage_carousel')
            .doc(id)
            .remove()
            .then(() => {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadCarouselImages();
            })
            .catch(err => {
              console.error('删除失败:', err);
              wx.showToast({
                title: '删除失败',
                icon: 'error'
              });
            });
        }
      }
    });
  },

  // 选择轮播图图片
  selectCarouselImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.uploadCarouselImage(tempFilePath);
      }
    });
  },

  // 上传轮播图图片
  uploadCarouselImage(filePath) {
    wx.showLoading({
      title: '上传中...'
    });

    const fileName = `carousel/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    
    wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: filePath,
      success: (res) => {
        this.setData({
          'currentCarousel.imageUrl': res.fileID
        });
        wx.hideLoading();
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('上传失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        });
      }
    });
  },

  // 渐变色选择
  onGradientChange(e) {
    const index = e.detail.value;
    this.setData({
      'currentCarousel.gradient': this.data.gradientOptions[index].value,
      'currentCarousel.gradientIndex': index
    });
  },

  // 轮播图表单输入处理
  onCarouselTitleInput(e) {
    this.setData({
      'currentCarousel.title': e.detail.value
    });
  },

  onCarouselSubtitleInput(e) {
    this.setData({
      'currentCarousel.subtitle': e.detail.value
    });
  },

  onCarouselSortInput(e) {
    this.setData({
      'currentCarousel.sort': parseInt(e.detail.value) || 0
    });
  },

  onCarouselStatusChange(e) {
    this.setData({
      'currentCarousel.status': e.detail.value ? 'active' : 'inactive'
    });
  },

  // 保存轮播图
  saveCarouselItem() {
    const { currentCarousel, isEditMode } = this.data;
    
    if (!currentCarousel.title || !currentCarousel.imageUrl) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    const data = {
      title: currentCarousel.title,
      subtitle: currentCarousel.subtitle,
      imageUrl: currentCarousel.imageUrl,
      gradient: currentCarousel.gradient,
      sort: currentCarousel.sort || 0,
      status: currentCarousel.status,
      updateTime: new Date()
    };

    if (isEditMode) {
      // 更新
      wx.cloud.database().collection('homepage_carousel')
        .doc(currentCarousel._id)
        .update({
          data
        })
        .then(() => {
          wx.hideLoading();
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
          this.closeModal();
          this.loadCarouselImages();
        })
        .catch(err => {
          console.error('更新失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '更新失败',
            icon: 'error'
          });
        });
    } else {
      // 新增
      data.createTime = new Date();
      
      wx.cloud.database().collection('homepage_carousel')
        .add({
          data
        })
        .then(() => {
          wx.hideLoading();
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          this.closeModal();
          this.loadCarouselImages();
        })
        .catch(err => {
          console.error('添加失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '添加失败',
            icon: 'error'
          });
        });
    }
  },

  // 关闭轮播图编辑弹窗
  closeModal() {
    this.setData({
      showCarouselModal: false
    });
  },

  // 编辑推广内容
  editPromoContent() {
    this.setData({
      showPromoModal: true,
      editingPromo: JSON.parse(JSON.stringify(this.data.promoData))
    });
  },

  // 推广内容表单输入处理
  onPromoTitleInput(e) {
    this.setData({
      'editingPromo.title': e.detail.value
    });
  },

  onPromoSubtitleInput(e) {
    this.setData({
      'editingPromo.subtitle': e.detail.value
    });
  },

  onPromoGiftNoteInput(e) {
    this.setData({
      'editingPromo.giftNote': e.detail.value
    });
  },

  onPromoValidityNoteInput(e) {
    this.setData({
      'editingPromo.validityNote': e.detail.value
    });
  },

  // 价格设置处理
  onPriceInput(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = parseFloat(e.detail.value) || 0;
    
    this.setData({
      [`editingPromo.prices[${index}].${field}`]: value
    });
  },

  addPriceItem() {
    const prices = this.data.editingPromo.prices || [];
    prices.push({ price: 0, originalPrice: 0 });
    
    this.setData({
      'editingPromo.prices': prices
    });
  },

  removePriceItem(e) {
    const index = e.currentTarget.dataset.index;
    const prices = this.data.editingPromo.prices;
    prices.splice(index, 1);
    
    this.setData({
      'editingPromo.prices': prices
    });
  },

  // 保存推广内容
  savePromoContent() {
    const { editingPromo } = this.data;
    
    wx.showLoading({
      title: '保存中...'
    });

    const data = {
      ...editingPromo,
      updateTime: new Date()
    };

    // 检查是否已存在记录
    wx.cloud.database().collection('homepage_promo')
      .limit(1)
      .get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          // 更新现有记录
          return wx.cloud.database().collection('homepage_promo')
            .doc(res.data[0]._id)
            .update({ data });
        } else {
          // 创建新记录
          data.createTime = new Date();
          return wx.cloud.database().collection('homepage_promo')
            .add({ data });
        }
      })
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        this.setData({
          promoData: editingPromo
        });
        this.closePromoModal();
      })
      .catch(err => {
        console.error('保存失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        });
      });
  },

  // 关闭推广内容编辑弹窗
  closePromoModal() {
    this.setData({
      showPromoModal: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，阻止事件冒泡
  }
}); 