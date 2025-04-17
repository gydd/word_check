// wordCheckApi.js
const app = getApp();

// 错误类型常量
const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',     // 网络错误
  SERVER_ERROR: 'SERVER_ERROR',       // 服务器错误
  AUTH_ERROR: 'AUTH_ERROR',           // 认证错误
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',     // Token过期
  POINTS_NOT_ENOUGH: 'POINTS_NOT_ENOUGH', // 积分不足
  PARAM_ERROR: 'PARAM_ERROR',         // 参数错误
  FILE_ERROR: 'FILE_ERROR',           // 文件错误
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',     // 超时错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'      // 未知错误
};

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 15000;

// 最大重试次数
const MAX_RETRY_COUNT = 2;

/**
 * 处理后端API返回结果的通用方法
 * @param {Object} res API返回的响应对象
 * @param {Function} resolve Promise的resolve函数
 * @param {Function} reject Promise的reject函数
 */
function handleApiResponse(res, resolve, reject) {
  if (res.statusCode !== 200) {
    console.error('API响应状态码错误:', res.statusCode, res);
    
    let errorType = ERROR_TYPES.SERVER_ERROR;
    let errorMsg = '服务器响应异常';
    
    if (res.statusCode >= 500) {
      errorType = ERROR_TYPES.SERVER_ERROR;
      errorMsg = '服务器内部错误，请稍后再试';
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      errorType = ERROR_TYPES.AUTH_ERROR;
      errorMsg = '授权失败，请重新登录';
    } else if (res.statusCode === 404) {
      errorType = ERROR_TYPES.SERVER_ERROR;
      errorMsg = '请求的资源不存在';
    } else if (res.statusCode === 408 || res.statusCode === 504) {
      errorType = ERROR_TYPES.TIMEOUT_ERROR;
      errorMsg = '请求超时，请稍后再试';
    }
    
    wx.showToast({
      title: errorMsg,
      icon: 'none'
    });
    
    reject({ type: errorType, message: errorMsg, statusCode: res.statusCode });
    return;
  }

  const data = res.data;
  if (data.code === 200) {
    // 请求成功
    resolve(data.data);
  } else if (data.code === 401) {
    // 需要登录
    app.clearLoginInfo();
    const error = { type: ERROR_TYPES.TOKEN_EXPIRED, message: '登录已过期，请重新登录' };
    
    wx.showToast({
      title: error.message,
      icon: 'none',
      duration: 2000
    });
    
    setTimeout(() => {
    wx.navigateTo({
      url: '/pages/login/login'
      });
    }, 1500);
    
    reject(error);
  } else if (data.code === 4001) {
    // 积分不足
    const error = { type: ERROR_TYPES.POINTS_NOT_ENOUGH, message: '积分不足，请先充值' };
    
    wx.showToast({
      title: error.message,
      icon: 'none',
      duration: 2000
    });
    
    reject(error);
  } else {
    // 其他业务错误
    const errMsg = data.message || '请求失败';
    const error = { type: ERROR_TYPES.UNKNOWN_ERROR, message: errMsg, code: data.code };
    
    wx.showToast({
      title: errMsg,
      icon: 'none',
      duration: 2000
    });
    
    reject(error);
  }
}

// 获取认证头
function getAuthHeader() {
  const token = wx.getStorageSync('token') || app.globalData.token;
  if (token && !token.startsWith('Bearer ')) {
    return 'Bearer ' + token;
  }
  return token;
}

/**
 * 执行网络请求并处理重试逻辑
 * @param {Function} requestFn 执行请求的函数
 * @param {Number} retryCount 当前重试次数
 * @returns {Promise} 返回请求结果的Promise
 */
