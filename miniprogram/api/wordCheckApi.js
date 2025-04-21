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
  
  // 检查是否使用模拟模式
  if (shouldUseMockMode()) {
    console.log('[wordCheckApi] 启用模拟模式');
    return mockCheckWord(params);
  }
  
  // 要尝试的API路径列表，按优先级顺序排列
  const apiPaths = [
    '/essay/check',
    '/essays/check',
    '/word/check',
    '/check',
    '/check/essay'
  ];
  
  // 递归尝试不同的API路径
  const tryApiPath = (pathIndex = 0) => {
    if (pathIndex >= apiPaths.length) {
      console.log('[wordCheckApi] 所有API路径都尝试失败，切换到模拟模式');
      
      // 自动启用模拟模式
      wx.setStorageSync('use_mock_api', 'true');
      
      // 显示提示
      wx.showModal({
        title: 'API连接问题',
        content: '无法连接到后端API，已自动切换到模拟模式。',
        showCancel: false
      });
      
      // 返回模拟检查结果
      return mockCheckWord(params);
    }
    
    const currentPath = apiPaths[pathIndex];
    console.log(`[wordCheckApi] 尝试API路径: ${currentPath}`);
    
    const requestFn = () => {
      return new Promise((resolve, reject) => {
        const requestTask = wx.request({
          url: app.globalData.baseUrl + currentPath,
          method: 'POST',
          data: params,
          header: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json'
          },
          success: (res) => {
            if (res.statusCode === 404) {
              console.log(`[wordCheckApi] 路径 ${currentPath} 返回404，尝试下一个路径`);
              // 这个路径不存在，尝试下一个
              tryApiPath(pathIndex + 1).then(resolve).catch(reject);
            } else {
              // 如果找到了可用路径，记录下来
              if (res.statusCode === 200) {
                const workingPath = currentPath;
                wx.setStorageSync('working_api_path', workingPath);
                console.log(`[wordCheckApi] 找到可用的API路径: ${workingPath}`);
              }
              
              handleApiResponse(res, resolve, reject);
            }
          },
          fail: (err) => {
            console.error(`[wordCheckApi] ${currentPath} 请求失败:`, err);
            
            let errorType = ERROR_TYPES.NETWORK_ERROR;
            let errorMsg = '网络连接失败';
            
            if (err.errMsg && err.errMsg.includes('timeout')) {
              errorType = ERROR_TYPES.TIMEOUT_ERROR;
              errorMsg = '请求超时，请检查网络';
            }
            
            // 不显示toast，避免多个路径尝试时反复显示
            reject({ type: errorType, message: errorMsg, originalError: err });
          }
        });
        
        // 设置超时
        setTimeout(() => {
          requestTask.abort();
        }, REQUEST_TIMEOUT);
      });
    };
    
    return requestFn();
  };
  
  // 先检查之前找到的可用路径
  const workingPath = wx.getStorageSync('working_api_path');
  if (workingPath) {
    console.log(`[wordCheckApi] 使用之前找到的可用路径: ${workingPath}`);
    // 将可用路径放到列表最前面
    const pathIndex = apiPaths.indexOf(workingPath);
    if (pathIndex > 0) {
      apiPaths.splice(pathIndex, 1);
      apiPaths.unshift(workingPath);
    }
  }
  
  // 开始尝试API路径
  return tryApiPath(0);
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
 * 上传文件并进行检查 - 为upload.js页面提供的接口
 * @param {Object} params 上传参数
 * @param {String} params.filePath 文件路径
 * @param {String} params.fileName 文件名称
 * @param {Function} params.onProgress 进度回调函数（可选）
 * @returns {Promise} 返回检查结果的Promise
 */
