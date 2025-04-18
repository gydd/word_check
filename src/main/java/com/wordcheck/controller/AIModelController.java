package com.wordcheck.controller;

import com.wordcheck.common.ApiResponse;
import com.wordcheck.model.AIModelConfig;
import com.wordcheck.service.AIModelConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI模型接口控制器
 */
@RestController
@RequestMapping("/ai-models")
@Tag(name = "AI模型", description = "用户可用的AI模型相关接口")
@Slf4j
public class AIModelController {

    @Autowired
    private AIModelConfigService aiModelConfigService;
    
    /**
     * 获取可用的AI模型配置列表
     */
    @GetMapping("")
    @Operation(summary = "获取可用的AI模型配置列表")
    public ApiResponse<List<AIModelConfig>> getAvailableModels() {
        try {
            List<AIModelConfig> configs = aiModelConfigService.getAvailableConfigs();
            return ApiResponse.success(configs);
        } catch (Exception e) {
            log.error("获取可用AI模型列表失败", e);
            return ApiResponse.error(500, "获取可用AI模型列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 使用AI模型批改作文
     */
    @PostMapping("/check-essay")
    @Operation(summary = "使用AI模型批改作文")
    public ApiResponse<Map<String, Object>> checkEssay(
            HttpServletRequest request,
            @RequestBody Map<String, Object> params) {
        try {
            // 从请求中获取用户ID
            Integer userId = (Integer) request.getAttribute("userId");
            if (userId == null) {
                return ApiResponse.error(401, "未登录或登录已过期");
            }
            
            // 验证参数
            if (!params.containsKey("content") || params.get("content") == null) {
                return ApiResponse.error(400, "作文内容不能为空");
            }
            
            String content = params.get("content").toString();
            if (content.trim().isEmpty()) {
                return ApiResponse.error(400, "作文内容不能为空");
            }
            
            // 获取模型ID，如果未指定则使用默认模型
            Integer modelId = null;
            if (params.containsKey("modelId") && params.get("modelId") != null) {
                try {
                    modelId = Integer.parseInt(params.get("modelId").toString());
                } catch (NumberFormatException e) {
                    log.warn("模型ID格式错误，将使用默认模型");
                }
            }
            
            // 调用AI模型进行作文批改
            String checkResult = aiModelConfigService.checkEssay(modelId, content);
            
            // 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("result", checkResult);
            
            // 如果指定了模型ID，返回模型信息
            if (modelId != null) {
                AIModelConfig model = aiModelConfigService.getConfigById(modelId);
                if (model != null) {
                    result.put("modelName", model.getName());
                    result.put("modelProvider", model.getProvider());
                }
            }
            
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        } catch (IllegalStateException e) {
            return ApiResponse.error(500, e.getMessage());
        } catch (Exception e) {
            log.error("作文批改失败", e);
            return ApiResponse.error(500, "作文批改失败: " + e.getMessage());
        }
    }
} 