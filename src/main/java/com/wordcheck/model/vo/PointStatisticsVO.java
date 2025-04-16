package com.wordcheck.model.vo;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * 积分统计信息VO
 */
@Data
public class PointStatisticsVO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 总积分
     */
    private Integer totalPoints;
    
    /**
     * 可用积分
     */
    private Integer availablePoints;
    
    /**
     * 历史总获取积分
     */
    private Integer totalEarned;
    
    /**
     * 历史总消费积分
     */
    private Integer totalSpent;
    
    /**
     * 用户当前等级
     */
    private Integer level;
    
    /**
     * 等级名称
     */
    private String levelName;
    
    /**
     * 升级所需积分
     */
    private Integer nextLevelPoints;
    
    /**
     * 今日获取积分
     */
    private Integer todayEarned;
    
    /**
     * 今日消费积分
     */
    private Integer todaySpent;
    
    /**
     * 最近7天每日积分变动
     */
    private List<DailyPointsVO> dailyPoints;
    
    /**
     * 每日积分变动统计
     */
    @Data
    public static class DailyPointsVO {
        /**
         * 日期，格式：yyyy-MM-dd
         */
        private String date;
        
        /**
         * 获取积分
         */
        private Integer earned;
        
        /**
         * 消费积分
         */
        private Integer spent;
        
        /**
         * 净变化
         */
        private Integer net;
    }
} 