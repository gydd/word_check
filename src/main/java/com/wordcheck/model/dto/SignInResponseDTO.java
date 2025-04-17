package com.wordcheck.model.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * 签到响应DTO
 */
@Data
public class SignInResponseDTO {
    /**
     * 获得积分
     */
    private Integer points;
    
    /**
     * 连续签到天数
     */
    private Integer continuousDays;
    
    /**
     * 签到日期
     */
    private LocalDate signDate;
    
    /**
     * 当前总积分
     */
    private Integer currentPoints;
    
    /**
     * 累计签到天数
     */
    private Integer totalSignDays;
} 