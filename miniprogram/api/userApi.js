// userApi.js
const app = getApp();

// EventEmitter类实现事件发布订阅功能
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }
}

/**
 * 处理API响应
 * @param {Object} res - 响应对象
 * @param {function} resolve - Promise resolve函数
 * @param {function} reject - Promise reject函数
 */
const handleApiResponse = function(res, resolve, reject) {
  console.log('API响应:', res);
  
  // 网络请求成功，检查HTTP状态码
  if (res.statusCode === 200) {
    const data = res.data;
    
    // 检查业务状态码
    if (data.code === 200) {
      // 业务成功
      resolve(data.data);
    } else {
      // 业务错误
      const errMsg = data.message || '请求失败';
      
      // 特殊处理token失效情况
      if (data.code === 401) {
        console.log('Token失效，需要重新登录');
        app.clearLoginInfo();
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none',
          duration: 2000
        });
        
        // 延迟跳转到登录页
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }, 1500);
      } else {
        // 其他业务错误，显示错误信息
        wx.showToast({
          title: errMsg,
          icon: 'none',
          duration: 2000
        });
      }
      
      reject(new Error(errMsg));
    }
  } else {
    // HTTP错误
    const errMsg = `HTTP错误: ${res.statusCode}`;
    console.error(errMsg);
    
    wx.showToast({
      title: '网络请求失败',
      icon: 'none',
      duration: 2000
    });
    
    reject(new Error(errMsg));
  }
};

// 尝试多个可能的后端端点进行登录
const tryAllPossibleEndpoints = function(code, endpoints, index = 0) {
  console.log(`尝试第 ${index + 1}/${endpoints.length} 个登录端点: ${endpoints[index].url}`);
  
  return new Promise((resolve, reject) => {
    // 检查是否已尝试了所有端点
    if (index >= endpoints.length) {
      console.error('所有登录端点尝试失败');
      reject({code: -1, message: '所有登录尝试均失败'});
      return;
    }
    
    // 获取当前尝试的端点配置
    const endpoint = endpoints[index];
    
    // 构建URL和请求参数
    const url = endpoint.url;
    const method = endpoint.method || 'POST';
    const data = {code: code};
    
    // 发起登录请求
    wx.request({
      url: url,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        try {
          console.log(`登录端点 ${url} 响应:`, res);
          
          // 处理HTTP状态码
          if (res.statusCode === 200 || res.statusCode === 201) {
            // 尝试处理响应
            try {
              // 获取响应数据
              const resData = res.data;
              
              // 检查是否为有效登录响应
              if ((resData.code === 200 || resData.error === 0) && 
                  (resData.data || resData.body)) {
                
                // 提取响应数据
                const userData = resData.data || resData.body;
                
                // 保存登录信息
                if (userData.token) {
                  app.globalData.token = userData.token;
                  wx.setStorageSync('token', userData.token);
                }
                
                if (userData.userInfo) {
                  app.globalData.userInfo = userData.userInfo;
                  app.globalData.userId = userData.userInfo.id;
                  wx.setStorageSync('userInfo', userData.userInfo);
                }
                
                console.log('登录成功，端点:', url);
                app.globalData.isLoggedIn = true;
                
                // 标记这个端点为当前使用的端点
                app.globalData.baseUrl = endpoint.baseUrl || app.globalData.baseUrl;
                
                resolve(userData);
                return;
              }
            } catch (e) {
              console.error('解析登录响应时出错:', e);
            }
          }
          
          // 如果这个端点失败，尝试下一个端点
          console.log(`端点 ${url} 登录失败，尝试下一个端点`);
          return tryAllPossibleEndpoints(code, endpoints, index + 1)
            .then(resolve)
            .catch(reject);
            
        } catch (error) {
          console.error(`处理端点 ${url} 响应时出错:`, error);
          // 尝试下一个端点
          return tryAllPossibleEndpoints(code, endpoints, index + 1)
            .then(resolve)
            .catch(reject);
        }
      },
      fail: (err) => {
        console.error(`端点 ${url} 请求失败:`, err);
        // 尝试下一个端点
        return tryAllPossibleEndpoints(code, endpoints, index + 1)
          .then(resolve)
          .catch(reject);
      }
    });
  });
};

// 增强版的微信登录，支持多端点尝试
const enhancedWxLogin = function(code) {
  console.log('执行增强版微信登录，code:', code);
  
  // 显示加载状态
  wx.showLoading({
    title: '登录中...',
    mask: true
  });
  
  // 初始化全局事件发射器（如果还未初始化）
  if (!app.globalData.emitter) {
    app.globalData.emitter = new EventEmitter();
    console.log('初始化全局事件发射器');
  }
  
  // 定义可能的登录端点
  const possibleEndpoints = [
    { url: app.globalData.baseUrl + '/api/v1/auth/wx-login', method: 'POST', baseUrl: app.globalData.baseUrl }
  ];
  
  // 尝试所有可能的端点
  return tryAllPossibleEndpoints(code, possibleEndpoints)
    .finally(() => {
      // 隐藏加载状态
      wx.hideLoading();
    });
};

/**
 * 获取认证头
 * @returns {String} 认证头
 */
function getAuthHeader() {
  const token = app.globalData.token;
  console.log('getAuthHeader被调用，当前token:', token);
  
  if (!token) {
    console.warn('token为空，无法生成认证头');
    return '';
  }
  
  if (token && !token.startsWith('Bearer ')) {
    const authHeader = 'Bearer ' + token;
    console.log('添加Bearer前缀，认证头:', authHeader);
    return authHeader;
  }
  console.log('使用原始token作为认证头:', token);
  return token;
}

/**
 * 微信授权登录
 * @param {string} code - 微信登录code
 * @returns {Promise} Promise对象
 */
