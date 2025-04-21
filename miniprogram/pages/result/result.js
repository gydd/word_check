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
    // 检查是否从历史记录页面进入
    if (options.from === 'history') {
      this.fromHistory = true;
    }
    
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
    
    // 保存历史记录
    this.saveToHistory(processedResult);
  },
  
  /**
   * 保存检测结果到历史记录
   */
  saveToHistory: function(result) {
    // 防止重复保存
    if (this.savedToHistory) {
      return;
    }
    
    // 从历史记录页面进入时不重复保存
    if (this.fromHistory) {
      console.log('[result.js] 从历史记录页面进入，不重复保存');
      return;
    }
    
    // 设置标记，防止重复保存
    this.savedToHistory = true;
    
    // 如果没有有效的结果数据，不保存
    if (!result || !result.textContent) {
      console.log('[result.js] 没有有效结果数据，不保存历史记录');
      return;
    }
    
    console.log('[result.js] 开始保存历史记录');
    
    // 计算消耗的积分（基于内容长度或复杂度）
    const pointCost = result.pointCost || 
                     Math.max(1, Math.floor((result.textLength || result.content?.length || 0) / 100));
    
    // 准备保存数据
    const historyData = {
      title: result.title || '文本检测',
      content: result.textContent || result.content,
      modelId: result.modelId || 1,
      modelName: result.modelName || getApp().globalData.currentModelName || '默认模型',
      pointCost: pointCost,
      score: result.score || 0,
      textLength: result.textLength || (result.textContent ? result.textContent.length : 0)
    };
    
    // 调用API保存历史记录
    this.trySaveHistory(historyData, 0);
    
    // 扣减用户积分
    this.deductUserPoints(pointCost);
  },
  
  /**
   * 扣减用户积分
   * @param {Number} points 要扣减的积分数量
   */
  deductUserPoints: function(points) {
    const pointApi = require('../../api/pointApi');
    if (!pointApi || !pointApi.deductPoints) {
      console.error('[result.js] 无法加载积分API或扣减积分功能不可用');
      return;
    }
    
    console.log(`[result.js] 开始扣减用户积分: ${points}点`);
    
    // 调用积分扣减API
    pointApi.deductPoints({
      points: points,
      reason: '文本检测消费'
    }).then(res => {
      console.log('[result.js] 积分扣减成功:', res);
      // 更新全局状态，表示积分已发生变化
      getApp().globalData.pointsChanged = true;
    }).catch(err => {
      console.error('[result.js] 积分扣减失败:', err);
      // 这里不需要用户提示，因为即使积分扣减失败，检测结果仍然有效
    });
  },
  
  /**
   * 尝试保存历史记录（带重试）
   * @param {Object} data 历史记录数据
   * @param {Number} retryCount 当前重试次数
   */
  trySaveHistory: function(data, retryCount = 0) {
    const maxRetries = 2; // 最大重试次数
    
    console.log(`[result.js] 尝试保存历史记录，重试次数: ${retryCount}`);
    
    api.saveCheckHistory(data)
      .then(res => {
        console.log('[result.js] 历史记录保存成功:', res);
      })
      .catch(err => {
        console.error('[result.js] 保存历史记录失败:', err);
        
        // 如果服务器返回500错误且未超过重试次数，则尝试重试
        if (retryCount < maxRetries && err && 
           (err.message && err.message.includes('500') || 
            (err.statusCode && err.statusCode === 500))) {
          
          console.log(`[result.js] 服务器错误，${retryCount + 1}秒后重试...`);
          
          // 延迟后重试
          setTimeout(() => {
            this.trySaveHistory(data, retryCount + 1);
          }, (retryCount + 1) * 1000);
        }
        // 失败时不显示错误给用户，因为这不影响当前检测结果的显示
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