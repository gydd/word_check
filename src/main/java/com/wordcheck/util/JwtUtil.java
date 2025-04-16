package com.wordcheck.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT工具类
 * 用于生成和验证JWT令牌
 */
@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;
    
    // 用于签名的密钥
    private byte[] getSigningKey() {
        return Base64.getEncoder().encode(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 从令牌中获取用户ID
     *
     * @param token 令牌
     * @return 用户ID
     */
    public Integer getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return Integer.valueOf(claims.getSubject());
    }

    /**
     * 从请求中获取用户ID
     *
     * @param request HTTP请求
     * @return 用户ID，如果未登录则返回null
     */
    public Integer getUserIdFromRequest(HttpServletRequest request) {
        // 首先尝试从请求属性中获取（这通常是由拦截器设置的）
        Object userIdAttr = request.getAttribute("userId");
        if (userIdAttr != null) {
            return (Integer) userIdAttr;
        }
        
        // 如果属性中没有，则尝试从请求头中获取token并解析
        String token = request.getHeader("Authorization");
        if (!StringUtils.hasText(token)) {
            log.warn("请求头中缺少Authorization");
            return null;
        }
        
        // 检查token格式并去除Bearer前缀
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        try {
            return validateTokenAndGetUserId(token);
        } catch (Exception e) {
            log.error("JWT验证失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 获取token的过期时间
     *
     * @param token 令牌
     * @return 过期时间
     */
    public Date getExpirationDateFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.getExpiration();
    }

    /**
     * 验证令牌并获取用户ID
     *
     * @param token 令牌
     * @return 用户ID
     */
    public Integer validateTokenAndGetUserId(String token) {
        if (isTokenExpired(token)) {
            throw new IllegalArgumentException("令牌已过期");
        }
        return getUserIdFromToken(token);
    }

    /**
     * 判断令牌是否过期
     *
     * @param token 令牌
     * @return 是否过期
     */
    private Boolean isTokenExpired(String token) {
        Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    /**
     * 生成令牌
     *
     * @param userId 用户ID
     * @return 令牌
     */
    public String generateToken(Integer userId) {
        Map<String, Object> claims = new HashMap<>();
        return doGenerateToken(claims, userId.toString());
    }

    /**
     * 从令牌中获取数据声明
     *
     * @param token 令牌
     * @return 数据声明
     */
    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(getSigningKey())
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 生成令牌
     *
     * @param claims 数据声明
     * @param subject 主题
     * @return 令牌
     */
    private String doGenerateToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + expiration * 1000);
        
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expirationDate)
                .signWith(SignatureAlgorithm.HS512, getSigningKey())
                .compact();
    }
} 