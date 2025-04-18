// home.js
const userApi = require('../../api/userApi');
const signInApi = require('../../api/signInApi');
const carouselApi = require('../../api/carouselApi'); // 引入轮播图API
const userHelper = require('../../utils/userHelper.js'); // 引入用户头像处理工具

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    avatarLoading: false,
    loadingUserInfo: true,
    signInStatus: {
      hasSigned: false,
      todaySigned: false, // 与WXML中的判断匹配
      continuousDays: 0,
      totalSignDays: 0, // 增加累计签到天数
      points: 0
    },
    loading: true,
    loadingSignIn: false,
    userInfoLoaded: false,
    // 轮播图相关数据
    carouselItems: [],
    carouselLoading: true,
    carouselError: false,
    // 功能菜单
    features: [
      { 
        id: 1, 
        name: '单词检查', 
        icon: '/static/icons/check.png',
        url: '/pages/upload/upload' 
      },
      { 
        id: 2, 
        name: '历史记录', 
        icon: '/static/icons/history.png',
        url: '/pages/result/result' 
      },
      { 
        id: 3, 
        name: '我的积分', 
        icon: '/static/icons/points.png',
        url: '/pages/points/points' 
      },
      { 
        id: 4, 
        name: '积分充值', 
        icon: '/static/icons/recharge.png',
        url: '/pages/recharge/recharge' 
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 先检查登录状态
    this.checkLoginStatus();
    
    // 清除轮播图缓存，确保使用最新数据
    wx.removeStorageSync('carousel_data');
    wx.removeStorageSync('carousel_time');
    
    // 加载轮播图数据
    this.loadCarouselData();
    
    // 预检查头像状态，但确保不影响其他功能
    this.preCheckAvatarStatus();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (getApp().globalData.token) {
      // 先加载签到状态，优先保证签到功能正常
      this.loadSignInStatus();
      // 再加载用户信息
      this.loadUserInfo();
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
        
        // 显示后记录查看
        if (data && data.length > 0) {
          this.recordCarouselViews(data);
        }
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
   * 记录轮播图查看
   */
  recordCarouselViews: function(carousels) {
    // 只记录最多前5个轮播图的查看统计
    const maxCount = Math.min(carousels.length, 5);
    for (let i = 0; i < maxCount; i++) {
      const carousel = carousels[i];
      if (carousel && carousel.id) {
        carouselApi.recordView(carousel.id).catch(err => {
          console.warn('记录轮播图查看失败', err);
        });
      }
    }
  },

  /**
   * 处理轮播图点击事件
   */
  handleCarouselItemClick: function(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.carouselItems[index];
    
    if (!item) return;
    
    console.log('轮播图点击', item);
    
    // 记录点击统计
    if (item.id) {
      carouselApi.recordClick(item.id).catch(err => {
        console.warn('记录轮播图点击失败', err);
      });
    }
    
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
    const defaultImage = '/static/images/cat_banner.png';
    if (items[index] && items[index].imageUrl !== defaultImage) {
      const key = `carouselItems[${index}].imageUrl`;
      this.setData({
        [key]: defaultImage
      });
      console.warn(`轮播图 ${index} 加载失败，已替换为默认图片`);
    }
  },

  /**
   * 处理头像加载错误
   */
  handleAvatarError: function(e) {
    console.warn('首页头像加载错误，使用默认头像');
    
    // 使用更新的全局头像处理工具，但不影响签到状态
    const fixedUserInfo = userHelper.handleAvatarError(this.data.userInfo, (updatedInfo) => {
      this.setData({
        userInfo: updatedInfo,
        avatarLoading: false
      });
    });
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
      
      // 设置用户信息，但使用一个简化版的验证以避免影响其他功能
      this.setBasicUserInfo(userInfo);
      
      this.setData({
        loading: false
      });
      // 立即加载签到状态
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
   * 设置基本用户信息，简化版的验证，避免影响签到功能
   */
  setBasicUserInfo: function(userInfo) {
    if (!userInfo) return;
    
    // 简单验证，不进行复杂的异步操作
    const basicValidatedUserInfo = {...userInfo};
    if (!basicValidatedUserInfo.avatarUrl || 
        (typeof basicValidatedUserInfo.avatarUrl === 'string' && basicValidatedUserInfo.avatarUrl.trim() === '')) {
      basicValidatedUserInfo.avatarUrl = userHelper.DEFAULT_AVATAR;
    }
    
    this.setData({
      userInfo: basicValidatedUserInfo,
      loadingUserInfo: false
    });
  },

  /**
   * 加载用户信息
   */
  loadUserInfo: function () {
    userApi.getUserInfo().then(res => {
      // 在成功获取用户信息后进行完整验证
      // 将验证逻辑与UI更新分离，以避免影响签到功能
      this.validateAndSetUserInfo(res);
      getApp().globalData.userInfo = res;
      
      // 加载最新积分信息
      this.loadUserPoints();
    }).catch(err => {
      console.error('获取用户信息失败', err);
    });
  },
  
  /**
   * 验证并设置用户信息
   */
  validateAndSetUserInfo: function(userInfo) {
    if (!userInfo) return;
    
    try {
      // 先进行同步验证
      const validatedUserInfo = userHelper.validateUserAvatar(userInfo);
      
      // 设置用户信息，但避免影响现有UI状态
      this.setData({
        userInfo: validatedUserInfo
      });
      
      // 然后异步验证头像URL，但确保不影响其他功能
      if (validatedUserInfo.avatarUrl && 
          validatedUserInfo.avatarUrl !== userHelper.DEFAULT_AVATAR && 
          !validatedUserInfo.avatarUrl.startsWith('/static/')) {
        
        // 设置头像为加载中状态
        this.setData({ avatarLoading: true });
        
        // 异步验证头像，但使用Promise捕获任何错误以避免影响其他功能
        userHelper.validateAvatarAsync(validatedUserInfo.avatarUrl)
          .then(validAvatarUrl => {
            if (validAvatarUrl !== validatedUserInfo.avatarUrl) {
              // 更新头像地址
              this.setData({
                'userInfo.avatarUrl': validAvatarUrl,
                avatarLoading: false
              });
            } else {
              // 头像验证通过但未更改
              this.setData({ avatarLoading: false });
            }
          })
          .catch(() => {
            // 验证出错，使用默认头像
            this.setData({ 
              avatarLoading: false,
              'userInfo.avatarUrl': userHelper.DEFAULT_AVATAR
            });
          });
      } else {
        // 已经是默认头像或本地图片，无需异步验证
        this.setData({ avatarLoading: false });
      }
    } catch (err) {
      console.error('验证用户头像时出错:', err);
      this.setData({ avatarLoading: false });
    }
  },

  /**
   * 加载用户积分信息
   */
  loadUserPoints: function() {
    // 导入pointApi
    const pointApi = require('../../api/pointApi.js');
    
    if (typeof pointApi.getUserPoints !== 'function') {
      console.error('pointApi.getUserPoints不是一个函数');
      return;
    }
    
    pointApi.getUserPoints()
      .then(pointsData => {
        console.log('获取到最新积分信息:', pointsData);
        
        // 正确提取积分值
        let points = 0;
        if (typeof pointsData === 'number') {
          // 如果直接返回数值
          points = pointsData;
        } else if (pointsData && typeof pointsData === 'object') {
          // 如果返回对象，尝试获取不同可能的字段名
          if (typeof pointsData.availablePoints === 'number') {
            points = pointsData.availablePoints;
          } else if (typeof pointsData.points === 'number') {
            points = pointsData.points;
          } else if (typeof pointsData.point === 'number') {
            points = pointsData.point;
          } else if (typeof pointsData.balance === 'number') {
            points = pointsData.balance;
          } else {
            // 如果无法确定字段，记录对象以便调试
            console.warn('无法从返回数据中提取积分:', pointsData);
            
            // 尝试找到第一个看起来像积分的数值
            for (const key in pointsData) {
              if (typeof pointsData[key] === 'number' && key.toLowerCase().includes('point')) {
                points = pointsData[key];
                console.log(`找到可能的积分字段 "${key}":`, points);
                break;
              }
            }
          }
        }
        
        // 更新用户积分信息
        this.setData({
          'userInfo.points': points
        });
      })
      .catch(err => {
        console.error('获取积分信息失败:', err);
      });
  },

  /**
   * 加载签到状态
   */
  loadSignInStatus: function () {
    this.setData({
      loadingSignIn: true
    });
    
    signInApi.getSignInStatus()
      .then(res => {
        this.setData({
          loadingSignIn: false
        });
        
        console.log('获取签到状态成功:', res);
        
        if (res.success) {
          // 处理后端返回的数据
          const totalDays = res.data.totalDays || res.data.totalSignDays || 0;
          const hasSigned = res.data.hasSigned || false;
          
          this.setData({
            signInStatus: {
              hasSigned: hasSigned,
              todaySigned: hasSigned, // todaySigned与hasSigned同步
              continuousDays: res.data.continuousDays || 0,
              totalSignDays: totalDays,
              points: res.data.points || 0
            }
          });
          
          console.log('签到状态已更新:', this.data.signInStatus);
        } else if (res.alreadySigned) {
          // 已签到状态
          const totalDays = res.data.totalDays || res.data.totalSignDays || 0;
          
          this.setData({
            signInStatus: {
              hasSigned: true,
              todaySigned: true,
              continuousDays: res.data.continuousDays || 0,
              totalSignDays: totalDays,
              points: res.data.points || 0
            }
          });
          
          console.log('已签到状态已更新:', this.data.signInStatus);
        }
      })
      .catch(err => {
        console.error('获取签到状态失败', err);
        this.setData({
          loadingSignIn: false
        });
      });
  },

  /**
   * 处理签到
   */
  handleSignIn: function () {
    // 如果正在加载或已经签到，禁止操作
    if (this.data.loadingSignIn) {
      return;
    }
    
    // 如果已经签到，直接提示
    if (this.data.signInStatus.hasSigned || this.data.signInStatus.todaySigned) {
      wx.showToast({
        title: '今日已签到',
        icon: 'none'
      });
      return;
    }

    this.setData({
      loadingSignIn: true
    });

    signInApi.signIn()
      .then(res => {
        this.setData({
          loadingSignIn: false
        });
        
        console.log('签到返回结果:', res);
        
        if (res.success) {
          // 签到成功
          const totalDays = res.data.totalDays || res.data.totalSignDays || 
                          (this.data.signInStatus.totalSignDays + 1);
          
          this.setData({
            signInStatus: {
              hasSigned: true,
              todaySigned: true,
              continuousDays: res.data.continuousDays || 0,
              totalSignDays: totalDays,
              points: res.data.points || 0
            }
          });
          
          console.log('签到成功后状态:', this.data.signInStatus);

          wx.showToast({
            title: `签到成功，获得${res.data.addedPoints || 1}积分`,
            icon: 'success'
          });
        } else if (res.alreadySigned) {
          // 已经签到过了
          const totalDays = res.data.totalDays || res.data.totalSignDays || 
                          this.data.signInStatus.totalSignDays;
          
          // 保证连续签到天数不会被错误地重置为0
          const continuousDays = res.data.continuousDays || this.data.signInStatus.continuousDays;
          
          this.setData({
            signInStatus: {
              hasSigned: true,
              todaySigned: true,
              continuousDays: continuousDays,
              totalSignDays: totalDays,
              points: res.data.points || this.data.signInStatus.points
            }
          });
          
          console.log('已签到状态反馈:', this.data.signInStatus);
          
          wx.showToast({
            title: res.message || '今日已签到',
            icon: 'none'
          });
        } else {
          // 其他业务错误
          wx.showToast({
            title: res.message || '签到失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('签到失败', err);
        this.setData({
          loadingSignIn: false
        });
        wx.showToast({
          title: '签到失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 跳转到功能页面
   */
  navigateToFeature: function (e) {
    const url = e.currentTarget.dataset.url;
    console.log('[home.js] 尝试跳转到:', url);
    
    if (!url) {
      console.error('[home.js] 跳转URL为空');
      wx.showToast({
        title: '页面跳转失败',
        icon: 'none'
      });
      return;
    }
    
    // 判断是否是tabBar页面
    const tabBarPages = ['/pages/home/home', '/pages/upload/upload', '/pages/profile/profile'];
    const isTabBarPage = tabBarPages.some(tabBarPage => url.startsWith(tabBarPage));
    
    if (isTabBarPage) {
      wx.switchTab({
        url: url,
        success: () => {
          console.log('[home.js] 页面跳转成功(switchTab):', url);
        },
        fail: (err) => {
          console.error('[home.js] 页面跳转失败(switchTab):', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    } else {
      wx.navigateTo({
        url: url,
        success: () => {
          console.log('[home.js] 页面跳转成功(navigateTo):', url);
        },
        fail: (err) => {
          console.error('[home.js] 页面跳转失败(navigateTo):', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '单词检查小程序 - 提升你的英语水平',
      path: '/pages/home/home'
    };
  },

  /**
   * 预检查头像状态
   */
  preCheckAvatarStatus: function() {
    try {
      const app = getApp();
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
      
      if (userInfo && userInfo.avatarUrl) {
        // 使用工具类的预加载方法，但包裹在try-catch中以避免影响其他功能
        userHelper.preloadAvatar(userInfo.avatarUrl).catch(err => {
          console.warn('头像预加载失败，但不影响其他功能:', err);
        });
      }
    } catch (err) {
      console.warn('头像预检查失败，但不影响其他功能:', err);
    }
  }
})