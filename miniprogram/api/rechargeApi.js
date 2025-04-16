// rechargeApi.js
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
 * 获取充值套餐列表
 * @returns {Promise} 返回套餐列表的Promise
 */
function getRechargePackages() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/recharge/packages',
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
 * 创建充值订单
 * @param {Object} data 订单数据
 * @param {Number} data.packageId 套餐ID
 * @returns {Promise} 返回订单创建结果的Promise
 */
function createRechargeOrder(data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/recharge/order',
      method: 'POST',
      data: data,
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
 * 获取充值订单列表
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页数量
 * @param {String} params.status 订单状态，可选值：all, paid, unpaid
 * @returns {Promise} 返回订单列表的Promise
 */
function getRechargeOrders(params = {}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const status = params.status || 'all';
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/recharge/orders',
      method: 'GET',
      data: {
        page,
        pageSize,
        status
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

/**
 * 查询订单支付状态
 * @param {String} orderId 订单ID
 * @returns {Promise} 返回订单状态的Promise
 */
function checkOrderStatus(orderId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/recharge/order/' + orderId + '/status',
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

module.exports = {
  getRechargePackages,
  createRechargeOrder,
  getRechargeOrders,
  checkOrderStatus
}; 