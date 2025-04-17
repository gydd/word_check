package com.wordcheck.controller;

import com.wordcheck.common.ApiResponse;
import com.wordcheck.model.dto.UserInfoDTO;
import com.wordcheck.service.UserService;
import com.wordcheck.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * 用户控制器
 * 处理用户信息相关的接口
 */
@RestController
@RequestMapping("/user")
@Tag(name = "用户信息", description = "用户信息相关接口")
@Slf4j
public class UserController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 获取用户信息接口
     * 
     * @param request HTTP请求，用于获取用户Token
     * @return 用户信息
     */
    @GetMapping
    @Operation(summary = "获取用户信息", security = {@SecurityRequirement(name = "Authorization")})
    public ApiResponse<UserInfoDTO> getUserInfo(HttpServletRequest request) {
        try {
            // 从请求中获取用户ID
            Integer userId = jwtUtil.getUserIdFromRequest(request);
            if (userId == null) {
                return ApiResponse.error(401, "未登录或登录已过期");
            }
            
            log.info("获取用户信息请求，用户ID: {}", userId);
            
            // 调用用户服务获取用户信息
            UserInfoDTO userInfo = userService.getUserInfo(userId);
            
            return ApiResponse.success(userInfo);
        } catch (Exception e) {
            log.error("获取用户信息失败", e);
            return ApiResponse.error(500, "获取用户信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 兼容旧路径的获取用户信息接口
     * 
     * @param request HTTP请求，用于获取用户Token
     * @return 用户信息
     */
    @GetMapping("/info")
    @Operation(summary = "获取用户信息(兼容旧路径)", security = {@SecurityRequirement(name = "Authorization")})
    public ApiResponse<UserInfoDTO> getUserInfoBackwardCompatible(HttpServletRequest request) {
        log.info("通过旧路径/info访问用户信息");
        return getUserInfo(request);
    }
    
    /**
     * 更新用户信息接口
     *
     * @param request HTTP请求，用于获取用户Token
     * @param params 包含nickname、avatarUrl和gender的参数
     * @return 更新后的用户信息
     */
    @PutMapping
    @Operation(summary = "更新用户信息", security = {@SecurityRequirement(name = "Authorization")})
    public ApiResponse<UserInfoDTO> updateUserInfo(HttpServletRequest request, @RequestBody Map<String, Object> params) {
        try {
            // 从请求中获取用户ID
            Integer userId = jwtUtil.getUserIdFromRequest(request);
            if (userId == null) {
                return ApiResponse.error(401, "未登录或登录已过期");
            }
            
            String nickname = params.get("nickname") != null ? params.get("nickname").toString() : null;
            String avatarUrl = params.get("avatarUrl") != null ? params.get("avatarUrl").toString() : null;
            Integer gender = params.get("gender") != null ? Integer.valueOf(params.get("gender").toString()) : null;
            
            log.info("更新用户信息请求，用户ID: {}, 昵称: {}, 性别: {}", userId, nickname, gender);
            
            // 调用用户服务更新用户信息
            UserInfoDTO userInfo = userService.updateUserInfo(userId, nickname, avatarUrl, gender);
            
            return ApiResponse.success(userInfo);
        } catch (Exception e) {
            log.error("更新用户信息失败", e);
            return ApiResponse.error(500, "更新用户信息失败: " + e.getMessage());
        }
    }
    
    /**
     * 绑定手机号接口
     *
     * @param request HTTP请求，用于获取用户Token
     * @param params 包含phone的参数
     * @return 更新后的用户信息
     */
    @PostMapping("/bind-phone")
    @Operation(summary = "绑定手机号", security = {@SecurityRequirement(name = "Authorization")})
    public ApiResponse<UserInfoDTO> bindPhone(HttpServletRequest request, @RequestBody Map<String, String> params) {
        try {
            // 从请求中获取用户ID
            Integer userId = jwtUtil.getUserIdFromRequest(request);
            if (userId == null) {
                return ApiResponse.error(401, "未登录或登录已过期");
            }
            
            String phone = params.get("phone");
            if (phone == null || phone.isEmpty()) {
                return ApiResponse.error(400, "手机号不能为空");
            }
            
            log.info("绑定手机号请求，用户ID: {}, 手机号: {}", userId, phone);
            
            // 调用用户服务绑定手机号
            UserInfoDTO userInfo = userService.bindPhone(userId, phone);
            
            return ApiResponse.success(userInfo);
        } catch (Exception e) {
            log.error("绑定手机号失败", e);
            return ApiResponse.error(500, "绑定手机号失败: " + e.getMessage());
        }
    }
} 