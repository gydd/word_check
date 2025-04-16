package com.wordcheck.controller;

import com.wordcheck.common.ApiResponse;
import com.wordcheck.model.dto.LoginResponseDTO;
import com.wordcheck.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * 认证控制器
 * 处理登录、认证相关的接口
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "用户认证", description = "用户登录和认证相关接口")
@Slf4j
public class AuthController {

    @Autowired
    private UserService userService;

    /**
     * 微信登录接口
     *
     * @param params 包含微信授权code的参数
     * @return 登录结果，包含token和用户信息
     */
    @PostMapping("/wx-login")
    @Operation(summary = "微信登录")
    public ApiResponse<LoginResponseDTO> wxLogin(@RequestBody Map<String, String> params) {
        try {
            String code = params.get("code");
            
            if (code == null || code.isEmpty()) {
                return ApiResponse.error(400, "缺少微信授权码");
            }
            
            // 记录开始时间，用于监控处理时间
            long startTime = System.currentTimeMillis();
            log.info("开始处理微信登录请求，code: {}", code);
            
            // 调用微信登录服务
            LoginResponseDTO response = userService.wxLogin(code);
            
            // 计算处理时间并记录
            long endTime = System.currentTimeMillis();
            log.info("完成微信登录请求处理，耗时: {}ms", (endTime - startTime));
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("微信登录失败", e);
            
            // 区分不同类型的错误，提供更精确的错误信息
            String errorMessage;
            int errorCode = 500;
            
            if (e.getMessage() != null && e.getMessage().contains("超时")) {
                errorMessage = "服务器请求超时，请稍后重试";
                errorCode = 504; // Gateway Timeout
            } else if (e.getMessage() != null && e.getMessage().contains("令牌生成错误")) {
                errorMessage = "登录授权失败，请重试";
                errorCode = 500;
            } else if (e.getCause() instanceof java.net.SocketTimeoutException) {
                errorMessage = "服务器响应超时，请稍后重试";
                errorCode = 504; // Gateway Timeout
            } else {
                errorMessage = "登录失败：" + e.getMessage();
            }
            
            return ApiResponse.error(errorCode, errorMessage);
        }
    }
    
    /**
     * 手机号登录接口
     *
     * @param params 包含code、encryptedData和iv的参数
     * @return 登录结果，包含token和用户信息
     */
    @PostMapping("/phone-login")
    @Operation(summary = "手机号登录")
    public ApiResponse<LoginResponseDTO> phoneLogin(@RequestBody Map<String, String> params) {
        try {
            String code = params.get("code");
            String encryptedData = params.get("encryptedData");
            String iv = params.get("iv");
            
            if (code == null || code.isEmpty()) {
                return ApiResponse.error(400, "缺少微信授权码");
            }
            
            if (encryptedData == null || encryptedData.isEmpty()) {
                return ApiResponse.error(400, "缺少加密数据");
            }
            
            if (iv == null || iv.isEmpty()) {
                return ApiResponse.error(400, "缺少初始向量");
            }
            
            // 调用手机号登录服务
            LoginResponseDTO response = userService.phoneLogin(code, encryptedData, iv);
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("手机号登录失败", e);
            return ApiResponse.error(500, "登录失败：" + e.getMessage());
        }
    }
} 