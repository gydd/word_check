// upload.js
const app = getApp();
const api = require('../../api/wordCheckApi');
const util = require('../../utils/util');
const fileManager = wx.getFileSystemManager();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户相关
    userPoints: 0,
    checkCost: 1, // 每次检测消耗的积分数

    // 页面状态
    currentTab: 'text', // 当前选中的选项卡：text 或 file
    isSubmitting: false, // 是否正在提交检测请求
    showError: false, // 是否显示错误信息
    errorMsg: '', // 错误信息

    // 文本检测相关
    textContent: '', // 文本内容
    textLength: 0, // 文本长度
    maxTextLength: 10000, // 最大文本长度

    // 文件检测相关
    file: null, // 当前选择的文件
    fileName: '', // 文件名称
    fileSize: '', // 文件大小（格式化后的字符串）
    fileSizeRaw: 0, // 文件大小（原始字节数）
    maxFileSize: 5 * 1024 * 1024, // 最大文件大小（5MB）
    supportedFileTypes: ['doc', 'docx', 'txt', 'pdf'], // 支持的文件类型
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
    // 如果用户可能已经进行了积分操作，刷新积分
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
          userPoints: res.currentPoints || 0
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
   * 切换选项卡
   */
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab !== this.data.currentTab) {
      this.setData({
        currentTab: tab,
        showError: false,
        errorMsg: ''
      });
    }
  },

  /**
   * 输入文本内容
   */
  inputText: function (e) {
    const text = e.detail.value;
    const length = text.length;
    
    this.setData({
      textContent: text,
      textLength: length,
      showError: false,
      errorMsg: ''
    });
  },

  /**
   * 选择文件
   */
  chooseFile: function () {
    const that = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success(res) {
        const file = res.tempFiles[0];
        const fileName = file.name;
        const fileSize = file.size;
        const fileSizeFormatted = util.formatFileSize(fileSize);
        
        // 检查文件类型
        const fileExtension = util.getFileExtension(fileName).toLowerCase();
        if (!that.data.supportedFileTypes.includes(fileExtension)) {
          that.setData({
            showError: true,
            errorMsg: '文件类型不支持，请上传doc、docx、txt或pdf格式的文件'
          });
          return;
        }
        
        // 检查文件大小
        if (fileSize > that.data.maxFileSize) {
          that.setData({
            showError: true,
            errorMsg: `文件大小超过限制，最大支持${util.formatFileSize(that.data.maxFileSize)}`
          });
          return;
        }
        
        that.setData({
          file: file,
          fileName: fileName,
          fileSize: fileSizeFormatted,
          fileSizeRaw: fileSize,
          showError: false,
          errorMsg: ''
        });
      },
      fail(err) {
        console.error('选择文件失败', err);
        that.setData({
          showError: true,
          errorMsg: '选择文件失败，请重试'
        });
      }
    });
  },

  /**
   * 删除文件
   */
  deleteFile: function () {
    this.setData({
      file: null,
      fileName: '',
      fileSize: '',
      fileSizeRaw: 0
    });
  },

  /**
   * 预览文件
   */
  previewFile: function () {
    if (this.data.file) {
      wx.openDocument({
        filePath: this.data.file.path,
        success: function (res) {
          console.log('打开文档成功');
        },
        fail: function (err) {
          console.error('打开文档失败', err);
          wx.showToast({
            title: '打开文档失败',
            icon: 'none'
          });
        }
      });
    }
  },

  /**
   * 提交检测
   */
  submitCheck: function () {
    if (this.data.isSubmitting) {
      return;
    }

    // 检查积分是否足够
    if (this.data.userPoints < this.data.checkCost) {
      this.setData({
        showError: true,
        errorMsg: '积分不足，请先获取积分'
      });
      return;
    }

    // 检查检测内容
    if (this.data.currentTab === 'text') {
      if (!this.data.textContent.trim()) {
        this.setData({
          showError: true,
          errorMsg: '请输入要检测的文本内容'
        });
        return;
      }

      if (this.data.textLength > this.data.maxTextLength) {
        this.setData({
          showError: true,
          errorMsg: `文本长度超过限制，最多支持${this.data.maxTextLength}个字符`
        });
        return;
      }

      this.submitTextCheck();
    } else {
      if (!this.data.file) {
        this.setData({
          showError: true,
          errorMsg: '请先选择要检测的文件'
        });
        return;
      }

      this.submitFileCheck();
    }
  },

  /**
   * 提交文本检测
   */
  submitTextCheck: function () {
    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '正在检测' });

    api.checkWord({
      content: this.data.textContent
    })
      .then(res => {
        // 检测完成，跳转到结果页
        wx.navigateTo({
          url: '/pages/result/result?id=' + res.id
        });
        
        // 更新积分状态
        app.globalData.pointsChanged = true;
        this.getUserPoints();
      })
      .catch(err => {
        console.error('文本检测失败', err);
        this.setData({
          showError: true,
          errorMsg: err.message || '检测失败，请重试'
        });
      })
      .finally(() => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });
      });
  },

  /**
   * 提交文件检测
   */
  submitFileCheck: function () {
    const { file } = this.data;
    if (!file) {
      wx.showToast({
        title: '请先选择文件',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      isSubmitting: true
    });
    
    // 检查用户积分是否足够
    if (this.data.userPoints < this.data.checkCost) {
      wx.showToast({
        title: '积分不足，请先充值',
        icon: 'none'
      });
      this.setData({
        isSubmitting: false
      });
      return;
    }
    
    wx.showLoading({
      title: '正在上传检测',
    });
    
    const filePath = file.path;
    const fileName = this.data.fileName;
    
    // 使用API中的uploadFileCheck函数
    api.uploadFileCheck({
      filePath: filePath,
      fileName: fileName
    }).then(data => {
      wx.hideLoading();
      this.setData({
        isSubmitting: false
      });
      
      // 跳转到结果页面
      wx.navigateTo({
        url: `/pages/result/result?id=${data.resultId}`
      });
      
      // 刷新用户积分
      this.getUserPoints();
    }).catch(err => {
      console.error('提交文件检测失败', err);
      wx.hideLoading();
      this.setData({
        isSubmitting: false
      });
      wx.showToast({
        title: err.message || '提交失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 跳转到积分页面
   */
  goToPointsPage: function () {
    wx.navigateTo({
      url: '/pages/points/points'
    });
  }
}); 