function uploadFileCheck(params) {
  console.log('[wordCheckApi] 开始上传文件检查, 参数:', params);
  
  // 参数验证
  if (!params || !params.filePath) {
    return Promise.reject({ 
      type: ERROR_TYPES.PARAM_ERROR, 
      message: '文件路径不能为空' 
    });
  }
  
  // 确保有文件名
  if (!params.fileName && params.filePath) {
    const pathParts = params.filePath.split('/');
    params.fileName = pathParts[pathParts.length - 1];
  }
  
  return new Promise((resolve, reject) => {
    const uploadTask = wx.uploadFile({
      url: app.globalData.baseUrl + '/api/v1/word/upload',
      filePath: params.filePath,
      name: 'file',
      formData: {
        fileName: params.fileName
      },
      header: {
        'Authorization': getAuthHeader()
      },
      success: function(res) {
        console.log('[wordCheckApi] 文件上传响应:', res);
        try {
          // 微信小程序uploadFile返回的数据是字符串，需要解析为JSON
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            // 上传成功，直接返回结果，不再调用getCheckResult
            console.log('[wordCheckApi] 文件上传成功:', data.data);
            resolve({
              resultId: data.data.taskId,
              status: 'success',
              message: '文件上传成功'
            });
          } else if (data.code === 401) {
            // Token失效
            app.clearLoginInfo();
            const error = { type: ERROR_TYPES.TOKEN_EXPIRED, message: '登录已过期，请重新登录' };
            
            wx.showToast({
              title: error.message,
              icon: 'none'
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
              icon: 'none'
            });
            
            reject(error);
          } else {
            // 其他业务错误
            const errMsg = data.message || '上传失败';
            const error = { type: ERROR_TYPES.UNKNOWN_ERROR, message: errMsg, code: data.code };
            
            wx.showToast({
              title: errMsg,
              icon: 'none'
            });
            
            reject(error);
          }
        } catch (e) {
          console.error('[wordCheckApi] 解析上传响应失败:', e);
          reject({ type: ERROR_TYPES.SERVER_ERROR, message: '服务器响应格式错误', originalError: e });
        }
      },
      fail: function(err) {
        console.error('[wordCheckApi] 文件上传请求失败:', err);
        
        let errorType = ERROR_TYPES.NETWORK_ERROR;
        let errorMsg = '网络连接失败';
        
        if (err.errMsg && err.errMsg.includes('timeout')) {
          errorType = ERROR_TYPES.TIMEOUT_ERROR;
          errorMsg = '上传超时，请检查网络';
        }
        
        wx.showToast({
          title: errorMsg,
          icon: 'none'
        });
        
        reject({ type: errorType, message: errorMsg, originalError: err });
      }
    });
    
    // 注册上传进度事件
    if (typeof params.onProgress === 'function') {
      uploadTask.onProgressUpdate((res) => {
        params.onProgress(res.progress);
      });
    }
  });
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
  
  // 检查是否为模拟数据的ID
  if (taskId.startsWith('mock_')) {
    console.log(`[wordCheckApi] 检测到模拟模式结果ID: ${taskId}，从本地存储获取结果`);
    
    return new Promise((resolve, reject) => {
      // 从本地存储获取模拟结果
      const mockResult = wx.getStorageSync('mock_check_result_' + taskId);
      
      if (mockResult) {
        console.log('[wordCheckApi] 从本地存储获取到模拟结果:', mockResult);
        // 返回模拟结果
        resolve(mockResult);
      } else {
        console.error('[wordCheckApi] 未找到对应的模拟结果:', taskId);
        // 如果找不到对应的模拟结果
        reject({ 
          type: ERROR_TYPES.UNKNOWN_ERROR, 
          message: '未找到模拟结果数据' 
        });
      }
    });
  }
  
  // 非模拟模式，正常从API获取结果
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
 * @param {Object} options 选项
 * @param {Boolean} options.silentFail 是否静默失败（不显示错误提示）
 * @returns {Promise} 返回用户积分信息的Promise
 */
function getUserPoints(options = {}) {
  const silentFail = options.silentFail || false;
  
  // 设置一个标志避免路径尝试重复执行
  let apiPathAttempted = false;
  
  // 不使用重试机制，直接返回单次请求的Promise
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
            if (!apiPathAttempted) {
              apiPathAttempted = true;
              tryOldPath();
            } else {
              // 避免无限循环
              handleApiFailure({ statusCode: 404, message: '积分API不存在' });
            }
          } else {
            handleApiResponse(res, resolve, reject);
          }
        },
        fail: function(err) {
          console.error('获取积分信息请求失败 (新路径):', err);
          // 尝试旧路径
          if (!apiPathAttempted) {
            apiPathAttempted = true;
            tryOldPath();
          } else {
            // 避免无限循环
            handleApiFailure(err);
          }
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
          if (res.statusCode === 404) {
            handleApiFailure({ statusCode: 404, message: '积分API不存在' });
          } else {
            handleApiResponse(res, resolve, reject);
          }
        },
        fail: function(err) {
          console.error('获取积分信息请求失败 (旧路径):', err);
          handleApiFailure(err);
        }
      });
      
      // 设置超时
      setTimeout(() => {
        requestTask.abort();
      }, REQUEST_TIMEOUT);
    };
    
    // 统一处理失败
    const handleApiFailure = (err) => {
      let errorType = ERROR_TYPES.NETWORK_ERROR;
      let errorMsg = '网络连接失败';
      let statusCode = err.statusCode || 0;
      
      if (err.errMsg && err.errMsg.includes('timeout')) {
        errorType = ERROR_TYPES.TIMEOUT_ERROR;
        errorMsg = '请求超时，请检查网络';
      } else if (statusCode === 404) {
        errorType = ERROR_TYPES.SERVER_ERROR;
        errorMsg = '请求的资源不存在';
      }
      
      // 如果是静默失败模式，不显示提示
      if (!silentFail) {
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }
      
      reject({ 
        type: errorType, 
        message: errorMsg, 
        originalError: err,
        statusCode: statusCode
      });
    };
    
    // 先尝试新路径
    tryNewPath();
  });
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

