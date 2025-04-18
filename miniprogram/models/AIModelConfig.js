/**
 * AI模型配置实体类
 */
class AIModelConfig {
  /**
   * 构造函数
   * @param {Object} options - 初始化选项
   * @param {Number} options.id - 模型ID
   * @param {String} options.name - 模型名称
   * @param {String} options.provider - 提供商
   * @param {String} options.model - 模型标识
   * @param {Boolean} options.isDefault - 是否为默认模型
   * @param {String} options.description - 模型描述
   * @param {String} options.apiUrl - API地址（敏感信息，前端不显示）
   * @param {String} options.apiKey - API密钥（敏感信息，前端不显示）
   * @param {Number} options.timeout - 超时时间（毫秒）
   * @param {Number} options.tokensLimit - 支持的最大Token数
   * @param {Number} options.pointsCost - 使用该模型消耗的积分数
   * @param {String} options.icon - 模型图标URL
   * @param {Boolean} options.available - 模型是否可用
   */
  constructor(options = {}) {
    this.id = options.id || null;
    this.name = options.name || '';
    this.provider = options.provider || '';
    this.model = options.model || '';
    this.isDefault = options.isDefault || false;
    this.description = options.description || '';
    this.timeout = options.timeout || 60000;
    this.tokensLimit = options.tokensLimit || 4000;
    this.pointsCost = options.pointsCost || 1;
    this.icon = options.icon || '';
    this.available = options.available !== false;
    
    // 敏感信息，仅在服务端使用
    this._apiUrl = options.apiUrl;
    this._apiKey = options.apiKey;
  }

  /**
   * 从API响应创建实例
   * @param {Object} data - API返回的数据
   * @returns {AIModelConfig} 创建的实例
   */
  static fromApiResponse(data) {
    return new AIModelConfig({
      id: data.id,
      name: data.name,
      provider: data.provider,
      model: data.model,
      isDefault: data.isDefault,
      description: data.description,
      timeout: data.timeout,
      tokensLimit: data.tokensLimit,
      pointsCost: data.pointsCost,
      icon: data.icon,
      available: data.available
    });
  }

  /**
   * 获取模型详细信息（用于展示）
   * @returns {Object} 模型详细信息
   */
  getDisplayInfo() {
    return {
      id: this.id,
      name: this.name,
      provider: this.provider,
      description: this.description,
      pointsCost: this.pointsCost,
      isDefault: this.isDefault,
      icon: this.icon
    };
  }

  /**
   * 检查模型是否可用
   * @returns {Boolean} 是否可用
   */
  isAvailable() {
    return this.available;
  }

  /**
   * 获取使用该模型所需的积分
   * @returns {Number} 所需积分
   */
  getPointsCost() {
    return this.pointsCost;
  }
}

module.exports = AIModelConfig; 