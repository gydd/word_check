package com.wordcheck.model.dto;

import lombok.Data;

import java.util.List;

/**
 * 签到状态DTO
 */
@Data
public class SignInStatusDTO {
    /**
     * 今日是否已签到
     */
    private Boolean todaySigned;
    
    /**
     * 连续签到天数
     */
    private Integer continuousDays;
    
    /**
     * 累计签到天数
     */
    private Integer totalSignDays;
    
    /**
     * 本周签到情况，数组索引0为周一
     */
    private List<Boolean> thisWeekSigned;
    
    /**
     * 本月签到情况，数组索引0为1号
     */
    private List<Boolean> thisMonthSigned;
} 