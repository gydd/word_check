package com.wordcheck.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wordcheck.common.ApiResponse;
import com.wordcheck.model.vo.CheckHistory;
import com.wordcheck.service.CheckHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 检测历史记录控制器
 */
@RestController
@RequestMapping("/check-history")
@Tag(name = "检测历史", description = "用户检测历史记录相关接口")
@Slf4j
public class CheckHistoryController {
    
    @Autowired
    private CheckHistoryService checkHistoryService;
    
    /**
     * 获取用户的检测历史列表
     */
    @GetMapping("")
    @Operation(summary = "获取用户检测历史列表")
    public ApiResponse<Map<String, Object>> getUserHistoryList(
            HttpServletRequest request,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        
        // 从请求中获取用户ID
        Integer userId = (Integer) request.getAttribute("userId");
        if (userId == null) {
            return ApiResponse.error(401, "未登录或登录已过期");
        }
        
        try {
            // 获取历史记录列表
            List<CheckHistory> historyList = checkHistoryService.getUserHistoryList(userId, page, pageSize);
            
            // 获取总记录数
            int total = checkHistoryService.getUserHistoryCount(userId);
            
            // 构建分页结果
            Map<String, Object> result = new HashMap<>();
            result.put("list", historyList);
            result.put("total", total);
            result.put("page", page);
            result.put("pageSize", pageSize);
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("获取用户检测历史列表失败", e);
            return ApiResponse.error(500, "获取历史记录失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取检测历史详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取检测历史详情")
    public ApiResponse<CheckHistory> getHistoryDetail(
            HttpServletRequest request,
            @PathVariable String id) {
        
        // 从请求中获取用户ID
        Integer userId = (Integer) request.getAttribute("userId");
        if (userId == null) {
            return ApiResponse.error(401, "未登录或登录已过期");
        }
        
        try {
            // 获取历史记录详情
            CheckHistory history = checkHistoryService.getHistoryById(id);
            
            // 检查记录是否存在
            if (history == null) {
                return ApiResponse.error(404, "历史记录不存在");
            }
            
            // 检查是否是当前用户的记录
            if (!userId.equals(history.getUserId())) {
                return ApiResponse.error(403, "无权访问该历史记录");
            }
            
            return ApiResponse.success(history);
        } catch (Exception e) {
            log.error("获取检测历史详情失败", e);
            return ApiResponse.error(500, "获取历史记录详情失败: " + e.getMessage());
        }
    }
    
    /**
     * 删除检测历史记录
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除检测历史记录")
    public ApiResponse<Boolean> deleteHistory(
            HttpServletRequest request,
            @PathVariable String id) {
        
        // 从请求中获取用户ID
        Integer userId = (Integer) request.getAttribute("userId");
        if (userId == null) {
            return ApiResponse.error(401, "未登录或登录已过期");
        }
        
        try {
            // 删除历史记录
            boolean success = checkHistoryService.deleteHistory(id, userId);
            
            if (success) {
                return ApiResponse.success( true);
            } else {
                return ApiResponse.error(400, "删除失败，记录可能不存在或无权删除");
            }
        } catch (Exception e) {
            log.error("删除检测历史记录失败", e);
            return ApiResponse.error(500, "删除历史记录失败: " + e.getMessage());
        }
    }
    
    /**
     * 保存检测历史记录
     */
    @PostMapping("")
    @Operation(summary = "保存检测历史记录")
    public ApiResponse<CheckHistory> saveHistory(
            HttpServletRequest request,
            @RequestBody Map<String, Object> params) {
        
        // 从请求中获取用户ID
        Integer userId = (Integer) request.getAttribute("userId");
        if (userId == null) {
            return ApiResponse.error(401, "未登录或登录已过期");
        }
        
        try {
            log.info("保存检测历史记录, 参数: {}", params);
            
            // 获取必要参数
            String content = params.get("content") != null ? params.get("content").toString() : "";
            String title = params.get("title") != null ? params.get("title").toString() : "检测记录";
            Integer modelId = params.get("modelId") != null ? Integer.parseInt(params.get("modelId").toString()) : 1;
            String modelName = params.get("modelName") != null ? params.get("modelName").toString() : "未知模型";
            String checkType = params.get("checkType") != null ? params.get("checkType").toString() : "文本检测";
            
            // 处理result对象
            Map<String, Object> result = new HashMap<>();
            if (params.get("result") != null) {
                result = (Map<String, Object>) params.get("result");
                log.info("检测结果内容: {}", result);
                
                // 从结果中提取模型信息（如果存在）
                if (result.containsKey("modelInfo") && result.get("modelInfo") instanceof Map) {
                    Map<String, Object> modelInfo = (Map<String, Object>) result.get("modelInfo");
                    if (modelInfo.containsKey("name")) {
                        modelName = modelInfo.get("name").toString();
                        log.info("从结果中提取的模型名称: {}", modelName);
                    }
                    if (modelInfo.containsKey("id")) {
                        modelId = Integer.parseInt(modelInfo.get("id").toString());
                    }
                }
            } else if (params.containsKey("checkResult")) {
                // 尝试将checkResult解析为Map
                try {
                    if (params.get("checkResult") instanceof String) {
                        // 如果是字符串，尝试解析JSON
                        result = new ObjectMapper().readValue(params.get("checkResult").toString(), Map.class);
                    } else if (params.get("checkResult") instanceof Map) {
                        result = (Map<String, Object>) params.get("checkResult");
                    }
                } catch (Exception e) {
                    log.warn("解析checkResult失败: {}", e.getMessage());
                }
            }
            
            Integer pointsCost = params.get("point") != null ? Integer.parseInt(params.get("point").toString()) : 1;
            
            log.info("处理后的参数: 模型ID={}, 模型名称={}, 检测类型={}", modelId, modelName, checkType);
            
            // 调用服务保存历史记录
            String historyId = checkHistoryService.saveHistory(
                userId, content, modelId, modelName, checkType, result, pointsCost);
            
            // 获取保存后的记录详情
            CheckHistory savedHistory = checkHistoryService.getHistoryById(historyId);
            
            return ApiResponse.success(savedHistory);
        } catch (Exception e) {
            log.error("保存检测历史记录失败", e);
            return ApiResponse.error(500, "保存历史记录失败: " + e.getMessage());
        }
    }
} 