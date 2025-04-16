const app = getApp();
const api = require('../../api/wordCheckApi');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userPoints: 0, // 用户当前积分
    rechargeOptions: [
      { amount: 10, points: 100 },
      { amount: 30, points: 300 },
      { amount: 50, points: 550, tag: "赠50" },
      { amount: 100, points: 1200, tag: "赠200" },
      { amount: 200, points: 2500, tag: "赠500" },
      { amount: 500, points: 6500, tag: "赠1500" }
    ],
    selectedOption: -1, // 选中的充值选项索引
    customAmount: '', // 自定义充值金额
    estimatedPoints: 0, // 预计获得积分
    paymentMethod: 'wxpay', // 支付方式：wxpay
    canRecharge: false, // 是否可以充值
    isProcessing: false // 是否正在处理充值请求
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getUserPoints();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (app.globalData.pointsChanged) {
      this.getUserPoints();
      app.globalData.pointsChanged = false;
    }
  },

  /**
   * 获取用户积分
   */
  getUserPoints: function () {
    wx.showLoading({ title: '获取积分信息' });
    api.getUserPoints()
      .then(res => {
        this.setData({
          userPoints: res.availablePoints || 0
        });
      })
      .catch(err => {
        console.error('获取积分失败', err);
        wx.showToast({
          title: '获取积分信息失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 选择充值选项
   */
  selectOption: function (e) {
    const index = e.currentTarget.dataset.index;
    const selected = this.data.rechargeOptions[index];
    
    this.setData({
      selectedOption: index,
      customAmount: '',
      estimatedPoints: selected.points,
      canRecharge: true
    });
  },

  /**
   * 输入自定义金额
   */
  inputCustomAmount: function (e) {
    const amount = e.detail.value;
    let estimatedPoints = 0;
    let canRecharge = false;
    
    if (amount) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        // 计算预计获得的积分，根据充值梯度计算赠送额度
        if (parsedAmount < 30) {
          estimatedPoints = Math.floor(parsedAmount * 10); // 1元=10积分
        } else if (parsedAmount < 50) {
          estimatedPoints = Math.floor(parsedAmount * 10); // 1元=10积分
        } else if (parsedAmount < 100) {
          estimatedPoints = Math.floor(parsedAmount * 10 + parsedAmount); // 额外赠送10%
        } else if (parsedAmount < 200) {
          estimatedPoints = Math.floor(parsedAmount * 10 + parsedAmount * 2); // 额外赠送20%
        } else if (parsedAmount < 500) {
          estimatedPoints = Math.floor(parsedAmount * 10 + parsedAmount * 2.5); // 额外赠送25%
        } else {
          estimatedPoints = Math.floor(parsedAmount * 10 + parsedAmount * 3); // 额外赠送30%
        }
        
        canRecharge = true;
      }
    }
    
    this.setData({
      customAmount: amount,
      selectedOption: -1,
      estimatedPoints,
      canRecharge
    });
  },

  /**
   * 选择支付方式
   */
  selectPaymentMethod: function (e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      paymentMethod: method
    });
  },

  /**
   * 执行充值
   */
  rechargePoints: function () {
    if (!this.data.canRecharge || this.data.isProcessing) {
      return;
    }
    
    let amount = 0;
    
    if (this.data.selectedOption !== -1) {
      amount = this.data.rechargeOptions[this.data.selectedOption].amount;
    } else if (this.data.customAmount) {
      amount = parseFloat(this.data.customAmount);
      if (isNaN(amount) || amount <= 0) {
        wx.showToast({
          title: '请输入有效的充值金额',
          icon: 'none'
        });
        return;
      }
    } else {
      wx.showToast({
        title: '请选择或输入充值金额',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isProcessing: true });
    
    // 生成微信支付参数
    api.createRechargeOrder({
      amount: amount,
      paymentMethod: this.data.paymentMethod
    })
      .then(res => {
        // 调用微信支付接口
        wx.requestPayment({
          timeStamp: res.timeStamp,
          nonceStr: res.nonceStr,
          package: res.package,
          signType: res.signType,
          paySign: res.paySign,
          success: () => {
            // 支付成功
            wx.showToast({
              title: '充值成功',
              icon: 'success'
            });
            
            // 更新积分状态
            app.globalData.pointsChanged = true;
            this.getUserPoints();
            
            // 延迟返回上一页
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          },
          fail: (err) => {
            if (err.errMsg.indexOf('cancel') !== -1) {
              wx.showToast({
                title: '支付已取消',
                icon: 'none'
              });
            } else {
              wx.showToast({
                title: '支付失败，请重试',
                icon: 'none'
              });
            }
          },
          complete: () => {
            this.setData({ isProcessing: false });
          }
        });
      })
      .catch(err => {
        console.error('创建订单失败', err);
        wx.showToast({
          title: err.message || '创建订单失败，请重试',
          icon: 'none'
        });
        this.setData({ isProcessing: false });
      });
  }
}); 