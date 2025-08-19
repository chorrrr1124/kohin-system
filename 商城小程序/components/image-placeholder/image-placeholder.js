// components/image-placeholder/image-placeholder.js
const imageService = require('../../utils/imageService')

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    src: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'default' // product, avatar, banner, category, default
    },
    mode: {
      type: String,
      value: 'aspectFill'
    },
    customClass: {
      type: String,
      value: ''
    },
    customStyle: {
      type: String,
      value: ''
    },
    text: {
      type: String,
      value: '暂无图片'
    },
    showText: {
      type: Boolean,
      value: true
    },
    lazyLoad: {
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    imageError: false,
    processedSrc: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async onImageError(e) {
      console.log('图片加载失败:', e.detail);
      
      // 检查图片是否可访问
      const isAccessible = await imageService.checkImageAccessible(this.data.processedSrc);
      if (!isAccessible) {
        console.log('图片确实无法访问，显示占位符');
        this.setData({
          imageError: true
        });
      }
      
      // 触发父组件的错误处理
      this.triggerEvent('imageerror', {
        src: this.properties.src,
        processedSrc: this.data.processedSrc,
        error: e.detail
      });
    },

    onImageLoad(e) {
      console.log('图片加载成功:', e.detail);
      this.setData({
        imageError: false
      });
      
      // 触发父组件的加载成功事件
      this.triggerEvent('imageload', {
        src: this.properties.src,
        processedSrc: this.data.processedSrc,
        detail: e.detail
      });
    },

    // 处理图片URL
    processImageUrl(src) {
      if (!src) {
        this.setData({ processedSrc: '' });
        return;
      }
      
      const processedSrc = imageService.buildImageUrl(src);
      this.setData({ processedSrc });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件实例进入页面节点树时执行
      this.processImageUrl(this.properties.src);
    },

    detached() {
      // 组件实例被从页面节点树移除时执行
    }
  },

  /**
   * 组件所在页面的生命周期
   */
  pageLifetimes: {
    show() {
      // 页面被展示时执行
    },

    hide() {
      // 页面被隐藏时执行
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'src': function(newSrc) {
      // 当src属性变化时，重置错误状态并处理新的URL
      this.setData({
        imageError: false
      });
      this.processImageUrl(newSrc);
    }
  }
}); 