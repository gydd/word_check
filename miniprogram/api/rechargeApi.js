// rechargeApi.js
const app = getApp();
const config = require('../config/config.js'); // 引入配置

/**
 * 获取认证头
 * @returns {String} 认证头
 */
function getAuthHeader() {
  const token = wx.getStorageSync('token') || app.globalData.token;
  console.log('当前Token:', token);
  
  if (token && !token.startsWith('Bearer ')) {
    return 'Bearer ' + token;
  }
  return token;
}

/**
 * 处理后端API返回结果的通用方法
 * @param {Object} res API返回的响应对象
 * @param {Function} resolve Promise的resolve函数
 * @param {Function} reject Promise的reject函数
 */
function handleApiResponse(res, resolve, reject) {
  if (res.statusCode !== 200) {
    const errorMsg = `网络请求失败 (${res.statusCode})`;
    console.error('充值API请求失败:', res);
    
    wx.showToast({
      title: errorMsg,
      icon: 'none'
    });
    reject(new Error(errorMsg));
    return;
  }

  const data = res.data;
  console.log('充值API响应:', data);
  
  // 兼容后端两种成功格式 {code: 200, data:{...}} 或 {error: 0, body:{...}}
  const isCodeSuccess = data.code === 200;
  const isErrorSuccess = data.error === 0;
  const responseData = isCodeSuccess ? data.data : (isErrorSuccess ? data.body : null);
  
  if (isCodeSuccess || isErrorSuccess) {
    // 请求成功
    resolve(responseData);
  } else if (data.code === 401 || data.error === 401) {
    // 需要登录
    console.warn('充值API需要登录');
    app.clearLoginInfo && app.clearLoginInfo();
    wx.navigateTo({
      url: '/pages/login/login'
    });
    reject(new Error('登录已过期，请重新登录'));
  } else {
    // 业务错误
    const errorMsg = data.message || '请求失败';
    console.error('充值API业务错误:', data);
    
    wx.showToast({
      title: errorMsg,
      icon: 'none'
    });
    reject(new Error(errorMsg));
  }
}

/**
 * 获取充值套餐列表
 * @returns {Promise} 返回套餐列表的Promise
 */
function getRechargePackages() {
  return new Promise((resolve, reject) => {
    console.log('获取充值套餐列表');
    
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/recharge/packages',
      method: 'GET',
      header: {
        'Authorization': getAuthHeader()
      },
      success: (res) => {
        handleApiResponse(res, resolve, reject);
      },
      fail: (err) => {
        console.error('获取充值套餐列表网络请求失败:', err);
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
 * @param {Number} data.amount 充值金额
 * @returns {Promise} 返回订单创建结果的Promise
 */
function createRechargeOrder(data) {
  return new Promise((resolve, reject) => {
    const authHeader = getAuthHeader();
    
    if (!authHeader) {
      const error = new Error('未登录或Token不存在');
      console.error('创建充值订单失败:', error);
      reject(error);
      return;
    }
    
    console.log('创建充值订单, 参数:', data);
    console.log('认证头:', authHeader);
    
    // 尝试使用新的充值API
    const tryNewRechargeApi = () => {
      console.log('尝试使用新的充值API');
      wx.request({
        url: app.globalData.baseUrl + '/api/v1/recharge/order',
        method: 'POST',
        data: data,
        header: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          console.log('新充值API响应:', res);
          handleApiResponse(res, resolve, reject);
        },
        fail: (err) => {
          console.error('新充值API请求失败:', err);
          // 如果新API失败，尝试旧API
          tryLegacyRechargeApi();
        }
      });
    };
    
    // 尝试使用旧的充值API
    const tryLegacyRechargeApi = () => {
      console.log('尝试使用旧的充值API');
      wx.request({
        url: app.globalData.baseUrl + '/api/v1/point/recharge',
        method: 'POST',
        data: data,
        header: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        success: (res) => {
          console.log('旧充值API响应:', res);
          handleApiResponse(res, resolve, reject);
        },
        fail: (err) => {
          console.error('旧充值API请求失败:', err);
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          });
          reject(err);
        }
      });
    };
    
    // 先尝试新API
    tryNewRechargeApi();
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
        'Authorization': getAuthHeader()
      },
      success: (res) => {
        handleApiResponse(res, resolve, reject);
      },
      fail: (err) => {
        console.error('获取充值订单列表网络请求失败:', err);
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
        'Authorization': getAuthHeader()
      },
      success: (res) => {
        handleApiResponse(res, resolve, reject);
      },
      fail: (err) => {
        console.error('查询订单支付状态网络请求失败:', err);
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