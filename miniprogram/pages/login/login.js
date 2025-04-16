// pages/login/login.js
const app = getApp()
const userApi = require('../../api/userApi')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查是否已经登录
    if (wx.getStorageSync('token')) {
      this.navigateBack()
    }
  },

  /**
   * 获取用户信息
   */
  onGetUserInfo: function (e) {
    if (this.data.isLoading) return
    
    this.setData({ isLoading: true })
    
    if (e.detail.userInfo) {
      const userInfo = e.detail.userInfo
      console.log('获取到用户信息:', userInfo)
      
      // 获取登录码
      wx.login({
        success: (res) => {
          if (res.code) {
            console.log('获取登录码成功:', res.code)
            // 调用登录接口
            userApi.login({
              code: res.code,
              userInfo: userInfo
            }).then(result => {
              console.log('登录成功，获取到token:', result.token)
              
              // 保存登录状态
              wx.setStorageSync('token', result.token)
              wx.setStorageSync('userInfo', result.userInfo)
              
              // 设置全局数据
              app.globalData.token = result.token;
              app.globalData.userInfo = result.userInfo;
              app.globalData.userId = result.userInfo.id;
              
              console.log('存储token和用户信息完成')
              console.log('app.globalData.token:', app.globalData.token)
              
              // 登录成功后绑定手机号
              if (e.detail.encryptedData && e.detail.iv) {
                console.log('尝试绑定手机号');
                userApi.bindPhone({
                  phoneNumber: e.detail.encryptedData,
                  iv: e.detail.iv
                }).catch(err => {
                  console.error('绑定手机号失败', err)
                })
              }
              
              // 登录成功
              this.navigateBack()
            }).catch(err => {
              console.error('登录失败，尝试备用方案:', err)
              
              // 尝试使用不同认证头的方法
              userApi.tryAlternativeWxLogin(res.code).then(result => {
                console.log('备用方案登录成功，获取到token:', result.token)
                
                // 保存登录状态
                wx.setStorageSync('token', result.token)
                wx.setStorageSync('userInfo', result.userInfo)
                
                // 设置全局数据
                app.globalData.token = result.token;
                app.globalData.userInfo = result.userInfo;
                app.globalData.userId = result.userInfo.id;
                
                console.log('存储token和用户信息完成')
                
                // 登录成功后绑定手机号
                if (e.detail.encryptedData && e.detail.iv) {
                  console.log('尝试绑定手机号');
                  userApi.bindPhone({
                    phoneNumber: e.detail.encryptedData,
                    iv: e.detail.iv
                  }).catch(err => {
                    console.error('绑定手机号失败', err)
                  })
                }
                
                // 登录成功
                this.navigateBack()
              }).catch(finalErr => {
                console.error('所有尝试都失败:', finalErr)
                
                // 尝试使用参数方式登录
                console.log('尝试使用参数方式登录')
                userApi.tryParameterLogin(res.code).then(result => {
                  console.log('参数方式登录成功，获取到token:', result.token)
                  
                  // 保存登录状态
                  wx.setStorageSync('token', result.token)
                  wx.setStorageSync('userInfo', result.userInfo)
                  
                  // 设置全局数据
                  app.globalData.token = result.token;
                  app.globalData.userInfo = result.userInfo;
                  app.globalData.userId = result.userInfo.id;
                  
                  console.log('存储token和用户信息完成')
                  
                  // 登录成功
                  this.navigateBack()
                }).catch(lastErr => {
                  console.error('参数方式登录也失败，尝试所有可能的端点:', lastErr)
                  
                  // 最后尝试所有可能的端点
                  userApi.tryAllPossibleEndpoints(res.code).then(result => {
                    console.log('找到可用的登录端点，获取到token:', result.token)
                    
                    // 保存登录状态
                    wx.setStorageSync('token', result.token)
                    wx.setStorageSync('userInfo', result.userInfo)
                    
                    // 设置全局数据
                    app.globalData.token = result.token;
                    app.globalData.userInfo = result.userInfo;
                    app.globalData.userId = result.userInfo ? result.userInfo.id : null;
                    
                    console.log('存储token和用户信息完成')
                    
                    // 登录成功
                    this.navigateBack()
                  }).catch(finalLastErr => {
                    console.error('所有登录方式都失败:', finalLastErr)
                    wx.showToast({
                      title: '登录失败，请重试',
                      icon: 'none'
                    })
                    this.setData({ isLoading: false })
                  })
                })
              })
            })
          } else {
            this.setData({ isLoading: false })
            console.error('获取用户登录态失败:', res)
            wx.showToast({
              title: '获取用户登录态失败',
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          this.setData({ isLoading: false })
          console.error('wx.login调用失败:', err)
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          })
        }
      })
    } else {
      this.setData({ isLoading: false })
      wx.showToast({
        title: '您拒绝了授权，将无法使用部分功能',
        icon: 'none'
      })
    }
  },

  /**
   * 获取手机号
   */
  onGetPhoneNumber: function (e) {
    if (this.data.isLoading) return
    
    this.setData({ isLoading: true })
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 获取登录码
      wx.login({
        success: (res) => {
          if (res.code) {
            console.log('获取登录码成功:', res.code)
            // 尝试新的微信登录接口
            userApi.wxLogin(res.code).then(result => {
              console.log('手机号登录成功，获取到token:', result.token)
              
              // 保存登录状态
              wx.setStorageSync('token', result.token)
              wx.setStorageSync('userInfo', result.userInfo)
              
              // 设置全局数据
              app.globalData.token = result.token;
              app.globalData.userInfo = result.userInfo;
              app.globalData.userId = result.userInfo.id;
              
              console.log('存储token和用户信息完成')
              console.log('app.globalData.token:', app.globalData.token)
              
              // 登录成功后绑定手机号
              if (e.detail.encryptedData && e.detail.iv) {
                console.log('尝试绑定手机号');
                userApi.bindPhone({
                  phoneNumber: e.detail.encryptedData,
                  iv: e.detail.iv
                }).catch(err => {
                  console.error('绑定手机号失败', err)
                })
              }
              
              // 登录成功
              this.navigateBack()
            }).catch(err => {
              console.error('新接口登录失败，尝试备用接口:', err)
              
              // 如果新接口失败，尝试使用旧接口
              userApi.fallbackWxLogin(res.code).then(result => {
                console.log('备用接口登录成功，获取到token:', result.token)
                
                // 保存登录状态
                wx.setStorageSync('token', result.token)
                wx.setStorageSync('userInfo', result.userInfo)
                
                // 设置全局数据
                app.globalData.token = result.token;
                app.globalData.userInfo = result.userInfo;
                app.globalData.userId = result.userInfo.id;
                
                console.log('存储token和用户信息完成')
                console.log('app.globalData.token:', app.globalData.token)
                
                // 登录成功后绑定手机号
                if (e.detail.encryptedData && e.detail.iv) {
                  console.log('尝试绑定手机号');
                  userApi.bindPhone({
                    phoneNumber: e.detail.encryptedData,
                    iv: e.detail.iv
                  }).catch(err => {
                    console.error('绑定手机号失败', err)
                  })
                }
                
                // 登录成功
                this.navigateBack()
              }).catch(finalErr => {
                console.error('所有尝试都失败:', finalErr)
                wx.showToast({
                  title: '登录失败，请重试',
                  icon: 'none'
                })
                this.setData({ isLoading: false })
              })
            })
          } else {
            this.setData({ isLoading: false })
            wx.showToast({
              title: '获取用户登录态失败',
              icon: 'none'
            })
          }
        },
        fail: () => {
          this.setData({ isLoading: false })
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          })
        }
      })
    } else {
      this.setData({ isLoading: false })
      wx.showToast({
        title: '您拒绝了授权，将无法使用部分功能',
        icon: 'none'
      })
    }
  },

  /**
   * 跳转回原来的页面
   */
  navigateBack: function () {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }
  }
}) 