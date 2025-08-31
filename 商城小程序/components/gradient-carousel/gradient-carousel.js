// components/gradient-carousel/gradient-carousel.js
Component({
  properties: {
    // 轮播图片数组
    images: {
      type: Array,
      value: []
    },
    // 轮播图高度
    height: {
      type: String,
      value: '100vh'
    },
    // 是否自动播放
    autoplay: {
      type: Boolean,
      value: true
    },
    // 轮播间隔时间
    interval: {
      type: Number,
      value: 10000
    },
    // 切换动画时长
    duration: {
      type: Number,
      value: 800
    },
    // 是否衔接滑动
    circular: {
      type: Boolean,
      value: true
    },
    // 是否显示指示器
    showIndicators: {
      type: Boolean,
      value: true
    },
    // 默认渐变色
    defaultGradient: {
      type: String,
      value: 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)'
    },
    // 触摸灵敏度阈值
    touchThreshold: {
      type: Number,
      value: 50
    }
  },

  data: {
    currentIndex: 0,
    imageLoadedCount: 0,
    // 触摸相关状态
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,
    isTouching: false,
    touchDirection: '', // 'left', 'right', 'up', 'down'
    slideOffset: 0 // 滑动偏移量，用于动画效果
  },

  observers: {
    'images': function(newImages) {
      if (newImages && newImages.length > 0) {
        // 重置当前索引
        this.setData({
          currentIndex: 0,
          imageLoadedCount: 0
        });

        // 启动自动播放
        if (this.properties.autoplay && newImages.length > 1) {
          setTimeout(() => {
            this.startAutoPlay();
          }, 500);
        }
      }
    }
  },

  lifetimes: {
    attached() {
      this.loadCarouselData();
    },

    detached() {
      this.clearAutoPlay();
    }
  },

  methods: {
    // 加载轮播图数据
    loadCarouselData() {
      // 从云数据库加载轮播图配置
      this.loadFromCloud();
    },

    // 从云数据库加载
    loadFromCloud() {
      if (!wx.cloud) {
        console.warn('云开发未初始化');
        return;
      }

      wx.cloud.database().collection('homepage_carousel')
        .where({ status: 'active' })
        .orderBy('sort', 'asc')
        .get()
        .then(res => {
          if (res.data && res.data.length > 0) {
            this.setData({
              images: res.data.map(item => ({
                url: item.imageUrl,
                gradient: item.gradient || this.properties.defaultGradient,
                title: item.title,
                subtitle: item.subtitle,
                link: item.link
              }))
            });

            // 启动自动播放
            if (this.properties.autoplay && res.data.length > 1) {
              setTimeout(() => {
                this.startAutoPlay();
              }, 1000);
            }
          }
        })
        .catch(err => {
          console.error('加载轮播图失败:', err);
          // 使用默认数据
          this.useDefaultImages();
        });
    },

    // 使用默认图片
    useDefaultImages() {
      const defaultImages = [
        {
          url: '/images/banner/banner1.jpg',
          gradient: 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(139, 195, 74, 0.85) 50%, rgba(205, 220, 57, 0.85) 100%)',
          title: '夏日消暑',
          subtitle: 'Lemon tea for Uncle Q'
        },
        {
          url: '/images/banner/banner2.jpg', 
          gradient: 'linear-gradient(135deg, rgba(33, 150, 243, 0.85) 0%, rgba(63, 81, 181, 0.85) 50%, rgba(103, 58, 183, 0.85) 100%)',
          title: '新品推荐',
          subtitle: 'Fresh & Natural'
        },
        {
          url: '/images/banner/banner3.jpg',
          gradient: 'linear-gradient(135deg, rgba(255, 152, 0, 0.85) 0%, rgba(255, 87, 34, 0.85) 50%, rgba(244, 67, 54, 0.85) 100%)',
          title: '会员专享',
          subtitle: 'VIP Exclusive'
        }
      ];

      this.setData({
        images: defaultImages
      });

      // 启动自动播放
      if (this.properties.autoplay && defaultImages.length > 1) {
        setTimeout(() => {
          this.startAutoPlay();
        }, 1000);
      }
    },

    // 外部控制接口 - 切换到指定索引
    switchToIndex(index, silent = false) {
      if (index >= 0 && index < this.data.images.length) {
        if (silent) {
          // 静默切换，不触发事件，避免循环同步
          this.setData({
            currentIndex: index
          });
        } else {
          this.setCurrentIndex(index);
        }
      }
    },

    // 开始自动轮播
    startAutoPlay() {
      if (!this.properties.autoplay || this.data.images.length <= 1) return;
      
      this.clearAutoPlay();
      this.autoPlayTimer = setInterval(() => {
        this.nextSlide();
      }, this.properties.interval);
    },

    // 停止自动轮播
    clearAutoPlay() {
      if (this.autoPlayTimer) {
        clearInterval(this.autoPlayTimer);
        this.autoPlayTimer = null;
      }
    },

    // 下一张图片
    nextSlide() {
      const { currentIndex, images } = this.data;
      const { circular } = this.properties;
      let nextIndex = currentIndex + 1;
      
      if (nextIndex >= images.length) {
        nextIndex = circular ? 0 : images.length - 1;
      }
      
      this.setCurrentIndex(nextIndex);
    },

    // 上一张图片
    prevSlide() {
      const { currentIndex, images } = this.data;
      const { circular } = this.properties;
      let prevIndex = currentIndex - 1;
      
      if (prevIndex < 0) {
        prevIndex = circular ? images.length - 1 : 0;
      }
      
      this.setCurrentIndex(prevIndex);
    },

    // 设置当前索引
    setCurrentIndex(index) {
      if (index === this.data.currentIndex) return;
      
      this.setData({
        currentIndex: index
      });

      // 触发父组件事件
      this.triggerEvent('change', {
        current: index,
        item: this.data.images[index]
      });
    },

    // 指示器点击事件
    onIndicatorTap(e) {
      const index = parseInt(e.currentTarget.dataset.index);
      this.setCurrentIndex(index);
      
      // 重新开始自动播放
      if (this.properties.autoplay) {
        this.startAutoPlay();
      }
    },

    // 图片加载成功
    onImageLoad(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({
        imageLoadedCount: this.data.imageLoadedCount + 1
      });

      // 触发加载完成事件
      if (this.data.imageLoadedCount === this.data.images.length) {
        this.triggerEvent('loaded', {
          total: this.data.images.length
        });
      }
    },

    // 图片加载失败
    onImageError(e) {
      const index = e.currentTarget.dataset.index;
      console.error(`轮播图 ${index} 加载失败`);
      
      // 使用默认图片替换
      const images = this.data.images;
      images[index] = {
        ...images[index],
        url: '/images/default-banner.jpg'
      };
      
      this.setData({ images });
    },

    // 刷新轮播图数据
    refresh() {
      this.setData({
        imageLoadedCount: 0
      });
      this.loadCarouselData();
    },

    // 获取当前图片信息
    getCurrentImage() {
      return this.data.images[this.data.currentIndex];
    },

    // 触摸开始事件
    onTouchStart(e) {
      if (this.data.images.length <= 1) return;
      
      const touch = e.touches[0];
      this.setData({
        touchStartX: touch.clientX,
        touchStartY: touch.clientY,
        isTouching: true,
        slideOffset: 0
      });
      
      // 触摸时暂停自动播放
      if (this.properties.autoplay) {
        this.clearAutoPlay();
      }
    },

    // 触摸移动事件
    onTouchMove(e) {
      if (!this.data.isTouching || this.data.images.length <= 1) return;
      
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;
      
      // 计算触摸移动距离
      const deltaX = currentX - this.data.touchStartX;
      const deltaY = currentY - this.data.touchStartY;
      
      // 判断滑动方向
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > 10) { // 防止误触
          const direction = deltaX > 0 ? 'right' : 'left';
          const offset = deltaX * 0.3; // 滑动跟随效果，系数0.3让跟随更平滑
          
          this.setData({
            touchDirection: direction,
            slideOffset: offset
          });
          
          // 设置动态CSS变量
          this.setSlideOffset(offset);
        }
      } else {
        // 垂直滑动
        if (Math.abs(deltaY) > 10) {
          this.setData({
            touchDirection: deltaY > 0 ? 'down' : 'up'
          });
        }
      }
    },

    // 触摸结束事件
    onTouchEnd(e) {
      if (!this.data.isTouching || this.data.images.length <= 1) return;
      
      const touch = e.changedTouches[0];
      this.setData({
        touchEndX: touch.clientX,
        touchEndY: touch.clientY,
        isTouching: false
      });
      
      // 计算滑动距离
      const deltaX = this.data.touchEndX - this.data.touchStartX;
      const deltaY = this.data.touchEndY - this.data.touchStartY;
      
      // 判断是否为有效的滑动
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.properties.touchThreshold) {
        // 水平滑动且超过阈值
        if (deltaX > 0) {
          // 向右滑动，显示上一张
          this.prevSlide();
        } else {
          // 向左滑动，显示下一张
          this.nextSlide();
        }
      }
      
      // 重置触摸状态
      this.setData({
        touchStartX: 0,
        touchStartY: 0,
        touchEndX: 0,
        touchEndY: 0,
        touchDirection: '',
        slideOffset: 0
      });
      
      // 触摸结束后恢复自动播放
      if (this.properties.autoplay) {
        setTimeout(() => {
          this.startAutoPlay();
        }, 1000);
      }
    },

    // 设置滑动偏移量
    setSlideOffset(offset) {
      const query = this.createSelectorQuery();
      query.select('.background-item.active').fields({
        node: true,
        size: true,
      }, (res) => {
        if (res && res.node) {
          res.node.style.setProperty('--slide-offset', `${offset}px`);
        }
      }).exec();
    },

    // 触摸取消事件
    onTouchCancel(e) {
      this.setData({
        isTouching: false,
        touchStartX: 0,
        touchStartY: 0,
        touchEndX: 0,
        touchEndY: 0,
        touchDirection: '',
        slideOffset: 0
      });
      
      // 恢复自动播放
      if (this.properties.autoplay) {
        setTimeout(() => {
          this.startAutoPlay();
        }, 1000);
      }
    }
  }
}); 