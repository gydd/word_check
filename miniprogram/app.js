// app.js
App({
  globalData: {
    userInfo: null,
    // baseUrl: 'https://api.wordcheck.com', // 请替换为实际的API基础URL
    baseUrl: 'http://127.0.0.1:8080', // 请替换为实际的API基础URL
    token: '',
    userId: null,
    isLoggedIn: false,
    emitter: null,  // 将在userApi.js中初始化
    
    // 登录流程控制
    autoLoginEnabled: true,      // 是否启用自动登录
    autoLoginInProgress: false,  // 自动登录是否正在进行中
    manualLoginInProgress: false, // 手动登录是否正在进行中
    lastAutoLoginTime: 0,        // 上次自动登录时间
    minAutoLoginInterval: 10 * 1000, // 最小自动登录间隔时间（10秒）
    autoLoginAttempts: 0,        // 自动登录尝试次数（用于控制和防止循环）
    maxAutoLoginAttempts: 3      // 短时间内最大自动登录尝试次数
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function() {
    console.log('检查登录状态');
    
    // 导入userApi模块
    const userApi = require('./api/userApi.js');
    
    // 从本地存储中获取token和userInfo
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    console.log('本地存储的token:', token);
    console.log('本地存储的userInfo:', userInfo);
    
    if (token) {
      this.globalData.token = token;
      
      if (userInfo) {
        this.globalData.userInfo = userInfo;
        this.globalData.userId = userInfo.id;
      }
      
      // 验证token有效性，而不是立即更新登录状态
      userApi.checkTokenValidity(true).then(valid => {
        console.log('Token有效性检查结果:', valid);
        this.globalData.isLoggedIn = valid;
        
        // 如果token有效，设置登录状态
        if (valid) {
          userApi.LoginState.setState(userApi.LoginState.LOGGED_IN);
        } else {
          console.log('Token无效，但不自动登录，等待用户主动触发');
          userApi.LoginState.reset();
          // 清除无效token
          wx.removeStorageSync('token');
        }
      });
    } else {
      console.log('未找到token，等待用户主动登录');
      userApi.LoginState.reset();
      this.globalData.isLoggedIn = false;
    }
  },

  /**
   * 检查token是否有效
   * @returns {Promise} Promise对象
   */
  checkToken: function() {
    return new Promise((resolve, reject) => {
      console.log('检查token状态');
      const token = wx.getStorageSync('token');
      
      if (!token) {
        console.log('没有token，认为未登录');
        // 导入userApi模块
        const userApi = require('./api/userApi.js');
        userApi.LoginState.reset();
        this.globalData.isLoggedIn = false;
        resolve(false);
        return;
      }
      
      this.globalData.token = token;
      
      // 使用token访问需要认证的接口，验证token是否有效
      wx.request({
        url: this.globalData.baseUrl + '/api/v1/user',
        method: 'GET',
        header: {
          'Authorization': token.startsWith('Bearer ') ? token : 'Bearer ' + token
        },
        success: (res) => {
          console.log('验证token响应:', res);
          
          if (res.statusCode === 200) {
            // 兼容后端两种响应格式: {code: 200, data:{...}} 或 {error: 0, body:{...}}
            const isSuccess = (res.data.code === 200) || (res.data.error === 0);
            const userData = res.data.data || res.data.body;
            
            if (isSuccess && userData) {
              console.log('token有效，用户已登录');
              // 刷新用户信息
              this.globalData.userInfo = userData;
              this.globalData.userId = userData.id;
              wx.setStorageSync('userInfo', userData);
              
              // 导入userApi模块
              const userApi = require('./api/userApi.js');
              userApi.LoginState.setState(userApi.LoginState.LOGGED_IN);
              this.globalData.isLoggedIn = true;
              
              resolve(true);
            } else {
              console.log('token无效，需要重新登录');
              this.clearLoginInfo();
              resolve(false);
            }
          } else {
            console.error('验证token请求失败，HTTP状态码:', res.statusCode);
            // 不再自动清除登录信息，等待用户主动触发登录
            resolve(false);
          }
        },
        fail: (err) => {
          console.error('验证token网络请求失败:', err);
          // 网络错误时，保留token状态，不判定为失效
          resolve(true);
        }
      });
    });
  },

  /**
   * 用户主动触发登录时调用此方法
   * @returns {Promise} 登录结果Promise
   */
  userInitiatedLogin: function() {
    console.log('用户主动触发登录');
            
            // 导入userApi模块
            const userApi = require('./api/userApi.js');
            
    // 检查是否有登录锁
    if (userApi.LoginLock && userApi.LoginLock.isLocked()) {
      console.log('有其他登录流程正在进行，请稍后再试');
      return Promise.reject(new Error('有其他登录流程正在进行，请稍后再试'));
    }
    
    // 重置登录状态
    userApi.LoginState.reset();
    
    // 执行登录流程
    return userApi.getWxLoginCodeAndLogin()
              .then(result => {
        console.log('用户主动登录成功:', result);
                this.globalData.isLoggedIn = true;
                
                // 触发登录成功事件
                if (this.globalData.emitter) {
                  this.globalData.emitter.emit('loginSuccess', result);
                }
                
        return result;
      });
  },

  /**
   * 检查是否可以进行自动登录
   */
  canPerformAutoLogin: function() {
    const now = Date.now();
    
    // 如果手动登录正在进行中，不允许自动登录
    if (this.globalData.manualLoginInProgress) {
      console.log('手动登录正在进行中，跳过自动登录');
      return false;
    }
    
    // 如果自动登录禁用，不允许自动登录
    if (!this.globalData.autoLoginEnabled) {
      console.log('自动登录功能已禁用');
      return false;
    }
    
    // 如果自动登录正在进行中，不重复触发
    if (this.globalData.autoLoginInProgress) {
      console.log('自动登录正在进行中，不重复触发');
      return false;
    }
    
    // 如果距离上次自动登录时间过短，不重复触发
    if (now - this.globalData.lastAutoLoginTime < this.globalData.minAutoLoginInterval) {
      console.log('距离上次自动登录时间过短，不重复触发');
      return false;
    }
    
    // 如果短时间内自动登录尝试次数过多，暂时禁用自动登录
    if (this.globalData.autoLoginAttempts >= this.globalData.maxAutoLoginAttempts) {
      console.log('短时间内自动登录尝试次数过多，暂时禁用自动登录');
      // 暂时禁用自动登录
      this.globalData.autoLoginEnabled = false;
      
      // 设置定时器，一段时间后重新启用
      setTimeout(() => {
        this.globalData.autoLoginEnabled = true;
        this.globalData.autoLoginAttempts = 0;
        console.log('自动登录功能已重新启用');
      }, 2 * 60 * 1000); // 2分钟后重新启用
      
      return false;
    }
    
    return true;
  },
  
  // 记录自动登录尝试
  recordAutoLoginAttempt: function() {
    this.globalData.autoLoginAttempts++;
    this.globalData.lastAutoLoginTime = Date.now();
    this.globalData.autoLoginInProgress = true;
    
    // 设置超时保护，防止状态未正确更新
    setTimeout(() => {
      if (this.globalData.autoLoginInProgress) {
        console.log('自动登录状态保护：重置卡住的自动登录状态');
        this.globalData.autoLoginInProgress = false;
      }
    }, 30 * 1000); // 30秒后强制清除状态
  },
  
  // 完成自动登录（成功或失败）
  completeAutoLogin: function(success, error) {
    this.globalData.autoLoginInProgress = false;
    
    if (success) {
      // 登录成功，重置尝试次数
      console.log('自动登录成功，重置尝试次数');
      this.globalData.autoLoginAttempts = 0;
    } else {
      console.log('自动登录失败', error);
    }
  },
  
  // 标记手动登录状态
  setManualLoginState: function(inProgress) {
    this.globalData.manualLoginInProgress = inProgress;
    
    // 如果开始手动登录，暂时禁用自动登录
    if (inProgress) {
      console.log('手动登录开始，暂时禁用自动登录');
      this.globalData.autoLoginEnabled = false;
      
      // 自动登录可能正在进行中，取消它
      if (this.globalData.autoLoginInProgress) {
        this.globalData.autoLoginInProgress = false;
      }
    } else {
      // 手动登录结束后，延时一段时间后再启用自动登录
      console.log('手动登录结束，延时后启用自动登录');
      setTimeout(() => {
        this.globalData.autoLoginEnabled = true;
        console.log('自动登录功能已重新启用');
      }, 5 * 1000); // 5秒后重新启用
    }
  },
  
  // 优化自动登录函数
  autoLogin: function() {
    // 检查是否可以进行自动登录
    if (!this.canPerformAutoLogin()) {
      return Promise.reject({
        type: 'AUTO_LOGIN_SKIPPED',
        message: '跳过自动登录'
      });
    }
    
    // 记录自动登录尝试
    this.recordAutoLoginAttempt();
    
    // 执行登录
    return new Promise((resolve, reject) => {
      const userApi = require('./api/userApi');
      
      // 使用标记为自动登录的方法
      userApi.getWxLoginCodeAndLogin()
        .then(result => {
          this.completeAutoLogin(true);
          resolve(result);
              })
              .catch(error => {
          this.completeAutoLogin(false, error);
          
          // 针对不同错误类型做不同处理
          if (error && error.type === 'CODE_USED') {
            console.log('自动登录时code已被使用，尝试处理');
            // 特殊处理已使用的code情况
            userApi.handleCodeReuse()
              .then(resolve)
              .catch(reject);
            return;
                }
                
                reject(error);
      });
    });
  },

  /**
   * 清除登录信息
   */
  clearLoginInfo: function() {
    console.log('清除登录信息');
    
    // 导入userApi模块
    const userApi = require('./api/userApi.js');
    
    this.globalData.token = '';
    this.globalData.userInfo = null;
    this.globalData.userId = null;
    this.globalData.isLoggedIn = false;
    
    // 清除存储
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('loginTime');
    wx.removeStorageSync('userInfoLastUpdate');
    wx.removeStorageSync('tokenExpireTime');
    
    // 重置登录状态
    userApi.LoginState.reset();
    
    // 释放登录锁
    if (userApi.LoginLock && userApi.LoginLock.isLocked()) {
      userApi.LoginLock.release();
    }
  },

  onLaunch: function() {
    console.log('应用启动');
    
    // 启动小程序时执行的逻辑
    const token = wx.getStorageSync('token') || '';
    const userInfo = wx.getStorageSync('userInfo') || null;
    
    // 打印调试信息
    console.log('应用启动，从存储读取token:', token);
    
    // 确保token格式正确
    if (token && !token.startsWith('Bearer ')) {
      this.globalData.token = 'Bearer ' + token;
      console.log('token格式处理，添加Bearer前缀');
    } else {
      this.globalData.token = token;
    }
    
    console.log('设置全局token:', this.globalData.token);
    this.globalData.userInfo = userInfo;
    
    // 导入userApi模块
    const userApi = require('./api/userApi.js');
    
    // 初始化EventEmitter
    if (!this.globalData.emitter && userApi.EventEmitter) {
      this.globalData.emitter = new userApi.EventEmitter();
    }
    
    if (token) {
      // 验证token是否有效，不再自动设置登录状态
      this.checkToken().then(valid => {
        // 只有在token验证有效的情况下才进行状态更新
        if (valid) {
          userApi.LoginState.setState(userApi.LoginState.LOGGED_IN);
          this.globalData.isLoggedIn = true;
        } else {
          // token无效，不自动触发登录
          console.log('Token无效，等待用户主动触发登录');
        }
      });
    } else {
      console.log('未找到token，等待用户主动登录');
    }
    
    // 优化自动登录逻辑
    if (wx.getStorageSync('token')) {
      console.log('启动时发现token，尝试自动登录');
      this.autoLogin()
        .then(userInfo => {
          console.log('自动登录成功', userInfo);
        })
        .catch(error => {
          console.log('自动登录失败', error);
          // 不在启动时反复尝试，避免循环
        });
    } else {
      console.log('启动时未发现token，跳过自动登录');
    }
  },
  
  // 获取带前缀的认证头
  getAuthHeader: function() {
    const token = this.globalData.token;
    if (!token) {
      console.warn('获取认证头时token为空');
      return '';
    }
    
    if (token && !token.startsWith('Bearer ')) {
      console.log('认证头添加Bearer前缀');
      return 'Bearer ' + token;
    }
    return token;
  }
}) 