// pages/login/login.js
const app = getApp()
const userApi = require('../../api/userApi.js')
const util = require('../../utils/util.js')

// 标记登录状态
let pageLoginStatus = {
  hasCheckedLogin: false, // 标记是否已检查过登录状态
  isLoginProcessing: false, // 标记是否正在处理登录
  lastLoginAttempt: 0, // 最后一次登录尝试时间
  loginCount: 0 // 登录计数器，用于防止重复登录
};

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    loginStatus: 'ready', // ready, loading, success, error
    loginMessage: '', // 登录状态信息
    isNavigating: false, // 防止重复跳转
    backgroundColor: app.globalData.backgroundColor,
    isCustomDisabled: true,  // 是否禁用获取手机号按钮
    canIUseButtonGetPhoneNumber: wx.canIUse('button.open-type.getPhoneNumber'),
    phoneAuthed: false,
    redirectedFrom: '', // 记录从哪里重定向过来的
    redirect: '' // 登录成功后的跳转路径
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('登录页面加载', options);
    
    // 重置登录页面状态
    pageLoginStatus = {
      hasCheckedLogin: false,
      isLoginProcessing: false,
      lastLoginAttempt: 0,
      loginCount: 0
    };
    
    // 检查是否支持getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 保存重定向来源和路径
    if (options.from) {
      this.setData({
        redirectedFrom: options.from
      });
    }
    
    if (options.redirect) {
      this.setData({
        redirect: decodeURIComponent(options.redirect)
      });
    }
    
    // 检查登录状态并重定向（如果已登录）
    this.checkLoginAndRedirect();
  },
  
  /**
   * 页面显示时的处理
   */
  onShow: function() {
    console.log('登录页面显示，检查登录状态');
    
    // 如果之前已经检查过登录状态，避免重复检查
    if (!pageLoginStatus.hasCheckedLogin) {
      this.checkLoginAndRedirect();
    }
  },

  /**
   * 统一登录状态检查和跳转
   * @returns {Boolean} 是否已登录
   */
  checkLoginAndRedirect: function() {
    console.log('执行登录状态检查');
    
    // 防止重复检查
    if (pageLoginStatus.isLoginProcessing) {
      console.log('登录检查正在进行中，避免重复检查');
      return false;
    }
    
    pageLoginStatus.isLoginProcessing = true;
    pageLoginStatus.hasCheckedLogin = true;
    
    // 检查是否已登录
    if (userApi.isLoggedIn()) {
      console.log('检测到已登录状态，验证token有效性');
      
      this.setData({ 
        loginStatus: 'loading',
        loginMessage: '验证登录状态...'
      });
      
      // 验证token有效性
      userApi.checkTokenValidity().then(isValid => {
        pageLoginStatus.isLoginProcessing = false;
        
        if (isValid) {
          console.log('Token有效，直接跳转到首页');
          this.setData({ 
            loginStatus: 'success',
            loginMessage: '已登录'
          });
          this.directToHome();
          return true;
        } else {
          // Token无效，需要重新登录
          console.log('Token已失效，需要重新登录');
          this.setData({
            loginStatus: 'ready',
            loginMessage: '登录已失效，请重新登录'
          });
          // 确保释放登录锁
          userApi.LoginLock.release();
          return false;
        }
      }).catch(err => {
        console.error('Token验证出错:', err);
        pageLoginStatus.isLoginProcessing = false;
        this.setData({
          loginStatus: 'ready',
          loginMessage: '登录状态验证失败，请重新登录'
        });
        // 确保释放登录锁
        userApi.LoginLock.release();
        return false;
      });
      
      return true; // 异步验证中，但状态是已登录
    } else {
      // 未登录状态
      console.log('未检测到登录状态，需要用户主动登录');
      pageLoginStatus.isLoginProcessing = false;
      this.setData({
        loginStatus: 'ready',
        loginMessage: '请登录'
      });
      return false;
    }
  },

  /**
   * 通过getUserProfile获取用户信息
   */
  getUserProfile: function(e) {
    // 1. 防抖检查：防止短时间内多次点击
    const now = Date.now();
    if (now - pageLoginStatus.lastLoginAttempt < 2000) { // 2秒内不允许重复点击
      console.log('点击过于频繁，请稍后再试');
      wx.showToast({
        title: '请勿频繁点击',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    pageLoginStatus.lastLoginAttempt = now;
    
    // 2. 状态检查：避免重复登录
    if (userApi.LoginState.isLoggingIn() || 
        this.data.loginStatus === 'loading' || 
        pageLoginStatus.isLoginProcessing) {
      console.log('登录中，请勿重复操作');
      wx.showToast({
        title: '登录中，请稍等',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 3. 登录锁检查：确保全局只有一个登录请求
    if (userApi.LoginLock.isLocked()) {
      console.log('系统正在处理登录，请稍等');
      wx.showToast({
        title: '系统正在处理登录，请稍等',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 4. 设置状态
    pageLoginStatus.isLoginProcessing = true;
    this.setData({
      loginStatus: 'loading',
      loginMessage: '获取用户信息...'
    });
    
    // 5. 显示获取用户信息界面
    wx.getUserProfile({
      desc: '用于完善用户资料', 
      success: (res) => {
        // 获取用户信息成功后，开始登录流程
        this.processUserInfo(res.userInfo);
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        pageLoginStatus.isLoginProcessing = false;
        this.setData({
          loginStatus: 'error',
          loginMessage: '获取用户信息失败，请重试'
        });
      }
    });
  },

  /**
   * 处理用户信息并登录
   */
  processUserInfo: function(userInfo) {
    // 更新界面显示用户信息
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true,
      loginMessage: '登录中...'
    });

    // 开始登录流程
    this.wxLoginWithDebounce();
  },

  /**
   * 旧的获取用户信息方法（兼容性）
   */
  onGetUserInfo: function (e) {
    // 1. 防抖检查：防止短时间内多次点击
    const now = Date.now();
    if (now - pageLoginStatus.lastLoginAttempt < 2000) { // 2秒内不允许重复点击
      console.log('点击过于频繁，请稍后再试');
      wx.showToast({
        title: '请勿频繁点击',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    pageLoginStatus.lastLoginAttempt = now;
    
    // 2. 状态检查：避免重复登录
    if (userApi.LoginState.isLoggingIn() || 
        this.data.loginStatus === 'loading' || 
        pageLoginStatus.isLoginProcessing) {
      console.log('登录中，请勿重复操作');
      wx.showToast({
        title: '登录中，请稍等',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 3. 设置状态
    pageLoginStatus.isLoginProcessing = true;
    
    if (e.detail.userInfo) {
      this.setData({
        loginStatus: 'loading',
        loginMessage: '获取用户信息...'
      });
      this.processUserInfo(e.detail.userInfo);
    } else {
      console.log('用户拒绝授权');
      pageLoginStatus.isLoginProcessing = false;
      this.setData({
        loginStatus: 'error',
        loginMessage: '需要授权才能登录'
      });
    }
  },

  /**
   * 微信登录（带增强防抖）
   */
  wxLoginWithDebounce: function() {
    // 增加登录计数
    pageLoginStatus.loginCount++;
    const currentLoginCount = pageLoginStatus.loginCount;
    
    console.log(`开始登录流程，当前登录序号：${currentLoginCount}`);
    
    // 防止短时间内触发多次登录
    const now = Date.now();
    if (now - pageLoginStatus.lastLoginAttempt < 1000) {
      console.log('登录请求太频繁，忽略本次请求');
      wx.showToast({
        title: '请勿频繁操作',
        icon: 'none',
        duration: 1500
      });
      return Promise.reject({ message: '请勿频繁操作' });
    }
    pageLoginStatus.lastLoginAttempt = now;
    
    // 检查是否已登录
    if (userApi.isLoggedIn()) {
      console.log('检测到已登录状态，验证token有效性');
      
      return userApi.checkTokenValidity().then(isValid => {
        // 检查是否已被更新的登录流程取代
        if (currentLoginCount !== pageLoginStatus.loginCount) {
          console.log('当前登录流程已被取代，中止处理');
          return Promise.reject({ message: '登录流程已取代' });
        }
        
        if (isValid) {
          console.log('Token有效，直接跳转');
          this.loginSuccess(null);
          return Promise.resolve({ skipped: true });
        } else {
          console.log('Token无效，需要重新登录');
          // 执行实际登录
          return this.executeLogin(currentLoginCount);
        }
      });
    } else {
      // 直接执行登录
      return this.executeLogin(currentLoginCount);
    }
  },
  
  /**
   * 执行实际的登录请求
   */
  executeLogin: function(loginCount) {
    if (loginCount !== pageLoginStatus.loginCount) {
      console.log('当前登录流程已被取代，中止处理');
      return Promise.reject({ message: '登录流程已取代' });
    }
    
    // 判断是否已有登录请求在进行中
    if (userApi.LoginState.isLoggingIn() || userApi.LoginLock.isLocked()) {
      console.log('已有登录请求正在处理中，等待其完成');
      wx.showToast({
        title: '登录中，请稍等',
        icon: 'none',
        duration: 2000
      });
      
      // 返回一个等待已有登录流程完成的Promise
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (userApi.LoginState.isLoggedIn()) {
            clearInterval(checkInterval);
            this.loginSuccess(null);
            resolve({ waitedForExisting: true });
          } else if (userApi.LoginState.isLoginFailed()) {
            clearInterval(checkInterval);
            const errorMsg = userApi.LoginState.errorMessage || '登录失败';
            this.loginFailed({ message: errorMsg });
            reject({ message: errorMsg });
          }
        }, 500);
        
        // 设置超时
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!userApi.LoginState.isLoggedIn()) {
            this.loginFailed({ message: '等待登录超时' });
            reject({ message: '等待登录超时' });
          }
        }, 15000);
      });
    }
    
    // 显示loading
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    
    this.setData({
      loginStatus: 'loading',
      loginMessage: '登录中...'
    });
    
    // 清理过期的code存储
    try {
      if (userApi.CodeManager && userApi.CodeManager.cleanExpired) {
        userApi.CodeManager.cleanExpired();
      }
    } catch (e) {
      console.error('清理code存储失败:', e);
    }
    
    // 执行登录，使用Promise链处理结果
    return userApi.getWxLoginCodeAndLogin()
      .then(result => {
        // 检查是否为最新登录流程
        if (loginCount !== pageLoginStatus.loginCount) {
          console.log('当前登录流程已被取代，中止处理');
          wx.hideLoading();
          return { skipped: true };
        }
        
        // 登录成功处理
        this.loginSuccess(result);
        return result;
      })
      .catch(error => {
        // 检查是否为最新登录流程
        if (loginCount !== pageLoginStatus.loginCount) {
          console.log('当前登录流程已被取代，中止处理');
          wx.hideLoading();
          return Promise.reject({ skipped: true });
        }
        
        // 登录失败处理
        this.loginFailed(error);
        return Promise.reject(error);
      });
  },
  
  /**
   * 统一的登录成功处理
   */
  loginSuccess: function(result) {
    console.log('登录成功:', result);
    
    // 重置状态
    pageLoginStatus.isLoginProcessing = false;
    
    // 更新页面状态
    this.setData({
      loginStatus: 'success',
      loginMessage: '登录成功'
    });
    
    // 隐藏加载
    wx.hideLoading();
    
    // 成功提示并跳转
                    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1000,
      complete: () => {
        setTimeout(() => {
          this.directToHome();
        }, 500);
      }
    });
  },
  
  /**
   * 统一的登录失败处理
   */
  loginFailed: function(error) {
    console.error('登录失败:', error);
    
    // 重置状态
    pageLoginStatus.isLoginProcessing = false;
    
    // 隐藏加载
    wx.hideLoading();
    
    // 错误提示
    let errorMsg = '登录失败，请重试';
    if (error && error.message) {
      errorMsg = error.message;
    }
    
    this.setData({
      loginStatus: 'error',
      loginMessage: errorMsg
    });
    
    // 特殊处理code已使用的情况，可以自动重试
    if (error && error.type === 'CODE_USED') {
      console.log('检测到code已使用错误，自动重试');
      setTimeout(() => {
        this.wxLoginWithDebounce()
          .catch(e => console.error('自动重试失败:', e));
      }, 2000);
      
      // 显示提示但不过于明显
          wx.showToast({
        title: '正在重新连接...',
        icon: 'none',
        duration: 1500
      });
    } else {
      // 其他错误正常提示
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 获取手机号
   */
  onGetPhoneNumber: function (e) {
    // 1. 防抖检查：防止短时间内多次点击
    const now = Date.now();
    if (now - pageLoginStatus.lastLoginAttempt < 2000) { // 2秒内不允许重复点击
      console.log('点击过于频繁，请稍后再试');
      wx.showToast({
        title: '请勿频繁点击',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    pageLoginStatus.lastLoginAttempt = now;
    
    // 2. 状态检查：避免重复登录
    if (userApi.LoginState.isLoggingIn() || 
        this.data.loginStatus === 'loading' || 
        pageLoginStatus.isLoginProcessing) {
      console.log('登录中，请勿重复操作');
      wx.showToast({
        title: '登录中，请稍等',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 3. 检查授权结果
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      console.error('获取手机号失败:', e.detail.errMsg);
      this.setData({
        loginStatus: 'error',
        loginMessage: '获取手机号失败'
      });
      
      wx.showToast({
        title: '获取手机号失败，请重试',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 4. 设置状态
    pageLoginStatus.isLoginProcessing = true;
    pageLoginStatus.loginCount++;
    const currentLoginCount = pageLoginStatus.loginCount;
    
    // 5. 更新UI状态
    this.setData({
      loginStatus: 'loading',
      loginMessage: '登录中...'
    });
    
    // 6. 显示加载提示
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    
    // 7. 先进行微信登录获取token
    userApi.getWxLoginCodeAndLogin()
      .then(result => {
        // 检查是否为最新登录流程
        if (currentLoginCount !== pageLoginStatus.loginCount) {
          console.log('当前登录流程已被取代，中止处理');
          wx.hideLoading();
          return;
        }
        
        console.log('微信登录成功，开始绑定手机号');
        
        // ---- 暂时禁用绑定手机号调用 ----
                wx.showToast({
          title: '手机号绑定功能暂未开放',
                  icon: 'none'
        });
        // 假设即使绑定失败/未开放，也要尝试跳转首页
        this.directToHome();
        /*
        // 原绑定调用代码，暂时注释
        userApi.bindPhone(e.detail.encryptedData, e.detail.iv)
          .then(res => {
            // 绑定成功
            wx.showToast({
              title: '手机号绑定成功',
              icon: 'success',
              duration: 1500
            });
            // 更新本地用户信息状态（如果需要）
            // ... 

            // 跳转首页
            this.directToHome();
          })
          .catch(err => {
            // 绑定失败
            console.error('手机号绑定失败:', err);
            // 显示错误信息
            wx.showModal({
              title: '绑定失败',
              content: err.message || '绑定手机号时发生错误，请稍后重试',
              showCancel: false
            });
            // 即使绑定失败，也尝试跳转首页，让用户能进入应用
            this.directToHome(); 
          });
        */
        // ---- 结束禁用 ----

      })
      .catch(error => {
        // 检查是否为最新登录流程
        if (currentLoginCount !== pageLoginStatus.loginCount) {
          console.log('当前登录流程已被取代，中止处理');
          wx.hideLoading();
          return;
        }
        
        // 登录失败
        this.loginFailed(error);
      });
  },

  /**
   * 直接跳转到首页
   */
  directToHome: function() {
    console.log('执行directToHome，准备跳转');
    
    // 防止重复跳转
    if (this.data.isNavigating) {
      console.log('正在跳转中，不重复执行');
      return;
    }
    
    this.setData({
      isNavigating: true
    });
    
    // 使用setTimeout包装跳转，确保状态更新
    setTimeout(() => {
      // 跳转到重定向页面或首页
      if (this.data.redirect) {
        console.log('跳转到指定页面:', this.data.redirect);
        wx.reLaunch({
          url: this.data.redirect,
          fail: (err) => {
            console.error('跳转失败:', err);
            // 跳转失败时降级到首页 (使用 reLaunch)
            wx.reLaunch({
              url: '/pages/home/home',
              fail: (err2) => {
                console.error('降级跳转首页失败:', err2);
              }
            });
          }
        });
    } else {
        console.log('跳转到首页');
        // 尝试使用reLaunch直接跳转首页
        wx.reLaunch({
          url: '/pages/home/home',
          fail: (err) => {
            console.error('reLaunch跳转首页失败:', err);
            // 如果 reLaunch 失败，再尝试 switchTab (作为备选)
            wx.switchTab({
              url: '/pages/home/home',
              fail: (err2) => {
                console.error('switchTab跳转首页失败:', err2);
              }
            });
          }
        });
      }
      
      // 重置导航状态
      this.setData({
        isNavigating: false
      });
    }, 100);
  },
  
  /**
   * 页面卸载时的处理
   */
  onUnload: function() {
    console.log('登录页面卸载');
    // 确保释放登录锁
    if (userApi.LoginLock.isLocked()) {
      userApi.LoginLock.release();
    }
  },

  /**
   * 页面隐藏时的处理
   */
  onHide: function() {
    console.log('登录页面隐藏');
    // 确保释放登录锁，避免锁定后无法释放
    if (userApi.LoginLock.isLocked() && pageLoginStatus.isLoginProcessing) {
      userApi.LoginLock.release();
    }
  }
}) 