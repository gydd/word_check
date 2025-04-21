// signInApi.js
const app = getApp();
const config = require('../config/config.js'); // 引入config

// 定义API错误类型常量
const API_ERROR_TYPES = {
  SUCCESS: { code: 200, message: '成功' },
  UNAUTHORIZED: { code: 401, message: '未授权，请登录' },
  ALREADY_SIGNED: { code: 4001, message: '今日已签到' }, 
  NETWORK_ERROR: { code: 5000, message: '网络连接错误' },
  TIMEOUT_ERROR: { code: 5001, message: '请求超时' },
  UNKNOWN_ERROR: { code: 9999, message: '未知错误' }
};

/**
 * 处理后端API返回结果的通用方法
 * @param {Object} res API返回的响应对象
 * @param {Function} resolve Promise的resolve函数
 * @param {Function} reject Promise的reject函数
 */
function handleApiResponse(res, resolve, reject) {
  if (res.statusCode !== 200) {
    const errorMsg = `网络请求失败 (${res.statusCode})`;
    console.error('签到API请求失败:', res);
    
    wx.showToast({
      title: errorMsg,
      icon: 'none'
    });
    reject(new Error(errorMsg));
    return;
  }

  const data = res.data;
  console.log('签到API响应:', data);
  
  // 简化返回码检查逻辑
  const successCode = data.code === 200 || data.error === 0;
  const alreadySignedCode = data.code === 4001 || data.error === 4001;
  const unauthorizedCode = data.code === 401 || data.error === 401;
  
  // 提取响应数据，兼容两种格式
  const responseData = data.data || data.body || {};
  const isAlreadySigned = alreadySignedCode || responseData.hasSigned === true;
  
  // 标准化错误消息
  const errorMsg = data.message || (responseData && responseData.message) || '未知错误';

  // 提取签到信息
  const signInInfo = {
    hasSigned: responseData.hasSigned === true,
    continuousDays: responseData.continuousDays || 0,
    points: responseData.points || 0,
    totalDays: responseData.totalDays || responseData.totalSignDays || 0,
    addedPoints: responseData.addedPoints || 0
  };

  // 处理不同情况
  if (successCode) {
    // 检查返回数据中是否表明已签到
    if (responseData && responseData.hasSigned === true) {
      resolve({
        success: false,
        alreadySigned: true,
        message: '今日已签到，请明天再来',
        data: signInInfo
      });
    } else {
      resolve({
        success: true,
        data: signInInfo
      });
    }
  } else if (unauthorizedCode) {
    // 需要登录
    console.warn('签到API需要登录');
    app.clearLoginInfo && app.clearLoginInfo();
    wx.navigateTo({
      url: '/pages/login/login'
    });
    reject(new Error('登录已过期，请重新登录'));
  } else if (isAlreadySigned) {
    // 已签到 - 直接返回标准化格式
    console.warn('签到API返回已签到状态:', data);
    resolve({
      success: false,
      alreadySigned: true,
      message: errorMsg || '今日已签到，请明天再来',
      data: signInInfo
    });
  } else {
    // 其他业务错误
    console.error('签到API业务错误:', data);
    wx.showToast({
      title: errorMsg || '请求失败',
      icon: 'none'
    });
    reject(new Error(errorMsg || '请求失败'));
  }
}

/**
 * 创建带超时处理的请求
 * @param {Object} requestConfig 请求配置对象
 * @param {number} timeout 超时时间，默认15秒
 * @returns {Promise} 返回带超时处理的Promise
 */
function createTimeoutRequest(requestConfig, timeout = 15000) {
  return new Promise((resolve, reject) => {
    // 创建超时标识
    const timeoutId = setTimeout(() => {
      // 超时处理
      reject(new Error(API_ERROR_TYPES.TIMEOUT_ERROR.message));
      console.error('API请求超时:', requestConfig.url);
    }, timeout);
    
    // 发送实际请求
    wx.request({
      ...requestConfig,
      success: (res) => {
        clearTimeout(timeoutId); // 清除超时
        resolve(res);
      },
      fail: (err) => {
        clearTimeout(timeoutId); // 清除超时
        reject(err);
      }
    });
  });
}

/**
 * 用户签到
 * @returns {Promise} 返回签到结果的Promise
 */
function signIn() {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(config.cache.tokenKey);
    if (!token) {
      console.error('签到失败: 用户未登录');
      reject(new Error('用户未登录'));
      return;
    }
    
    console.log('发起签到请求');
    
    createTimeoutRequest({
      url: `${config.apiBaseUrl}/sign-in`,
      method: 'POST',
      data: {},
      header: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(res => {
      handleApiResponse(res, resolve, reject);
    })
    .catch(err => {
      console.error('签到网络请求失败:', err);
      wx.showToast({
        title: err.message || '网络连接失败',
        icon: 'none'
      });
      reject(err);
    });
  });
}

/**
 * 获取签到状态
 * @returns {Promise} 返回签到状态的Promise
 */
function getSignInStatus() {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(config.cache.tokenKey);
    if (!token) {
      console.error('获取签到状态失败: 用户未登录');
      reject(new Error('用户未登录'));
      return;
    }
    
    console.log('获取签到状态');
    
    createTimeoutRequest({
      url: `${config.apiBaseUrl}/sign-in/status`,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(res => {
      handleApiResponse(res, resolve, reject);
    })
    .catch(err => {
      console.error('获取签到状态网络请求失败:', err);
      wx.showToast({
        title: err.message || '网络连接失败',
        icon: 'none'
      });
      reject(err);
    });
  });
}

module.exports = {
  signIn,
  getSignInStatus,
  API_ERROR_TYPES
}; 