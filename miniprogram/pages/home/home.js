// home.js
const userApi = require('../../api/userApi');
const signInApi = require('../../api/signInApi');
const carouselApi = require('../../api/carouselApi'); // 引入轮播图API

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    signInStatus: null,
    loading: true,
    loadingSignIn: false,
    userInfoLoaded: false,
    // 轮播图相关数据
    carouselItems: [],
    carouselLoading: true,
    carouselError: false,
    // 功能菜单
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
    // 加载轮播图数据
    this.loadCarouselData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (getApp().globalData.token) {
      this.loadUserInfo();
      this.loadSignInStatus();
    }
  },

  /**
   * 加载轮播图数据
   */
  loadCarouselData: function() {
    this.setData({ carouselLoading: true, carouselError: false });
    
    carouselApi.getCarouselList()
      .then(data => {
        this.setData({
          carouselItems: data,
          carouselLoading: false
        });
      })
      .catch(err => {
        console.error('轮播图加载失败', err);
        this.setData({
          carouselError: true,
          carouselLoading: false
        });
      });
  },

  /**
   * 处理轮播图点击事件
   */
  handleCarouselItemClick: function(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.carouselItems[index];
    
    if (!item) return;
    
    console.log('轮播图点击', item);
    
    // 根据不同链接类型处理跳转
    switch (item.linkType) {
      case 'page':
        // 跳转到小程序内页面
        wx.navigateTo({
          url: item.linkUrl,
          fail: err => {
            console.error('页面跳转失败', err);
            wx.showToast({
              title: '页面跳转失败',
              icon: 'none'
            });
          }
        });
        break;
      case 'web':
        // 打开网页
        wx.navigateTo({
          url: `/pages/webview/webview?url=${encodeURIComponent(item.linkUrl)}`,
          fail: err => {
            console.error('网页打开失败', err);
            wx.showToast({
              title: '网页打开失败',
              icon: 'none'
            });
          }
        });
        break;
      case 'miniprogram':
        // 打开其他小程序
        wx.navigateToMiniProgram({
          appId: item.appId,
          path: item.linkUrl,
          fail: err => {
            console.error('小程序跳转失败', err);
            wx.showToast({
              title: '小程序跳转失败',
              icon: 'none'
            });
          }
        });
        break;
      default:
        console.log('未知的链接类型或无链接');
    }
  },

  /**
   * 处理轮播图图片加载错误
   */
  handleImageError: function(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.carouselItems;
    
    // 替换为默认图片
    const defaultImage = '/static/images/cat_banner.jpg';
    if (items[index] && items[index].imageUrl !== defaultImage) {
      const key = `carouselItems[${index}].imageUrl`;
      this.setData({
        [key]: defaultImage
      });
      console.warn(`轮播图 ${index} 加载失败，已替换为默认图片`);
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
      this.loadSignInStatus();
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
    this.setData({
      loadingSignIn: true
    });
    
    signInApi.getSignInStatus().then(res => {
      console.log('签到状态:', res);
      this.setData({
        signInStatus: res,
        loadingSignIn: false
      });
    }).catch(err => {
      console.error('获取签到状态失败', err);
      this.setData({
        loadingSignIn: false
      });
      
      this.setData({
        signInStatus: {
          todaySigned: false,
          continuousDays: 0,
          totalSignDays: 0
        }
      });
    });
  },

  /**
   * 处理签到
   */
  handleSignIn: function () {
    if (this.data.loadingSignIn) {
      return;
    }
    
    if (this.data.signInStatus && this.data.signInStatus.todaySigned) {
      wx.showToast({
        title: '今日已签到',
        icon: 'none'
      });
      return;
    }

    this.setData({
      loadingSignIn: true
    });

    signInApi.signIn().then(res => {
      if (this.data.signInStatus) {
        let signInStatus = this.data.signInStatus;
        signInStatus.todaySigned = true;
        signInStatus.continuousDays = res.continuousDays;
        signInStatus.totalSignDays = res.totalSignDays;
        
        this.setData({
          signInStatus: signInStatus
        });
      }
      
      wx.showToast({
        title: '签到成功 +' + res.points + '积分',
        icon: 'success'
      });
      
      this.loadUserInfo();
    }).catch(err => {
      console.error('签到失败', err);
      
      if (err && err.message && err.message.includes('已签到')) {
        if (this.data.signInStatus) {
          let signInStatus = this.data.signInStatus;
          signInStatus.todaySigned = true;
          
          this.setData({
            signInStatus: signInStatus
          });
        }
      }
      
      wx.showToast({
        title: err.message || '签到失败',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({
        loadingSignIn: false
      });
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