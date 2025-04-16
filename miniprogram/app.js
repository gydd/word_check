// app.js
App({
  globalData: {
    userInfo: null,
    // baseUrl: 'https://api.wordcheck.com', // 请替换为实际的API基础URL
    baseUrl: 'http://127.0.0.1:8080', // 请替换为实际的API基础URL
    token: '',
    userId: null,
    isLoggedIn: false,
    emitter: null  // 将在userApi.js中初始化
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function() {
    console.log('检查登录状态');
    
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
      
      // 检查token有效性
      this.checkToken().then(valid => {
        console.log('Token有效性检查结果:', valid);
        this.globalData.isLoggedIn = valid;
        
        if (!valid) {
          console.log('Token无效，尝试自动登录');
          this.enhancedAutoLogin();
        }
      });
    } else {
      console.log('未找到token，尝试自动登录');
      this.enhancedAutoLogin();
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
        resolve(false);
        return;
      }
      
      this.globalData.token = token;
      
      // 使用token访问需要认证的接口，验证token是否有效
      wx.request({
        url: this.globalData.baseUrl + '/api/v1/user/info',
        method: 'GET',
        header: {
          'Authorization': token
        },
        success: (res) => {
          console.log('验证token响应:', res);
          
          if (res.statusCode === 200) {
            if (res.data.code === 200) {
              console.log('token有效，用户已登录');
              // 刷新用户信息
              const userInfo = res.data.data;
              this.globalData.userInfo = userInfo;
              this.globalData.userId = userInfo.id;
              wx.setStorageSync('userInfo', userInfo);
              resolve(true);
            } else {
              console.log('token无效，需要重新登录');
              this.clearLoginInfo();
              resolve(false);
            }
          } else {
            console.error('验证token请求失败，HTTP状态码:', res.statusCode);
            this.clearLoginInfo();
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
   * 增强版自动登录
   * @returns {Promise} 登录结果Promise
   */
  enhancedAutoLogin: function() {
    console.log('开始增强版自动登录');
    
    return new Promise((resolve, reject) => {
      // 检查是否已登录
      if (this.globalData.isLoggedIn) {
        console.log('用户已登录，无需自动登录');
        resolve(true);
        return;
      }
      
      // 执行微信登录
      wx.login({
        success: (res) => {
          if (res.code) {
            console.log('获取微信登录code成功:', res.code);
            
            // 导入userApi模块
            const userApi = require('./api/userApi.js');
            
            // 使用增强版微信登录
            userApi.wxLogin(res.code)
              .then(result => {
                console.log('增强版自动登录成功:', result);
                
                // 设置登录状态
                this.globalData.isLoggedIn = true;
                
                // 触发登录成功事件
                if (this.globalData.emitter) {
                  this.globalData.emitter.emit('loginSuccess', result);
                }
                
                resolve(true);
              })
              .catch(error => {
                console.error('增强版自动登录失败:', error);
                
                // 触发登录失败事件
                if (this.globalData.emitter) {
                  this.globalData.emitter.emit('loginFailed', error);
                }
                
                reject(error);
              });
          } else {
            console.error('获取微信登录code失败:', res.errMsg);
            reject(new Error('获取微信登录code失败'));
          }
        },
        fail: (err) => {
          console.error('wx.login调用失败:', err);
          reject(err);
        }
      });
    });
  },

  /**
   * 清除登录信息
   */
  clearLoginInfo: function() {
    console.log('清除登录信息');
    
    this.globalData.token = '';
    this.globalData.userInfo = null;
    this.globalData.userId = null;
    this.globalData.isLoggedIn = false;
    
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  },

  onLaunch: function() {
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
    
    if (token) {
      // 验证token是否有效
      this.checkToken();
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