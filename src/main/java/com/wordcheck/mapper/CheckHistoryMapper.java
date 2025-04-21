package com.wordcheck.mapper;

import com.wordcheck.model.CheckHistoryEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 检测历史记录Mapper
 */
@Mapper
public interface CheckHistoryMapper {
    
    /**
     * 插入历史记录
     * @param history 历史记录实体
     * @return 影响行数
     */
    int insert(CheckHistoryEntity history);
    
    /**
     * 根据ID查询历史记录
     * @param id 历史记录ID
     * @return 历史记录
     */
    CheckHistoryEntity findById(@Param("id") String id);
    
    /**
     * 查询用户的历史记录列表
     * @param userId 用户ID
     * @param limit 查询数量限制
     * @param offset 分页偏移
     * @return 历史记录列表
     */
    List<CheckHistoryEntity> findByUserId(@Param("userId") Integer userId, 
                                          @Param("limit") Integer limit, 
                                          @Param("offset") Integer offset);
    
    /**
     * 统计用户的历史记录总数
     * @param userId 用户ID
     * @return 历史记录数量
     */
    int countByUserId(@Param("userId") Integer userId);
    
    /**
     * 更新历史记录
     * @param history 历史记录实体
     * @return 影响行数
     */
    int update(CheckHistoryEntity history);
    
    /**
     * 删除历史记录
     * @param id 历史记录ID
     * @return 影响行数
     */
    int deleteById(@Param("id") String id);
} 