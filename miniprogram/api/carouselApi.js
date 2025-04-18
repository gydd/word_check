// carouselApi.js
const app = getApp();
const config = require('../config/config.js');

// 错误类型常量
const ERROR_TYPES = {
  NETWORK_ERROR: '网络连接错误',
  SERVER_ERROR: '服务器错误',
  AUTH_ERROR: '认证失败',
  TIMEOUT_ERROR: '请求超时',
  UNKNOWN_ERROR: '未知错误'
};

/**
 * 处理API响应的通用方法
 * @param {Object} res API响应对象
 * @param {Function} resolve Promise成功回调
 * @param {Function} reject Promise失败回调
 */
function handleApiResponse(res, resolve, reject) {
  if (res.statusCode !== 200) {
    const errorMsg = getErrorMessage(res.statusCode);
    console.error('轮播图API请求失败:', res);
    reject(new Error(errorMsg));
    return;
  }

  const data = res.data;
  console.log('轮播图API响应:', data);
  
  // 兼容后端两种成功格式 {code: 200, data:{...}} 或 {error: 0, body:{...}}
  const isSuccess = (data.code === 200) || (data.error === 0);
  const responseData = data.data || data.body || [];
  const errorMsg = data.message || (data.data && data.data.message);

  if (isSuccess) {
    resolve(responseData);
  } else if (data.code === 401 || data.error === 401) {
    console.warn('轮播图API需要登录');
    // 可以在这里添加自动跳转到登录页的逻辑
    reject(new Error(ERROR_TYPES.AUTH_ERROR));
  } else {
    console.error('轮播图API业务错误:', data);
    reject(new Error(errorMsg || ERROR_TYPES.UNKNOWN_ERROR));
  }
}

/**
 * 根据状态码获取错误信息
 * @param {Number} statusCode HTTP状态码
 * @returns {String} 错误信息
 */
function getErrorMessage(statusCode) {
  switch (statusCode) {
    case 400:
      return '请求参数错误';
    case 401:
      return ERROR_TYPES.AUTH_ERROR;
    case 403:
      return '无权访问';
    case 404:
      return '请求资源不存在';
    case 500:
      return ERROR_TYPES.SERVER_ERROR;
    default:
      return `网络请求失败 (${statusCode})`;
  }
}

/**
 * 获取轮播图列表
 * @param {Boolean} useCache 是否使用缓存
 * @param {Number} timeout 超时时间(毫秒)，默认10秒
 * @returns {Promise} 返回轮播图数据的Promise
 */
function getCarouselList(useCache = true, timeout = 10000) {
  return new Promise((resolve, reject) => {
    // 检查缓存
    if (useCache) {
      const cacheKey = 'carousel_data';
      const cacheTime = 'carousel_time';
      const cachedData = wx.getStorageSync(cacheKey);
      const cachedTime = wx.getStorageSync(cacheTime);
      
      // 缓存10分钟有效
      if (cachedData && cachedTime && Date.now() - cachedTime < 10 * 60 * 1000) {
        console.log('使用缓存的轮播图数据');
        resolve(cachedData);
        return;
      }
    }
    
    // 获取默认数据作为备选
    const defaultData = getDefaultCarouselItems();
    
    // 获取token
    const token = wx.getStorageSync(config.cache.tokenKey) || getApp().globalData.token;
    
    if (!token) {
      console.warn('轮播图API请求：未找到有效token，使用默认数据');
      resolve(defaultData);
      return;
    }
    
    // 确保token格式正确
    const authorization = token.startsWith('Bearer ') ? token : 'Bearer ' + token;
    
    // 请求超时计时器
    let timeoutTimer = null;
    
    // 发起请求
    const requestTask = wx.request({
      url: `${config.apiBaseUrl}/api/v1/carousels`,
      method: 'GET',
      header: {
        'Authorization': authorization
      },
      success: (res) => {
        // 清除超时计时器
        if (timeoutTimer) clearTimeout(timeoutTimer);
        
        try {
          handleApiResponse(res, (data) => {
            // 检查数据格式，确保是数组
            if (Array.isArray(data) && data.length > 0) {
              // 缓存数据 - 限制缓存大小
              if (JSON.stringify(data).length < 1024 * 50) { // 限制50KB
                wx.setStorageSync('carousel_data', data);
                wx.setStorageSync('carousel_time', Date.now());
              } else {
                console.warn('轮播图数据过大，不进行缓存');
              }
              resolve(data);
            } else {
              console.warn('轮播图数据格式不正确或为空，使用默认数据');
              resolve(defaultData);
            }
          }, reject);
        } catch (error) {
          console.error('处理轮播图数据出错:', error);
          resolve(defaultData);
        }
      },
      fail: (err) => {
        // 清除超时计时器
        if (timeoutTimer) clearTimeout(timeoutTimer);
        
        console.error('获取轮播图列表失败:', err);
        // 根据错误类型返回不同错误信息
        if (err.errMsg.includes('timeout')) {
          reject(new Error(ERROR_TYPES.TIMEOUT_ERROR));
        } else if (err.errMsg.includes('fail')) {
          reject(new Error(ERROR_TYPES.NETWORK_ERROR));
        } else {
          reject(new Error(err.errMsg || ERROR_TYPES.UNKNOWN_ERROR));
        }
        // 返回默认数据
        resolve(defaultData);
      }
    });
    
    // 设置超时
    timeoutTimer = setTimeout(() => {
      requestTask.abort(); // 中断请求
      console.error('轮播图请求超时');
      reject(new Error(ERROR_TYPES.TIMEOUT_ERROR));
      resolve(defaultData);
    }, timeout);
  });
}

