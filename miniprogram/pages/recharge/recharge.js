const app = getApp();
const api = require('../../api/wordCheckApi');
const rechargeApi = require('../../api/rechargeApi');
const pointApi = require('../../api/pointApi');

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
    
    // 尝试使用pointApi获取积分
    pointApi.getUserPoints()
      .then(pointsData => {
        console.log('pointApi返回的积分信息:', pointsData);
        
        // 提取正确的积分值
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
        
        this.setData({
          userPoints: points
        });
        wx.hideLoading();
      })
      .catch(err => {
        console.error('pointApi获取积分失败，尝试使用wordCheckApi:', err);
        
        // 如果pointApi失败，尝试使用wordCheckApi
        api.getUserPoints()
          .then(res => {
            console.log('wordCheckApi返回的积分信息:', res);
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
    wx.showLoading({ title: '订单处理中' });
    
    console.log(`准备创建充值订单，金额: ${amount}元`);
    
    // 首先尝试使用专用的rechargeApi
    const createOrder = () => {
      try {
        // 先尝试使用rechargeApi
        if (typeof rechargeApi.createRechargeOrder === 'function') {
          console.log('使用rechargeApi创建订单');
          return rechargeApi.createRechargeOrder({
            packageId: this.data.selectedOption >= 0 ? (this.data.selectedOption + 1) : null,
            amount: amount,
            paymentMethod: this.data.paymentMethod
          });
        } else {
          // 如果rechargeApi不可用，回退到wordCheckApi
          console.log('使用wordCheckApi创建订单');
          return api.createRechargeOrder({
            amount: amount,
            paymentMethod: this.data.paymentMethod
          });
        }
      } catch (err) {
        console.error('创建订单出现异常:', err);
        // 回退到wordCheckApi
        return api.createRechargeOrder({
          amount: amount,
          paymentMethod: this.data.paymentMethod
        });
      }
    };
    
    // 创建充值订单
    createOrder()
      .then(res => {
        wx.hideLoading();
        console.log('创建订单成功，准备调起支付:', res);
        
        // 检查返回的支付参数
        if (!res.timeStamp || !res.nonceStr || !res.package || !res.signType || !res.paySign) {
          console.error('支付参数不完整:', res);
          throw new Error('支付参数不完整');
        }
        
        console.log('微信支付参数:', {
          timeStamp: res.timeStamp,
          nonceStr: res.nonceStr,
          package: res.package,
          signType: res.signType,
          paySign: res.paySign,
        });
        
        // 调用微信支付接口
        return new Promise((resolve, reject) => {
          wx.requestPayment({
            timeStamp: res.timeStamp,
            nonceStr: res.nonceStr,
            package: res.package,
            signType: res.signType,
            paySign: res.paySign,
            success: (payResult) => {
              console.log('微信支付成功:', payResult);
              resolve(payResult);
            },
            fail: (err) => {
              console.error('微信支付失败:', err);
              
              // 检查特定的错误类型并提供更具体的错误信息
              if (err.errMsg) {
                if (err.errMsg.includes('cancel')) {
                  console.log('用户取消了支付');
                  err.isCancelled = true;
                } else if (err.errMsg.includes('requestPayment:fail')) {
                  if (err.errMsg.includes('appid not exist')) {
                    console.error('支付失败: appid不存在或错误');
                  } else if (err.errMsg.includes('jsapi_pay not enabled')) {
                    console.error('支付失败: 未开通JSAPI支付权限');
                  } else if (err.errMsg.includes('invalid signature')) {
                    console.error('支付失败: 签名验证失败');
                  } else if (err.errMsg.includes('out_trade_no exists')) {
                    console.error('支付失败: 商户订单号重复');
                  }
                }
              }
              
              reject(err);
            }
          });
        });
      })
      .then(() => {
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
      })
      .catch(err => {
        console.error('充值失败:', err);
        
        // 区分支付取消和其他错误
        if (err.isCancelled || (err.errMsg && err.errMsg.indexOf('cancel') !== -1)) {
          wx.showToast({
            title: '支付已取消',
            icon: 'none'
          });
        } else {
          // 不同类型的错误显示不同的提示
          let errorMsg = err.message || '充值失败，请重试';
          if (err.errMsg) {
            if (err.errMsg.includes('appid not exist')) {
              errorMsg = 'AppID配置错误';
            } else if (err.errMsg.includes('jsapi_pay not enabled')) {
              errorMsg = '支付权限未开通';
            } else if (err.errMsg.includes('invalid signature')) {
              errorMsg = '签名验证失败';
            }
          }
          
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
        }
      })
      .finally(() => {
        this.setData({ isProcessing: false });
        wx.hideLoading();
      });
  }
}); 