package com.wordcheck.model;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 轮播图实体类
 */
@Data
public class Carousel {
    /**
     * 主键ID
     */
    private Long id;
    
    /**
     * 图片URL
     */
    private String imageUrl;
    
    /**
     * 轮播图标题
     */
    private String title;
    
    /**
     * 轮播图描述
     */
    private String description;
    
    /**
     * 链接类型：page-小程序页面，web-网页，miniprogram-其他小程序
     */
    private String linkType;
    
    /**
     * 跳转链接
     */
    private String linkUrl;
    
    /**
     * 小程序appId(linkType为miniprogram时必填)
     */
    private String appId;
    
    /**
     * 排序(越小越靠前)
     */
    private Integer sort;
    
    /**
     * 状态：1-启用，0-禁用
     */
    private Integer status;
    
    /**
     * 查看次数
     */
    private Long viewCount;
    
    /**
     * 点击次数
     */
    private Long clickCount;
    
    /**
     * 开始展示时间
     */
    private LocalDateTime startTime;
    
    /**
     * 结束展示时间
     */
    private LocalDateTime endTime;
    
    /**
     * 版本号，用于乐观锁
     */
    private Integer version;
    
    /**
     * 创建时间
     */
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
    
    /**
     * 检查轮播图是否在有效期内
     * @return 是否有效
     */
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        boolean validStartTime = startTime == null || !startTime.isAfter(now);
        boolean validEndTime = endTime == null || !endTime.isBefore(now);
        return status != null && status == 1 && validStartTime && validEndTime;
    }
} 