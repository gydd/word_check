// pages/points/points.js
const app = getApp()
const pointApi = require('../../api/pointApi')
const signInApi = require('../../api/signInApi')

// 检查pointApi是否正确导入
console.log('[points.js] pointApi导入检查:', pointApi);
console.log('[points.js] getUserPoints函数检查:', typeof pointApi.getUserPoints);
console.log('[points.js] getPointsRecords函数检查:', typeof pointApi.getPointsRecords);

Page({
  /**
   * 页面的初始数据
   */
  data: {
    pointsInfo: {},
    records: [],
    activeTab: 'all',
    page: 1,
    pageSize: 10,
    hasMoreRecords: true,
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getPointsInfo()
    this.getPointsRecords()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.refreshData()
  },

  /**
   * 刷新页面数据
   */
  refreshData: function () {
    this.setData({ 
      page: 1, 
      records: [],
      hasMoreRecords: true
    })
    
    Promise.all([
      this.getPointsInfo(),
      this.getPointsRecords()
    ]).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 获取用户积分信息
   */
  getPointsInfo: function () {
    console.log('[points.js] 开始获取积分信息');
    return pointApi.getUserPoints().then(res => {
      console.log('[points.js] 积分获取成功:', res);
      this.setData({ pointsInfo: res })
    }).catch(err => {
      console.error('[points.js] 获取积分信息失败:', err)
      wx.showToast({
        title: '获取积分信息失败',
        icon: 'none'
      })
    })
  },

  /**
   * 获取积分记录
   */
  getPointsRecords: function () {
    const { page, pageSize, activeTab, records } = this.data
    
    if (this.data.isLoading) return Promise.resolve()
    
    this.setData({ isLoading: true })
    console.log('[points.js] 开始获取积分记录, 参数:', { page, pageSize, type: activeTab });
    
    return pointApi.getPointsRecords({
      page: page,
      pageSize: pageSize,
      type: activeTab
    }).then(res => {
      console.log('[points.js] 积分记录获取成功:', res);
      // 合并记录
      const newRecords = page === 1 ? res.records : [...records, ...res.records]
      
      this.setData({
        records: newRecords,
        hasMoreRecords: newRecords.length < res.total,
        page: page + 1
      })
    }).catch(err => {
      console.error('[points.js] 获取积分记录失败:', err)
      wx.showToast({
        title: '获取积分记录失败',
        icon: 'none'
      })
    }).finally(() => {
      this.setData({ isLoading: false })
    })
  },

  /**
   * 加载更多记录
   */
  loadMoreRecords: function () {
    if (this.data.isLoading || !this.data.hasMoreRecords) return
    this.getPointsRecords()
  },

  /**
   * 切换标签页
   */
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    
    if (tab === this.data.activeTab) return
    
    this.setData({
      activeTab: tab,
      page: 1,
      records: [],
      hasMoreRecords: true
    })
    
    this.getPointsRecords()
  },

  /**
   * 前往签到页面
   */
  goToSignIn: function () {
    wx.navigateTo({
      url: '/pages/sign-in/sign-in'
    })
  },

  /**
   * 前往单词检查页面
   */
  goToWordCheck: function () {
    wx.switchTab({
      url: '/pages/home/home'
    })
  },

  /**
   * 前往充值页面
   */
  goToRecharge: function () {
    wx.navigateTo({
      url: '/pages/recharge/recharge'
    })
  }
}) 