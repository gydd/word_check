// historyApi.js
import config from '../config/config';
import { getToken } from '../utils/authUtil';

/**
 * 状态值映射
 * 将后端数字状态转换为前端字符串状态
 */
const STATUS_MAP = {
  0: 'PENDING',  // 处理中
  1: 'SUCCESS',  // 成功
  2: 'FAILED'    // 失败
};

/**
 * 统一处理API响应
 * @param {Object} response - 服务器响应对象
 * @returns {Promise} 处理后的响应
 */
function handleApiResponse(response) {
  return new Promise((resolve, reject) => {
    if (response.statusCode === 200) {
      const data = response.data;
      resolve(data);
    } else if (response.statusCode === 401) {
      // 未授权，需要重新登录
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      
      // 保存当前页面路径，登录后可返回
      const currentPath = `/${currentPage.route}`;
      wx.setStorageSync('redirectPath', currentPath);
      
      // 跳转到登录页
      wx.navigateTo({
        url: '/miniprogram/pages/login/login'
      });
      
      reject(new Error('未授权，请登录'));
    } else {
      reject(new Error(`请求失败，状态码: ${response.statusCode}`));
    }
  });
}

/**
 * 获取错误信息
 * @param {Object|String} error - 错误对象或错误消息
 * @returns {String} 格式化后的错误信息
 */
function getErrorMessage(error) {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message || '未知错误';
  }
  
  return '请求失败，请稍后重试';
}

/**
 * 获取历史检测记录列表
 * @param {Object} params - 请求参数
 * @param {Number} params.page - 页码
 * @param {Number} params.pageSize - 每页条数
 * @returns {Promise} 历史记录列表
 */
export function getHistoryList(params) {
  const token = getToken();
  
  if (!token) {
    return Promise.resolve({
      error: 401,
      message: '用户未登录',
      body: null
    });
  }
  
  const { page = 1, pageSize = 10 } = params || {};
  
  return new Promise((resolve) => {
    wx.request({
      url: `${config.apiBaseUrl}/check-history`,
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
      },
      data: {
        page,
        pageSize
      },
      success: (res) => {
        handleApiResponse(res)
          .then(data => {
            // 处理返回数据，确保格式一致
            let result = {
              error: 0,
              message: '',
              body: {}
            };
            
            if (data && data.body) {
              // 后端可能返回list或records字段
              const list = data.body.list || data.body.records || [];
              const total = data.body.total || 0;
              const totalPages = data.body.totalPages || Math.ceil(total / pageSize) || 1;
              
              // 处理状态值
              const processedList = list.map(item => {
                return {
                  ...item,
                  status: typeof item.status === 'number' ? STATUS_MAP[item.status] || 'UNKNOWN' : item.status
                };
              });
              
              result.body = {
                list: processedList,
                total: total,
                totalPages: totalPages
              };
            } else {
              // 兼容直接返回数组的情况
              const list = Array.isArray(data) ? data : [];
              
              // 处理状态值
              const processedList = list.map(item => {
                return {
                  ...item,
                  status: typeof item.status === 'number' ? STATUS_MAP[item.status] || 'UNKNOWN' : item.status
                };
              });
              
              result.body = {
                list: processedList,
                total: processedList.length,
                totalPages: 1
              };
            }
            
            resolve(result);
          })
          .catch(err => {
            resolve({
              error: 500,
              message: getErrorMessage(err),
              body: null
            });
          });
      },
      fail: (err) => {
        resolve({
          error: 500,
          message: getErrorMessage(err),
          body: null
        });
      }
    });
  });
}

/**
 * 删除历史检测记录
 * @param {String} id - 记录ID
 * @returns {Promise} 删除结果
 */
export function deleteHistory(id) {
  const token = getToken();
  
  if (!token) {
    return Promise.resolve({
      error: 401,
      message: '用户未登录',
      body: null
    });
  }
  
  if (!id) {
    return Promise.resolve({
      error: 400,
      message: '记录ID不能为空',
      body: null
    });
  }
  
  return new Promise((resolve) => {
    wx.request({
      url: `${config.apiBaseUrl}/check-history/${id}`,
      method: 'DELETE',
      header: {
        'content-type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
      },
      success: (res) => {
        handleApiResponse(res)
          .then(data => {
            resolve({
              error: 0,
              message: '',
              body: data
            });
          })
          .catch(err => {
            resolve({
              error: 500,
              message: getErrorMessage(err),
              body: null
            });
          });
      },
      fail: (err) => {
        resolve({
          error: 500,
          message: getErrorMessage(err),
          body: null
        });
      }
    });
  });
}

/**
 * 获取历史检测记录详情
 * @param {String} id - 记录ID
 * @returns {Promise} 记录详情
 */
export function getHistoryDetail(id) {
  const token = getToken();
  
  if (!token) {
    return Promise.resolve({
      error: 401,
      message: '用户未登录',
      body: null
    });
  }
  
  if (!id) {
    return Promise.resolve({
      error: 400,
      message: '记录ID不能为空',
      body: null
    });
  }
  
  return new Promise((resolve) => {
    wx.request({
      url: `${config.apiBaseUrl}/check-history/${id}`,
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
      },
      success: (res) => {
        handleApiResponse(res)
          .then(data => {
            // 处理返回数据
            let result = {
              error: 0,
              message: '',
              body: null
            };
            
            if (data && data.body) {
              // 处理状态值
              const detail = data.body;
              if (detail && typeof detail.status === 'number') {
                detail.status = STATUS_MAP[detail.status] || 'UNKNOWN';
              }
              
              result.body = detail;
            } else if (data) {
              // 直接返回对象的情况
              const detail = data;
              if (detail && typeof detail.status === 'number') {
                detail.status = STATUS_MAP[detail.status] || 'UNKNOWN';
              }
              
              result.body = detail;
            }
            
            resolve(result);
          })
          .catch(err => {
            resolve({
              error: 500,
              message: getErrorMessage(err),
              body: null
            });
          });
      },
      fail: (err) => {
        resolve({
          error: 500,
          message: getErrorMessage(err),
          body: null
        });
      }
    });
  });
} 