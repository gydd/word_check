package com.wordcheck.model.dto;

import lombok.Data;

/**
 * 用户信息数据传输对象
 */
@Data
public class UserInfoDTO {
    /**
     * 用户ID
     */
    private Integer id;
    
    /**
     * 微信OpenID
     */
    private String openid;
    
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
     * 手机号
     */
    private String phone;
    
    /**
     * 用户积分
     */
    private Integer points;
    
    /**
     * 等级
     */
    private Integer level;
    
    /**
     * 等级名称
     */
    private String levelName;
    
    /**
     * 下一等级所需积分
     */
    private Integer nextLevelPoints;
    
    /**
     * 检查总次数
     */
    private Integer checkCount;
    
    /**
     * 正确次数
     */
    private Integer correctCount;
    
    /**
     * 正确率
     */
    private String accuracy;
} 