// userApi.js
// 获取全局App实例，若当前阶段尚未初始化，则创建占位对象，避免空指针错误
let app;
try {
  app = getApp();
} catch (e) {
  app = null;
}

if (!app || !app.globalData) {
  // 创建一个占位的全局对象，避免在App未初始化阶段访问报错
  app = {
    globalData: {}
  };
}

const config = require('../config/config.js');
const util = require('../utils/util.js');

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

// 错误类型常量
const ERROR_TYPES = {
  PARAM_ERROR: 'PARAM_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CODE_USED: 'CODE_USED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  AUTH_ERROR: 'AUTH_ERROR',
  PHONE_BINDING_ERROR: 'PHONE_BINDING_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  RETRY_LIMIT_REACHED: 'RETRY_LIMIT_REACHED',
  CODE_REUSING: 'CODE_REUSING'
};

// 登录状态管理
const LoginState = {
  IDLE: 'IDLE',           // 空闲状态，未登录
  LOGGING_IN: 'LOGGING_IN', // 登录中
  LOGGED_IN: 'LOGGED_IN',   // 已登录
  LOGIN_FAILED: 'LOGIN_FAILED', // 登录失败
  RECOVERING: 'RECOVERING',  // 正在恢复登录状态
  
  currentState: 'IDLE',    // 当前状态
  retryCount: 0,           // 重试次数
  maxRetries: 3,           // 最大重试次数
  lastError: null,         // 最后一次错误
  
  // 设置状态
  setState: function(state) {
    this.currentState = state;
    console.log(`登录状态变更为: ${state}`);
  },
  
  // 是否可以重试
  canRetry: function() {
    return this.retryCount < this.maxRetries;
  },
  
  // 增加重试次数
  incrementRetry: function() {
    this.retryCount++;
    console.log(`登录重试次数: ${this.retryCount}/${this.maxRetries}`);
  },
  
  // 重置重试次数
  resetRetryCount: function() {
    this.retryCount = 0;
  },
  
  // 设置最后一次错误
  setLastError: function(error) {
    this.lastError = error;
  },
  
  // 获取当前状态
  getState: function() {
    return this.currentState;
  },
  
  // 是否处于登录中状态
  isLoggingIn: function() {
    return this.currentState === this.LOGGING_IN || 
           this.currentState === this.RECOVERING;
  }
};

// 登录锁，防止并发登录请求
const LoginLock = {
  locked: false,
  timeout: null,
  lockTimeMs: 30000, // 30秒自动解锁
  
  // 获取锁
  acquire: function() {
    if (this.locked) {
      console.warn('登录锁已被占用，无法获取');
      return false;
    }
    
    this.locked = true;
    
    // 设置自动解锁定时器
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.timeout = setTimeout(() => {
      console.warn('登录锁超时自动解锁');
      this.release();
    }, this.lockTimeMs);
    
    console.log('获取登录锁成功');
    return true;
  },
  
  // 释放锁
  release: function() {
    this.locked = false;
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    console.log('释放登录锁');
  },
  
  // 是否已锁定
  isLocked: function() {
    return this.locked;
  }
};

