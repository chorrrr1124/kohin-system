// components/responsive-image/responsive-image.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 图片源
    src: {
      type: String,
      value: ''
    },
    // 图片模式
    mode: {
      type: String,
      value: 'aspectFill' // aspectFill, aspectFit, scaleToFill, centerCrop, topCrop, bottomCrop
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    },
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    },
    // 占位符类型
    placeholderType: {
      type: String,
      value: 'default' // default, product, banner, avatar
    },
    // 占位符文本
    placeholderText: {
      type: String,
      value: '暂无图片'
    },
    // 是否显示占位符文本
    showPlaceholderText: {
      type: Boolean,
      value: true
    },
    // 是否懒加载
    lazyLoad: {
      type: Boolean,
      value: true
    },
    // 是否显示操作按钮
    showActions: {
      type: Boolean,
      value: false
    },
    // 是否显示预览按钮
    showPreview: {
      type: Boolean,
      value: true
    },
    // 是否显示下载按钮
    showDownload: {
      type: Boolean,
      value: false
    },
    // 图片尺寸类型
    sizeType: {
      type: String,
      value: 'auto' // auto, square, rectangle, portrait, landscape
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    imageSrc: '',
    imageError: false,
    loading: false,
    imageMode: 'aspectFill',
    imageClass: '',
    processedSrc: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 处理图片源
    processImageSrc() {
      const { src } = this.properties;
      if (!src) {
        this.setData({
          imageSrc: '',
          imageError: false,
          loading: false
        });
        return;
      }

      this.setData({
        loading: true,
        imageError: false
      });

      // 如果是云存储路径，需要获取临时URL
      if (src.startsWith('cloud://')) {
        this.getCloudImageUrl(src);
      } else {
        this.setData({
          imageSrc: src,
          loading: false
        });
      }
    },

    // 获取云存储图片URL
    async getCloudImageUrl(fileID) {
      try {
        const result = await wx.cloud.callFunction({
          name: 'getTempFileURL',
          data: {
            fileID: fileID
          }
        });

        if (result.result && result.result.success) {
          this.setData({
            imageSrc: result.result.data.tempFileURL,
            loading: false
          });
        } else {
          throw new Error(result.result?.error || '获取图片URL失败');
        }
      } catch (error) {
        console.error('获取云存储图片URL失败:', error);
        this.setData({
          imageError: true,
          loading: false
        });
      }
    },

    // 图片加载完成
    onImageLoad(e) {
      this.setData({
        loading: false,
        imageError: false
      });
      this.triggerEvent('load', e.detail);
    },

    // 图片加载失败
    onImageError(e) {
      console.error('图片加载失败:', e.detail);
      this.setData({
        imageError: true,
        loading: false
      });
      this.triggerEvent('error', e.detail);
    },

    // 图片点击
    onImageTap(e) {
      this.triggerEvent('tap', e.detail);
    },

    // 预览图片
    onPreview() {
      const { imageSrc } = this.data;
      if (imageSrc) {
        wx.previewImage({
          urls: [imageSrc],
          current: imageSrc
        });
      }
    },

    // 下载图片
    onDownload() {
      const { imageSrc } = this.data;
      if (imageSrc) {
        wx.downloadFile({
          url: imageSrc,
          success: (res) => {
            if (res.statusCode === 200) {
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => {
                  wx.showToast({
                    title: '保存成功',
                    icon: 'success'
                  });
                },
                fail: () => {
                  wx.showToast({
                    title: '保存失败',
                    icon: 'error'
                  });
                }
              });
            }
          },
          fail: () => {
            wx.showToast({
              title: '下载失败',
              icon: 'error'
            });
          }
        });
      }
    },

    // 更新图片模式
    updateImageMode() {
      const { mode, sizeType } = this.properties;
      let imageMode = 'aspectFill';
      let imageClass = '';

      // 根据模式设置图片显示方式
      switch (mode) {
        case 'aspectFill':
          imageMode = 'aspectFill';
          imageClass = 'aspect-fill';
          break;
        case 'aspectFit':
          imageMode = 'aspectFit';
          imageClass = 'aspect-fit';
          break;
        case 'scaleToFill':
          imageMode = 'scaleToFill';
          imageClass = 'scale-to-fill';
          break;
        case 'centerCrop':
          imageMode = 'aspectFill';
          imageClass = 'center-crop';
          break;
        case 'topCrop':
          imageMode = 'aspectFill';
          imageClass = 'top-crop';
          break;
        case 'bottomCrop':
          imageMode = 'aspectFill';
          imageClass = 'bottom-crop';
          break;
        default:
          imageMode = 'aspectFill';
          imageClass = 'aspect-fill';
      }

      this.setData({
        imageMode,
        imageClass
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.updateImageMode();
      this.processImageSrc();
    }
  },

  /**
   * 数据监听器
   */
  observers: {
    'src': function(newSrc) {
      this.processImageSrc();
    },
    'mode': function() {
      this.updateImageMode();
    }
  }
});
