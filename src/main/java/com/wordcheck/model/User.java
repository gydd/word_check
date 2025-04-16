package com.wordcheck.model;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体类
 */
@Data
public class User {
    /**
     * 用户ID
     */
    private Integer id;
    
    /**
     * 微信OpenID
     */
    private String openid;
    
    /**
     * 手机号
     */
    private String phone;
    
    /**
     * 用户昵称
     */
    private String nickname;
    
    /**
     * 头像URL
     */
    private String avatarUrl;
    
    /**
     * 性别：0未知，1男，2女
     */
    private Integer gender;
    
    /**
     * 状态：0禁用，1启用
     */
    private Integer status;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
} 