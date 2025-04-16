// pointApi.js
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

/**
 * 获取用户积分信息
 * @returns {Promise} 返回用户积分信息的Promise
 */
function getUserPoints() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/points',
      method: 'GET',
      header: {
        'Authorization': app.globalData.token
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
 * 获取积分记录
 * @param {Object} params 参数对象
 * @param {Number} params.page 页码，默认1
 * @param {Number} params.pageSize 每页记录数，默认10
 * @param {String} params.type 记录类型，可选值：all-全部，earn-获取，spend-消费
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
        'Authorization': app.globalData.token
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
  getUserPoints,
  getPointsRecords
}; 