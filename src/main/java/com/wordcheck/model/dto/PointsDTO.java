package com.wordcheck.model.dto;

import lombok.Data;

/**
 * 积分信息数据传输对象
 */
@Data
public class PointsDTO {
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
} 