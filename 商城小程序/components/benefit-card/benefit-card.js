// components/benefit-card/benefit-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 会员等级
    memberLevel: {
      type: Number,
      value: 2
    },
    // 会员等级名称
    memberLevelName: {
      type: String,
      value: '资深养鸭人'
    },
    // 权益数量
    benefitsCount: {
      type: Number,
      value: 5
    },
    // 权益列表
    benefitsList: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onBenefitTap(e) {
      const { benefit } = e.currentTarget.dataset;
      this.triggerEvent('benefittap', { benefit });
    },

    onViewAll() {
      this.triggerEvent('viewall');
    }
  }
}) 