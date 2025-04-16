package com.wordcheck.util;

import com.wordcheck.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * JWT拦截器
 * 用于验证请求头中的JWT令牌
 */
@Slf4j
@Component
public class JwtInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 处理请求前执行
     * 验证请求头中的JWT令牌
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String requestPath = request.getRequestURI();
        log.info("拦截请求: {}, 方法: {}", requestPath, request.getMethod());
        
        // 先检查是否有特殊标记请求头，用于跳过验证
        String skipAuth = request.getHeader("X-Skip-Auth");
        log.info("X-Skip-Auth头: {}", skipAuth);
        
        if (skipAuth != null && skipAuth.equals("true")) {
            log.info("检测到跳过验证请求头，绕过JWT验证");
            return true;
        }
        
        // 从请求头中获取token
        String token = request.getHeader("Authorization");
        log.info("Authorization头: {}", token);
        
        // 如果请求头中没有token
        if (!StringUtils.hasText(token)) {
            log.warn("缺少Authorization请求头");
            throw new UnauthorizedException("请求未授权");
        }
        
        // 如果token不是以Bearer开头
        if (!token.startsWith("Bearer ")) {
            log.warn("Authorization格式错误: {}", token);
            throw new UnauthorizedException("令牌格式错误");
        }
        
        // 截取Bearer后的token
        token = token.substring(7);
        
        try {
            // 验证token并从中提取userId
            Integer userId = jwtUtil.validateTokenAndGetUserId(token);
            // 将userId存入请求属性，供后续使用
            request.setAttribute("userId", userId);
            return true;
        } catch (Exception e) {
            log.error("JWT验证失败: {}", e.getMessage());
            throw new UnauthorizedException("令牌无效或已过期");
        }
    }
} 