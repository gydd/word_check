// upload.js
const app = getApp();
const api = require('../../api/wordCheckApi');
const pointApi = require('../../api/pointApi.js');
const util = require('../../utils/util');
const fileManager = wx.getFileSystemManager();

// 检查pointApi是否正确导入 
console.log('[upload.js] pointApi导入检查:', pointApi);
console.log('[upload.js] getUserPoints函数检查:', typeof pointApi.getUserPoints);

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
    textInput: '', // 与WXML中的变量保持一致
    textInputLength: 0, // 与WXML中的变量保持一致
    maxTextLength: 10000, // 最大文本长度

    // 文件检测相关
    file: null, // 当前选择的文件
    fileName: '', // 文件名称
    fileSize: '', // 文件大小（格式化后的字符串）
    fileSizeRaw: 0, // 文件大小（原始字节数）
    maxFileSize: 5 * 1024 * 1024, // 最大文件大小（5MB）
    supportedFileTypes: ['doc', 'docx', 'txt', 'pdf'], // 支持的文件类型
    hasUploadedFile: false, // 是否已上传文件
    fileInfo: {
      name: '',
      size: '',
      type: ''
    }
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
    // 使用一个标志防止重复调用hideLoading
    if (this._isLoadingPoints) {
      return;
    }
    
    this._isLoadingPoints = true;
    console.log('[upload.js] 开始获取用户积分');
    console.log('[upload.js] pointApi:', pointApi);
    
    try {
      wx.showLoading({ title: '获取积分信息' });
      
      // 直接调用，避免多余的类型检查
      pointApi.getUserPoints()
        .then(res => {
          console.log('[upload.js] 积分获取成功:', res);
          this.setData({
            userPoints: res.currentPoints || 0
          });
        })
        .catch(err => {
          console.error('[upload.js] 获取积分失败:', err);
          // 设置默认积分值避免影响用户体验
          this.setData({
            userPoints: 100 // 设置默认值
          });
        })
        .finally(() => {
          wx.hideLoading();
          this._isLoadingPoints = false;
        });
    } catch (error) {
      console.error('[upload.js] getUserPoints异常:', error);
      wx.hideLoading();
      this._isLoadingPoints = false;
      
      // 出现异常时设置一个默认积分值
      this.setData({
        userPoints: 100 // 设置默认值
      });
    }
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
   * 处理文本输入 - 与WXML中保持一致的函数名
   */
  handleTextInput: function (e) {
    const text = e.detail.value;
    const length = text.length;
    
    this.setData({
      textContent: text,
      textInput: text,
      textLength: length,
      textInputLength: length,
      showError: false,
      errorMsg: ''
    });
    
    console.log('[upload.js] 文本输入更新, 长度:', length);
  },

  /**
   * 检查是否可以提交 - 与WXML中的canSubmit函数一致
   */
  canSubmit: function () {
    console.log('[upload.js] 检查是否可以提交检测');
    
    // 检查积分是否足够
    if (this.data.userPoints < this.data.checkCost) {
      console.log('[upload.js] 积分不足，不能提交');
      return false;
    }
    
    // 检查当前标签页
    if (this.data.currentTab === 'text') {
      // 文本检测：检查文本是否为空以及是否超出长度限制
      const hasValidText = this.data.textContent.trim().length > 0;
      const withinLimit = this.data.textLength <= this.data.maxTextLength;
      console.log('[upload.js] 文本检测条件: 有效文本=', hasValidText, '长度合适=', withinLimit);
      return hasValidText && withinLimit;
    } else {
      // 文件检测：检查是否选择了文件
      console.log('[upload.js] 文件检测条件: 已选择文件=', !!this.data.file);
      return !!this.data.file;
    }
  },

  /**
   * 输入文本内容 - 保持原有函数但调用handleTextInput
   */
  inputText: function (e) {
    this.handleTextInput(e);
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
          hasUploadedFile: true,
          fileInfo: {
            name: fileName,
            size: fileSizeFormatted,
            type: fileExtension
          },
          showError: false,
          errorMsg: ''
        });
        
        console.log('[upload.js] 文件选择成功:', fileName, fileSizeFormatted);
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
   * 重新选择文件 - 与WXML中保持一致
   */
  reselectFile: function () {
    this.chooseFile();
  },

  /**
   * 删除文件
   */
  deleteFile: function () {
    this.setData({
      file: null,
      fileName: '',
      fileSize: '',
      fileSizeRaw: 0,
      hasUploadedFile: false,
      fileInfo: {
        name: '',
        size: '',
        type: ''
      }
    });
    
    console.log('[upload.js] 已删除文件');
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
    console.log('[upload.js] 尝试提交检测');
    
    if (this.data.isSubmitting) {
      console.log('[upload.js] 已经在提交中，忽略重复点击');
      return;
    }

    if (!this.canSubmit()) {
      console.log('[upload.js] 不满足提交条件');
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