package com.wordcheck.model;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 单词检查记录实体类
 */
@Data
public class WordCheckRecord {
    /**
     * 记录ID
     */
    private Integer id;
    
    /**
     * 用户ID
     */
    private Integer userId;
    
    /**
     * 用户输入的单词
     */
    private String word;
    
    /**
     * 是否拼写正确
     */
    private Boolean isCorrect;
    
    /**
     * 是否已奖励积分
     */
    private Boolean hasReward;
    
    /**
     * 奖励积分数量
     */
    private Integer rewardPoints;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
} 