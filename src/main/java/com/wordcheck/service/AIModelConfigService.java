package com.wordcheck.service;

import com.wordcheck.model.AIModelConfig;

import java.util.List;

/**
 * AI模型配置服务接口
 */
public interface AIModelConfigService {
    
    /**
     * 获取所有AI模型配置
     *
     * @return AI模型配置列表
     */
    List<AIModelConfig> getAllConfigs();
    
    /**
     * 获取可用的AI模型配置列表（返回非敏感信息）
     *
     * @return 可用的AI模型配置列表
     */
    List<AIModelConfig> getAvailableConfigs();
    
    /**
     * 根据ID获取AI模型配置
     *
     * @param id 配置ID
     * @return AI模型配置
     */
    AIModelConfig getConfigById(Integer id);
    
    /**
     * 获取默认的AI模型配置
     *
     * @return 默认AI模型配置
     */
    AIModelConfig getDefaultConfig();
    
    /**
     * 创建AI模型配置
     *
     * @param config 配置信息
     * @return 创建的配置
     */
    AIModelConfig createConfig(AIModelConfig config);
    
    /**
     * 更新AI模型配置
     *
     * @param id 配置ID
     * @param config 配置信息
     * @return 更新后的配置
     */
    AIModelConfig updateConfig(Integer id, AIModelConfig config);
    
    /**
     * 删除AI模型配置
     *
     * @param id 配置ID
     * @return 是否成功
     */
    boolean deleteConfig(Integer id);
    
    /**
     * 设置指定ID的模型为默认模型
     *
     * @param id 配置ID
     * @return 是否成功
     */
    boolean setDefault(Integer id);
    
    /**
     * 使用AI模型进行作文批改
     *
     * @param modelId 模型ID
     * @param content 作文内容
     * @return 批改结果
     */
    String checkEssay(Integer modelId, String content);
} 