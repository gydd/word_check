package com.wordcheck.model.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

/**
 * 检测历史记录
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CheckHistory {
    
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
     * 内容摘要（截取前50个字符）
     */
    private String contentSummary;
    
    /**
     * 内容长度（字符数）
     */
    private Integer contentLength;
    
    /**
     * 检测类型（如"作文批改"、"单词检测"等）
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
     * 检测结果评分
     */
    private Integer score;
    
    /**
     * 检测结果摘要
     */
    private String summary;
    
    /**
     * 检测结果详情
     */
    private String evaluation;
    
    /**
     * 建议列表
     */
    private List<String> suggestions;
    
    /**
     * 消耗的积分
     */
    private Integer pointsCost;
    
    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;
    
    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date updateTime;
    
    /**
     * 获取内容摘要
     */
    public String getContentSummary() {
        if (contentSummary != null) {
            return contentSummary;
        }
        
        if (content == null || content.isEmpty()) {
            return "";
        }
        
        // 截取前50个字符作为摘要
        int maxLength = 50;
        if (content.length() <= maxLength) {
            return content;
        } else {
            return content.substring(0, maxLength) + "...";
        }
    }
} 