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
  
  // 兼容后端两种成功格式 {code: 200, data:{...}} 或 {error: 0, body:{...}}
  const isSuccess = (data.code === 200) || (data.error === 0);
  const responseData = data.data || data.body;
  const errorMsg = data.message || (data.data && data.data.message);

  if (isSuccess) {
    // 请求成功
    resolve(responseData);
  } else if (data.code === 401 || data.error === 401) {
    // 需要登录
    console.warn('签到API需要登录');
    app.clearLoginInfo && app.clearLoginInfo();
    wx.navigateTo({
      url: '/pages/login/login'
    });
    reject(new Error('登录已过期，请重新登录'));
  } else if (data.code === 4001) {
    // 已签到错误
    console.warn('重复签到');
    reject(new Error(errorMsg || '今日已签到'));
  } else {
    // 业务错误
    console.error('签到API业务错误:', data);
    wx.showToast({
      title: errorMsg || '请求失败',
      icon: 'none'
    });
    reject(new Error(errorMsg || '请求失败'));
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
      console.error('签到失败: 用户未登录');
      reject(new Error('用户未登录'));
      return;
    }
    
    console.log('发起签到请求');
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
        console.error('签到网络请求失败:', err);
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
      console.error('获取签到状态失败: 用户未登录');
      reject(new Error('用户未登录'));
      return;
    }
    
    console.log('获取签到状态');
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
        console.error('获取签到状态网络请求失败:', err);
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