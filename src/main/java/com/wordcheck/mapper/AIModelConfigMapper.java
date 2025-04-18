package com.wordcheck.mapper;

import com.wordcheck.model.AIModelConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * AI模型配置数据访问接口
 */
@Mapper
public interface AIModelConfigMapper {
    
    /**
     * 获取所有AI模型配置
     * 
     * @return AI模型配置列表
     */
    List<AIModelConfig> findAll();
    
    /**
     * 根据ID查询AI模型配置
     * 
     * @param id 配置ID
     * @return AI模型配置
     */
    AIModelConfig findById(@Param("id") Integer id);
    
    /**
     * 查询默认的AI模型配置
     * 
     * @return 默认AI模型配置
     */
    AIModelConfig findDefault();
    
    /**
     * 插入AI模型配置
     * 
     * @param config 配置信息
     * @return 影响的行数
     */
    int insert(AIModelConfig config);
    
    /**
     * 更新AI模型配置
     * 
     * @param config 配置信息
     * @return 影响的行数
     */
    int update(AIModelConfig config);
    
    /**
     * 删除AI模型配置
     * 
     * @param id 配置ID
     * @return 影响的行数
     */
    int delete(@Param("id") Integer id);
    
    /**
     * 设置指定ID的模型为默认模型
     * 
     * @param id 配置ID
     * @return 影响的行数
     */
    int setDefault(@Param("id") Integer id);
    
    /**
     * 重置所有模型的默认状态
     * 
     * @return 影响的行数
     */
    int resetAllDefault();
    
    /**
     * 获取可用的AI模型配置列表
     * 
     * @return 可用的AI模型配置列表
     */
    List<AIModelConfig> findAvailable();
} 