/**
 * 获取默认轮播图数据
 * @returns {Array} 默认轮播图数据
 */
function getDefaultCarouselItems() {
  return [
    {
      id: 1,
      imageUrl: '/static/images/cat_banner.png',
      title: '单词检查服务',
      description: '高效准确的英语单词纠错',
      linkType: 'page',
      linkUrl: '/pages/upload/upload'
    },
    {
      id: 2,
      imageUrl: '/static/images/banner1.jpg',
      title: '积分奖励活动',
      description: '每日签到获取积分',
      linkType: 'page',
      linkUrl: '/pages/points/points'
    },
    {
      id: 3,
      imageUrl: '/static/images/banner2.jpg',
      title: '历史记录查询',
      description: '查看你的检查记录',
      linkType: 'page',
      linkUrl: '/pages/result/result'
    }
  ];
}

/**
 * 记录轮播图查看
 * @param {Number} id 轮播图ID
 * @returns {Promise} 操作结果Promise
 */
function recordView(id) {
  if (!id) {
    console.warn('记录轮播图查看：ID为空');
    return Promise.resolve(false);
  }
  
  const token = wx.getStorageSync(config.cache.tokenKey) || getApp().globalData.token;
  
  if (!token) {
    console.warn('记录轮播图查看：未找到有效token');
    return Promise.resolve(false);
  }
  
  // 确保token格式正确
  const authorization = token.startsWith('Bearer ') ? token : 'Bearer ' + token;
  
  return new Promise((resolve) => {
    // 使用异步方式，不阻塞主流程
    wx.request({
      url: `${config.apiBaseUrl}/api/v1/carousels/${id}/view`,
      method: 'GET',
      header: {
        'Authorization': authorization
      },
      success: () => {
        console.log('记录轮播图查看成功，ID:', id);
        resolve(true);
      },
      fail: (err) => {
        console.error('记录轮播图查看失败:', err);
        resolve(false);
      }
    });
  });
}

/**
 * 记录轮播图点击
 * @param {Number} id 轮播图ID
 * @returns {Promise} 操作结果Promise
 */
function recordClick(id) {
  if (!id) {
    console.warn('记录轮播图点击：ID为空');
    return Promise.resolve(false);
  }
  
  const token = wx.getStorageSync(config.cache.tokenKey) || getApp().globalData.token;
  
  if (!token) {
    console.warn('记录轮播图点击：未找到有效token');
    return Promise.resolve(false);
  }
  
  // 确保token格式正确
  const authorization = token.startsWith('Bearer ') ? token : 'Bearer ' + token;
  
  return new Promise((resolve) => {
    // 使用异步方式，不阻塞主流程
    wx.request({
      url: `${config.apiBaseUrl}/api/v1/carousels/${id}/click`,
      method: 'GET',
      header: {
        'Authorization': authorization
      },
      success: () => {
        console.log('记录轮播图点击成功，ID:', id);
        resolve(true);
      },
      fail: (err) => {
        console.error('记录轮播图点击失败:', err);
        resolve(false);
      }
    });
  });
}

module.exports = {
  getCarouselList,
  recordView,
  recordClick,
  ERROR_TYPES
}; 