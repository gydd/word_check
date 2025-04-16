package com.wordcheck.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * 用户积分DTO
 */
@Data
public class PointsDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
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