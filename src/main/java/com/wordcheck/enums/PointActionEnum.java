package com.wordcheck.enums;

/**
 * 积分动作枚举
 * 定义积分变动的具体动作
 */
public enum PointActionEnum {
    
    /**
     * 签到奖励
     */
    SIGN_IN_REWARD(101, "签到奖励"),
    
    /**
     * 连续签到奖励
     */
    CONTINUOUS_SIGN_IN_REWARD(102, "连续签到奖励"),
    
    /**
     * 单词拼写正确奖励
     */
    WORD_CORRECT_REWARD(201, "单词拼写正确奖励"),
    
    /**
     * 学习任务完成奖励
     */
    TASK_COMPLETE_REWARD(301, "学习任务完成奖励"),
    
    /**
     * 消费
     */
    CONSUMPTION(401, "积分消费"),
    
    /**
     * 系统赠送
     */
    SYSTEM_GRANT(501, "系统赠送"),
    
    /**
     * 邀请好友
     */
    INVITE_FRIEND(6, "邀请好友"),
    
    /**
     * 购买商品
     */
    PURCHASE(7, "购买商品"),
    
    /**
     * 兑换奖品
     */
    EXCHANGE_GIFT(8, "兑换奖品"),
    
    /**
     * 积分过期
     */
    POINTS_EXPIRED(9, "积分过期"),
    
    /**
     * 管理员调整
     */
    ADMIN_ADJUST(10, "管理员调整"),
    
    /**
     * 其他
     */
    OTHER(999, "其他");
    
    /**
     * 动作编码
     */
    private final int code;
    
    /**
     * 动作描述
     */
    private final String description;
    
    PointActionEnum(int code, String description) {
        this.code = code;
        this.description = description;
    }
    
    /**
     * 获取动作编码
     */
    public int getCode() {
        return code;
    }
    
    /**
     * 获取动作描述
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * 根据编码获取枚举
     */
    public static PointActionEnum getByCode(int code) {
        for (PointActionEnum action : values()) {
            if (action.getCode() == code) {
                return action;
            }
        }
        return OTHER;
    }
} 