function executeWithRetry(requestFn, retryCount = 0) {
  return new Promise((resolve, reject) => {
    requestFn()
      .then(resolve)
      .catch(error => {
        console.log('请求失败:', error, '重试次数:', retryCount);
        
        // 如果是网络错误或超时，且未超过最大重试次数，则重试
        if ((error.type === ERROR_TYPES.NETWORK_ERROR || 
            error.type === ERROR_TYPES.TIMEOUT_ERROR || 
            error.type === ERROR_TYPES.SERVER_ERROR) && 
            retryCount < MAX_RETRY_COUNT) {
          
          const retryDelay = Math.pow(2, retryCount) * 1000; // 指数退避策略
          
          wx.showToast({
            title: `网络请求失败，${retryCount + 1}秒后重试...`,
            icon: 'none',
            duration: retryDelay
          });
          
          setTimeout(() => {
            executeWithRetry(requestFn, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, retryDelay);
        } else {
          reject(error);
        }
      });
  });
}

/**
 * 检查单词拼写
 * @param {Object} params 检查参数
 * @param {String} params.content 待检查的内容
 * @returns {Promise} 返回检查结果的Promise
 */
function checkWord(params) {
  // 参数验证
  if (!params || !params.content) {
    return Promise.reject({ 
      type: ERROR_TYPES.PARAM_ERROR, 
      message: '检查内容不能为空' 
    });
  }
  
  const requestFn = () => {
  return new Promise((resolve, reject) => {
      const requestTask = wx.request({
      url: app.globalData.baseUrl + '/api/v1/word/check',
      method: 'POST',
      data: params,
      header: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json'
      },
      success: (res) => {
        handleApiResponse(res, resolve, reject);
      },
      fail: (err) => {
          console.error('单词拼写检查请求失败:', err);
          
          let errorType = ERROR_TYPES.NETWORK_ERROR;
          let errorMsg = '网络连接失败';
          
          if (err.errMsg && err.errMsg.includes('timeout')) {
            errorType = ERROR_TYPES.TIMEOUT_ERROR;
            errorMsg = '请求超时，请检查网络';
          }
          
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
          
          reject({ type: errorType, message: errorMsg, originalError: err });
        }
      });
      
      // 设置超时
      setTimeout(() => {
        requestTask.abort();
      }, REQUEST_TIMEOUT);
    });
  };
  
  return executeWithRetry(requestFn);
}

/**
 * 上传文件并进行检查
 * @param {Object} params 上传参数
 * @param {String} params.filePath 文件路径
 * @param {Function} params.onProgress 进度回调函数
 * @returns {Promise} 返回检查结果的Promise
 */
function uploadAndCheck(params) {
  // 参数验证
  if (!params || !params.filePath) {
    return Promise.reject({ 
      type: ERROR_TYPES.PARAM_ERROR, 
      message: '文件路径不能为空' 
    });
  }
  
  const requestFn = () => {
    return new Promise((resolve, reject) => {
      const uploadTask = wx.uploadFile({
        url: app.globalData.baseUrl + '/api/v1/word/upload',
        filePath: params.filePath,
        name: 'file',
        header: {
          'Authorization': getAuthHeader()
        },
        success: function(res) {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 200) {
              // 上传成功，获取检查结果
              getCheckResult(data.data.taskId)
                .then(resolve)
                .catch(reject);
            } else if (data.code === 401) {
              // Token失效
              app.clearLoginInfo();
              const error = { type: ERROR_TYPES.TOKEN_EXPIRED, message: '登录已过期，请重新登录' };
              
        wx.showToast({
                title: error.message,
                icon: 'none',
                duration: 2000
              });
              
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/login/login'
                });
              }, 1500);
              
              reject(error);
            } else if (data.code === 4001) {
              // 积分不足
              reject({ type: ERROR_TYPES.POINTS_NOT_ENOUGH, message: '积分不足，请充值' });
            } else if (data.code === 4002) {
              // 文件格式错误
              reject({ type: ERROR_TYPES.FILE_ERROR, message: '不支持的文件格式' });
            } else {
              // 其他错误
              const errMsg = data.message || '上传失败';
              reject({ type: ERROR_TYPES.UNKNOWN_ERROR, message: errMsg, code: data.code });
            }
          } catch (e) {
            console.error('解析上传响应失败:', e);
            reject({ type: ERROR_TYPES.SERVER_ERROR, message: '服务器响应格式错误' });
          }
        },
        fail: function(err) {
          console.error('文件上传请求失败:', err);
          
          let errorType = ERROR_TYPES.NETWORK_ERROR;
          let errorMsg = '网络连接失败';
          
          if (err.errMsg && err.errMsg.includes('timeout')) {
            errorType = ERROR_TYPES.TIMEOUT_ERROR;
            errorMsg = '上传超时，请检查网络';
          }
          
          reject({ type: errorType, message: errorMsg, originalError: err });
        }
      });
      
      // 监听上传进度
      if (params.onProgress && typeof params.onProgress === 'function') {
        uploadTask.onProgressUpdate(res => {
          params.onProgress(res.progress);
        });
      }
      
      // 设置超时（上传文件可能需要更长时间）
      setTimeout(() => {
        uploadTask.abort();
      }, REQUEST_TIMEOUT * 2);
    });
  };
  
  return executeWithRetry(requestFn);
}

