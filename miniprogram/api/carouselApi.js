// carouselApi.js
import { request, getErrorMessage } from '../utils/requestUtil';
import config from '../config/config';

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
    const errorMsg = getStatusErrorMessage(res.statusCode);
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
function getStatusErrorMessage(statusCode) {
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
 * @param {Object} params - 请求参数
 * @returns {Promise} Promise对象
 */
export function getCarouselList(params = {}) {
  return request({
    url: '/carousels',
    method: 'GET',
    data: params,
    needAuth: true
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
 * @param {String} id - 轮播图ID
 * @returns {Promise} Promise对象
 */
export function recordView(id) {
  if (!id) {
    return Promise.reject(new Error('轮播图ID不能为空'));
  }
  
  return request({
    url: `/carousels/${id}/view`,
    method: 'POST',
    needAuth: true
  });
}

/**
 * 获取轮播图详情
 * @param {String} id - 轮播图ID
 * @returns {Promise} Promise对象
 */
export function getCarouselDetail(id) {
  if (!id) {
    return Promise.reject(new Error('轮播图ID不能为空'));
  }
  
  return request({
    url: `/carousels/${id}`,
    method: 'GET',
    needAuth: false
  });
}

/**
 * 记录轮播图点击
 * @param {Number} id 轮播图ID
 * @returns {Promise} 操作结果Promise
 */
export function recordClick(id) {
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
      url: `${config.apiBaseUrl}/carousels/${id}/click`,
      method: 'POST',
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

// 使用ES6导出语法，同时兼容CommonJS
export default {
  getCarouselList,
  recordView,
  getCarouselDetail, 
  recordClick,
  ERROR_TYPES
};

// 兼容原有的CommonJS导出
module.exports = {
  getCarouselList,
  recordView,
  getCarouselDetail,
  recordClick,
  ERROR_TYPES
}; 