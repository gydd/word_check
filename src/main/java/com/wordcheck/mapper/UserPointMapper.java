package com.wordcheck.mapper;

import com.wordcheck.model.UserPoint;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户积分数据访问接口
 */
@Mapper
public interface UserPointMapper {
    /**
     * 根据用户ID查询积分信息
     *
     * @param userId 用户ID
     * @return 用户积分对象
     */
    UserPoint findByUserId(@Param("userId") Integer userId);
    
    /**
     * 插入新的用户积分记录
     *
     * @param userPoint 用户积分对象
     * @return 影响行数
     */
    int insert(UserPoint userPoint);
    
    /**
     * 更新用户积分信息
     *
     * @param userPoint 用户积分对象
     * @return 影响行数
     */
    int update(UserPoint userPoint);
    
    /**
     * 增加用户积分
     *
     * @param userId 用户ID
     * @param points 增加的积分数
     * @return 影响行数
     */
    int addPoints(@Param("userId") Integer userId, @Param("points") Integer points);
    
    /**
     * 减少用户积分
     *
     * @param userId 用户ID
     * @param points 减少的积分数
     * @return 影响行数
     */
    int deductPoints(@Param("userId") Integer userId, @Param("points") Integer points);
} 