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
    
    // 首先尝试从本地存储获取结果
    const localResult = wx.getStorageSync('checkResult_' + resultId) || 
                        wx.getStorageSync('checkResult');
    
    if (localResult) {
      console.log('[result.js] 从本地存储获取结果成功:', localResult);
      
      // 处理结果数据
      this.processResultData(localResult);
      return;
    }
    
    // 检查是否是模拟模式的结果ID
    if (resultId.startsWith('mock_')) {
      console.log(`[result.js] 检测到模拟结果ID: ${resultId}`);
      // 直接从本地存储获取模拟结果
      const mockResult = wx.getStorageSync('mock_check_result_' + resultId);
      
      if (mockResult) {
        console.log('[result.js] 从本地存储获取模拟结果成功:', mockResult);
        
        // 处理结果数据
        this.processResultData(mockResult);
        return;
      } else {
        console.error('[result.js] 未找到模拟结果数据');
        // 使用API继续尝试获取
      }
    }

    // 如果本地存储没有找到，则调用API获取
    api.getCheckResult(resultId)
      .then(res => {
        console.log('[result.js] 从API获取结果成功:', res);
        
        // 处理结果数据
        this.processResultData(res);
      })
      .catch(err => {
        console.error('[result.js] 从API获取检测结果失败', err);
        
        // 再次尝试从本地存储获取可能的数据
        const fallbackResult = wx.getStorageSync('checkResult');
        
        if (fallbackResult) {
          console.log('[result.js] 从本地存储获取备用结果:', fallbackResult);
          
          // 处理结果数据
          this.processResultData(fallbackResult);
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
   * 处理结果数据
   */
  processResultData: function(data) {
    // 处理数据结构
    let processedResult = data;
    
    // 如果数据是嵌套在result字段中的
    if (data.result) {
      processedResult = {
        ...data,
        ...data.result
      };
    }
    
    // 确保有文本内容
    if (!processedResult.textContent && data.content) {
      processedResult.textContent = data.content;
    }
    
    // 确保有检测时间
    if (!processedResult.checkTime) {
      if (processedResult.timestamp) {
        processedResult.checkTime = util.formatTime(new Date(processedResult.timestamp));
      } else if (processedResult.createdAt) {
        processedResult.checkTime = util.formatTime(new Date(processedResult.createdAt));
      } else {
        processedResult.checkTime = util.formatTime(new Date());
      }
    }
    
    // 确保有文本长度
    if (!processedResult.textLength && processedResult.textContent) {
      processedResult.textLength = processedResult.textContent.length;
    }
    
    // 确保有status字段
    if (!processedResult.status) {
      processedResult.status = 'COMPLETED';
    }
    
    // 确保有issues字段，即使为空
    if (!processedResult.issues) {
      processedResult.issues = [];
    }
    
    console.log('[result.js] 处理后的结果数据:', processedResult);
    
    this.setData({
      result: processedResult,
      loading: false
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