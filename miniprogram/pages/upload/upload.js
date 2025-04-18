// upload.js
const app = getApp();
const api = require('../../api/wordCheckApi');
const pointApi = require('../../api/pointApi.js');
const aiConfigApi = require('../../api/aiConfigApi.js');
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
    },
    
    // AI模型相关
    modelConfigs: [],
    selectedModelId: null,
    loadingModels: false,

    // 错误恢复
    retryCount: 0,
    maxRetryCount: 3,

    canSubmit: false,
    userInfo: null,
    showPointsNotice: false,
    submitSuccess: false,
    submitError: false,
    errorMessage: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('[upload.js] 页面加载');
    
    try {
      // 加载用户信息和AI模型配置
      this.loadUserInfo();
      this.loadAIModelConfigs();
      
      // 设置默认检测费用
      this.setData({
        checkCost: 1, // 设置默认为1积分，降低要求确保用户能使用
        // 如果没有选择模型，临时设置一个默认ID，后续会被替换
        selectedModelId: 1
      });
    } catch (error) {
      console.error('[upload.js] onLoad错误:', error);
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo: function() {
    console.log('[upload.js] 加载用户信息');
    try {
      // 获取App实例，设置临时用户信息
      const app = getApp();
      const tempUserInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || { nickName: '访客用户' };
      
      // 先设置一个临时的积分值和用户信息，避免初始状态按钮被禁用
      const tempUserPoints = wx.getStorageSync('tempUserPoints') || 30;
      this.setData({ 
        userPoints: tempUserPoints,
        userInfo: tempUserInfo
      });
      
      // 尝试获取用户积分，但不阻塞页面加载
      this.getUserPoints().catch(err => {
        console.warn('[upload.js] 获取积分失败，使用默认值:', err);
        // 错误时已在getUserPoints中设置默认值，这里不需要额外处理
      });
      
      // 调试信息
      console.log('[upload.js] 用户信息加载完成:', {
        userPoints: this.data.userPoints,
        userInfo: this.data.userInfo,
        token: wx.getStorageSync('token')
      });
    } catch (error) {
      console.error('[upload.js] 加载用户信息出错:', error);
      // 设置默认值以确保页面可以继续加载
      this.setData({
        userPoints: 30,
        userInfo: { nickName: '访客用户' }
      });
    }
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
   * @returns {Promise} 返回Promise对象
   */
  getUserPoints: function () {
    // 使用一个标志防止重复调用hideLoading
    if (this._isLoadingPoints) {
      return Promise.reject(new Error('正在获取积分中'));
    }
    
    this._isLoadingPoints = true;
    console.log('[upload.js] 开始获取用户积分');
    
    return new Promise((resolve, reject) => {
      try {
        wx.showLoading({ title: '获取积分信息' });
        
        // 直接调用，避免多余的类型检查
        pointApi.getUserPoints()
          .then(res => {
            console.log('[upload.js] 积分获取成功:', res);
            
            // 确保从API响应中正确提取积分值
            let points = 0;
            if (typeof res === 'number') {
              points = res;
            } else if (res && typeof res === 'object') {
              if (typeof res.currentPoints === 'number') {
                points = res.currentPoints;
              } else if (typeof res.points === 'number') {
                points = res.points;
              } else if (typeof res.point === 'number') {
                points = res.point;
              }
            }
            
            this.setData({
              userPoints: points
            });
            
            // 在积分更新后重新检查提交状态
            console.log('[upload.js] 积分更新后检查按钮状态, 当前积分:', points, '检测费用:', this.data.checkCost);
            
            // 如果有错误提示但现在条件满足，清除错误
            if (this.data.showError && this.canSubmit()) {
              this.setData({
                showError: false,
                errorMsg: ''
              });
            }
            
            resolve(points);
          })
          .catch(err => {
            console.error('[upload.js] 获取积分失败:', err);
            // 设置默认积分值避免影响用户体验
            this.setData({
              userPoints: 30 // 设置较高的默认值，确保能提交
            });
            reject(err);
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
          userPoints: 30 // 设置较高的默认值
        });
        
        reject(error);
      }
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
   * 处理文本输入 - 与WXML中保持一致的函数名
   */
  handleTextInput: function (e) {
    const text = e.detail.value || '';
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
    
    // 随时检查是否满足提交条件，如果满足可以直接尝试提交
    if (this.data.showError && this.canSubmit()) {
      this.setData({ showError: false, errorMsg: '' });
    }
  },

  /**
   * 判断当前是否可以提交
   */
  canSubmit() {
    // 开发模式设置
    const isDevMode = false; // 修改为false以使用实际逻辑
    
    if (isDevMode) {
      console.log('[upload.js] 开发模式已禁用，使用正常的canSubmit逻辑');
    }
    
    // 以下是正常逻辑
    
    // 获取app实例
    const app = getApp();
    
    // 检查是否有文本内容或文件
    const hasText = this.data.textContent && this.data.textContent.trim().length > 0;
    const hasFile = this.data.file !== null && this.data.hasUploadedFile;
    const hasContent = (this.data.currentTab === 'text' && hasText) || 
                       (this.data.currentTab === 'file' && hasFile);
    
    // 检查用户登录状态 - 多重验证
    const userInfo = app.globalData.userInfo || this.data.userInfo;
    const token = wx.getStorageSync('token');
    const isLoggedIn = !!token && !!userInfo; // 正常逻辑要求token和用户信息都存在
    
    // 检查是否在处理中
    const notLoading = !this.data.isSubmitting;
    
    // 检查是否选择了模型
    const hasSelectedModel = !!this.data.selectedModelId;
    
    // 检查积分是否足够
    const hasEnoughPoints = this.data.userPoints >= this.data.checkCost;
    
    // 详细输出状态信息，方便调试
    const conditions = {
      hasContent,
      isLoggedIn,
      notLoading,
      hasSelectedModel,
      hasEnoughPoints,
      // --- 详细子条件 ---
      _hasText: hasText,
      _hasFile: hasFile,
      _currentTab: this.data.currentTab,
      _tokenExists: !!token,
      _userInfoExists: !!userInfo,
      _isSubmitting: this.data.isSubmitting,
      _selectedModelId: this.data.selectedModelId,
      _userPoints: this.data.userPoints,
      _checkCost: this.data.checkCost
    };
    console.log('[upload.js] canSubmit条件检查:', conditions);
    
    const canProceed = hasContent && isLoggedIn && notLoading && hasSelectedModel && hasEnoughPoints;
    console.log('[upload.js] canSubmit 最终结果:', canProceed);
    
    return canProceed;
  },

  /**
   * 显示调试信息
   */
  showDebugInfo() {
    const app = getApp();
    
    // 收集调试信息
    const debugInfo = {
      userInfo: this.data.userInfo || '未登录',
      userPoints: this.data.userPoints || 0,
      canSubmit: this.canSubmit(),
      textContent: this.data.textContent ? `${this.data.textContent.length}字符` : '无内容',
      isLoading: this.data.isLoading,
      fee: this.data.checkCost,
      modelSelected: this.data.selectedModelId,
      modelConfigs: this.data.modelConfigs ? this.data.modelConfigs.length + '个模型' : '无模型配置',
      appData: app.globalData || '无全局数据'
    };
    
    // 获取当前选择的模型详情
    let modelDetail = '未选择模型';
    if (this.data.selectedModelId && this.data.modelConfigs) {
      const selectedModel = this.data.modelConfigs.find(
        model => model.id === this.data.selectedModelId
      );
      
      if (selectedModel) {
        modelDetail = {
          id: selectedModel.id,
          name: selectedModel.name,
          provider: selectedModel.provider,
          cost: selectedModel.getPointsCost(),
          isDefault: selectedModel.isDefault ? '是' : '否',
          description: selectedModel.description
        };
      }
    }
    
    // 输出到控制台
    console.log('[upload.js] 调试信息:', {
      ...debugInfo,
      selectedModel: modelDetail,
      allModels: this.data.modelConfigs,
      mockApi: wx.getStorageSync('use_mock_api') === 'true',
      baseUrl: app.globalData.baseUrl || '未设置',
      token: wx.getStorageSync('token') ? '已设置' : '未设置',
      apiCache: wx.getStorageSync('working_api_path') || '未缓存'
    });
    
    // 格式化要在弹窗显示的信息
    let formattedInfo = '';
    Object.keys(debugInfo).forEach(key => {
      const value = typeof debugInfo[key] === 'object' 
        ? JSON.stringify(debugInfo[key]).slice(0, 50) + '...'
        : debugInfo[key];
      formattedInfo += `${key}: ${value}\n`;
    });
    
    // 添加模型详情
    formattedInfo += '\n当前模型详情:\n';
    if (typeof modelDetail === 'object') {
      Object.keys(modelDetail).forEach(key => {
        formattedInfo += `${key}: ${modelDetail[key]}\n`;
      });
    } else {
      formattedInfo += modelDetail;
    }
    
    // 添加API模式信息
    formattedInfo += '\nAPI模式: ' + (wx.getStorageSync('use_mock_api') === 'true' ? '模拟数据' : '真实API');
    
    // 显示弹窗
    wx.showModal({
      title: '调试信息',
      content: formattedInfo.slice(0, 500) + (formattedInfo.length > 500 ? '...(更多信息请查看控制台)' : ''),
      showCancel: false,
      confirmText: '确定',
      success: (res) => {
        // 如果用户点击确定后想执行特定操作
        if (res.confirm) {
          console.log('[upload.js] 用户已查看调试信息');
        }
      }
    });
  },
  
  /**
   * 切换模拟模式
   */
  toggleMockMode() {
    const currentMode = wx.getStorageSync('use_mock_api') === 'true';
    const newMode = !currentMode;
    
    wx.setStorageSync('use_mock_api', newMode ? 'true' : 'false');
    
    wx.showToast({
      title: newMode ? '已启用模拟模式' : '已禁用模拟模式',
      icon: 'none'
    });
    
    console.log(`[upload.js] 模拟模式已${newMode ? '启用' : '禁用'}`);
  },
  
  /**
   * 清除API缓存
   */
  clearApiCache() {
    wx.removeStorageSync('working_api_path');
    
    wx.showToast({
      title: '已清除API缓存',
      icon: 'none'
    });
    
    console.log('[upload.js] 已清除API缓存');
  },
  
  /**
   * 运行完整API诊断
   */
  runApiDiagnostic() {
    wx.showLoading({
      title: '正在诊断API...'
    });
    
    // 获取基础URL
    const app = getApp();
    const baseUrl = app.globalData.baseUrl || 'http://127.0.0.1:8080';
    
    // 生成测试URL列表
    const testUrls = [
      `${baseUrl}/api/v1/essay/check`,
      `${baseUrl}/api/v1/essays/check`, 
      `${baseUrl}/api/v1/word/check`,
      `${baseUrl}/api/v1/check`,
      `${baseUrl}/api/v1/check/essay`,
      `${baseUrl}/api/v1/ai-models/check-essay`
    ];
    
    console.log('[upload.js] 开始API诊断, 测试URL:', testUrls);
    
    // 诊断所有路径
    this.diagnosePossibleApiPaths(testUrls);
    
    // 尝试调用API诊断方法
    try {
      api.diagnoseApiPaths()
        .then(result => {
          wx.hideLoading();
          
          // 显示诊断结果
          const availablePaths = result.availablePaths && result.availablePaths.length > 0 
            ? result.availablePaths.join('\n')
            : '无可用路径';
          
          wx.showModal({
            title: 'API诊断结果',
            content: result.allFailed ? 
              '所有API路径均不可用，建议启用模拟模式' : 
              `发现 ${result.availablePaths.length} 个可用路径:\n${availablePaths}`,
            showCancel: false
          });
        })
        .catch(err => {
          // 如果API方法调用失败，进行手动诊断
          this.manualApiDiagnostic(testUrls);
          
          wx.hideLoading();
          console.error('[upload.js] API诊断失败:', err);
        });
    } catch (error) {
      // 如果API方法不存在，进行手动诊断
      console.warn('[upload.js] diagnoseApiPaths方法不存在，使用手动诊断');
      this.manualApiDiagnostic(testUrls);
    }
  },
  
  /**
   * 手动API诊断
   */
  manualApiDiagnostic(urls) {
    wx.hideLoading();
    
    if (!urls || !urls.length) {
      wx.showToast({
        title: '无URL可诊断',
        icon: 'none'
      });
      return;
    }
    
    // 测试所有URL
    let completed = 0;
    let results = [];
    
    wx.showLoading({
      title: '正在诊断API...',
      mask: true
    });
    
    urls.forEach(url => {
      wx.request({
        url: url,
        method: 'HEAD',  // 使用HEAD请求验证API是否存在
        timeout: 5000,   // 5秒超时
        success: (res) => {
          results.push({
            url,
            status: res.statusCode,
            working: res.statusCode >= 200 && res.statusCode < 400
          });
        },
        fail: (err) => {
          results.push({
            url,
            status: 'error',
            error: err.errMsg,
            working: false
          });
        },
        complete: () => {
          completed++;
          if (completed === urls.length) {
            wx.hideLoading();
            
            // 显示诊断结果
            let resultText = '=== API诊断结果 ===\n\n';
            results.forEach((result) => {
              resultText += `${result.url}\n状态: ${result.status}\n可用性: ${result.working ? '可用✅' : '不可用❌'}\n\n`;
            });
            
            // 找到可用的API路径并记录
            const workingApis = results.filter(r => r.working).map(r => r.url);
            if (workingApis.length > 0) {
              wx.setStorageSync('working_api_path', workingApis[0]);
              console.log('[upload.js] 已找到可用API路径:', workingApis[0]);
            }
            
            wx.showModal({
              title: 'API诊断完成',
              content: resultText,
              showCancel: false,
              confirmText: '确定'
            });
            
            console.log('[upload.js] API诊断结果:', results);
          }
        }
      });
    });
  },

  /**
   * 诊断可能的API路径
   * @param {Array} urls 要测试的URL列表
   */
  diagnosePossibleApiPaths(urls) {
    if (!urls || !urls.length) return;
    
    // 测试每个URL，不阻塞
    urls.forEach(url => {
      wx.request({
        url: url,
        method: 'GET',  // 使用GET检查API是否存在
        timeout: 5000,  // 5秒超时
        success: (res) => {
          console.log(`[API诊断] ${url} 返回状态: ${res.statusCode}`, 
            res.statusCode === 200 ? '✅可能可用' : '❌可能不可用');
        },
        fail: (err) => {
          console.log(`[API诊断] ${url} 请求失败:`, err.errMsg);
        }
      });
    });
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
    const self = this;
    const isDevMode = false; // 修改为false以使用实际API逻辑
    
    console.log('[upload.js] submitCheck被调用, 开发模式:', isDevMode);
    
    // 在正常模式下，检查是否满足提交条件
    if (!isDevMode && !this.canSubmit()) {
      console.log('[upload.js] submitCheck: canSubmit() 返回 false，阻止提交');
      // 根据不同情况给出不同提示
      let reason = '未知原因';
      if (!this.data.textContent && this.data.currentTab === 'text') {
        reason = '请输入文本内容';
      } else if (!this.data.file && this.data.currentTab === 'file') {
        reason = '请先选择文件';
      } else if (!this.data.selectedModelId) {
        reason = '请选择AI模型';
      } else if (this.data.userPoints < this.data.checkCost) {
        reason = '积分不足';
        // 显示积分不足的弹窗
        wx.showModal({
          title: '积分不足',
          content: `当前积分${this.data.userPoints}分，本次检测需要${this.data.checkCost}分，是否前往充值？`,
          confirmText: '去充值',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/points/points'
              });
            }
          }
        });
        // 积分不足时，直接返回，避免显示下面的通用提示
        return; 
      } else if (this.data.isSubmitting) {
        reason = '正在处理中，请稍候';
      } else if (!wx.getStorageSync('token') || !getApp().globalData.userInfo) {
        reason = '用户未登录或登录信息不完整';
        // 提示用户登录
         wx.showModal({
          title: '请先登录',
          content: '您需要登录后才能使用检测功能。',
          confirmText: '去登录',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/login/login' });
            }
          }
        });
        return; // 未登录时直接返回
      }
      
      // 显示一个通用的禁用提示
      wx.showToast({
        title: `无法提交: ${reason}`,
        icon: 'none',
        duration: 2000
      });
      console.log('[upload.js] 无法提交，原因:', reason);
      return;
    }
    
    // 所有模式下的基本检查
    if (this.data.currentTab === 'text' && (!this.data.textContent || this.data.textContent.trim().length === 0)) {
      wx.showToast({
        title: '请输入文本内容',
        icon: 'none'
      });
      return;
    }
    if (this.data.currentTab === 'file' && !this.data.file) {
      wx.showToast({
        title: '请先选择文件',
        icon: 'none'
      });
      return;
    }
    
    // 设置提交状态
    self.setData({
      isSubmitting: true
    });
    
    // 显示加载提示
    wx.showLoading({
      title: '正在提交...',
      mask: true
    });
    
    console.log('[upload.js] 调试信息 - 用户积分:', self.data.userPoints);
    console.log('[upload.js] 调试信息 - 检测费用:', self.data.checkCost);
    console.log('[upload.js] 调试信息 - 当前标签:', self.data.currentTab);
    console.log('[upload.js] 调试信息 - 已选模型:', self.data.selectedModelId);
    
    // 根据当前标签选择相应的提交方法
    if (self.data.currentTab === 'text') {
      self.handleTextSubmit();
    } else {
      self.handleFileSubmit();
    }
  },

  /**
   * 处理文本提交
   */
  handleTextSubmit: function () {
    const isDevMode = false; // 修改为false以使用实际API
    
    // 基本内容检查
    if (!this.data.textContent || this.data.textContent.trim().length === 0) {
      wx.showToast({
        title: '请输入文本内容',
        icon: 'none'
      });
      this.setData({ isSubmitting: false });
      return;
    }
    
    console.log('[upload.js] 文本内容检查通过，开始提交检测');
    
    // 调用文本检测方法
    this.submitForCheck();
  },

  /**
   * 处理文件提交
   */
  handleFileSubmit: function () {
    if (!this.data.file) {
      wx.showToast({
        title: '请先选择文件',
        icon: 'none'
      });
      this.setData({ isSubmitting: false });
      return;
    }
    
    // 调用文件检测方法
    this.submitFileCheck();
  },

  /**
   * 提交内容进行检测
   */
  submitForCheck: function() {
    console.log('[upload.js] 开始提交检测，选中的模型ID:', this.data.selectedModelId);
    console.log('[upload.js] 文本内容长度:', this.data.textContent ? this.data.textContent.length : 0);
    
    // 隐藏可能的前一个错误提示
    this.setData({ errorMsg: '' });
    
    // 检查内容是否为空
    if (!this.data.textContent || this.data.textContent.trim() === '') {
      this.setData({ errorMsg: '请输入要检测的内容' });
      return;
    }
    
    // 检查是否选择了模型
    if (!this.data.selectedModelId) {
      this.setData({ errorMsg: '请选择一个AI模型' });
      return;
    }
    
    // 设置加载状态
    this.setData({ isSubmitting: true });
    
    // 调用API进行检测
    const aiConfigApi = require('../../api/aiConfigApi');
    aiConfigApi.checkEssay({
      content: this.data.textContent,
      modelId: this.data.selectedModelId
    }).then(res => {
      console.log('[upload.js] 检测成功:', res);
      
      // 扣除用户积分
      this.updateUserPoints();
      
      // 准备结果数据
      const resultData = {
        content: this.data.textContent,
        result: res.data,
        modelInfo: res.data.modelInfo || null,
        timestamp: new Date().getTime()
      };
      
      // 保存结果并跳转
      this.saveAndNavigateToResult(resultData);
    }).catch(err => {
      console.error('[upload.js] 检测失败:', err);
      let errorMessage = '检测失败';
      
      if (err && err.message) {
        errorMessage = err.message;
      }
      
      this.setData({ 
        errorMsg: errorMessage,
        isSubmitting: false
      });
      
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      });
    });
  },
  
  /**
   * 更新用户积分信息
   */
  updateUserPoints: function() {
    const userApi = require('../../api/userApi');
    userApi.getUserInfo()
      .then(res => {
        if (res && res.data) {
          getApp().globalData.userInfo = res.data;
          console.log('[upload.js] 用户积分更新成功');
        }
      })
      .catch(err => {
        console.error('[upload.js] 更新用户积分失败:', err);
      });
  },

  /**
   * 提交文件检测
   */
  submitFileCheck: function () {
    const self = this;
    const { file, selectedModelId } = this.data;
    
    if (!file) {
      wx.showToast({
        title: '请先选择文件',
        icon: 'none'
      });
      this.setData({ isSubmitting: false });
      return;
    }
    
    // 显示加载中
    this.setData({
      isLoading: true,
      submitError: false,
      submitSuccess: false
    });
    
    // 读取文件内容
    const fileManager = wx.getFileSystemManager();
    try {
      fileManager.readFile({
        filePath: file.path,
        encoding: 'utf-8',
        success: function(res) {
          const content = res.data;
          
          // 提交作文检查
          console.log('[upload.js] 提交作文检查, 模型ID:', selectedModelId, '内容长度:', content.length);
          
          aiConfigApi.checkEssay({
            modelId: selectedModelId,
            content: content
          })
          .then(res => {
            console.log('[upload.js] 检查结果:', res);
            
            if (res && res.success) {
              // 作文检查成功，更新积分并跳转到结果页
              const result = res.data;
              
              // 更新用户积分
              if (self.data.userInfo) {
                let userInfo = self.data.userInfo;
                userInfo.points = Math.max(0, (userInfo.points || 0) - self.data.checkCost);
                wx.setStorageSync('userInfo', userInfo);
                
                self.setData({
                  userInfo: userInfo,
                  userPoints: userInfo.points
                });
              }
              
              // 设置成功标志
              self.setData({
                submitSuccess: true,
                isLoading: false,
                isSubmitting: false
              });
              
              // 保存结果并跳转到结果页
              wx.setStorageSync('checkResult', result);
              
              setTimeout(() => {
                wx.navigateTo({
                  url: '/pages/result/result'
                });
              }, 500);
            } else {
              // 处理错误
              self.setData({
                submitError: true,
                errorMessage: res.message || '检查失败，请稍后重试',
                isLoading: false,
                isSubmitting: false
              });
            }
          })
          .catch(err => {
            console.error('[upload.js] 作文检查请求失败:', err);
            
            self.setData({
              submitError: true,
              errorMessage: err.message || '网络请求失败，请稍后重试',
              isLoading: false,
              isSubmitting: false
            });
          });
        },
        fail: function(err) {
          console.error('[upload.js] 读取文件失败:', err);
          self.setData({
            submitError: true,
            errorMessage: '读取文件失败: ' + (err.errMsg || '未知错误'),
            isLoading: false,
            isSubmitting: false
          });
        }
      });
    } catch (err) {
      console.error('[upload.js] 文件读取异常:', err);
      self.setData({
        submitError: true,
        errorMessage: '读取文件出错: ' + (err.message || '未知错误'),
        isLoading: false,
        isSubmitting: false
      });
    }
  },

  /**
   * 跳转到积分页面
   */
  goToPointsPage: function () {
    wx.navigateTo({
      url: '/pages/points/points'
    });
  },

  /**
   * 加载AI模型配置
   * @returns {Promise} 返回Promise对象
   */
  loadAIModelConfigs: function() {
    const self = this;
    const aiConfigApi = require('../../api/aiConfigApi');
    const AIModelConfig = require('../../models/AIModelConfig');
    
    console.log('[upload.js] 开始加载AI模型配置');
    
    // 显示加载状态
    this.setData({
      loadingModels: true
    });
    
    // 请求可用的AI模型列表
    aiConfigApi.getAvailableModels()
      .then(res => {
        console.log('[upload.js] 获取到AI模型配置:', res);
        
        if (res && res.success && res.data && res.data.length > 0) {
          const modelConfigs = res.data;
          
          // 确保所有配置都是AIModelConfig实例
          const standardizedConfigs = modelConfigs.map(config => {
            return config instanceof AIModelConfig ? 
              config : 
              AIModelConfig.fromApiResponse(config);
          });
          
          // 寻找默认模型
          let defaultModel = standardizedConfigs.find(model => model.isDefault) || standardizedConfigs[0];
          const defaultModelId = defaultModel ? defaultModel.id : null;
          
          console.log('[upload.js] 找到默认模型:', defaultModel);
          console.log('[upload.js] 默认模型ID:', defaultModelId);
          
          // 更新检测费用
          const cost = defaultModel ? defaultModel.getPointsCost() : 1;
          
          // 设置模型配置和默认选择
          self.setData({
            modelConfigs: standardizedConfigs,
            selectedModelId: defaultModelId,
            checkCost: cost
          }, () => {
            // 回调确认数据已更新
            console.log('[upload.js] 模型配置设置完成, modelConfigs:', self.data.modelConfigs);
            console.log('[upload.js] 已选择默认模型ID:', self.data.selectedModelId);
            console.log('[upload.js] 检测费用:', self.data.checkCost);
            
            // 设置加载完成
            self.setData({ loadingModels: false });
            
            // 显示成功获取的消息提示
            wx.showToast({
              title: '已加载模型配置',
              icon: 'success',
              duration: 1000
            });
          });
        } else {
          console.warn('[upload.js] 未获取到有效的模型配置');
          
          // 显示提示
          wx.showToast({
            title: '未获取到模型配置',
            icon: 'none',
            duration: 2000
          });
          
          // 设置加载完成
          self.setData({ loadingModels: false });
          
          // 如果是API返回空结果，可以显示更详细的错误信息
          if (res && res.success && (!res.data || res.data.length === 0)) {
            wx.showModal({
              title: '提示',
              content: '未找到可用的AI模型配置，请联系管理员添加模型配置。',
              showCancel: false
            });
          }
        }
      })
      .catch(err => {
        console.error('[upload.js] 获取AI模型配置失败:', err);
        
        // 加载失败时，提供默认模型配置
        const AIModelConfig = require('../../models/AIModelConfig');
        const defaultModels = [
          new AIModelConfig({
            id: 1, 
            name: 'GPT-3.5 Turbo', 
            provider: 'OpenAI',
            model: 'gpt-3.5-turbo',
            isDefault: true,
            description: '通用AI助手，适合日常文本处理',
            pointsCost: 1
          }),
          new AIModelConfig({
            id: 2,
            name: 'DeepSeek Coder',
            provider: 'DeepSeek',
            model: 'deepseek-coder',
            isDefault: false,
            description: '专为代码理解与生成优化的大模型',
            pointsCost: 2
          })
        ];
        
        self.setData({
          modelConfigs: defaultModels,
          selectedModelId: 1,
          checkCost: 1,
          loadingModels: false
        });
        
        // 显示错误提示
        wx.showToast({
          title: '使用默认AI模型配置',
          icon: 'none',
          duration: 2000
        });
      });
  },
  
  /**
   * 处理模型选择变更
   */
  handleModelChange: function(e) {
    const modelId = parseInt(e.detail.value);
    console.log('[upload.js] 选择AI模型:', modelId);
    
    // 查找选中的模型配置
    const selectedModel = this.data.modelConfigs.find(model => model.id === modelId);
    
    // 更新检测费用
    const cost = selectedModel ? selectedModel.getPointsCost() : this.data.checkCost;
    
    this.setData({
      selectedModelId: modelId,
      checkCost: cost
    });
    
    console.log('[upload.js] 更新检测费用:', cost);
  },

  /**
   * 重试上次失败的请求
   */
  retryLastRequest() {
    const self = this;
    
    if (self.data.retryCount >= self.data.maxRetryCount) {
      wx.showToast({
        title: '重试次数过多，请稍后再试',
        icon: 'none'
      });
      return;
    }
    
    // 增加重试计数
    self.setData({
      retryCount: self.data.retryCount + 1,
      showError: false,
      errorMsg: ''
    });
    
    // 重新提交
    self.submitCheck();
  },

  /**
   * 重置错误状态
   */
  resetErrorState() {
    this.setData({
      showError: false,
      errorMsg: '',
      retryCount: 0,
      isSubmitting: false
    });
  },

  // API诊断方法
  runApiDiagnostics(urls) {
    wx.showLoading({
      title: '正在诊断...',
      mask: true
    });
    
    let results = [];
    let completed = 0;
    
    urls.forEach((url, index) => {
      wx.request({
        url: url,
        method: 'HEAD',
        timeout: 5000,
        success: (res) => {
          results.push({
            url,
            status: res.statusCode,
            working: res.statusCode >= 200 && res.statusCode < 400
          });
        },
        fail: (err) => {
          results.push({
            url,
            status: 'error',
            error: err.errMsg,
            working: false
          });
        },
        complete: () => {
          completed++;
          if (completed === urls.length) {
            wx.hideLoading();
            
            // 显示诊断结果
            let resultText = '=== API诊断结果 ===\n\n';
            results.forEach((result) => {
              resultText += `${result.url}\n状态: ${result.status}\n可用性: ${result.working ? '可用✅' : '不可用❌'}\n\n`;
            });
            
            wx.showModal({
              title: 'API诊断完成',
              content: resultText,
              showCancel: false,
              confirmText: '确定'
            });
            
            console.log('[upload.js] API诊断结果:', results);
          }
        }
      });
    });
  },

  /**
   * 保存结果并跳转到结果页面
   * @param {Object} resultData 包含批改结果的数据对象
   */
  saveAndNavigateToResult: function(resultData) {
    try {
      console.log('[upload.js] 保存批改结果:', resultData);
      
      // 保存结果到本地存储
      wx.setStorageSync('checkResult', resultData);
      
      // 设置提交状态
      this.setData({
        submitSuccess: true,
        isSubmitting: false
      });
      
      // 延迟跳转，确保状态更新完成
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/result/result'
        });
      }, 500);
    } catch (error) {
      console.error('[upload.js] 保存结果并跳转异常:', error);
      wx.showToast({
        title: '处理结果时出错',
        icon: 'none'
      });
      this.setData({ isSubmitting: false });
    }
  },
}); 