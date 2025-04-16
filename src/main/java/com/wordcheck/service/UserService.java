package com.wordcheck.service;

import com.wordcheck.model.dto.LoginResponseDTO;
import com.wordcheck.model.dto.UserInfoDTO;
import com.wordcheck.model.User;

/**
 * 用户服务接口
 */
public interface UserService {
    
    /**
     * 微信登录
     *
     * @param code 微信授权码
     * @return 登录响应信息
     */
    LoginResponseDTO wxLogin(String code);
    
    /**
     * 手机号登录
     *
     * @param code 微信授权码
     * @param encryptedData 加密数据
     * @param iv 初始向量
     * @return 登录响应信息
     */
    LoginResponseDTO phoneLogin(String code, String encryptedData, String iv);
    
    /**
     * 获取用户信息
     *
     * @param userId 用户ID
     * @return 用户信息
     */
    UserInfoDTO getUserInfo(Integer userId);
    
    /**
     * 更新用户信息
     *
     * @param userId 用户ID
     * @param nickname 昵称
     * @param avatarUrl 头像URL
     * @param gender 性别
     * @return 更新后的用户信息
     */
    UserInfoDTO updateUserInfo(Integer userId, String nickname, String avatarUrl, Integer gender);
    
    /**
     * 绑定手机号
     *
     * @param userId 用户ID
     * @param phone 手机号
     * @return 更新后的用户信息
     */
    UserInfoDTO bindPhone(Integer userId, String phone);
    
    /**
     * 通过ID查找用户
     *
     * @param id 用户ID
     * @return 用户对象
     */
    User findById(Integer id);
} 