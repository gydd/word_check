// pages/profile/profile.js
const app = getApp()
const userApi = require('../../api/userApi')
const pointApi = require('../../api/pointApi')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    isLoggedIn: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.checkLoginStatus()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.checkLoginStatus()
    
    if (this.data.isLoggedIn) {
      this.getUserInfo()
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    this.setData({
      isLoggedIn: !!token,
      userInfo: userInfo || {}
    })
  },

  /**
   * 获取用户信息
   */
  getUserInfo: function () {
    userApi.getUserInfo().then(userInfo => {
      // 更新个人信息及积分
      this.setData({ userInfo: userInfo })
      wx.setStorageSync('userInfo', userInfo)
    }).catch(err => {
      console.error('获取用户信息失败:', err)
    })
  },

  /**
   * 前往登录页
   */
  goToLogin: function () {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  /**
   * 退出登录
   */
  logout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          app.globalData.token = ''
          app.globalData.userInfo = null
          
          // 更新页面状态
          this.setData({
            isLoggedIn: false,
            userInfo: {}
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  /**
   * 前往我的积分页面
   */
  goToPoints: function () {
    if (!this.data.isLoggedIn) {
      this.goToLogin()
      return
    }
    
    wx.navigateTo({
      url: '/pages/points/points'
    })
  },

  /**
   * 前往检查历史页面
   */
  goToHistory: function () {
    if (!this.data.isLoggedIn) {
      this.goToLogin()
      return
    }
    
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  /**
   * 前往我的收藏页面
   */
  goToFavorites: function () {
    if (!this.data.isLoggedIn) {
      this.goToLogin()
      return
    }
    
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    })
  },

  /**
   * 前往设置页面
   */
  goToSettings: function () {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  /**
   * 前往意见反馈页面
   */
  goToFeedback: function () {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  /**
   * 前往关于我们页面
   */
  goToAbout: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  /**
   * 点击头像
   */
  onTapAvatar: function () {
    if (!this.data.isLoggedIn) {
      this.goToLogin()
      return
    }
    
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  }
})