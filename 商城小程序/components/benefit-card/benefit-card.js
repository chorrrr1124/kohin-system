// components/benefit-card/benefit-card.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    benefitsCount: {
      type: Number,
      value: 5
    },
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