// 登录码管理器
const CodeManager = {
  STORAGE_KEY: 'wx_login_used_codes',
  CODE_EXPIRE_TIME: 10 * 60 * 1000, // 10分钟过期
  
  STATUS: {
    UNUSED: 'UNUSED',     // 未使用
    PENDING: 'PENDING',   // 使用中
    USED: 'USED',         // 已使用
    FAILED: 'FAILED'      // 使用失败
  },
  
  // 获取已使用的codes
  getUsedCodes: function() {
    try {
      const usedCodesStr = wx.getStorageSync(this.STORAGE_KEY);
      return usedCodesStr ? JSON.parse(usedCodesStr) : {};
    } catch (e) {
      console.error('获取已使用codes失败:', e);
      return {};
    }
  },
  
  // 保存已使用的codes
  saveUsedCodes: function(usedCodes) {
    try {
      wx.setStorageSync(this.STORAGE_KEY, JSON.stringify(usedCodes));
    } catch (e) {
      console.error('保存已使用codes失败:', e);
    }
  },
  
  // 检查code是否已使用过
  isUsed: function(code) {
    const usedCodes = this.getUsedCodes();
    return usedCodes[code] !== undefined;
  },
  
  // 标记code为使用中
  markAsPending: function(code) {
    const usedCodes = this.getUsedCodes();
    usedCodes[code] = {
      status: this.STATUS.PENDING,
      time: Date.now()
    };
    this.saveUsedCodes(usedCodes);
  },
  
  // 标记code为已使用
  markAsUsed: function(code) {
    const usedCodes = this.getUsedCodes();
    usedCodes[code] = {
      status: this.STATUS.USED,
      time: Date.now()
    };
    this.saveUsedCodes(usedCodes);
  },
  
  // 标记code为使用失败
  markAsFailed: function(code) {
    const usedCodes = this.getUsedCodes();
    usedCodes[code] = {
      status: this.STATUS.FAILED,
      time: Date.now()
    };
    this.saveUsedCodes(usedCodes);
  },
  
  // 获取code状态
  getCodeStatus: function(code) {
    const usedCodes = this.getUsedCodes();
    return usedCodes[code] ? usedCodes[code].status : this.STATUS.UNUSED;
  },
  
  // 清理过期的codes
  cleanExpiredCodes: function() {
    const usedCodes = this.getUsedCodes();
    const now = Date.now();
    let hasChanges = false;
    
    // 清理过期的code
    Object.keys(usedCodes).forEach(code => {
      if (now - usedCodes[code].time > this.CODE_EXPIRE_TIME) {
        delete usedCodes[code];
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.saveUsedCodes(usedCodes);
      console.log('已清理过期的login codes');
    }
    
    return hasChanges;
  },
  
  // 向后兼容的别名方法
  cleanExpired: function() {
    return this.cleanExpiredCodes();
  }
};

// 全局变量，追踪登录状态
let isTokenAvailable = false;
let loginInProgress = false;

// 上次使用的登录code
let lastUsedCode = '';
// 登录锁定超时时间
const LOGIN_LOCK_TIMEOUT = 15000; // 15秒

// 在小程序启动时初始化
if (app.globalData) {
  if (!app.globalData.emitter) {
    app.globalData.emitter = new EventEmitter();
  }
}

/**
 * 微信登录函数
 * @param {string} code 微信登录凭证
 * @returns {Promise} 登录结果Promise
 */
const wxLogin = function(code) {
  return new Promise(async (resolve, reject) => {
    try {
      // 参数检查
      if (!code) {
        console.error('wxLogin: code参数为空');
        reject({
          type: ERROR_TYPES.PARAM_ERROR,
          message: '登录凭证不能为空'
        });
        return;
      }

      // 获取登录锁
      if (!LoginLock.acquire()) {
        console.warn('wxLogin: 已有登录请求正在进行');
        reject({
          type: ERROR_TYPES.LOGIN_IN_PROGRESS,
          message: '登录操作正在进行中'
        });
        return;
      }

      console.log(`开始登录: code=${code.substring(0, 6)}...`);
      
      // 设置登录状态为登录中
      LoginState.setState(LoginState.LOGGING_IN);
      
      // 检查Code是否已被使用
      const codeStatusAtStart = CodeManager.getCodeStatus(code);
      if (codeStatusAtStart === CodeManager.STATUS.USED) {
        console.warn(`wxLogin: code已被标记为USED: ${code.substring(0, 6)}...`);
        
        // 释放登录锁
        LoginLock.release();
        
        // 处理code重用情况
        return userApi.handleCodeReuse()
          .then(result => {
            // 处理成功，恢复了登录状态
            resolve(result);
          })
          .catch(error => {
            // 如果处理失败，则尝试重新获取code
            if (LoginState.canRetry()) {
              // 增加重试计数
              LoginState.incrementRetry();
              // 延迟后重新获取code登录
              setTimeout(() => {
                getLoginCodeWithCache()
                  .then(newCode => wxLogin(newCode))
            .then(resolve)
            .catch(reject);
              }, 1500);
            } else {
              // 超过重试次数，返回错误
              reject({
                type: ERROR_TYPES.RETRY_LIMIT_REACHED,
                message: '登录失败次数过多，请稍后再试',
                originalError: error
              });
            }
          });
      }
      
      // 标记code为使用中
      CodeManager.markAsPending(code);
      
      // 清理过期的codes
      CodeManager.cleanExpiredCodes();
      
      // 执行登录请求
      executeLoginWithRetry(code, 0)
        .then(result => {
          // 登录成功，标记code为已使用
          CodeManager.markAsUsed(code);
          // 更新登录状态
          LoginState.setState(LoginState.LOGGED_IN);
          LoginState.resetRetryCount();
          // 释放登录锁
          LoginLock.release();
          // 返回结果
          resolve(result);
        })
        .catch(error => {
          // 登录失败处理
          console.error('登录失败:', error);
          
          // 根据错误类型更新code状态
          if (error.type === ERROR_TYPES.CODE_USED) {
            CodeManager.markAsUsed(code);
          } else {
            CodeManager.markAsFailed(code);
          }
          
          // 更新登录状态
          LoginState.setState(LoginState.LOGIN_FAILED);
          LoginState.setLastError(error);
          
          // 释放登录锁
          LoginLock.release();
          
          // 返回错误
          reject(error);
        });
    } catch (e) {
      console.error('wxLogin函数异常:', e);
      
      // 释放登录锁
      if (LoginLock.isLocked()) {
        LoginLock.release();
      }
      
      // 更新登录状态
      LoginState.setState(LoginState.LOGIN_FAILED);
      LoginState.setLastError({
        type: ERROR_TYPES.UNKNOWN_ERROR,
        message: '登录过程中出现异常'
      });
      
      reject({
        type: ERROR_TYPES.UNKNOWN_ERROR,
        message: '登录过程中出现异常',
        error: e
      });
    }
  });
};

/**
 * 带重试机制的登录请求执行函数
 * @param {string} code 微信登录code
 * @param {number} retryCount 当前重试次数
 * @returns {Promise} 登录结果Promise
 */
const executeLoginWithRetry = function(code, retryCount = 0) {
  return new Promise((resolve, reject) => {
    console.log(`执行登录请求${retryCount > 0 ? `(第${retryCount}次重试)` : ''}，code: ${code.substring(0, 6)}...`);
    
    // 请求超时时间（毫秒）
    const timeout = 15000; // 增加到15秒以应对网络波动
    
    // 准备请求参数
    const requestData = {
      code: code,
      appId: app.globalData.appId || '',
      version: app.globalData.version || '1.0.0',
      platform: wx.getSystemInfoSync().platform,
      system: wx.getSystemInfoSync().system
    };
    
    wx.request({
      url: `${config.apiBaseUrl}/api/v1/auth/wx-login`,
      method: 'POST',
      data: requestData,
      timeout: timeout,
      header: {
        'content-type': 'application/json',
        'auth': wx.getStorageSync('token')
      },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          const isSuccess = (res.data.success === true) || (res.data.error === 0);
          if (isSuccess) {
            // 登录成功，兼容两种返回格式
            const responseData = res.data.body || res.data.data || {};
            const token = responseData.token;
            const userInfo = responseData.userInfo || responseData.user;
            
            if (!token) {
              reject({
                type: ERROR_TYPES.SERVER_ERROR,
                message: '服务器返回数据错误：缺少token'
              });
              return;
            }
            
            // 保存token和用户信息
            wx.setStorageSync('token', token);
            if (userInfo) {
              wx.setStorageSync('userInfo', userInfo);
            }
            
            wx.setStorageSync('loginTime', Date.now());
            
            // 设置token过期时间（通常服务器会返回过期时间，这里假设7天）
            const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
            wx.setStorageSync('tokenExpireTime', expireTime);
            
            // 更新全局变量
            isTokenAvailable = true;
            if (app.globalData) {
            app.globalData.token = token;
              app.globalData.userInfo = userInfo;
              app.globalData.userId = userInfo?.id;
              app.globalData.isLoggedIn = true;
              
              // 触发登录成功事件
              if (app.globalData.emitter) {
                app.globalData.emitter.emit('loginSuccess', userInfo);
              }
            }
            
            // 返回成功结果
            resolve(responseData);
          } else {
            // 登录失败处理
            console.error('登录失败:', res.data);
            
            // 根据错误类型更新code状态
            if (res.data.error === ERROR_TYPES.CODE_USED) {
              CodeManager.markAsUsed(code);
            } else {
              CodeManager.markAsFailed(code);
            }
            
            // 更新登录状态
            LoginState.setState(LoginState.LOGIN_FAILED);
            LoginState.setLastError(res.data);
            
            // 释放登录锁
            LoginLock.release();
            
            // 返回错误
            reject(res.data);
          }
        } else if (res.statusCode === 400 && res.data && 
                  (res.data.error === 'code_used' || 
                  (res.data.error && res.data.error.code === 'CODE_USED') || 
                  (res.data.message && res.data.message.includes('已使用')))) {
          // Code已使用的情况
          console.warn('服务器返回code已使用');
          
          reject({
            type: ERROR_TYPES.CODE_USED,
            message: '登录码已被使用，请重新获取',
            data: res.data
          });
        } else if (res.statusCode === 429) {
          // 请求频率限制
          console.warn('服务器返回请求频率限制');
          
          reject({
            type: ERROR_TYPES.RATE_LIMITED,
            message: '请求过于频繁，请稍后再试',
            data: res.data
          });
        } else if (res.statusCode === 401) {
          // Token过期
          console.warn('服务器返回token已过期');
          
          // 清除本地存储的token和用户信息
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          
          // 更新token状态
          isTokenAvailable = false;
          
          reject({
            type: ERROR_TYPES.TOKEN_EXPIRED,
            message: 'Token已过期，请重新登录',
            data: res.data
          });
        } else if (res.statusCode >= 500) {
          // 服务器错误，可能需要重试
          console.error('服务器错误:', res.statusCode, res.data);
          
          // 检查是否可以重试
          if (retryCount < retryConfig.maxRetries && 
              (res.statusCode >= 500 || res.statusCode === 0)) {
            
            // 计算重试延迟时间
            const delay = retryConfig.getDelayTime(retryCount);
            console.log(`服务器错误(${res.statusCode})，${delay}ms后进行第${retryCount + 1}次重试`);
            
            // 延迟后重试
            setTimeout(() => {
              executeLoginWithRetry(code, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, delay);
          } else {
            // 超过重试次数或不需要重试的错误
            reject({
              type: ERROR_TYPES.SERVER_ERROR,
              message: '服务器处理登录请求失败',
              statusCode: res.statusCode,
              data: res.data
            });
          }
        } else {
          // 其他服务器错误
          const errorMessage = (res.data && res.data.message) ? 
                              res.data.message : '服务器返回未知错误';
          console.error('登录失败:', errorMessage, res);
          
          reject({
            type: ERROR_TYPES.SERVER_ERROR,
            message: errorMessage,
            statusCode: res.statusCode,
            data: res.data
          });
        }
      },
      fail: function(err) {
        console.error('登录请求失败:', err);
        
        // 判断错误类型
        let errorType = ERROR_TYPES.UNKNOWN_ERROR;
        let errorMessage = '登录请求失败';
        let shouldRetry = false;
        
        if (err.errMsg && err.errMsg.indexOf('timeout') > -1) {
          errorType = ERROR_TYPES.TIMEOUT_ERROR;
          errorMessage = '登录请求超时，请检查网络';
          shouldRetry = true;
        } else if (err.errMsg && (
            err.errMsg.indexOf('fail') > -1 || 
            err.errMsg.indexOf('网络') > -1 ||
            err.errMsg.indexOf('net::') > -1)) {
          errorType = ERROR_TYPES.NETWORK_ERROR;
          errorMessage = '网络连接失败，请检查网络';
          shouldRetry = true;
        }
        
        // 网络相关错误可以进行重试
        if (shouldRetry && retryCount < retryConfig.maxRetries) {
          // 计算重试延迟时间
          const delay = retryConfig.getDelayTime(retryCount);
          console.log(`网络错误(${errorType})，${delay}ms后进行第${retryCount + 1}次重试`);
          
          // 延迟后重试
          setTimeout(() => {
            executeLoginWithRetry(code, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          // 超过重试次数或不需要重试的错误
          if (retryCount >= retryConfig.maxRetries) {
            errorType = ERROR_TYPES.RETRY_LIMIT_REACHED;
            errorMessage = `已达到最大重试次数(${retryConfig.maxRetries})，登录失败`;
          }
          
          reject({
            type: errorType,
            message: errorMessage,
            error: err
          });
        }
      }
    });
  });
};

// 用户API
const userApi = {
  // 导出错误类型常量
  ERROR_TYPES: ERROR_TYPES,
  
  // 导出登录状态管理器
  LoginState: LoginState,
  
  // 导出登录锁
  LoginLock: LoginLock,
  
  // 导出事件发布订阅类
  EventEmitter: EventEmitter,
  
  // 导出CodeManager，方便外部调用
  CodeManager: CodeManager,
  
  // 重置所有登录状态
  resetAllLoginState: function() {
    // 释放登录锁
    if (LoginLock.isLocked()) {
      LoginLock.release();
    }
    
    // 重置登录状态
    LoginState.setState(LoginState.IDLE);
    LoginState.resetRetryCount();
    LoginState.setLastError(null);
    
    // 清除token和用户信息
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('loginTime');
    wx.removeStorageSync('tokenExpireTime');
    
    // 更新全局变量
    isTokenAvailable = false;
    loginInProgress = false;
    
    // 更新app全局数据
    if (app.globalData) {
      app.globalData.token = '';
      app.globalData.userInfo = null;
      app.globalData.userId = null;
      app.globalData.isLoggedIn = false;
    }
    
    console.log('已重置所有登录状态');
    
    return Promise.resolve({ success: true });
  },
  
  // 检查登录状态
  isLoggedIn: function() {
    // 先检查LoginState状态
    if (LoginState.isLoggingIn()) {
      return true;
    }

    // 再检查token
    const token = wx.getStorageSync('token');
    if (token) {
      // 如果有token但状态不是已登录，更新状态
      LoginState.setState(LoginState.LOGGED_IN);
      return true;
    }

    return false;
  },
  
  // 检查token是否有效
  checkTokenValidity: function() {
    return new Promise((resolve) => {
    const token = wx.getStorageSync('token');
    
    if (!token) {
        isTokenAvailable = false;
        resolve(false);
      return;
    }
    
      // 检查token是否过期
      const tokenExpireTime = wx.getStorageSync('tokenExpireTime');
      if (tokenExpireTime) {
        const now = Date.now();
        if (now >= tokenExpireTime) {
          console.log('Token已过期');
          isTokenAvailable = false;
          resolve(false);
          return;
        }
      }
      
      // 发送请求验证token
    wx.request({
        url: `${config.apiBaseUrl}/api/v1/user/check-token`,
      method: 'GET',
      header: {
          'auth': token
      },
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.valid) {
            isTokenAvailable = true;
            // 更新登录状态
            LoginState.setState(LoginState.LOGGED_IN);
            resolve(true);
          } else {
            isTokenAvailable = false;
            // 清除无效token
            wx.removeStorageSync('token');
            // 重置登录状态
            LoginState.setState(LoginState.IDLE);
            resolve(false);
          }
        },
        fail: () => {
          // 网络请求失败，暂时认为token可用
          console.log('验证token网络请求失败，暂时认为token可用');
          isTokenAvailable = true;
          resolve(true);
      }
    });
  });
  },
  
  // 获取微信登录code
  getLoginCode: function() {
    return getLoginCodeWithCache();
  },
  
  /**
   * 使用微信登录CODE进行登录
   * @param {string} code 微信登录凭证
   * @returns {Promise} 登录结果Promise
   */
  wxLogin: wxLogin,
  
  // 将实际的登录请求逻辑提取为单独的方法
  executeWxLogin: function(code) {
  return new Promise((resolve, reject) => {
      console.log(`执行微信登录请求，code: ${code.substr(0, 6)}...`);
      
      // 标记code为即将使用（二次确认）
      CodeManager.markAsPending(code);
    
    wx.request({
        url: `${config.apiBaseUrl}/api/v1/auth/wx-login`,
      method: 'POST',
        timeout: 15000, // 增加超时时间到15秒
      header: {
          'content-type': 'application/json',
          'auth': wx.getStorageSync('token')
        },
        data: {
          code: code,
          appId: app.globalData.appId || '',
          version: app.globalData.version || '1.0.0',
          platform: wx.getSystemInfoSync().platform,
          system: wx.getSystemInfoSync().system
        },
        success: (res) => {
          // 释放登录锁
          LoginLock.release();
          
          if (res.statusCode === 200 && res.data && res.data.token) {
            // 登录成功，标记code为已使用
            CodeManager.markAsUsed(code);
            
            // 登录成功
            console.log('微信登录成功');
            
            // 保存token和用户信息
            wx.setStorageSync('token', res.data.token);
            wx.setStorageSync('userInfo', res.data.userInfo || {});
            wx.setStorageSync('loginTime', Date.now());
            
            // 设置token过期时间（通常服务器会返回过期时间，这里假设7天）
            const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
            wx.setStorageSync('tokenExpireTime', expireTime);
            
            // 更新全局变量
            isTokenAvailable = true;
            if (app.globalData) {
              app.globalData.token = res.data.token;
              app.globalData.userInfo = res.data.userInfo;
              app.globalData.userId = res.data.userInfo?.id;
              app.globalData.isLoggedIn = true;
            }
            
            // 设置登录成功状态
            LoginState.setState(LoginState.LOGGED_IN);
            
            // 触发登录成功事件
            if (app.globalData && app.globalData.emitter) {
              app.globalData.emitter.emit('loginSuccess', res.data);
            }
            
            resolve(res.data);
          } else if (res.statusCode === 400 && res.data && 
                     (res.data.error === 'code_used' || res.data.message?.includes('已使用'))) {
            // code已被使用，标记为已使用状态
            CodeManager.markAsUsed(code);
            console.warn('接口返回code已使用');
            LoginState.setState(LoginState.IDLE);
            
            // 自动处理code重用情况
            this.handleCodeReuse()
              .then(resolve)
              .catch(reject);
          } else if (res.statusCode === 429) {
            // 请求频率限制，标记为使用失败
            CodeManager.markAsFailed(code);
            LoginState.setState(LoginState.LOGIN_FAILED);
            reject({
              type: ERROR_TYPES.RATE_LIMITED,
              message: '请求过于频繁，请稍后再试',
              statusCode: res.statusCode,
              data: res.data
            });
          } else if (res.statusCode >= 500) {
            // 服务器错误，标记为使用失败
            CodeManager.markAsFailed(code);
            LoginState.setState(LoginState.LOGIN_FAILED);
            reject({
              type: ERROR_TYPES.SERVER_ERROR,
              message: '服务器错误，请稍后再试',
              statusCode: res.statusCode,
              data: res.data
            });
          } else {
            // 其他错误，标记为使用失败
            CodeManager.markAsFailed(code);
            LoginState.setState(LoginState.LOGIN_FAILED);
            reject({
              type: ERROR_TYPES.UNKNOWN_ERROR,
              message: res.data?.message || '登录失败，请重试',
              statusCode: res.statusCode,
              data: res.data
            });
          }
        },
        fail: (err) => {
          // 释放登录锁
          LoginLock.release();
          
          // 标记为使用失败
          CodeManager.markAsFailed(code);
          
          // 分类网络错误
          let errorType = ERROR_TYPES.NETWORK_ERROR;
          let errorMessage = '网络请求失败，请检查网络';
          
          if (err.errMsg && err.errMsg.includes('timeout')) {
            errorType = ERROR_TYPES.TIMEOUT_ERROR;
            errorMessage = '请求超时，请检查网络后重试';
          }
          
          // 设置登录失败状态
          LoginState.setState(LoginState.LOGIN_FAILED);
          
          reject({
            type: errorType,
            message: errorMessage,
            error: err
          });
        }
      });
    });
  },
  
  /**
   * 处理code已被使用的情况
   * 尝试恢复登录状态，如果有token就验证token并获取用户信息
   * 如果恢复失败，则清除登录状态并提示需要重新登录
   * @returns {Promise} 恢复结果Promise
   */
  handleCodeReuse: function() {
    console.log('处理code已被使用的情况，尝试恢复登录状态');
    
    // 获取当前登录状态
    const currentState = LoginState.getState();
    // 如果当前不是登录中或已登录状态，更新状态为正在恢复
    if (currentState !== LoginState.LOGGING_IN && currentState !== LoginState.LOGGED_IN) {
      LoginState.setState(LoginState.RECOVERING);
    }
    
  return new Promise((resolve, reject) => {
      // 1. 获取本地缓存的token和用户信息
    const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
    
    if (!token) {
        console.error('无法恢复登录状态：本地无token');
        LoginState.setState(LoginState.LOGIN_FAILED);
        return reject({
          type: ERROR_TYPES.AUTH_ERROR,
          message: '登录会话已失效，请重新登录'
        });
      }
      
      // 2. 验证token有效性
      this.checkTokenValidity()
        .then(isValid => {
          if (!isValid) {
            console.error('无法恢复登录状态：token无效');
            // 清除无效的token和用户信息
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            LoginState.setState(LoginState.LOGIN_FAILED);
            return reject({
              type: ERROR_TYPES.TOKEN_EXPIRED,
              message: '登录已失效，请重新登录'
            });
          }
          
          // 3. Token有效，验证用户信息
          if (!userInfo) {
            console.log('Token有效但缺少用户信息，尝试获取');
            return this.getUserInfo()
              .then(info => {
                // 用户信息获取成功，更新登录状态
                LoginState.setState(LoginState.LOGGED_IN);
                console.log('成功恢复登录状态，已获取最新用户信息');
                return resolve(info);
              })
              .catch(err => {
                console.error('获取用户信息失败:', err);
                LoginState.setState(LoginState.LOGIN_FAILED);
                return reject({
                  type: ERROR_TYPES.USER_INFO_ERROR,
                  message: '获取用户信息失败，请重新登录',
                  originalError: err
                });
              });
          }
          
          // 4. Token和用户信息都有效，直接返回成功
          console.log('成功恢复登录状态，使用缓存的用户信息');
          LoginState.setState(LoginState.LOGGED_IN);
          
          // 确保app.globalData也更新
          const app = getApp();
          if (app && app.globalData) {
            app.globalData.isLoggedIn = true;
            app.globalData.userInfo = userInfo;
            app.globalData.userId = userInfo.id;
          }
          
          // 触发登录成功事件
          if (app && app.globalData && app.globalData.emitter) {
            app.globalData.emitter.emit('loginSuccess', userInfo);
          }
          
          return resolve(userInfo);
        })
        .catch(err => {
          // 网络错误等其他错误
          console.error('恢复登录状态时发生错误:', err);
          
          // 判断是否为网络错误
          if (err.type === ERROR_TYPES.NETWORK_ERROR) {
            // 网络错误时，不清除token和用户信息
            // 但将状态设置为错误，以便UI层能够提示用户
            LoginState.setState(LoginState.LOGIN_FAILED);
            return reject({
              type: ERROR_TYPES.NETWORK_ERROR,
              message: '网络连接错误，请检查网络后重试',
              originalError: err
            });
          }
          
          // 其他错误，清除token和用户信息
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          LoginState.setState(LoginState.LOGIN_FAILED);
          
          return reject({
            type: ERROR_TYPES.UNKNOWN_ERROR,
            message: '登录状态恢复失败，请重新登录',
            originalError: err
          });
        });
    });
  },
  
  // 优化获取微信登录code并登录的方法
  getWxLoginCodeAndLogin: function(isAutoLogin = false) {
    // 获取App实例
    const app = getApp();
    
    // 如果是手动登录，标记App状态
    if (!isAutoLogin && app && app.setManualLoginState) {
      app.setManualLoginState(true);
    }
    
    return new Promise((resolve, reject) => {
      // 检查是否有登录锁
      if (LoginLock.isLocked()) {
        console.log('[用户API] 已有登录请求正在进行中');
        
        // 如果是手动登录，重置状态
        if (!isAutoLogin && app && app.setManualLoginState) {
          app.setManualLoginState(false);
        }
        
        return reject({
          type: ERROR_TYPES.LOGIN_IN_PROGRESS,
          message: '登录正在进行中，请稍后'
        });
      }
      
      // 先获取微信登录code
      getLoginCodeWithCache()
        .then(code => {
          // 执行登录
          return wxLogin(code);
        })
        .then(result => {
          // 登录成功处理
          // 如果是手动登录，重置状态
          if (!isAutoLogin && app && app.setManualLoginState) {
            app.setManualLoginState(false);
          }
          
          resolve(result);
        })
        .catch(error => {
          console.error('登录流程失败:', error);
          
          // 如果是手动登录，重置状态
          if (!isAutoLogin && app && app.setManualLoginState) {
            app.setManualLoginState(false);
          }
          
          reject(error);
        });
    });
  },
  
  // 绑定手机号
  bindPhone: function(encryptedData, iv) {
    // 参数检查
    if (!encryptedData || !iv) {
      return Promise.reject({
        type: ERROR_TYPES.PARAM_ERROR,
        message: '手机号信息不完整'
      });
    }
    
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      return Promise.reject({
        type: ERROR_TYPES.AUTH_ERROR,
        message: '未登录，无法绑定手机号'
      });
    }
    
    // 执行带自动重试的请求
    const executeWithRetry = (retryCount = 0) => {
      return new Promise((resolve, reject) => {
    wx.request({
          url: `${config.apiBaseUrl}/api/v1/user/bind-phone`,
      method: 'POST',
          timeout: 10000, // 设置10秒超时
      header: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + token
      },
      data: {
        encryptedData: encryptedData,
        iv: iv
      },
      success: function(res) {
            if (res.statusCode === 200 && res.data && res.data.success) {
              // 更新用户信息
              const userInfo = wx.getStorageSync('userInfo') || {};
              userInfo.phoneNumber = res.data.phoneNumber;
              userInfo.hasBindPhone = true;
              wx.setStorageSync('userInfo', userInfo);
              
              // 更新全局变量
              if (app.globalData && app.globalData.userInfo) {
                app.globalData.userInfo.phoneNumber = res.data.phoneNumber;
                app.globalData.userInfo.hasBindPhone = true;
              }
              
              resolve(res.data);
            } else if (res.statusCode === 401) {
              // token过期，需要重新登录
              isTokenAvailable = false;
              LoginState.setState(LoginState.LOGIN_FAILED);
              
              reject({
                type: ERROR_TYPES.TOKEN_EXPIRED,
                message: 'Token已过期，请重新登录',
                statusCode: res.statusCode
              });
            } else {
              reject({
                type: ERROR_TYPES.PHONE_BINDING_ERROR,
                message: '手机号绑定失败: ' + (res.data?.message || '未知错误'),
                statusCode: res.statusCode,
                data: res.data
              });
            }
      },
      fail: function(err) {
            // 分类网络错误
            let errorType = ERROR_TYPES.NETWORK_ERROR;
            let errorMessage = '网络请求失败，请检查网络';
            
            if (err.errMsg && err.errMsg.includes('timeout')) {
              errorType = ERROR_TYPES.TIMEOUT_ERROR;
              errorMessage = '请求超时，请检查网络后重试';
            }
            
            reject({
              type: errorType,
              message: errorMessage,
              error: err
            });
          }
        });
      }).catch(error => {
        // 网络错误自动重试
        if ((error.type === ERROR_TYPES.NETWORK_ERROR || 
             error.type === ERROR_TYPES.TIMEOUT_ERROR) && 
            retryCount < retryConfig.maxRetries) {
          
          const delay = retryConfig.getDelayTime(retryCount);
          console.log(`绑定手机号失败，${delay}ms后进行第${retryCount + 1}次重试`);
          
          return new Promise(resolve => setTimeout(resolve, delay))
            .then(() => executeWithRetry(retryCount + 1));
        }
        
        // 达到重试次数限制
        if (retryCount >= retryConfig.maxRetries && 
            (error.type === ERROR_TYPES.NETWORK_ERROR || 
             error.type === ERROR_TYPES.TIMEOUT_ERROR)) {
          error.type = ERROR_TYPES.RETRY_LIMIT_REACHED;
          error.message = `已达到最大重试次数(${retryConfig.maxRetries})，绑定手机号失败`;
        }
        
        return Promise.reject(error);
  });
};

    // 执行请求
    return executeWithRetry();
  },
  
  // 获取用户信息
  getUserInfo: function() {
  return new Promise((resolve, reject) => {
      // 检查登录状态
      const token = wx.getStorageSync(config.cache.tokenKey);
      console.log('[getUserInfo] Token from storage:', token);
      if (!token) {
        return reject({
          type: ERROR_TYPES.AUTH_ERROR,
          message: '未登录，无法获取用户信息'
        });
      }
      
      const requestUrl = `${config.apiBaseUrl}/api/v1/user`;
      const requestHeaders = {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      };
      console.log('[getUserInfo] Requesting URL:', requestUrl);
      console.log('[getUserInfo] Requesting Headers:', JSON.stringify(requestHeaders));

    wx.request({
        url: requestUrl,
        method: 'GET',
        header: requestHeaders,
        success: function(res) {
          if (res.statusCode === 200 && res.data) {
            // 检查后端统一响应格式
            if (res.data.error === 0 && res.data.body) {
              // 提取响应中的用户信息
              const userData = res.data.body;
              
              // 更新本地存储的用户信息
              wx.setStorageSync('userInfo', userData);
              wx.setStorageSync('userInfoLastUpdate', Date.now());
              
              // 更新全局变量
              if (app.globalData) {
                app.globalData.userInfo = userData;
                app.globalData.userId = userData.id;
                app.globalData.isLoggedIn = true;
              }
              
              resolve(userData);
            } else {
              // API返回了错误码
              reject({
                type: ERROR_TYPES.SERVER_ERROR,
                message: res.data.message || '获取用户信息失败',
                data: res.data
              });
            }
          } else if (res.statusCode === 401) {
            // token已过期
            isTokenAvailable = false;
            LoginState.setState(LoginState.LOGIN_FAILED);
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            
            reject({
              type: ERROR_TYPES.TOKEN_EXPIRED,
              message: '登录已过期，请重新登录',
              statusCode: res.statusCode
            });
          } else {
            // 其他HTTP错误
            reject({
              type: ERROR_TYPES.UNKNOWN_ERROR,
              message: '获取用户信息失败: ' + (res.data?.message || `HTTP错误 ${res.statusCode}`),
              statusCode: res.statusCode,
              data: res.data
            });
          }
        },
        fail: function(err) {
          reject({
            type: ERROR_TYPES.NETWORK_ERROR,
            message: '网络请求失败，请检查网络',
            error: err
          });
        }
      });
    });
  },
  
  // 检查并刷新用户信息
  refreshUserInfoIfNeeded: function() {
    // 检查本地用户信息是否存在
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !Object.keys(userInfo).length) {
      // 如果没有用户信息或为空，尝试获取
      return this.getUserInfo();
    }
    
    // 如果有用户信息，检查是否需要刷新
    // 这里可以根据业务需求设置刷新间隔，例如30分钟
    const lastUpdateTime = wx.getStorageSync('userInfoLastUpdate') || 0;
    const now = Date.now();
    const refreshInterval = 30 * 60 * 1000; // 30分钟
    
    if (now - lastUpdateTime > refreshInterval) {
      // 需要刷新
      return this.getUserInfo()
        .then(info => {
          wx.setStorageSync('userInfoLastUpdate', now);
          return info;
        })
        .catch(err => {
          // 如果刷新失败，但本地存在用户信息，仍然使用本地信息
          console.warn('刷新用户信息失败，使用本地缓存:', err);
          return userInfo;
        });
    }
    
    // 不需要刷新，直接返回本地信息
    return Promise.resolve(userInfo);
  },
  
  // 退出登录
  logout: function() {
    return new Promise((resolve) => {
      // 清除本地存储
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('userInfoLastUpdate');
      wx.removeStorageSync('loginTime');
      wx.removeStorageSync('tokenExpireTime');
      
      // 重置状态
      isTokenAvailable = false;
      LoginState.setState(LoginState.IDLE);
      // 释放登录锁
      LoginLock.release();
      
      // 清除全局变量
      if (app.globalData) {
        app.globalData.token = '';
        app.globalData.userInfo = null;
        app.globalData.userId = null;
        app.globalData.isLoggedIn = false;
      }
      
      resolve({ success: true });
    });
  }
};

