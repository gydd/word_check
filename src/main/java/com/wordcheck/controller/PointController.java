package com.wordcheck.controller;

import com.wordcheck.model.dto.PointsDTO;
import com.wordcheck.model.dto.PointsRecordDTO;
import com.wordcheck.service.PointService;
import com.wordcheck.util.JwtUtil;
import com.wordcheck.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

/**
 * 积分控制器
 */
@RestController
@RequestMapping("/api/v1/point")
@Tag(name = "积分管理", description = "积分相关接口")
@Slf4j
public class PointController {

    private static final Logger logger = LoggerFactory.getLogger(PointController.class);

    @Autowired
    private PointService pointService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 获取用户积分信息
     */
    @GetMapping("/info")
    @Operation(summary = "获取用户积分信息")
    public Result<PointsDTO> getUserPoints(HttpServletRequest request) {
        try {
            Integer userId = jwtUtil.getUserIdFromRequest(request);
            if (userId == null) {
                return Result.fail("未登录");
            }
            
            PointsDTO pointsDTO = pointService.getUserPointsDTO(userId);
            return Result.success(pointsDTO);
        } catch (Exception e) {
            logger.error("获取用户积分信息失败", e);
            return Result.fail("系统错误");
        }
    }
    
    /**
     * 获取积分记录
     */
    @GetMapping("/records")
    @Operation(summary = "获取用户积分记录")
    public Result<PointsRecordDTO> getPointsRecords(
            HttpServletRequest request,
            @RequestParam(value = "page", defaultValue = "1") Integer page,
            @RequestParam(value = "size", defaultValue = "10") Integer size,
            @RequestParam(value = "type", defaultValue = "all") String type) {
        try {
            Integer userId = jwtUtil.getUserIdFromRequest(request);
            if (userId == null) {
                return Result.fail("未登录");
            }
            PointsRecordDTO records = pointService.getPointsRecords(userId, page, size, type);
            return Result.success(records);
        } catch (Exception e) {
            logger.error("获取用户积分记录失败", e);
            return Result.fail("系统错误");
        }
    }
} 