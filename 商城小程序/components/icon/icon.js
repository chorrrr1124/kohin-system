// components/icon/icon.js
Component({
  properties: {
    // 图标类型
    type: {
      type: String,
      value: ''
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    },
    // 自定义内联样式
    customStyle: {
      type: String,
      value: ''
    }
  },

  data: {},

  methods: {
    // 点击事件
    onIconTap() {
      this.triggerEvent('tap')
    }
  }
}) 