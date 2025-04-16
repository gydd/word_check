package com.wordcheck.mapper;

import com.wordcheck.model.PointRecord;
import com.wordcheck.model.UserPoint;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 积分数据访问接口
 */
@Mapper
public interface PointMapper {
    
    /**
     * 获取用户积分信息
     * 
     * @param userId 用户ID
     * @return 用户积分信息
     */
    UserPoint getUserPoints(@Param("userId") Integer userId);
    
    /**
     * 初始化用户积分记录
     * 
     * @param userPoint 用户积分信息
     * @return 影响行数
     */
    int initUserPoints(UserPoint userPoint);
    
    /**
     * 更新用户积分
     * 
     * @param userPoint 用户积分信息
     * @return 影响行数
     */
    int updateUserPoints(UserPoint userPoint);
    
    /**
     * 增加用户等级
     * 
     * @param userId 用户ID
     * @param level 用户等级
     * @return 影响行数
     */
    int updateUserLevel(@Param("userId") Integer userId, @Param("level") Integer level);
    
    /**
     * 添加积分记录
     * 
     * @param record 积分记录
     * @return 影响行数
     */
    int addPointRecord(PointRecord record);
    
    /**
     * 获取用户积分记录列表
     * 
     * @param userId 用户ID
     * @param type 记录类型 (null表示全部)
     * @param offset 偏移量
     * @param limit 每页记录数
     * @return 积分记录列表
     */
    List<PointRecord> getPointRecords(
            @Param("userId") Integer userId, 
            @Param("type") String type, 
            @Param("offset") Integer offset, 
            @Param("limit") Integer limit
    );
    
    /**
     * 获取用户积分记录总数
     * 
     * @param userId 用户ID
     * @param type 记录类型 (null表示全部)
     * @return 记录总数
     */
    int countPointRecords(
            @Param("userId") Integer userId, 
            @Param("type") String type
    );
} 