const wxLogin = function(code) {
  console.log('执行标准微信登录，code:', code);
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/auth/wx-login',
      method: 'POST',
      data: {
        code: code
      },
      header: {
        'Content-Type': 'application/json'
      },
      // 增加超时时间到30秒
      timeout: 30000,
      success: function(res) {
        console.log('微信登录响应:', res);
        
        if (res.statusCode === 200) {
          const data = res.data;
          
          if (data.code === 200) {
            const responseData = data.data;
            const token = responseData.token;
            
            // 存储token和用户信息
            wx.setStorageSync('token', token);
            app.globalData.token = token;
            app.globalData.userInfo = responseData;
            app.globalData.userId = responseData.id;
            wx.setStorageSync('userInfo', responseData);
            
            resolve(responseData);
          } else {
            const errMsg = data.message || '微信登录失败';
            wx.showToast({
              title: errMsg,
              icon: 'none',
              duration: 2000
            });
            reject(new Error(errMsg));
          }
        } else {
          const errMsg = `HTTP错误: ${res.statusCode}`;
          wx.showToast({
            title: '网络请求失败',
            icon: 'none',
            duration: 2000
          });
          reject(new Error(errMsg));
        }
      },
      fail: function(err) {
        console.error('微信登录请求失败:', err);
        // 根据错误类型提供更明确的提示
        let errMsg = '网络连接失败';
        if (err.errMsg && err.errMsg.includes('timeout')) {
          errMsg = '服务器响应超时，请检查网络后重试';
        }
        wx.showToast({
          title: errMsg,
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

/**
 * 手机号登录
 * @param {string} phone - 手机号
 * @param {string} password - 密码
 * @returns {Promise} Promise对象
 */
const phoneLogin = function(phone, password) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/auth/phone-login',
      method: 'POST',
      data: {
        phone: phone,
        password: password
      },
      success: function(res) {
        handleApiResponse(res, resolve, reject);
      },
      fail: function(err) {
        console.error('手机号登录请求失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

/**
 * 获取用户信息
 * @returns {Promise} Promise对象
 */
const getUserInfo = function() {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    if (!token) {
      reject(new Error('未登录'));
      return;
    }
    
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/user/info',
      method: 'GET',
      header: {
        'Authorization': token
      },
      success: function(res) {
        handleApiResponse(res, resolve, reject);
      },
      fail: function(err) {
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

/**
 * 更新用户信息
 * @param {Object} userInfo - 用户信息
 * @returns {Promise} Promise对象
 */
const updateUserInfo = function(userInfo) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    if (!token) {
      reject(new Error('未登录'));
      return;
    }
    
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/user/update',
      method: 'POST',
      header: {
        'Authorization': token
      },
      data: userInfo,
      success: function(res) {
        handleApiResponse(res, resolve, reject);
      },
      fail: function(err) {
        console.error('更新用户信息失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

/**
 * 绑定手机号
 * @param {string} encryptedData - 加密数据
 * @param {string} iv - 初始向量
 * @returns {Promise} Promise对象
 */
const bindPhone = function(encryptedData, iv) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    if (!token) {
      reject(new Error('未登录'));
      return;
    }
    
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/user/bind-phone',
      method: 'POST',
      header: {
        'Authorization': token
      },
      data: {
        encryptedData: encryptedData,
        iv: iv
      },
      success: function(res) {
        handleApiResponse(res, resolve, reject);
      },
      fail: function(err) {
        console.error('绑定手机号失败:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

/**
 * 备用微信登录接口
 * @param {string} code - 微信登录code
 * @returns {Promise} Promise对象
 */
const fallbackWxLogin = function(code) {
  console.log('执行备用微信登录，发送X-Skip-Auth头');
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.baseUrl + '/api/v1/auth/wx-login',
      method: 'POST',
      data: {
        code: code
      },
      // 设置请求头绕过JWT验证
      header: {
        'X-Skip-Auth': 'true',  // 特殊标记，用于告知后端跳过JWT验证
        'Content-Type': 'application/json'
      },
      // 增加超时时间到30秒
      timeout: 30000,
      success: function(res) {
        console.log('备用微信登录响应:', res);
        
        if (res.statusCode === 200) {
          const data = res.data;
          
          if (data.code === 200) {
            const responseData = data.data;
            const token = responseData.token;
            
            // 存储token和用户信息
            wx.setStorageSync('token', token);
            app.globalData.token = token;
            app.globalData.userInfo = responseData;
            app.globalData.userId = responseData.id;
            wx.setStorageSync('userInfo', responseData);
            
            resolve(responseData);
          } else {
            const errMsg = data.message || '备用微信登录失败';
            wx.showToast({
              title: errMsg,
              icon: 'none',
              duration: 2000
            });
            reject(new Error(errMsg));
          }
        } else {
          const errMsg = `HTTP错误: ${res.statusCode}`;
          wx.showToast({
            title: '网络请求失败',
            icon: 'none',
            duration: 2000
          });
          reject(new Error(errMsg));
        }
      },
      fail: function(err) {
        console.error('备用微信登录请求失败:', err);
        // 根据错误类型提供更明确的提示
        let errMsg = '网络连接失败';
        if (err.errMsg && err.errMsg.includes('timeout')) {
          errMsg = '服务器响应超时，请检查网络后重试';
        }
        wx.showToast({
          title: errMsg,
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

module.exports = {
  wxLogin,
  phoneLogin,
  getUserInfo,
  updateUserInfo,
  bindPhone,
  fallbackWxLogin,
  
  // 以下方法供内部测试使用
  _originalWxLogin: wxLogin,
  _tryAllPossibleEndpoints: tryAllPossibleEndpoints,
  _enhancedLogin: enhancedWxLogin
}; 