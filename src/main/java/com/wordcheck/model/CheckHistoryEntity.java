package com.wordcheck.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * 检测历史记录实体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckHistoryEntity {
    
    /**
     * 历史记录ID
     */
    private String id;
    
    /**
     * 用户ID
     */
    private Integer userId;
    
    /**
     * 检测内容
     */
    private String content;
    
    /**
     * 内容长度（字符数）
     */
    private Integer contentLength;
    
    /**
     * 检测类型
     */
    private String checkType;
    
    /**
     * 使用的模型ID
     */
    private Integer modelId;
    
    /**
     * 模型名称
     */
    private String modelName;
    
    /**
     * 检测结果（JSON格式）
     */
    private String checkResult;
    
    /**
     * 检测评分
     */
    private Integer score;
    
    /**
     * 消耗的积分
     */
    private Integer pointsCost;
    
    /**
     * 创建时间
     */
    private Date createTime;
    
    /**
     * 更新时间
     */
    private Date updateTime;
} 