package com.wordcheck.enums;

/**
 * 积分类型枚举
 * 定义积分变动的不同类型
 */
public enum PointTypeEnum {
    
    /**
     * 增加积分
     */
    INCREASE(1, "增加积分"),
    
    /**
     * 减少积分
     */
    DECREASE(2, "减少积分"),
    
    /**
     * 冻结积分
     */
    FREEZE(3, "冻结积分"),
    
    /**
     * 解冻积分
     */
    UNFREEZE(4, "解冻积分"),
    
    /**
     * 过期积分
     */
    EXPIRE(5, "过期积分"),
    
    /**
     * 初始化积分
     */
    INITIALIZE(6, "初始化积分"),
    
    /**
     * 签到积分
     */
    SIGN_IN(10, "签到积分"),
    
    /**
     * 单词检查
     */
    WORD_CHECK(11, "单词检查"),
    
    /**
     * 学习任务
     */
    STUDY_TASK(12, "学习任务"),
    
    /**
     * 消费
     */
    CONSUMPTION(20, "消费"),
    
    /**
     * 系统赠送
     */
    SYSTEM(30, "系统赠送"),
    
    /**
     * 其他类型
     */
    OTHER(99, "其他类型");
    
    /**
     * 类型编码
     */
    private final int code;
    
    /**
     * 类型描述
     */
    private final String description;
    
    PointTypeEnum(int code, String description) {
        this.code = code;
        this.description = description;
    }
    
    /**
     * 获取类型编码
     */
    public int getCode() {
        return code;
    }
    
    /**
     * 获取类型描述
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * 根据编码获取枚举
     */
    public static PointTypeEnum getByCode(int code) {
        for (PointTypeEnum type : values()) {
            if (type.getCode() == code) {
                return type;
            }
        }
        return OTHER;
    }
    
    /**
     * 判断是否为增加类型
     */
    public boolean isIncrease() {
        return this == INCREASE || this == UNFREEZE || this == SIGN_IN || 
               this == WORD_CHECK || this == STUDY_TASK || this == SYSTEM;
    }
    
    /**
     * 判断是否为减少类型
     */
    public boolean isDecrease() {
        return this == DECREASE || this == FREEZE || this == EXPIRE || this == CONSUMPTION;
    }
} 