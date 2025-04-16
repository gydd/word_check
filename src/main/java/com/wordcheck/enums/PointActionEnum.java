package com.wordcheck.enums;

/**
 * 积分动作枚举
 * 定义所有可能的积分变动动作
 */
public enum PointActionEnum {
    
    /**
     * 系统赠送
     */
    SYSTEM_GRANT(1, "系统赠送"),
    
    /**
     * 签到奖励
     */
    SIGN_IN(2, "签到奖励"),
    
    /**
     * 完成任务
     */
    COMPLETE_TASK(3, "完成任务"),
    
    /**
     * 单词学习
     */
    WORD_LEARNING(4, "单词学习"),
    
    /**
     * 完成测试
     */
    COMPLETE_TEST(5, "完成测试"),
    
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
    OTHER(99, "其他");
    
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