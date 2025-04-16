package com.wordcheck.model;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户积分实体类
 */
@Data
public class UserPoint {
    /**
     * 用户ID
     */
    private Integer userId;
    
    /**
     * 当前可用积分
     */
    private Integer currentPoints;
    
    /**
     * 历史总获取积分
     */
    private Integer totalEarned;
    
    /**
     * 历史总消费积分
     */
    private Integer totalSpent;
    
    /**
     * 积分等级
     */
    private Integer level;
    
    /**
     * 等级名称
     */
    private String levelName;
    
    /**
     * 下一等级所需积分
     */
    private Integer nextLevelPoints;
    
    /**
     * 最后更新时间
     */
    private LocalDateTime lastUpdated;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
} 