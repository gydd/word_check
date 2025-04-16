package com.wordcheck.mapper;

import com.wordcheck.model.PointRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 积分记录数据访问接口
 */
@Mapper
public interface PointRecordMapper {
    /**
     * 根据ID查询积分记录
     *
     * @param id 记录ID
     * @return 积分记录对象
     */
    PointRecord findById(@Param("id") Integer id);
    
    /**
     * 插入新的积分记录
     *
     * @param record 积分记录对象
     * @return 影响行数
     */
    int insert(PointRecord record);
    
    /**
     * 根据用户ID和类型查询积分记录
     *
     * @param userId 用户ID
     * @param type 类型筛选，可选值：all, earn, spend
     * @param offset 偏移量
     * @param limit 记录数
     * @return 积分记录列表
     */
    List<PointRecord> findByUserIdAndType(@Param("userId") Integer userId, 
                                          @Param("type") String type, 
                                          @Param("offset") Integer offset, 
                                          @Param("limit") Integer limit);
    
    /**
     * 根据用户ID和类型统计记录数
     *
     * @param userId 用户ID
     * @param type 类型筛选，可选值：all, earn, spend
     * @return 记录数
     */
    int countByUserIdAndType(@Param("userId") Integer userId, @Param("type") String type);
    
    /**
     * 根据用户ID查询积分记录，带分页
     *
     * @param userId 用户ID
     * @param offset 偏移量
     * @param limit 记录数
     * @return 积分记录列表
     */
    List<PointRecord> selectByUserIdWithPagination(@Param("userId") Integer userId, 
                                                 @Param("offset") Integer offset, 
                                                 @Param("limit") Integer limit);
    
    /**
     * 根据用户ID统计记录数
     *
     * @param userId 用户ID
     * @return 记录数
     */
    int countByUserId(@Param("userId") Integer userId);
} 