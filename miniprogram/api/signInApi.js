// signInApi.js
const app = getApp();
const config = require('../config/config.js'); // 引入config

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
  // 兼容后端两种成功格式 {code: 200, data:{...}} 或 {error: 0, body:{...}}
  const isSuccess = (data.code === 200) || (data.error === 0);
  const responseData = data.data || data.body;

  if (isSuccess) {
    // 请求成功
    resolve(responseData);
  } else if (data.code === 401 || data.error === 401) {
    // 需要登录
    app.clearLoginInfo && app.clearLoginInfo();
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

/**
 * 用户签到
 * @returns {Promise} 返回签到结果的Promise
 */
function signIn() {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(config.cache.tokenKey);
    if (!token) {
      reject(new Error('用户未登录'));
      return;
    }
    wx.request({
      url: `${config.apiBaseUrl}/api/v1/sign-in`,
      method: 'POST',
      data: {},
      header: {
        'Authorization': 'Bearer ' + token // 修正请求头
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
 * 获取签到状态
 * @returns {Promise} 返回签到状态的Promise
 */
function getSignInStatus() {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(config.cache.tokenKey);
    if (!token) {
      reject(new Error('用户未登录'));
      return;
    }
    wx.request({
      url: `${config.apiBaseUrl}/api/v1/sign-in/status`,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + token // 修正请求头
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

module.exports = {
  signIn,
  getSignInStatus
}; 