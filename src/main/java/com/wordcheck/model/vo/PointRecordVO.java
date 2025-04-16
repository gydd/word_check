package com.wordcheck.model.vo;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 积分记录VO
 * 用于返回积分变动记录信息
 */
@Data
public class PointRecordVO implements Serializable {
    
    private static final long serialVersionUID = 1L;

    /**
     * 记录ID
     */
    private Integer id;
    
    /**
     * 用户ID
     */
    private Integer userId;
    
    /**
     * 变动积分值
     */
    private Integer points;
    
    /**
     * 变动原因
     */
    private String reason;
    
    /**
     * 积分类型
     * NORMAL - 普通积分
     * BONUS - 奖励积分
     * TASK - 任务积分
     */
    private String type;
    
    /**
     * 积分动作
     * INCREASE - 增加
     * DECREASE - 减少
     * FREEZE - 冻结
     * UNFREEZE - 解冻
     * ADJUST - 调整
     */
    private String action;
    
    /**
     * 业务ID
     */
    private Long businessId;
    
    /**
     * 业务类型
     */
    private String businessType;
    
    /**
     * 备注
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
     * 用户名称（关联信息）
     */
    private String username;
} 