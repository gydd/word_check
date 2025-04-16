package com.wordcheck.model;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 积分记录实体类
 */
@Data
public class PointRecord {
    /**
     * 记录ID
     */
    private Integer id;
    
    /**
     * 用户ID
     */
    private Integer userId;
    
    /**
     * 积分变动数量
     */
    private Integer points;
    
    /**
     * 积分变动原因
     */
    private String reason;
    
    /**
     * 积分类型，如签到(sign_in)、单词检查(word_check)等
     */
    private String type;
    
    /**
     * 变动动作：增加(add)或扣减(deduct)
     */
    private String action;
    
    /**
     * 关联业务ID
     */
    private Integer businessId;
    
    /**
     * 关联业务类型
     */
    private String businessType;
    
    /**
     * 备注说明
     */
    private String remark;
    
    /**
     * 变动前积分
     */
    private Integer beforePoints;
    
    /**
     * 变动后积分
     */
    private Integer afterPoints;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
} 