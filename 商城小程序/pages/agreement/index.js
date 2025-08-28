Page({
  data: {
    type: 'user',
    loading: true,
    error: '',
    htmlNodes: ''
  },

  onLoad(options){
    const type = (options && options.type) || 'user'
    this.setData({ type })
    this.loadAgreement()
  },

  async loadAgreement(){
    try {
      this.setData({ loading: true, error: '' })
      const res = await wx.cloud.callFunction({ name: 'getPopupContent' })
      const content = res && res.result && res.result.data ? res.result.data : {}
      const html = this.data.type === 'privacy' ? (content.privacyPolicyHtml || '') : (content.userAgreementHtml || '')
      if (!html) {
        this.setData({
          error: '暂未配置协议内容',
          htmlNodes: '<p>暂未配置协议内容，请稍后再试。</p>'
        })
      } else {
        this.setData({ htmlNodes: html })
      }
    } catch (e) {
      this.setData({ error: '加载失败，请稍后重试' })
    } finally {
      this.setData({ loading: false })
      wx.setNavigationBarTitle({ title: this.data.type === 'privacy' ? '隐私政策' : '用户协议' })
    }
  }
}) 