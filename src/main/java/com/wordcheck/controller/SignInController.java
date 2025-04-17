package com.wordcheck.controller;

import com.wordcheck.common.ApiResponse;
import com.wordcheck.model.dto.SignInResponseDTO;
import com.wordcheck.model.dto.SignInStatusDTO;
import com.wordcheck.service.SignInService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

/**
 * 签到控制器
 */
@RestController
@RequestMapping("/sign-in")
@Tag(name = "签到", description = "用户签到相关接口")
@Slf4j
public class SignInController {

    @Autowired
    private SignInService signInService;

    /**
     * 用户签到
     *
     * @param request HTTP请求
     * @return 签到结果
     */
    @PostMapping("")
    @Operation(summary = "用户签到")
    public ApiResponse<SignInResponseDTO> signIn(HttpServletRequest request) {
        try {
            Integer userId = (Integer) request.getAttribute("userId");
            
            if (userId == null) {
                return ApiResponse.error(401, "未登录或登录已过期");
            }
            
            SignInResponseDTO response = signInService.signIn(userId);
            return ApiResponse.success(response);
        } catch (IllegalStateException e) {
            // 处理重复签到的情况
            log.warn("用户重复签到: {}", e.getMessage());
            return ApiResponse.error(4001, e.getMessage());
        } catch (Exception e) {
            log.error("签到失败", e);
            return ApiResponse.error(500, "签到失败: " + e.getMessage());
        }
    }

    /**
     * 获取签到状态
     *
     * @param request HTTP请求
     * @return 签到状态
     */
    @GetMapping("/status")
    @Operation(summary = "获取签到状态")
    public ApiResponse<SignInStatusDTO> getSignInStatus(HttpServletRequest request) {
        try {
            Integer userId = (Integer) request.getAttribute("userId");
            
            if (userId == null) {
                return ApiResponse.error(401, "未登录或登录已过期");
            }
            
            SignInStatusDTO status = signInService.getSignInStatus(userId);
            return ApiResponse.success(status);
        } catch (Exception e) {
            log.error("获取签到状态失败", e);
            return ApiResponse.error(500, "获取签到状态失败: " + e.getMessage());
        }
    }
} 