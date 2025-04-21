package com.wordcheck.service;

import com.wordcheck.model.vo.CheckHistory;

import java.util.List;
import java.util.Map;

/**
 * 检测历史服务接口
 */
public interface CheckHistoryService {
    
    /**
     * 保存检测历史记录
     * @param userId 用户ID
     * @param content 检测内容
     * @param modelId 模型ID
     * @param modelName 模型名称
     * @param checkType 检测类型
     * @param result 检测结果
     * @param pointsCost 消耗积分
     * @return 历史记录ID
     */
    String saveHistory(Integer userId, String content, Integer modelId, String modelName,
                       String checkType, Map<String, Object> result, Integer pointsCost);
    
    /**
     * 根据ID获取历史记录
     * @param id 历史记录ID
     * @return 历史记录
     */
    CheckHistory getHistoryById(String id);
    
    /**
     * 获取用户的历史记录列表
     * @param userId 用户ID
     * @param page 页码（从1开始）
     * @param pageSize 每页记录数
     * @return 历史记录列表
     */
    List<CheckHistory> getUserHistoryList(Integer userId, Integer page, Integer pageSize);
    
    /**
     * 获取用户历史记录总数
     * @param userId 用户ID
     * @return 历史记录数量
     */
    int getUserHistoryCount(Integer userId);
    
    /**
     * 删除历史记录
     * @param id 历史记录ID
     * @param userId 用户ID（用于验证权限）
     * @return 是否删除成功
     */
    boolean deleteHistory(String id, Integer userId);
} 