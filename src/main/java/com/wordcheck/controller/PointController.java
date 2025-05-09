package com.wordcheck.controller;

import com.wordcheck.common.ApiResponse;
import com.wordcheck.model.dto.PointsDTO;
import com.wordcheck.model.dto.PointsRecordDTO;
import com.wordcheck.service.PointService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

/**
 * 积分控制器
 */
@RestController
@RequestMapping("/points")
@Tag(name = "积分", description = "用户积分相关接口")
@Slf4j
public class PointController {

    @Autowired
    private PointService pointService;

    /**
     * 获取用户积分信息
     *
     * @param request HTTP请求
     * @return 用户积分信息
     */
    @GetMapping("")
    @Operation(summary = "获取用户积分信息")
    public ApiResponse<PointsDTO> getUserPoints(HttpServletRequest request) {
        try {
            Integer userId = (Integer) request.getAttribute("userId");
            
            if (userId == null) {
                return ApiResponse.error(401, "未登录或登录已过期");
            }
            
            PointsDTO points = pointService.getUserPointsDTO(userId);
            return ApiResponse.success(points);
        } catch (Exception e) {
            log.error("获取用户积分信息失败", e);
            return ApiResponse.error(500, "获取用户积分信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取用户积分记录
     *
     * @param request HTTP请求
     * @param page 页码
     * @param pageSize 每页记录数
     * @param type 记录类型，可选值：all-全部，earn-获取，spend-消费
     * @return 积分记录
     */
    @GetMapping("/records")
    @Operation(summary = "获取用户积分记录")
    public ApiResponse<PointsRecordDTO> getPointsRecords(
            HttpServletRequest request,
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页记录数") @RequestParam(defaultValue = "10") int pageSize,
            @Parameter(description = "类型:all,earn,spend") @RequestParam(defaultValue = "all") String type
    ) {
        try {
            Integer userId = (Integer) request.getAttribute("userId");
            
            if (userId == null) {
                return ApiResponse.error(401, "未登录或登录已过期");
            }
            
            // 验证参数
            if (page < 1) {
                return ApiResponse.error(400, "页码必须大于0");
            }
            
            if (pageSize < 1 || pageSize > 100) {
                return ApiResponse.error(400, "每页记录数必须在1-100之间");
            }
            
            PointsRecordDTO records = pointService.getPointsRecords(userId, page, pageSize, type);
            return ApiResponse.success(records);
        } catch (Exception e) {
            log.error("获取用户积分记录失败", e);
            return ApiResponse.error(500, "获取用户积分记录失败: " + e.getMessage());
        }
    }
    
    /**
     * 兼容旧版API路径 - 获取用户积分信息
     * 前端仍在使用/point/info路径，添加此方法以保持兼容
     */
    @GetMapping("/point/info")
    @Operation(summary = "获取用户积分信息(兼容旧版)")
    public ApiResponse<PointsDTO> getUserPointsLegacy(HttpServletRequest request) {
        return getUserPoints(request);
    }
    
    /**
     * 扣减用户积分
     *
     * @param request HTTP请求
     * @param params 请求参数
     * @return 扣减结果
     */
    @PostMapping("/deduct")
    @Operation(summary = "扣减用户积分")
    public ApiResponse<PointsDTO> deductPoints(
            HttpServletRequest request,
            @RequestBody(required = true) java.util.Map<String, Object> params
    ) {
        try {
            Integer userId = (Integer) request.getAttribute("userId");
            
            if (userId == null) {
                return ApiResponse.error(401, "未登录或登录已过期");
            }
            
            // 获取参数
            Integer points = null;
            String reason = null;
            
            if (params.containsKey("points")) {
                try {
                    points = Integer.parseInt(params.get("points").toString());
                } catch (NumberFormatException e) {
                    return ApiResponse.error(400, "积分数量必须是整数");
                }
            }
            
            if (params.containsKey("reason")) {
                reason = params.get("reason").toString();
            }
            
            // 验证参数
            if (points == null || points <= 0) {
                return ApiResponse.error(400, "扣减积分数量必须大于0");
            }
            
            if (reason == null || reason.trim().isEmpty()) {
                reason = "消费";
            }
            
            // 调用服务扣减积分
            PointsDTO result = pointService.deductPoints(userId, points, reason);
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("扣减用户积分失败", e);
            return ApiResponse.error(500, "扣减用户积分失败: " + e.getMessage());
        }
    }
} 