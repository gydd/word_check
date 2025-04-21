package com.wordcheck.service;

/**
 * 用户积分服务接口
 */
public interface UserPointService {
    
    /**
     * 获取用户当前积分
     * @param userId 用户ID
     * @return 用户积分
     */
    int getUserPoints(Integer userId);
    
    /**
     * 增加用户积分
     * @param userId 用户ID
     * @param points 增加的积分数量
     * @param reason 增加原因描述
     * @return 是否增加成功
     */
    boolean addPoints(Integer userId, int points, String reason);
    
    /**
     * 扣减用户积分
     * @param userId 用户ID
     * @param points 扣减的积分数量
     * @param reason 扣减原因描述
     * @return 是否扣减成功
     */
    boolean deductPoints(Integer userId, int points, String reason);
    
    /**
     * 检查用户积分是否足够
     * @param userId 用户ID
     * @param points 需要的积分数量
     * @return 积分是否足够
     */
    boolean checkPointsEnough(Integer userId, int points);
} 