/**
 * 诊断API路径状态
 * @returns {Promise} 返回诊断结果的Promise
 */
function diagnoseApiPaths() {
  console.log('[wordCheckApi] 开始诊断API路径');
  
  // 要测试的API路径列表
  const apiPaths = [
    '/essay/check',
    '/essays/check',
    '/word/check',
    '/check',
    '/check/essay'
  ];
  
  const results = {};
  
  // 创建所有测试请求的数组
  const requests = apiPaths.map(path => {
    return new Promise(resolve => {
      wx.request({
        url: app.globalData.baseUrl + path,
        method: 'GET',
        timeout: 5000,
        success: (res) => {
          results[path] = {
            statusCode: res.statusCode,
            isAvailable: res.statusCode !== 404,
            response: res.data
          };
          resolve();
        },
        fail: (err) => {
          results[path] = {
            error: err.errMsg,
            isAvailable: false
          };
          resolve();
        }
      });
    });
  });
  
  // 等待所有请求完成
  return Promise.all(requests).then(() => {
    console.log('[wordCheckApi] API诊断结果:', results);
    
    // 找到可能可用的API路径
    const availablePaths = Object.keys(results).filter(path => 
      results[path].isAvailable
    );
    
    console.log('[wordCheckApi] 可能可用的API路径:', availablePaths);
    
    return {
      results,
      availablePaths,
      allFailed: availablePaths.length === 0
    };
  });
}

/**
 * 当真实API无法使用时，提供模拟检查功能
 * @param {Object} params 检查参数
 * @returns {Promise} 返回模拟检查结果的Promise
 */
function mockCheckWord(params) {
  console.log('[wordCheckApi] 使用模拟版本的checkWord函数');
  
  return new Promise((resolve) => {
    // 延迟2秒，模拟网络请求
    setTimeout(() => {
      // 生成随机ID
      const resultId = 'mock_' + Date.now();
      
      // 简单分析内容
      const content = params.content || '';
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      
      // 生成模拟错误（为了展示功能）
      const mockErrors = [];
      const words = content.split(/\s+/);
      words.forEach((word, index) => {
        // 随机为约15%的单词标记错误
        if (word.length > 3 && Math.random() < 0.15) {
          mockErrors.push({
            word: word,
            position: {
              start: content.indexOf(word),
              end: content.indexOf(word) + word.length
            },
            suggestions: [
              word.charAt(0).toUpperCase() + word.slice(1), // 首字母大写
              word + 's',  // 添加s
              word + 'ed'  // 添加ed
            ],
            type: Math.random() > 0.5 ? 'spelling' : 'grammar',
            description: Math.random() > 0.5 ? 
              '可能存在拼写错误' : '请检查语法使用'
          });
        }
      });
      
      // 模拟评估分数 (0-100)
      const score = Math.floor(70 + Math.random() * 30);
      
      // 模拟检查结果
      const result = {
        id: resultId,
        content: content,
        wordCount: wordCount,
        status: 'completed',
        createdAt: new Date().toISOString(),
        errors: mockErrors,
        score: score,
        feedback: {
          summary: `这是一段${wordCount}字的文本，总体评分为${score}分。`,
          strengths: ['表达比较清晰', '结构基本合理'],
          suggestions: mockErrors.length > 0 ? 
            ['注意拼写和语法错误', '可以增加更多细节'] : 
            ['可以增加更多细节', '考虑使用更丰富的词汇']
        },
        isMock: true
      };
      
      // 本地存储结果，添加命名空间前缀
      wx.setStorageSync('mock_check_result_' + resultId, result);
      
      // 返回结果ID
      resolve({
        id: resultId,
        status: 'success',
        message: '模拟检查完成',
        isMock: true
      });
    }, 2000);
  });
}

// 检查是否使用模拟模式
function shouldUseMockMode() {
  // 检查本地存储的设置
  const useMock = wx.getStorageSync('use_mock_api') === 'true';
  // 检查全局设置
  const appUseMock = app.globalData.useMockApi;
  
  return useMock || appUseMock;
}

// 导出模块
module.exports = {
  ERROR_TYPES,
  checkWord,
  uploadAndCheck,
  uploadFileCheck,
  getCheckResult,
  getUserPoints,
  getCheckHistory,
  getCheckStats,
  getPointsRecords,
  createRechargeOrder,
  // 新增的工具函数
  diagnoseApiPaths,
  mockCheckWord,
  shouldUseMockMode
}; 