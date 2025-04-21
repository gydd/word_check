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
     * 基础积分消耗（不足字数阈值时收取的积分）
     */
    private Integer basePointsCost;
    
    /**
     * 字数阈值（达到该字数时开始按阶梯计费）
     */
    private Integer wordThreshold;
    
    /**
     * 字数增量（每增加多少字进行一次计费）
     */
    private Integer wordIncrement;
    
    /**
     * 增量积分消耗（每增加一个wordIncrement消耗的积分）
     */
    private Integer incrementPointsCost;
    
    /**
     * 积分计费方式：0=固定积分，1=按字数梯度
     */
    private Integer pointsCostType;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
    
    /**
     * 计算指定内容长度需要消耗的积分
     * @param contentLength 内容长度
     * @return 需要消耗的积分
     */
    public int calculatePointsCost(int contentLength) {
        // 固定积分收费
        if (pointsCostType == null || pointsCostType == 0 || basePointsCost == null) {
            return basePointsCost != null ? basePointsCost : 1;
        }
        
        // 按字数梯度收费
        if (wordThreshold == null || wordThreshold <= 0) {
            wordThreshold = 1000; // 默认1000字
        }
        
        if (wordIncrement == null || wordIncrement <= 0) {
            wordIncrement = 1000; // 默认每1000字增加一次费用
        }
        
        if (incrementPointsCost == null) {
            incrementPointsCost = 2; // 默认每增加一个阶梯增加2积分
        }
        
        // 内容长度不足字数阈值，收取基础积分
        if (contentLength <= wordThreshold) {
            return basePointsCost != null ? basePointsCost : 3;
        }
        
        // 超出字数阈值，按阶梯计算
        int incrementCount = (int) Math.ceil((double)(contentLength - wordThreshold) / wordIncrement);
        return (basePointsCost != null ? basePointsCost : 3) + incrementCount * incrementPointsCost;
    }
} 