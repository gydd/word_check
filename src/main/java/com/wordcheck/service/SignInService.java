package com.wordcheck.service;

import com.wordcheck.model.dto.SignInResponseDTO;
import com.wordcheck.model.dto.SignInStatusDTO;

/**
 * 签到服务接口
 */
public interface SignInService {
    
    /**
     * 用户签到
     *
     * @param userId 用户ID
     * @return 签到结果
     */
    SignInResponseDTO signIn(Integer userId);
    
    /**
     * 获取用户签到状态
     *
     * @param userId 用户ID
     * @return 签到状态
     */
    SignInStatusDTO getSignInStatus(Integer userId);
} 