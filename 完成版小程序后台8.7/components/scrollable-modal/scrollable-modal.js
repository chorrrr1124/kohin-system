Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: ''
    },
    content: {
      type: String,
      value: ''
    },
    maxHeight: {
      type: Number,
      value: 600
    },
    showCancel: {
      type: Boolean,
      value: true
    },
    confirmText: {
      type: String,
      value: '确定'
    },
    enablePagination: {
      type: Boolean,
      value: false
    },
    pageData: {
      type: Array,
      value: []
    },
    pageSize: {
      type: Number,
      value: 5
    }
  },

  data: {
    currentPage: 1,
    totalPages: 1,
    currentPageItems: []
  },

  observers: {
    'pageData, pageSize': function(pageData, pageSize) {
      if (pageData && pageData.length > 0 && pageSize > 0) {
        this.updatePagination();
      }
    }
  },

  methods: {
    updatePagination() {
      const { pageData, pageSize } = this.data;
      const totalPages = Math.ceil(pageData.length / pageSize);
      const currentPage = Math.min(this.data.currentPage, totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      const currentPageItems = pageData.slice(startIndex, startIndex + pageSize);

      this.setData({
        currentPage,
        totalPages,
        currentPageItems
      });
    },

    onPrevPage() {
      if (this.data.currentPage > 1) {
        this.setData({
          currentPage: this.data.currentPage - 1
        }, () => {
          this.updatePagination();
        });
      }
    },

    onNextPage() {
      if (this.data.currentPage < this.data.totalPages) {
        this.setData({
          currentPage: this.data.currentPage + 1
        }, () => {
          this.updatePagination();
        });
      }
    },

    onConfirm() {
      this.triggerEvent('confirm');
    },

    onClose() {
      this.triggerEvent('close');
    },

    preventTouchMove() {
      return false;
    }
  }
}) 