// 初始化代码清理定时器
setInterval(() => CodeManager.cleanExpiredCodes(), 60000); // 每分钟清理一次过期code

// 重试机制配置
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 基础延迟，毫秒
  maxDelay: 5000,  // 最大延迟，毫秒
  
  // 计算指数退避延迟
  getDelayTime: function(retryCount) {
    // 指数退避算法: baseDelay * 2^retryCount + 随机抖动
    const exponentialDelay = this.baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // 0-1000毫秒的随机抖动
    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }
};

// 优化获取登录code的方法
const getLoginCodeWithCache = (() => {
  let codePromise = null;
  let lastCodeRequestTime = 0;
  
  return function() {
    // 首先清理过期的code
    CodeManager.cleanExpired();
    
    // 防止极短时间内重复获取code
    const now = Date.now();
    if (now - lastCodeRequestTime < 500) {
      console.log('获取code请求过于频繁，延迟处理');
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          getLoginCodeWithCache()
            .then(resolve)
            .catch(reject);
        }, 500);
      });
    }
    
    // 更新最后请求时间
    lastCodeRequestTime = now;
    
    // 如果已经有一个获取code的Promise正在进行，直接返回该Promise
    if (codePromise) {
      console.log('等待已有的获取code请求完成');
      return codePromise;
    }
    
    // 创建新的Promise获取code（不再缓存code，每次都获取新的）
    codePromise = new Promise((resolve, reject) => {
      console.log('开始获取新的微信登录code');
      wx.login({
        success: function(res) {
          if (res.code) {
            console.log(`获取登录code成功: ${res.code.substr(0, 6)}...`);
            
            // 检查code是否已被标记为使用
            if (CodeManager.isUsed(res.code)) {
              console.warn(`获取到的code已被标记为使用过: ${res.code.substr(0, 6)}...，重新获取`);
              
              // 延迟后重新获取
              setTimeout(() => {
                codePromise = null; // 清除promise，允许重新请求
                getLoginCodeWithCache()
                  .then(resolve)
                  .catch(reject);
              }, 1000);
              return;
            }
            
            // 立即标记为即将使用
            CodeManager.markAsPending(res.code);
            
            // 不再缓存code，每次都获取新code
            resolve(res.code);
        } else {
            console.error('获取登录code失败:', res);
            reject({
              type: ERROR_TYPES.UNKNOWN_ERROR,
              message: '获取登录凭证失败，请重试',
              error: res
            });
        }
      },
      fail: function(err) {
          console.error('wx.login调用失败:', err);
          reject({
            type: ERROR_TYPES.NETWORK_ERROR,
            message: '网络错误，无法获取登录凭证',
            error: err
          });
        },
        complete: function() {
          // 请求完成后，清除Promise缓存，允许发起新请求
          setTimeout(() => {
            codePromise = null;
          }, 500); // 增加延迟，防止极短时间内重复调用
      }
    });
  });
    
    return codePromise;
  };
})();

module.exports = userApi; 