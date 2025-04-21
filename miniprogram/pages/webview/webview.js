// webview.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    url: '',
    title: '网页',
    loading: true,
    error: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.url) {
      let url = decodeURIComponent(options.url);
      // 检查URL格式是否正确
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      this.setData({
        url: url,
        title: options.title || '网页'
      });
      
      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: this.data.title
      });
    } else {
      this.setData({
        error: true
      });
      wx.showToast({
        title: '缺少URL参数',
        icon: 'none'
      });
    }
  },

  /**
   * WebView加载完成
   */
  onWebViewLoad: function (e) {
    console.log('WebView加载完成', e);
    this.setData({
      loading: false
    });
  },

  /**
   * WebView加载错误
   */
  onWebViewError: function (e) {
    console.error('WebView加载错误', e);
    this.setData({
      error: true,
      loading: false
    });
    wx.showToast({
      title: '网页加载失败',
      icon: 'none'
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (options) {
    // 来自WebView的分享
    if (options.webViewUrl) {
      return {
        title: this.data.title,
        path: '/pages/webview/webview?url=' + encodeURIComponent(options.webViewUrl)
      }
    }
    
    return {
      title: this.data.title,
      path: '/pages/webview/webview?url=' + encodeURIComponent(this.data.url)
    }
  }
}) 