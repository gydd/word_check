package com.wordcheck.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;

/**
 * 用户工具类
 * 提供用户相关的工具方法
 */
@Component
public class UserUtil {
    
    private static final Logger logger = LoggerFactory.getLogger(UserUtil.class);
    
    private static JwtUtil jwtUtil;
    
    @Autowired
    public void setJwtUtil(JwtUtil jwtUtil) {
        UserUtil.jwtUtil = jwtUtil;
    }
    
    /**
     * 从请求中获取用户ID
     *
     * @param request HTTP请求
     * @return 用户ID，如果获取失败则返回null
     */
    public static Integer getUserId(HttpServletRequest request) {
        // 优先从请求属性中获取（可能已被JwtInterceptor设置）
        Object userIdAttribute = request.getAttribute("userId");
        if (userIdAttribute != null) {
            return (Integer) userIdAttribute;
        }
        
        // 从请求头中获取auth令牌
        String token = request.getHeader("auth");
        if (!StringUtils.hasText(token)) {
            logger.warn("请求头中缺少auth令牌");
            return null;
        }
        
        try {
            // 移除Bearer前缀（如果有）
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            // 使用JwtUtil解析令牌获取用户ID
            return jwtUtil.validateTokenAndGetUserId(token);
        } catch (Exception e) {
            logger.error("从令牌中解析用户ID失败", e);
            return null;
        }
    }
    
    /**
     * 从请求中获取用户ID，如果获取失败则抛出异常
     *
     * @param request HTTP请求
     * @return 用户ID
     * @throws RuntimeException 如果无法获取用户ID
     */
    public static Integer getUserIdOrThrow(HttpServletRequest request) {
        Integer userId = getUserId(request);
        if (userId == null) {
            throw new RuntimeException("未授权的访问，无法获取用户ID");
        }
        return userId;
    }
}