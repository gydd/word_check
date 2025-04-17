package com.wordcheck.mapper;

import com.wordcheck.model.SignIn;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

/**
 * 签到数据访问接口
 */
@Mapper
public interface SignInMapper {
    
    /**
     * 根据用户ID和日期查询签到记录
     * 
     * @param userId 用户ID
     * @param date 日期
     * @return 签到记录
     */
    SignIn findByUserIdAndDate(@Param("userId") Integer userId, @Param("date") LocalDate date);
    
    /**
     * 根据用户ID查询最近一次签到记录
     * 
     * @param userId 用户ID
     * @return 最近一次签到记录
     */
    SignIn findLastByUserId(@Param("userId") Integer userId);
    
    /**
     * 插入新的签到记录
     * 
     * @param signIn 签到记录
     * @return 影响的行数
     */
    int insert(SignIn signIn);
    
    /**
     * 获取用户在指定月份的签到记录
     * 
     * @param userId 用户ID
     * @param year 年份
     * @param month 月份
     * @return 签到记录列表
     */
    List<SignIn> findByUserIdAndMonth(
            @Param("userId") Integer userId, 
            @Param("year") int year, 
            @Param("month") int month);
    
    /**
     * 获取用户签到总天数
     * 
     * @param userId 用户ID
     * @return 签到总天数
     */
    int countByUserId(@Param("userId") Integer userId);
    
    /**
     * 获取用户最近一周的签到记录
     * 
     * @param userId 用户ID
     * @param startDate 开始日期（周一）
     * @param endDate 结束日期（周日）
     * @return 签到记录列表
     */
    List<SignIn> findByUserIdAndDateRange(
            @Param("userId") Integer userId, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
} 