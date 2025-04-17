// home.js
const userApi = require('../../api/userApi');
const signInApi = require('../../api/signInApi');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    signInStatus: null,
    loading: true,
    carouselImages: [
      '/static/images/banner1.jpg',
      '/static/images/banner2.jpg',
      '/static/images/banner3.jpg'
    ],
    features: [
      { id: 1, name: '单词检查', icon: '/static/icons/check.png', url: '/pages/upload/upload' },
      { id: 2, name: '历史记录', icon: '/static/icons/history.png', url: '/pages/result/result' },
      { id: 3, name: '我的积分', icon: '/static/icons/points.png', url: '/pages/points/points' },
      { id: 4, name: '积分充值', icon: '/static/icons/recharge.png', url: '/pages/recharge/recharge' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.checkLoginStatus();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (getApp().globalData.token) {
      this.loadUserInfo();
      // 暂时注释掉获取签到状态，因为接口404
      // this.loadSignInStatus(); 
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      getApp().globalData.token = token;
      getApp().globalData.userInfo = userInfo;
      this.setData({
        userInfo: userInfo,
        loading: false
      });
      // this.loadSignInStatus();
    } else {
      this.setData({
        loading: false
      });
      wx.navigateTo({
        url: '/pages/login/login'
      });
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo: function () {
    userApi.getUserInfo().then(res => {
      this.setData({
        userInfo: res
      });
      getApp().globalData.userInfo = res;
    }).catch(err => {
      console.error('获取用户信息失败', err);
    });
  },

  /**
   * 加载签到状态
   */
  loadSignInStatus: function () {
    signInApi.getSignInStatus().then(res => {
      this.setData({
        signInStatus: res
      });
    }).catch(err => {
      console.error('获取签到状态失败', err);
    });
  },

  /**
   * 处理签到
   */
  handleSignIn: function () {
    if (this.data.signInStatus && this.data.signInStatus.todaySigned) {
      wx.showToast({
        title: '今日已签到',
        icon: 'none'
      });
      return;
    }

    signInApi.signIn().then(res => {
      wx.showToast({
        title: '签到成功 +' + res.points + '积分',
        icon: 'success'
      });
      this.loadSignInStatus();
      this.loadUserInfo(); // 刷新用户积分
    }).catch(err => {
      console.error('签到失败', err);
    });
  },

  /**
   * 跳转到功能页面
   */
  navigateToFeature: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '单词检查小程序 - 提升你的英语水平',
      path: '/pages/home/home'
    };
  }
}) 