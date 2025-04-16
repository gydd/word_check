// wordCheckApi.js
const app = getApp();

/**
 * 处理后端API返回结果的通用方法
 * @param {Object} res API返回的响应对象
 * @param {Function} resolve Promise的resolve函数
 * @param {Function} reject Promise的reject函数
 */
function handleApiResponse(res, resolve, reject) {
  if (res.statusCode !== 200) {
    wx.showToast({
      title: '网络请求失败',
      icon: 'none'
    });
    reject(new Error('网络请求失败'));
    return;
  }

  const data = res.data;
  if (data.code === 200) {
    // 请求成功
    resolve(data.data);
  } else if (data.code === 401) {
    // 需要登录
    app.clearLoginInfo();
    wx.navigateTo({
      url: '/pages/login/login'
    });
    reject(new Error('登录已过期，请重新登录'));
  } else {
    // 业务错误
    wx.showToast({
      title: data.message || '请求失败',
      icon: 'none'
    });
    reject(new Error(data.message || '请求失败'));
  }
}

// 获取认证头
function getAuthHeader() {
  const token = app.globalData.token;
  if (token && !token.startsWith('Bearer ')) {
    return 'Bearer ' + token;
  }
  return token;
}

/**
 * 检查单词拼写
 * @param {Object} params 检查参数
 * @param {String} params.content 待检查的内容
 * @returns {Promise} 返回检查结果的Promise
 */
function checkWord(params) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/word/check',
      method: 'POST',
      data: params,
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
 * 获取检测结果详情
 * @param {String} resultId 检测结果ID
 * @returns {Promise} 返回检测结果的Promise
 */
function getCheckResult(resultId) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    if (!token) {
      reject(new Error('未登录'));
      return;
    }
    
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/check/result/' + resultId,
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
            const errMsg = data.message || '获取检查结果失败';
            
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
        console.error('获取检查结果请求失败:', err);
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
 * 获取用户积分
 * @returns {Promise} 返回用户积分信息的Promise
 */
function getUserPoints() {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    if (!token) {
      reject(new Error('未登录'));
      return;
    }
    
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/point/info',
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
            const errMsg = data.message || '获取积分信息失败';
            
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
        console.error('获取积分信息请求失败:', err);
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
      url: app.globalData.baseUrl + '/api/v1/point/records',
      method: 'GET',
      data: {
        page,
        size: pageSize,
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
 * 上传文件进行检查
 * @param {Object} params 上传文件参数
 * @param {String} params.filePath 文件路径
 * @param {String} params.fileName 文件名称
 * @returns {Promise} 返回检查结果的Promise
 */
function uploadFileCheck(params) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    if (!token) {
      reject(new Error('未登录'));
      return;
    }
    
    wx.uploadFile({
      url: app.globalData.baseUrl + '/api/v1/check/upload',
      filePath: params.filePath,
      name: 'file',
      formData: {
        fileName: params.fileName
      },
      header: {
        'Authorization': token
      },
      success: function(res) {
        console.log('上传文件响应:', res);
        
        if (res.statusCode === 200) {
          // 将返回的JSON字符串转换为对象
          try {
            const data = JSON.parse(res.data);
            
            if (data.code === 200) {
              resolve(data.data);
            } else {
              const errMsg = data.message || '上传文件失败';
              
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
              } else if (data.code === 4001) {
                // 积分不足
                wx.showToast({
                  title: '积分不足，请充值',
                  icon: 'none',
                  duration: 2000
                });
              } else {
                wx.showToast({
                  title: errMsg,
                  icon: 'none',
                  duration: 2000
                });
              }
              
              reject(new Error(errMsg));
            }
          } catch (e) {
            console.error('解析上传响应失败:', e);
            wx.showToast({
              title: '解析响应数据失败',
              icon: 'none',
              duration: 2000
            });
            reject(new Error('解析响应数据失败'));
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
        console.error('上传文件请求失败:', err);
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

module.exports = {
  checkWord,
  getCheckHistory,
  getCheckStats,
  getCheckResult,
  getUserPoints,
  getPointsRecords,
  createRechargeOrder,
  uploadFileCheck
}; 