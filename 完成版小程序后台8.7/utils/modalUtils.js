/**
 * 弹窗工具类
 * 用于处理内容过多时的弹窗显示逻辑
 */

/**
 * 显示内容弹窗（自动选择普通弹窗或可滚动弹窗）
 * @param {Object} options 配置选项
 * @param {string} options.title 弹窗标题
 * @param {string} options.content 弹窗内容
 * @param {number} options.maxLines 内容最大行数，超过则使用可滚动弹窗（默认10行）
 * @param {boolean} options.showCancel 是否显示取消按钮
 * @param {string} options.confirmText 确认按钮文本
 * @param {string} options.cancelText 取消按钮文本
 * @param {Function} options.onConfirm 确认回调
 * @param {Function} options.onCancel 取消回调
 * @param {Object} context 页面上下文（this）
 */
function showContentModal(options, context) {
  const {
    title = '提示',
    content = '',
    maxLines = 10,
    showCancel = false,
    confirmText = '确定',
    cancelText = '取消',
    onConfirm = null,
    onCancel = null
  } = options;

  // 计算内容行数（粗略估算）
  const lineCount = content.split('\n').length;
  const charLineCount = Math.ceil(content.length / 30); // 假设每行30个字符
  const estimatedLines = Math.max(lineCount, charLineCount);

  if (estimatedLines > maxLines) {
    // 使用可滚动弹窗
    context.setData({
      showScrollableModal: true,
      scrollableModalTitle: title,
      scrollableModalContent: content,
      scrollableModalShowCancel: showCancel,
      scrollableModalConfirmText: confirmText,
      scrollableModalCancelText: cancelText,
      scrollableModalOnConfirm: onConfirm,
      scrollableModalOnCancel: onCancel
    });
  } else {
    // 使用普通弹窗
    wx.showModal({
      title: title,
      content: content,
      showCancel: showCancel,
      confirmText: confirmText,
      cancelText: cancelText,
      success: (res) => {
        if (res.confirm && onConfirm) {
          onConfirm();
        } else if (res.cancel && onCancel) {
          onCancel();
        }
      }
    });
  }
}

/**
 * 显示分页内容弹窗
 * @param {Object} options 配置选项
 * @param {string} options.title 弹窗标题
 * @param {Array} options.data 分页数据
 * @param {number} options.pageSize 每页显示数量
 * @param {Function} options.formatItem 格式化单项数据的函数
 * @param {boolean} options.showCancel 是否显示取消按钮
 * @param {string} options.confirmText 确认按钮文本
 * @param {Function} options.onConfirm 确认回调
 * @param {Object} context 页面上下文（this）
 */
function showPaginatedModal(options, context) {
  const {
    title = '详情',
    data = [],
    pageSize = 10,
    formatItem = null,
    showCancel = false,
    confirmText = '确定',
    onConfirm = null
  } = options;

  // 如果数据量少，直接显示内容
  if (data.length <= pageSize) {
    let content = '';
    data.forEach((item, index) => {
      if (formatItem) {
        content += formatItem(item, index);
      } else {
        content += JSON.stringify(item);
      }
      if (index < data.length - 1) {
        content += '\n\n';
      }
    });

    showContentModal({
      title,
      content,
      showCancel,
      confirmText,
      onConfirm
    }, context);
  } else {
    // 使用分页弹窗
    context.setData({
      showScrollableModal: true,
      scrollableModalTitle: title,
      scrollableModalContent: '',
      scrollableModalShowCancel: showCancel,
      scrollableModalConfirmText: confirmText,
      scrollableModalEnablePagination: true,
      scrollableModalPageData: data,
      scrollableModalPageSize: pageSize,
      scrollableModalOnConfirm: onConfirm
    });
  }
}

/**
 * 关闭可滚动弹窗的通用方法
 * @param {Object} context 页面上下文（this）
 */
function closeScrollableModal(context) {
  context.setData({
    showScrollableModal: false,
    scrollableModalTitle: '',
    scrollableModalContent: '',
    scrollableModalPageData: [],
    scrollableModalEnablePagination: false,
    scrollableModalOnConfirm: null,
    scrollableModalOnCancel: null
  });
}

/**
 * 为页面添加可滚动弹窗的数据和方法
 * @param {Object} pageData 页面的data对象
 * @param {Object} pageMethods 页面的methods对象
 */
function addScrollableModalSupport(pageData, pageMethods) {
  // 添加数据
  Object.assign(pageData, {
    showScrollableModal: false,
    scrollableModalTitle: '',
    scrollableModalContent: '',
    scrollableModalShowCancel: false,
    scrollableModalConfirmText: '确定',
    scrollableModalCancelText: '取消',
    scrollableModalEnablePagination: false,
    scrollableModalPageData: [],
    scrollableModalPageSize: 10,
    scrollableModalOnConfirm: null,
    scrollableModalOnCancel: null
  });

  // 添加方法
  Object.assign(pageMethods, {
    onScrollableModalConfirm() {
      if (this.data.scrollableModalOnConfirm) {
        this.data.scrollableModalOnConfirm();
      }
      closeScrollableModal(this);
    },

    onScrollableModalCancel() {
      if (this.data.scrollableModalOnCancel) {
        this.data.scrollableModalOnCancel();
      }
      closeScrollableModal(this);
    },

    onScrollableModalClose() {
      closeScrollableModal(this);
    }
  });
}

module.exports = {
  showContentModal,
  showPaginatedModal,
  closeScrollableModal,
  addScrollableModalSupport
}; 