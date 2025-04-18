package com.wordcheck.model;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * AI模型配置实体类
 */
@Data
public class AIModelConfig {
    /**
     * 配置ID
     */
    private Integer id;
    
    /**
     * 模型名称
     */
    private String name;
    
    /**
     * 模型提供商 (如OpenAI, Azure, 百度等)
     */
    private String provider;
    
    /**
     * 模型API地址
     */
    private String apiUrl;
    
    /**
     * 具体模型标识
     */
    private String modelId;
    
    /**
     * API密钥
     */
    private String apiKey;
    
    /**
     * 是否为默认模型
     */
    private Boolean isDefault;
    
    /**
     * 超时时间(毫秒)
     */
    private Integer timeout;
    
    /**
     * 提示词模板（批改作文的指令）
     */
    private String promptTemplate;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
} 