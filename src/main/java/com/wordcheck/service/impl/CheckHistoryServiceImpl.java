package com.wordcheck.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wordcheck.mapper.CheckHistoryMapper;
import com.wordcheck.model.CheckHistoryEntity;
import com.wordcheck.model.vo.CheckHistory;
import com.wordcheck.service.CheckHistoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 检测历史服务实现类
 */
@Slf4j
@Service
public class CheckHistoryServiceImpl implements CheckHistoryService {
    
    @Autowired
    private CheckHistoryMapper checkHistoryMapper;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Override
    public String saveHistory(Integer userId, String content, Integer modelId, String modelName,
                              String checkType, Map<String, Object> result, Integer pointsCost) {
        try {
            // 生成唯一ID
            String id = UUID.randomUUID().toString().replace("-", "");
            
            // 计算内容长度
            int contentLength = content != null ? content.length() : 0;
            
            // 计算评分
            Integer score = null;
            if (result != null) {
                log.info("处理检测结果数据，尝试提取评分");
                
                // 直接从result中查找score字段
                if (result.containsKey("score")) {
                    Object scoreObj = result.get("score");
                    log.info("找到评分数据: {}, 类型: {}", scoreObj, scoreObj != null ? scoreObj.getClass().getName() : "null");
                    
                    if (scoreObj instanceof Number) {
                        score = ((Number) scoreObj).intValue();
                        log.info("提取到评分(数值类型): {}", score);
                    } else if (scoreObj instanceof String) {
                        try {
                            score = Integer.parseInt(scoreObj.toString());
                            log.info("提取到评分(字符串类型): {}", score);
                        } catch (NumberFormatException e) {
                            log.warn("转换评分失败: {}", scoreObj);
                        }
                    }
                }
                
                // 如果没有找到score字段，尝试从其他可能的位置查找
                if (score == null) {
                    // 方法1：查找result.result.score
                    if (result.containsKey("result") && result.get("result") instanceof Map) {
                        Map<String, Object> innerResult = (Map<String, Object>) result.get("result");
                        if (innerResult.containsKey("score")) {
                            Object scoreObj = innerResult.get("score");
                            if (scoreObj instanceof Number) {
                                score = ((Number) scoreObj).intValue();
                                log.info("从内层result中提取到评分: {}", score);
                            } else if (scoreObj instanceof String) {
                                try {
                                    score = Integer.parseInt(scoreObj.toString());
                                    log.info("从内层result中提取到评分(字符串): {}", score);
                                } catch (NumberFormatException e) {
                                    log.warn("从内层result转换评分失败: {}", scoreObj);
                                }
                            }
                        }
                    }
                }
            }
            
            // 将结果转为JSON字符串
            String resultJson = null;
            if (result != null) {
                try {
                    resultJson = objectMapper.writeValueAsString(result);
                    log.info("转换检测结果为JSON成功，长度: {}", resultJson.length());
                } catch (Exception e) {
                    log.error("转换检测结果为JSON失败", e);
                }
            }
            
            log.info("保存检测历史记录: 用户ID={}, 内容长度={}, 检测类型={}, 模型ID={}, 模型名称={}, 评分={}, 积分消耗={}",
                    userId, contentLength, checkType, modelId, modelName, score, pointsCost);
            
            // 创建实体并保存
            CheckHistoryEntity entity = CheckHistoryEntity.builder()
                    .id(id)
                    .userId(userId)
                    .content(content)
                    .contentLength(contentLength)
                    .checkType(checkType)
                    .modelId(modelId)
                    .modelName(modelName)
                    .checkResult(resultJson)
                    .score(score)
                    .pointsCost(pointsCost)
                    .createTime(new Date())
                    .updateTime(new Date())
                    .build();
            
            int rows = checkHistoryMapper.insert(entity);
            if (rows > 0) {
                log.info("检测历史记录保存成功，ID: {}", id);
                return id;
            } else {
                log.error("保存检测历史记录失败");
                return null;
            }
        } catch (Exception e) {
            log.error("保存检测历史记录异常", e);
            return null;
        }
    }
    
    @Override
    public CheckHistory getHistoryById(String id) {
        if (id == null || id.isEmpty()) {
            return null;
        }
        
        try {
            CheckHistoryEntity entity = checkHistoryMapper.findById(id);
            if (entity == null) {
                return null;
            }
            
            return convertToCheckHistory(entity);
        } catch (Exception e) {
            log.error("获取检测历史记录异常", e);
            return null;
        }
    }
    
