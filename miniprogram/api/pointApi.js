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
    const errorMsg = `HTTP错误: ${res.statusCode}`;
    console.error('API请求状态码错误:', res.statusCode, res);
    
    wx.showToast({
      title: errorMsg,
      icon: 'none'
    });
    reject(new Error(errorMsg));
    return;
  }

  const data = res.data;
  
  // 打印完整的响应数据，以便调试
  console.log('API响应数据:', data);
  
  // 检查响应格式:
  // 1. 后端使用 error=0 表示成功
  // 2. 后端使用 error=401 表示认证失败
  // 3. 其他错误码表示业务错误
  if (data.error === 0) {
    // 请求成功
    resolve(data.body);
  } else if (data.error === 401) {
    // 需要登录
    console.error('授权失败:', data);
    app.clearLoginInfo();
    wx.navigateTo({
      url: '/pages/login/login'
    });
    reject(new Error('登录已过期，请重新登录'));
  } else {
    // 业务错误
    const errMsg = data.message || '请求失败';
    console.error('业务错误:', data);
    
    wx.showToast({
      title: errMsg,
      icon: 'none'
    });
    reject(new Error(errMsg));
  }
}

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
 * 获取用户积分信息
 * @returns {Promise} 返回用户积分信息的Promise
 */
function getUserPoints() {
  console.log('[pointApi] getUserPoints 函数被调用');
  
  return new Promise((resolve, reject) => {
    // 检查token是否存在
    const authHeader = getAuthHeader();
    if (!authHeader) {
      console.error('获取积分信息失败: 未登录或Token不存在');
      reject(new Error('未登录或Token不存在'));
      return;
    }
    
    const url = app.globalData.baseUrl + '/api/v1/points';
    console.log('请求URL:', url);
    console.log('请求头:', { 'Authorization': authHeader });
    
    wx.request({
      url: url,
      method: 'GET',
      header: {
        'Authorization': authHeader
      },
      success: (res) => {
        console.log('获取积分API响应:', res);
        handleApiResponse(res, resolve, reject);
      },
      fail: (err) => {
        console.error('获取积分网络请求失败:', err);
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
  console.log('[pointApi] getPointsRecords 函数被调用', params);
  
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

// 创建并导出API对象
const pointApi = {
  getUserPoints,
  getPointsRecords
};

// 添加调试日志
console.log('[pointApi] 模块加载完成', pointApi);
console.log('[pointApi] getUserPoints存在:', typeof pointApi.getUserPoints === 'function');

module.exports = pointApi; 