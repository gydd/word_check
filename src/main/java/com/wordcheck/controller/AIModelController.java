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
import java.util.ArrayList;
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
            
            log.info("接收到AI批改请求，用户ID: {}, 参数: {}", userId, params);
            
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
                    if (params.get("modelId") instanceof Integer) {
                        modelId = (Integer) params.get("modelId");
                    } else {
                        modelId = Integer.parseInt(params.get("modelId").toString());
                    }
                    log.info("使用指定模型ID: {}", modelId);
                } catch (NumberFormatException e) {
                    log.warn("模型ID格式错误，将使用默认模型: {}", e.getMessage());
                }
            } else {
                log.info("未指定模型ID，将使用默认模型");
            }
            
            // 调用AI模型进行作文批改
            String checkResult = aiModelConfigService.checkEssay(modelId, content);
            log.info("AI批改完成，结果长度: {}", checkResult != null ? checkResult.length() : 0);
            
            // 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("evaluation", checkResult);
            
            // 获取模型信息
            AIModelConfig modelConfig;
            if (modelId != null) {
                modelConfig = aiModelConfigService.getConfigById(modelId);
            } else {
                modelConfig = aiModelConfigService.getDefaultConfig();
            }
            
            // 添加模型信息到结果中
            if (modelConfig != null) {
                Map<String, Object> modelInfo = new HashMap<>();
                modelInfo.put("id", modelConfig.getId());
                modelInfo.put("name", modelConfig.getName());
                modelInfo.put("provider", modelConfig.getProvider());
                result.put("modelInfo", modelInfo);
            }
            
            // 计算评分和提取关键建议（简单示例算法）
            int score = calculateScore(checkResult);
            List<String> suggestions = extractSuggestions(checkResult);
            String summary = extractSummary(checkResult);
            
            result.put("score", score);
            result.put("suggestions", suggestions);
            result.put("summary", summary);
            
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            log.error("参数错误: {}", e.getMessage(), e);
            return ApiResponse.error(400, e.getMessage());
        } catch (IllegalStateException e) {
            log.error("处理错误: {}", e.getMessage(), e);
            return ApiResponse.error(500, e.getMessage());
        } catch (Exception e) {
            log.error("作文批改失败", e);
            return ApiResponse.error(500, "作文批改失败: " + e.getMessage());
        }
    }
    
    /**
     * 从AI回复中计算评分
     * 简单实现，实际应用中可能需要更复杂的算法
     */
    private int calculateScore(String aiReply) {
        if (aiReply == null || aiReply.isEmpty()) {
            return 60; // 默认分数
        }
        
        // 尝试从回复中提取分数
        // 假设回复中可能包含"评分：85分"这样的文本
        try {
            int scoreIndex = aiReply.indexOf("评分：");
            if (scoreIndex != -1) {
                String scorePart = aiReply.substring(scoreIndex + 3, scoreIndex + 10);
                scorePart = scorePart.replaceAll("[^0-9]", "");
                if (!scorePart.isEmpty()) {
                    int score = Integer.parseInt(scorePart);
                    if (score >= 0 && score <= 100) {
                        return score;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("提取分数失败", e);
        }
        
        // 如果无法提取，则根据回复长度和关键词给出大致评分
        int baseScore = 70;
        
        // 根据回复长度调整分数
        if (aiReply.length() > 1000) baseScore += 5;
        if (aiReply.length() > 2000) baseScore += 5;
        
        // 根据关键词调整分数
        if (aiReply.contains("优秀") || aiReply.contains("excellent")) baseScore += 10;
        if (aiReply.contains("良好") || aiReply.contains("good")) baseScore += 5;
        if (aiReply.contains("不足") || aiReply.contains("weakness")) baseScore -= 5;
        if (aiReply.contains("问题") || aiReply.contains("issue")) baseScore -= 5;
        
        // 确保分数在合理范围内
        return Math.max(0, Math.min(100, baseScore));
    }
    
    /**
     * 从AI回复中提取建议
     */
    private List<String> extractSuggestions(String aiReply) {
        List<String> suggestions = new ArrayList<>();
        
        if (aiReply == null || aiReply.isEmpty()) {
            suggestions.add("无法提取建议");
            return suggestions;
        }
        
        // 尝试查找建议部分
        String[] markers = {"建议：", "建议:", "suggestions:", "Suggestions:", "改进建议", "改进意见"};
        
        for (String marker : markers) {
            int index = aiReply.indexOf(marker);
            if (index != -1) {
                // 找到建议部分，尝试提取
                String suggestionsText = aiReply.substring(index + marker.length());
                // 根据换行符或编号分割建议
                String[] lines = suggestionsText.split("\\n|\\d+\\.");
                
                for (String line : lines) {
                    line = line.trim();
                    if (!line.isEmpty() && line.length() > 5 && !line.startsWith("评分")) {
                        suggestions.add(line);
                        if (suggestions.size() >= 3) break; // 最多提取3条建议
                    }
                }
                
                if (!suggestions.isEmpty()) break;
            }
        }
        
        // 如果未找到明确的建议，尝试从段落中提取
        if (suggestions.isEmpty()) {
            String[] paragraphs = aiReply.split("\\n\\n");
            for (String paragraph : paragraphs) {
                if (paragraph.contains("建议") || paragraph.contains("suggest") || 
                    paragraph.contains("改进") || paragraph.contains("improve")) {
                    suggestions.add(paragraph.trim());
                    if (suggestions.size() >= 3) break;
                }
            }
        }
        
        // 如果仍然没有提取到，返回一个默认建议
        if (suggestions.isEmpty()) {
            suggestions.add("请仔细阅读AI的评价，根据反馈改进写作");
        }
        
        return suggestions;
    }
    
    /**
     * 从AI回复中提取摘要
     */
    private String extractSummary(String aiReply) {
        if (aiReply == null || aiReply.isEmpty()) {
            return "无法提取摘要";
        }
        
        // 尝试找到总结或总体评价部分
        String[] markers = {"总结：", "总结:", "总体评价", "整体评价", "Summary:", "summary:"};
        
        for (String marker : markers) {
            int index = aiReply.indexOf(marker);
            if (index != -1) {
                // 找到总结部分
                String summaryText = aiReply.substring(index + marker.length());
                // 取到下一个段落结束
                int endIndex = summaryText.indexOf("\n\n");
                if (endIndex != -1) {
                    return summaryText.substring(0, endIndex).trim();
                } else {
                    // 如果没有明确的结束，取前200个字符
                    return summaryText.substring(0, Math.min(200, summaryText.length())).trim();
                }
            }
        }
        
        // 如果没有找到明确的摘要，取开头的内容作为摘要
        int endOfFirstParagraph = aiReply.indexOf("\n\n");
        if (endOfFirstParagraph != -1 && endOfFirstParagraph > 20) {
            return aiReply.substring(0, endOfFirstParagraph).trim();
        } else {
            // 取前150个字符
            return aiReply.substring(0, Math.min(150, aiReply.length())).trim();
        }
    }
} 