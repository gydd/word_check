const app = getApp();
const config = require('../config/config.js');
const AIModelConfig = require('../models/AIModelConfig');

/**
 * 获取可用的AI模型配置
 * @returns {Promise} 返回可用的AI模型列表
 */
function getAvailableModels() {
  return new Promise((resolve, reject) => {
    // 检查用户是否登录
    const token = wx.getStorageSync('token');
    if (!token) {
      return reject({ message: '用户未登录，请先登录' });
    }

    // 判断是否使用模拟数据
    const useMock = wx.getStorageSync('use_mock_api') === 'true';
    if (useMock) {
      console.log('[aiConfigApi] 使用模拟数据');
      // 返回模拟的模型列表数据
      setTimeout(() => {
        const mockModels = [
          new AIModelConfig({
            id: 1,
            name: 'GPT-3.5 Turbo',
            provider: 'OpenAI',
            model: 'gpt-3.5-turbo',
            isDefault: true,
            description: '适用于一般文本检查，响应速度快',
            pointsCost: 1,
            icon: '/static/images/models/gpt-3.5.png',
            available: true
          }),
          new AIModelConfig({
            id: 2,
            name: 'GPT-4',
            provider: 'OpenAI',
            model: 'gpt-4',
            isDefault: false,
            description: '更高级的语言模型，适用于复杂文本分析',
            pointsCost: 5,
            icon: '/static/images/models/gpt-4.png',
            available: true
          }),
          new AIModelConfig({
            id: 3,
            name: 'Claude 2',
            provider: 'Anthropic',
            model: 'claude-2',
            isDefault: false,
            description: '强大的对话和分析能力',
            pointsCost: 3,
            icon: '/static/images/models/claude.png',
            available: true
          })
        ];

        resolve({
          success: true,
          data: mockModels,
          message: '获取成功(模拟数据)'
        });
      }, 500);
      return;
    }

    // 尝试获取可能的工作API路径
    const workingApiPath = wx.getStorageSync('working_api_path');
    const apiUrl = workingApiPath || `${config.apiBaseUrl}/api/v1/ai-models`;

    console.log('[aiConfigApi] 请求AI模型列表:', apiUrl);

    // 发起请求
    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: function(res) {
        console.log('[aiConfigApi] 获取模型列表成功:', res);

        // 根据状态码处理响应
        if (res.statusCode === 200) {
          // 添加字段适配
          let modelData = [];
          
          // 处理各种可能的数据格式
          if (res.data && res.data.data && Array.isArray(res.data.data)) {
            modelData = res.data.data;
          } else if (res.data && Array.isArray(res.data)) {
            modelData = res.data;
          } else if (res.data && res.data.body && Array.isArray(res.data.body)) {
            modelData = res.data.body;
          }
          
          // 添加字段适配
          const modelConfigs = modelData.map(item => {
            // 适配字段名
            if (item.model_id && !item.model) {
              item.model = item.model_id;
            }
            return AIModelConfig.fromApiResponse(item);
          });
          
          resolve({
            success: true,
            data: modelConfigs,
            message: '获取成功'
          });
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // 未授权或禁止访问
          reject({
            success: false,
            message: '用户会话已过期，请重新登录'
          });
        } else {
          // 其他错误
          reject({
            success: false,
            message: res.data.message || `请求失败，状态码: ${res.statusCode}`
          });
        }
      },
      fail: function(err) {
        console.error('[aiConfigApi] 获取模型列表失败:', err);
        
        // 不管是否在模拟环境，都返回默认模型以避免界面报错
        const defaultModel = new AIModelConfig({
          id: 1,
          name: 'GPT-3.5 Turbo (默认)',
          provider: 'OpenAI',
          model: 'gpt-3.5-turbo',
          isDefault: true,
          description: '适用于一般文本检查，响应速度快',
          pointsCost: 1,
          available: true
        });
        
        const deepseekModel = new AIModelConfig({
          id: 2,
          name: 'DeepSeek Coder',
          provider: 'DeepSeek',
          model: 'deepseek-coder',
          isDefault: false,
          description: '专为代码理解与生成优化的大模型',
          pointsCost: 2,
          available: true
        });
        
        const claudeModel = new AIModelConfig({
          id: 3,
          name: 'Claude 3',
          provider: 'Anthropic',
          model: 'claude-3',
          isDefault: false,
          description: '强大的多模态模型',
          pointsCost: 3,
          available: true
        });
        
        resolve({
          success: true,
          data: [defaultModel, deepseekModel, claudeModel],
          message: '获取成功(模拟数据)'
        });
      }
    });
  });
}

/**
 * 使用AI模型进行作文批改
 * @param {Object} params 参数对象
 * @param {String} params.content 作文内容
 * @param {Number} params.modelId 模型ID（可选）
 * @returns {Promise} 返回批改结果
 */