/**
 * 获取检查结果
 * @param {String} taskId 任务ID
 * @returns {Promise} 返回检查结果的Promise
 */
function getCheckResult(taskId) {
  if (!taskId) {
    return Promise.reject({ 
      type: ERROR_TYPES.PARAM_ERROR, 
      message: '任务ID不能为空' 
    });
  }
  
  const requestFn = () => {
    return new Promise((resolve, reject) => {
      const requestTask = wx.request({
        url: app.globalData.baseUrl + '/api/v1/word/result?taskId=' + taskId,
        method: 'GET',
        header: {
          'Authorization': getAuthHeader()
        },
        success: function(res) {
          handleApiResponse(res, resolve, reject);
        },
        fail: function(err) {
          console.error('获取检查结果请求失败:', err);
          
          let errorType = ERROR_TYPES.NETWORK_ERROR;
          let errorMsg = '网络连接失败';
          
          if (err.errMsg && err.errMsg.includes('timeout')) {
            errorType = ERROR_TYPES.TIMEOUT_ERROR;
            errorMsg = '请求超时，请检查网络';
          }
          
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
          
          reject({ type: errorType, message: errorMsg, originalError: err });
        }
      });
      
      // 设置超时
      setTimeout(() => {
        requestTask.abort();
      }, REQUEST_TIMEOUT);
    });
  };
  
  return executeWithRetry(requestFn);
}

/**
 * 获取用户积分
 * @returns {Promise} 返回用户积分信息的Promise
 */
function getUserPoints() {
  const requestFn = () => {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      
      if (!token) {
        reject({ type: ERROR_TYPES.AUTH_ERROR, message: '未登录' });
        return;
      }
      
      // 尝试请求新路径
      const tryNewPath = () => {
        const requestTask = wx.request({
          url: app.globalData.baseUrl + '/api/v1/points',
          method: 'GET',
          header: {
            'Authorization': getAuthHeader()
          },
          success: function(res) {
            if (res.statusCode === 404) {
              // 如果新路径返回404，尝试旧路径
              console.log('新路径API不存在，尝试旧路径');
              tryOldPath();
            } else {
              handleApiResponse(res, resolve, reject);
            }
          },
          fail: function(err) {
            console.error('获取积分信息请求失败 (新路径):', err);
            // 尝试旧路径
            tryOldPath();
          }
        });
        
        // 设置超时
        setTimeout(() => {
          requestTask.abort();
        }, REQUEST_TIMEOUT);
      };
      
      // 尝试请求旧路径
      const tryOldPath = () => {
        const requestTask = wx.request({
          url: app.globalData.baseUrl + '/api/v1/point/info',
          method: 'GET',
          header: {
            'Authorization': getAuthHeader()
          },
          success: function(res) {
            handleApiResponse(res, resolve, reject);
          },
          fail: function(err) {
            console.error('获取积分信息请求失败 (旧路径):', err);
            
            let errorType = ERROR_TYPES.NETWORK_ERROR;
            let errorMsg = '网络连接失败';
            
            if (err.errMsg && err.errMsg.includes('timeout')) {
              errorType = ERROR_TYPES.TIMEOUT_ERROR;
              errorMsg = '请求超时，请检查网络';
            }
            
            reject({ type: errorType, message: errorMsg, originalError: err });
          }
        });
        
        // 设置超时
        setTimeout(() => {
          requestTask.abort();
        }, REQUEST_TIMEOUT);
      };
      
      // 先尝试新路径
      tryNewPath();
    });
  };
  
  return executeWithRetry(requestFn);
}

