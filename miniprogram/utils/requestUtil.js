import { getToken, redirectToLogin } from './authUtil';
import config from '../config/config';

/**
 * 处理API响应
 * @param {Object} response - 服务器响应
 * @param {Function} resolve - Promise resolve函数
 * @param {Function} reject - Promise reject函数
 */
export function handleApiResponse(response, resolve, reject) {
  // 处理响应
  if (response.data) {
    const { error, body, message } = response.data;
    
    // 根据错误码处理
    if (error === 0) {
      // 成功响应
      resolve(body || {});
    } else if (error === 401) {
      // 未授权，需要登录
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      
      // 跳转到登录页
      redirectToLogin();
      reject(new Error(message || '请先登录'));
    } else {
      // 其他业务错误
      const errorMsg = message || '请求失败';
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      reject(new Error(errorMsg));
    }
  } else {
    // 响应异常
    wx.showToast({
      title: '服务器响应异常',
      icon: 'none',
      duration: 2000
    });
    reject(new Error('服务器响应异常'));
  }
}

/**
 * 获取错误消息
 * @param {Error} error - 错误对象
 * @returns {String} 错误消息
 */
export function getErrorMessage(error) {
  return error.message || '未知错误';
}

/**
 * 发送请求的通用方法
 * @param {Object} options - 请求配置
 * @returns {Promise} Promise对象
 */
export function request(options) {
  const { url, method = 'POST', data = {}, needAuth = true } = options;
  
  return new Promise((resolve, reject) => {
    const header = {
      'Content-Type': 'application/json'
    };
    
    // 如果需要认证，添加token
    if (needAuth) {
      const token = getToken();
      if (!token) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 2000
        });
        redirectToLogin();
        reject(new Error('请先登录'));
        return;
      }
      // 使用Authorization字段，并确保token格式正确
      header.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    
    // 发送请求
    wx.request({
      url: url.startsWith('http') ? url : `${config.apiBaseUrl}${url}`,
      method,
      data: method === 'GET' ? data : JSON.stringify(data),
      header,
      success: (res) => handleApiResponse(res, resolve, reject),
      fail: (err) => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
          duration: 2000
        });
        reject(new Error('网络请求失败'));
      }
    });
  });
} 