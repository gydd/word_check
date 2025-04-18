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

    console.log(`[result.js] 开始加载结果，ID: ${resultId}`);
    
    // 检查是否是模拟模式的结果ID
    if (resultId.startsWith('mock_')) {
      console.log(`[result.js] 检测到模拟结果ID: ${resultId}`);
      // 直接从本地存储获取模拟结果
      const mockResult = wx.getStorageSync('mock_check_result_' + resultId);
      
      if (mockResult) {
        console.log('[result.js] 从本地存储获取模拟结果成功:', mockResult);
        
        // 格式化时间
        if (mockResult.createdAt) {
          mockResult.checkTime = util.formatTime(new Date(mockResult.createdAt));
        }
        
        this.setData({
          result: mockResult,
          loading: false
        });
        return;
      } else {
        console.error('[result.js] 未找到模拟结果数据');
        // 使用API继续尝试获取
      }
    }

    api.getCheckResult(resultId)
      .then(res => {
        console.log('[result.js] 获取结果成功:', res);
        
        // 格式化时间
        if (res.checkTime) {
          res.checkTime = util.formatTime(new Date(res.checkTime));
        } else if (res.createdAt) {
          res.checkTime = util.formatTime(new Date(res.createdAt));
        }
        
        this.setData({
          result: res,
          loading: false
        });
      })
      .catch(err => {
        console.error('[result.js] 获取检测结果失败', err);
        
        // 尝试从本地存储直接获取结果（作为备用方案）
        const backupResult = wx.getStorageSync('mock_check_result_' + resultId) || 
                            wx.getStorageSync('essay_check_result');
        
        if (backupResult) {
          console.log('[result.js] 从本地存储获取备用结果:', backupResult);
          
          // 格式化时间
          if (backupResult.createdAt) {
            backupResult.checkTime = util.formatTime(new Date(backupResult.createdAt));
          } else {
            backupResult.checkTime = util.formatTime(new Date());
          }
          
          this.setData({
            result: backupResult,
            loading: false,
            hasError: false,
            errorMsg: ''
          });
        } else {
          // 真的没有找到任何结果，显示错误
          this.setData({
            loading: false,
            hasError: true,
            errorMsg: err.message || '获取检测结果失败，请重试'
          });
          
          // 显示更详细的错误提示
          wx.showModal({
            title: '获取结果失败',
            content: `无法获取ID为 ${resultId} 的检测结果，建议返回重新检测。`,
            showCancel: true,
            cancelText: '返回',
            confirmText: '重试',
            success: (res) => {
              if (res.confirm) {
                // 重试
                this.loadResult();
              } else {
                // 返回上一页
                wx.navigateBack();
              }
            }
          });
        }
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