/**
 * 获取单词检查历史
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页数量
 * @param {String} params.isCorrect 筛选类型，可选值：all, correct, incorrect
 * @returns {Promise} 返回历史记录的Promise
 */
function getCheckHistory(params = {}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const isCorrect = params.isCorrect || 'all';
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/word/check/history',
      method: 'GET',
      data: {
        page,
        pageSize,
        isCorrect
      },
      header: {
        'Authorization': getAuthHeader()
      },
      success: (res) => {
        handleApiResponse(res, resolve, reject);
      },
      fail: (err) => {
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * 获取单词检查统计
 * @returns {Promise} 返回统计数据的Promise
 */
function getCheckStats() {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    if (!token) {
      reject(new Error('未登录'));
      return;
    }
    
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/check/stats',
      method: 'GET',
      header: {
        'Authorization': token
      },
      success: function(res) {
        if (res.statusCode === 200) {
          const data = res.data;
          
          if (data.code === 200) {
            resolve(data.data);
          } else {
            const errMsg = data.message || '获取统计信息失败';
            
            if (data.code === 401) {
              // Token失效，清除登录信息并跳转到登录页
              app.clearLoginInfo();
              wx.showToast({
                title: '登录已过期，请重新登录',
                icon: 'none',
                duration: 2000
              });
              
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/login/login'
                });
              }, 1500);
            } else {
              wx.showToast({
                title: errMsg,
                icon: 'none',
                duration: 2000
              });
            }
            
            reject(new Error(errMsg));
          }
        } else {
          const errMsg = `HTTP错误: ${res.statusCode}`;
          wx.showToast({
            title: '网络请求失败',
            icon: 'none',
            duration: 2000
          });
          reject(new Error(errMsg));
        }
      },
      fail: function(err) {
        console.error('获取统计信息请求失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
}

/**
 * 获取积分记录
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页数量
 * @param {String} params.type 记录类型，可选值：all, earn, spend
 * @returns {Promise} 返回积分记录的Promise
 */
function getPointsRecords(params = {}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const type = params.type || 'all';
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/points/records',
      method: 'GET',
      data: {
        page,
        pageSize,
        type
      },
      header: {
        'Authorization': getAuthHeader()
      },
      success: (res) => {
        handleApiResponse(res, resolve, reject);
      },
      fail: (err) => {
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * 创建充值订单
 * @param {Object} params 充值参数
 * @param {Number} params.amount 充值金额
 * @param {String} params.paymentMethod 支付方式，可选值：wxpay
 * @returns {Promise} 返回支付参数的Promise
 */
function createRechargeOrder(params) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    if (!token) {
      reject(new Error('未登录'));
      return;
    }
    
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/point/recharge',
      method: 'POST',
      data: params,
      header: {
        'Authorization': token
      },
      success: function(res) {
        if (res.statusCode === 200) {
          const data = res.data;
          
          if (data.code === 200) {
            resolve(data.data);
          } else {
            const errMsg = data.message || '创建充值订单失败';
            
            if (data.code === 401) {
              // Token失效，清除登录信息并跳转到登录页
              app.clearLoginInfo();
              wx.showToast({
                title: '登录已过期，请重新登录',
                icon: 'none',
                duration: 2000
              });
              
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/login/login'
                });
              }, 1500);
            } else {
              wx.showToast({
                title: errMsg,
                icon: 'none',
                duration: 2000
              });
            }
            
            reject(new Error(errMsg));
          }
        } else {
          const errMsg = `HTTP错误: ${res.statusCode}`;
          wx.showToast({
            title: '网络请求失败',
            icon: 'none',
            duration: 2000
          });
          reject(new Error(errMsg));
        }
      },
      fail: function(err) {
        console.error('创建充值订单请求失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
}

// 导出模块
module.exports = {
  ERROR_TYPES,
  checkWord,
  uploadAndCheck,
  getCheckResult,
  getUserPoints,
  getCheckHistory,
  getCheckStats,
  getPointsRecords,
  createRechargeOrder
}; 