    @Override
    public List<CheckHistory> getUserHistoryList(Integer userId, Integer page, Integer pageSize) {
        if (userId == null || userId <= 0) {
            return Collections.emptyList();
        }
        
        try {
            // 计算分页
            if (page == null || page < 1) {
                page = 1;
            }
            if (pageSize == null || pageSize < 1) {
                pageSize = 10;
            }
            int offset = (page - 1) * pageSize;
            
            // 查询数据
            List<CheckHistoryEntity> entities = checkHistoryMapper.findByUserId(userId, pageSize, offset);
            if (entities == null || entities.isEmpty()) {
                return Collections.emptyList();
            }
            
            // 转换为VO
            return entities.stream()
                    .map(this::convertToListItem)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("获取用户检测历史记录列表异常", e);
            return Collections.emptyList();
        }
    }
    
    @Override
    public int getUserHistoryCount(Integer userId) {
        if (userId == null || userId <= 0) {
            return 0;
        }
        
        try {
            return checkHistoryMapper.countByUserId(userId);
        } catch (Exception e) {
            log.error("获取用户检测历史记录数量异常", e);
            return 0;
        }
    }
    
    @Override
    public boolean deleteHistory(String id, Integer userId) {
        if (id == null || id.isEmpty() || userId == null || userId <= 0) {
            return false;
        }
        
        try {
            // 查询记录确认所有权
            CheckHistoryEntity entity = checkHistoryMapper.findById(id);
            if (entity == null) {
                log.warn("要删除的检测历史记录不存在: {}", id);
                return false;
            }
            
            if (!Objects.equals(entity.getUserId(), userId)) {
                log.warn("用户({})无权删除检测历史记录: {}", userId, id);
                return false;
            }
            
            // 执行删除
            int rows = checkHistoryMapper.deleteById(id);
            return rows > 0;
        } catch (Exception e) {
            log.error("删除检测历史记录异常", e);
            return false;
        }
    }
    
    /**
     * 转换为VO对象（完整数据）
     */
    private CheckHistory convertToCheckHistory(CheckHistoryEntity entity) {
        if (entity == null) {
            return null;
        }
        
        CheckHistory history = new CheckHistory();
        history.setId(entity.getId());
        history.setUserId(entity.getUserId());
        history.setContent(entity.getContent());
        history.setContentLength(entity.getContentLength());
        history.setCheckType(entity.getCheckType());
        history.setModelId(entity.getModelId());
        history.setModelName(entity.getModelName());
        history.setScore(entity.getScore());
        history.setPointsCost(entity.getPointsCost());
        history.setCreateTime(entity.getCreateTime());
        history.setUpdateTime(entity.getUpdateTime());
        
        // 解析检测结果JSON
        if (entity.getCheckResult() != null && !entity.getCheckResult().isEmpty()) {
            try {
                Map<String, Object> result = objectMapper.readValue(entity.getCheckResult(), Map.class);
                
                // 提取评价和摘要
                history.setEvaluation(result.containsKey("evaluation") ? result.get("evaluation").toString() : null);
                history.setSummary(result.containsKey("summary") ? result.get("summary").toString() : null);
                
                // 提取建议列表
                if (result.containsKey("suggestions") && result.get("suggestions") instanceof List) {
                    List<String> suggestions = new ArrayList<>();
                    ((List<?>) result.get("suggestions")).forEach(item -> {
                        if (item != null) {
                            suggestions.add(item.toString());
                        }
                    });
                    history.setSuggestions(suggestions);
                }
            } catch (Exception e) {
                log.error("解析检测结果JSON失败", e);
            }
        }
        
        return history;
    }
    
    /**
     * 转换为列表项（不包含完整内容和结果）
     */
    private CheckHistory convertToListItem(CheckHistoryEntity entity) {
        if (entity == null) {
            return null;
        }
        
        CheckHistory history = new CheckHistory();
        history.setId(entity.getId());
        history.setUserId(entity.getUserId());
        history.setContentLength(entity.getContentLength());
        history.setCheckType(entity.getCheckType());
        history.setModelId(entity.getModelId());
        history.setModelName(entity.getModelName());
        history.setScore(entity.getScore());
        history.setPointsCost(entity.getPointsCost());
        history.setCreateTime(entity.getCreateTime());
        
        // 设置内容摘要（如果content太大，只保存前50个字符）
        if (entity.getContent() != null) {
            if (entity.getContent().length() <= 50) {
                history.setContentSummary(entity.getContent());
            } else {
                history.setContentSummary(entity.getContent().substring(0, 50) + "...");
            }
        }
        
        // 解析检测结果JSON，仅提取摘要
        if (entity.getCheckResult() != null && !entity.getCheckResult().isEmpty()) {
            try {
                Map<String, Object> result = objectMapper.readValue(entity.getCheckResult(), Map.class);
                history.setSummary(result.containsKey("summary") ? result.get("summary").toString() : null);
            } catch (Exception e) {
                log.error("解析检测结果JSON失败", e);
            }
        }
        
        return history;
    }
} 