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
            
            // 调用微信登录服务
            LoginResponseDTO response = userService.wxLogin(code);
            
            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("微信登录失败", e);
            return ApiResponse.error(500, "登录失败：" + e.getMessage());
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