package com.wordcheck.model;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 签到记录实体类
 */
@Data
public class SignIn {
    /**
     * 签到ID
     */
    private Integer id;
    
    /**
     * 用户ID
     */
    private Integer userId;
    
    /**
     * 连续签到天数
     */
    private Integer continuousDays;
    
    /**
     * 本次签到获得的积分
     */
    private Integer points;
    
    /**
     * 签到日期
     */
    private LocalDate signDate;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
} 