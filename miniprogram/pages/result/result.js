// result.js
const app = getApp();
const api = require('../../api/wordCheckApi');
const util = require('../../utils/util');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    resultId: '', // 检测结果ID
    loading: true, // 是否正在加载
    hasError: false, // 是否有错误
    errorMsg: '', // 错误信息
    result: null, // 检测结果
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.id) {
      this.setData({
        resultId: options.id
      });
      this.loadResult();
    } else {
      this.setData({
        loading: false,
        hasError: true,
        errorMsg: '未找到检测结果ID'
      });
    }
  },

  /**
   * 加载检测结果
   */
  loadResult: function () {
    const { resultId } = this.data;
    
    if (!resultId) {
      this.setData({
        loading: false,
        hasError: true,
        errorMsg: '检测结果ID无效'
      });
      return;
    }

    this.setData({
      loading: true,
      hasError: false,
      errorMsg: ''
    });

    api.getCheckResult(resultId)
      .then(res => {
        // 格式化时间
        if (res.checkTime) {
          res.checkTime = util.formatTime(new Date(res.checkTime));
        }
        
        this.setData({
          result: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('获取检测结果失败', err);
        this.setData({
          loading: false,
          hasError: true,
          errorMsg: err.message || '获取检测结果失败，请重试'
        });
      });
  },

  /**
   * 分享检测结果
   */
  shareResult: function () {
    // 实现分享逻辑
    wx.showToast({
      title: '暂不支持分享功能',
      icon: 'none'
    });
  },

  /**
   * 返回检测页面
   */
  returnToUpload: function () {
    wx.navigateBack();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { resultId } = this.data;
    return {
      title: '文本检测结果',
      path: `/pages/result/result?id=${resultId}`
    };
  }
}); 