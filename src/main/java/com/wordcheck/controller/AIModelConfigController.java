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

import java.util.List;

/**
 * AI模型配置控制器
 */
@RestController
@RequestMapping("/admin/ai-config")
@Tag(name = "AI模型配置", description = "AI模型配置管理接口")
@Slf4j
public class AIModelConfigController {

    @Autowired
    private AIModelConfigService aiModelConfigService;
    
    /**
     * 获取所有AI模型配置
     */
    @GetMapping("")
    @Operation(summary = "获取所有AI模型配置")
    public ApiResponse<List<AIModelConfig>> getAllConfigs() {
        try {
            List<AIModelConfig> configs = aiModelConfigService.getAllConfigs();
            return ApiResponse.success(configs);
        } catch (Exception e) {
            log.error("获取AI模型配置列表失败", e);
            return ApiResponse.error(500, "获取AI模型配置列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取单个AI模型配置
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取单个AI模型配置")
    public ApiResponse<AIModelConfig> getConfig(
            @Parameter(description = "配置ID") @PathVariable Integer id) {
        try {
            AIModelConfig config = aiModelConfigService.getConfigById(id);
            if (config == null) {
                return ApiResponse.error(404, "未找到指定的AI模型配置");
            }
            return ApiResponse.success(config);
        } catch (Exception e) {
            log.error("获取AI模型配置失败", e);
            return ApiResponse.error(500, "获取AI模型配置失败: " + e.getMessage());
        }
    }
    
    /**
     * 创建AI模型配置
     */
    @PostMapping("")
    @Operation(summary = "创建AI模型配置")
    public ApiResponse<AIModelConfig> createConfig(@RequestBody AIModelConfig config) {
        try {
            // 校验参数
            if (config.getName() == null || config.getName().trim().isEmpty()) {
                return ApiResponse.error(400, "模型名称不能为空");
            }
            if (config.getProvider() == null || config.getProvider().trim().isEmpty()) {
                return ApiResponse.error(400, "模型提供商不能为空");
            }
            
            AIModelConfig createdConfig = aiModelConfigService.createConfig(config);
            return ApiResponse.success(createdConfig);
        } catch (Exception e) {
            log.error("创建AI模型配置失败", e);
            return ApiResponse.error(500, "创建AI模型配置失败: " + e.getMessage());
        }
    }
    
    /**
     * 更新AI模型配置
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新AI模型配置")
    public ApiResponse<AIModelConfig> updateConfig(
            @Parameter(description = "配置ID") @PathVariable Integer id,
            @RequestBody AIModelConfig config) {
        try {
            // 校验参数
            if (config.getName() == null || config.getName().trim().isEmpty()) {
                return ApiResponse.error(400, "模型名称不能为空");
            }
            if (config.getProvider() == null || config.getProvider().trim().isEmpty()) {
                return ApiResponse.error(400, "模型提供商不能为空");
            }
            
            AIModelConfig updatedConfig = aiModelConfigService.updateConfig(id, config);
            return ApiResponse.success(updatedConfig);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(404, e.getMessage());
        } catch (Exception e) {
            log.error("更新AI模型配置失败", e);
            return ApiResponse.error(500, "更新AI模型配置失败: " + e.getMessage());
        }
    }
    
    /**
     * 删除AI模型配置
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除AI模型配置")
    public ApiResponse<Boolean> deleteConfig(
            @Parameter(description = "配置ID") @PathVariable Integer id) {
        try {
            boolean success = aiModelConfigService.deleteConfig(id);
            if (!success) {
                return ApiResponse.error(404, "未找到指定的AI模型配置");
            }
            return ApiResponse.success(true);
        } catch (Exception e) {
            log.error("删除AI模型配置失败", e);
            return ApiResponse.error(500, "删除AI模型配置失败: " + e.getMessage());
        }
    }
    
    /**
     * 设置默认AI模型配置
     */
    @PostMapping("/{id}/set-default")
    @Operation(summary = "设置默认AI模型配置")
    public ApiResponse<Boolean> setDefault(
            @Parameter(description = "配置ID") @PathVariable Integer id) {
        try {
            boolean success = aiModelConfigService.setDefault(id);
            if (!success) {
                return ApiResponse.error(404, "未找到指定的AI模型配置");
            }
            return ApiResponse.success(true);
        } catch (Exception e) {
            log.error("设置默认AI模型配置失败", e);
            return ApiResponse.error(500, "设置默认AI模型配置失败: " + e.getMessage());
        }
    }
} 