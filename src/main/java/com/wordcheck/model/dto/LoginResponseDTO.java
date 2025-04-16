package com.wordcheck.model.dto;

import com.wordcheck.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应DTO
 * 包含登录成功后返回的token和用户信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {
    
    /**
     * 用户认证令牌
     */
    private String token;
    
    /**
     * 用户信息
     */
    private User user;
} 