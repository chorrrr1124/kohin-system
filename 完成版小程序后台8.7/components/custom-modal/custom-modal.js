Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '提示'
    },
    content: {
      type: String,
      value: ''
    },
    showCancel: {
      type: Boolean,
      value: true
    },
    cancelText: {
      type: String,
      value: '取消'
    },
    confirmText: {
      type: String,
      value: '确定'
    }
  },

  methods: {
    onMaskTap() {
      // 点击遮罩层关闭弹窗
      this.onClose();
    },

    stopPropagation() {
      // 阻止事件冒泡，防止点击弹窗内容时关闭
    },

    onClose() {
      this.triggerEvent('close');
    },

    onCancel() {
      this.triggerEvent('cancel');
      this.onClose();
    },

    onConfirm() {
      this.triggerEvent('confirm');
      this.onClose();
    }
  }
}); 