function checkEssay(params) {
  return new Promise((resolve, reject) => {
    console.log('[aiConfigApi] 开始调用checkEssay, 参数:', params);
    
    // 开发模式：如果启用，则返回模拟数据而不实际调用API
    const isDevMode = false; // 修改为false以使用实际API
    // 也可以从配置或缓存读取
    // const isDevMode = wx.getStorageSync('use_mock_api') === 'true';
    
    if (isDevMode) {
      console.log('[aiConfigApi] 开发模式已启用，返回模拟数据');
      
      // 构造模拟响应数据
      setTimeout(() => {
        const mockResponse = {
          success: true,
          data: {
            evaluation: `这是一篇批改结果示例。原文长度：${params.content ? params.content.length : 0}字。\n\n1. 整体评价：\n文章结构清晰，语言表达流畅，思想内容丰富。\n\n2. 语法和用词错误：\n第2段有少量标点符号使用不当。\n\n3. 内容与结构建议：\n论述部分可以更加深入，建议增加具体例子支持观点。\n\n4. 亮点与不足：\n亮点：视角独特，有自己的思考。\n不足：结尾略显仓促，可以展开。\n\n5. 评分与等级：\n评分：85分\n等级：良好`,
            model: {
              id: params.modelId || 1,
              name: "模拟模型",
              provider: "开发测试"
            },
            summary: "这是一篇结构完整、观点明确的文章，有一些小瑕疵但整体不错。",
            suggestions: [
              "加强论证部分的例子",
              "注意标点符号的使用",
              "适当扩展结尾部分"
            ]
          }
        };
        resolve(mockResponse);
      }, 1500); // 延迟1.5秒，模拟网络请求
      
      return;
    }
    
    const token = wx.getStorageSync('token');
    console.log('[aiConfigApi] 准备调用真实API进行批改, token状态:', !!token);
    
    if (!token && !isDevMode) {
      reject(new Error('未登录'));
      return;
    }
    
    if (!params.content || params.content.trim() === '') {
      reject(new Error('作文内容不能为空'));
      return;
    }
    
    console.log('[aiConfigApi] 发送HTTP请求到后端:', `${config.apiBaseUrl}/api/v1/ai-models/check-essay`);
    
    wx.request({
      url: `${config.apiBaseUrl}/api/v1/ai-models/check-essay`,
      method: 'POST',
      data: params,
      header: {
        'Authorization': token ? ('Bearer ' + token) : '',
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('[aiConfigApi] 请求成功, 状态码:', res.statusCode, '响应:', res.data);
        
        if (res.statusCode === 200) {
          const data = res.data;
          if (data.code === 200 || data.error === 0) {
            resolve({
              success: true,
              data: data.data || data.body || {}
            });
          } else if (data.code === 401 || data.error === 401) {
            // 需要登录
            console.warn('[aiConfigApi] 返回401未授权错误，可能需要登录');
            if (app.clearLoginInfo) {
              app.clearLoginInfo();
            }
            
            // 在开发模式下，不跳转到登录页面，而是返回模拟数据
            if (isDevMode) {
              console.log('[aiConfigApi] 开发模式下401错误，返回模拟数据');
              setTimeout(() => {
                resolve({
                  success: true,
                  data: {
                    evaluation: `[开发模式-未登录] 这是一篇批改结果示例。原文长度：${params.content ? params.content.length : 0}字。\n\n评分：80分`
                  }
                });
              }, 500);
            } else {
              wx.navigateTo({
                url: '/pages/login/login'
              });
              reject(new Error('登录已过期，请重新登录'));
            }
          } else {
            console.warn('[aiConfigApi] 返回其他错误码:', data.code || data.error);
            resolve({
              success: false,
              message: data.message || '作文批改失败'
            });
          }
        } else {
          console.error('[aiConfigApi] 请求状态码异常:', res.statusCode);
          
          // 在开发模式下，即使状态码异常也返回模拟数据
          if (isDevMode) {
            console.log('[aiConfigApi] 开发模式下状态码异常，返回模拟数据');
            setTimeout(() => {
              resolve({
                success: true,
                data: {
                  evaluation: `[开发模式-状态码${res.statusCode}] 这是一篇批改结果示例。原文长度：${params.content ? params.content.length : 0}字。\n\n评分：75分`
                }
              });
            }, 500);
          } else {
            reject(new Error(`请求失败(${res.statusCode})`));
          }
        }
      },
      fail: (err) => {
        console.error('[aiConfigApi] 作文批改请求失败:', err);
        
        // 在开发模式下，即使请求失败也返回模拟数据
        if (isDevMode) {
          console.log('[aiConfigApi] 开发模式下请求失败，返回模拟数据');
          setTimeout(() => {
            resolve({
              success: true,
              data: {
                evaluation: `[开发模式-网络错误] 这是一篇批改结果示例。原文长度：${params.content ? params.content.length : 0}字。\n\n评分：70分`
              }
            });
          }, 500);
        } else {
          reject(err);
        }
      }
    });
  });
}

function debugAIModels() {
  const config = require('../config/config.js');
  const token = wx.getStorageSync('token');
  
  wx.request({
    url: `${config.apiBaseUrl}/api/v1/ai-models`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`
    },
    success: function(res) {
      console.log('调试 - API响应:', res);
      wx.showModal({
        title: 'API调试结果',
        content: JSON.stringify(res.data).substring(0, 500),
        showCancel: false
      });
    },
    fail: function(err) {
      console.log('调试 - API失败:', err);
      wx.showModal({
        title: 'API调试失败',
        content: JSON.stringify(err),
        showCancel: false
      });
    }
  });
}

module.exports = {
  getAvailableModels,
  checkEssay,
  debugAIModels
}; 