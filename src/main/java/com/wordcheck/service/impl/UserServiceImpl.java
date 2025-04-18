package com.wordcheck.service.impl;

import com.wordcheck.mapper.UserMapper;
import com.wordcheck.model.User;
import com.wordcheck.model.dto.LoginResponseDTO;
import com.wordcheck.model.dto.UserInfoDTO;
import com.wordcheck.service.PointService;
import com.wordcheck.service.UserService;
import com.wordcheck.util.JwtUtil;
import com.wordcheck.util.WechatUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 用户服务实现类
 */
@Slf4j
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private PointService pointService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private WechatUtil wechatUtil;
    
    @Value("${weixin.appid}")
    private String appId;
    
    @Value("${weixin.secret}")
    private String appSecret;

    /**
     * 微信登录
     *
     * @param code 微信授权码
     * @return 登录响应信息
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginResponseDTO wxLogin(String code) {
        log.info("微信登录，code: {}", code);
        
        // 1. 调用微信API获取openid和session_key
        Map<String, Object> wxResult = wechatUtil.getSessionKey(code);
        String openid = (String) wxResult.get("openid");
        String sessionKey = (String) wxResult.get("session_key");
        
        if (openid == null || openid.isEmpty()) {
            log.error("获取微信openid失败");
            throw new RuntimeException("获取微信openid失败");
        }
        
        // 2. 查询用户是否已存在
        User user = userMapper.findByOpenid(openid);
        
        // 3. 用户不存在则创建新用户
        if (user == null) {
            user = createNewUser(openid);
            // 初始化用户积分
            pointService.initUserPoints(user.getId());
        }
        
        // 4. 生成JWT令牌
        String token;
        try {
            token = jwtUtil.generateToken(user.getId());
        } catch (Exception e) {
            log.error("生成JWT令牌失败", e);
            throw new RuntimeException("登录失败：令牌生成错误");
        }
        
        // 5. 构建返回对象
        LoginResponseDTO response = new LoginResponseDTO();
        response.setToken(token);
        response.setUser(user);
        
        log.info("用户 {} 登录成功", user.getId());
        
        return response;
    }
    
    /**
     * 手机号登录
     *
     * @param code 微信授权码
     * @param encryptedData 加密数据
     * @param iv 初始向量
     * @return 登录响应信息
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginResponseDTO phoneLogin(String code, String encryptedData, String iv) {
        log.info("手机号登录，code: {}", code);
        
        // 1. 调用微信API获取openid和session_key
        Map<String, Object> wxResult = wechatUtil.getSessionKey(code);
        String openid = (String) wxResult.get("openid");
        String sessionKey = (String) wxResult.get("session_key");
        
        if (openid == null || openid.isEmpty() || sessionKey == null || sessionKey.isEmpty()) {
            log.error("获取微信openid或session_key失败");
            throw new RuntimeException("获取微信登录凭证失败");
        }
        
        // 2. 解密手机号
        Map<String, Object> phoneInfo = wechatUtil.decryptPhoneNumber(encryptedData, sessionKey, iv);
        String phoneNumber = (String) phoneInfo.get("phoneNumber");
        
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            log.error("解密手机号失败");
            throw new RuntimeException("获取手机号失败");
        }
        
        // 3. 查询用户是否已存在
        User user = userMapper.findByOpenid(openid);
        
        // 4. 用户不存在则创建新用户
        if (user == null) {
            user = createNewUser(openid);
            // 初始化用户积分
            pointService.initUserPoints(user.getId());
        }
        
        // 5. 更新手机号
        user.setPhone(phoneNumber);
        userMapper.update(user);
        
        // 6. 生成JWT令牌
        String token = jwtUtil.generateToken(user.getId());
        
        // 7. 构建返回对象
        LoginResponseDTO response = new LoginResponseDTO();
        response.setToken(token);
        response.setUser(user);
        
        log.info("用户 {} 通过手机号登录成功", user.getId());
        
        return response;
    }

    /**
     * 获取用户信息
     *
     * @param userId 用户ID
     * @return 用户信息
     */
    @Override
    public UserInfoDTO getUserInfo(Integer userId) {
        log.info("获取用户信息，userId: {}", userId);
        
        User user = userMapper.findById(userId);
        if (user == null) {
            log.error("用户不存在，userId: {}", userId);
            throw new RuntimeException("用户不存在");
        }
        
        UserInfoDTO userInfo = new UserInfoDTO();
        userInfo.setId(user.getId());
        userInfo.setNickname(user.getNickname());
        userInfo.setAvatarUrl(user.getAvatarUrl());
        userInfo.setGender(user.getGender());
        userInfo.setPhone(user.getPhone());
        
        return userInfo;
    }

    /**
     * 更新用户信息
     *
     * @param userId 用户ID
     * @param nickname 昵称
     * @param avatarUrl 头像URL
     * @param gender 性别
     * @return 更新后的用户信息
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserInfoDTO updateUserInfo(Integer userId, String nickname, String avatarUrl, Integer gender) {
        log.info("更新用户信息，userId: {}, nickname: {}, gender: {}", userId, nickname, gender);
        
        User user = userMapper.findById(userId);
        if (user == null) {
            log.error("用户不存在，userId: {}", userId);
            throw new RuntimeException("用户不存在");
        }
        
        // 更新用户信息
        if (nickname != null && !nickname.isEmpty()) {
            user.setNickname(nickname);
        }
        
        if (avatarUrl != null && !avatarUrl.isEmpty()) {
            user.setAvatarUrl(avatarUrl);
        }
        
        if (gender != null) {
            user.setGender(gender);
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        
        // 构建返回对象
        UserInfoDTO userInfo = new UserInfoDTO();
        userInfo.setId(user.getId());
        userInfo.setNickname(user.getNickname());
        userInfo.setAvatarUrl(user.getAvatarUrl());
        userInfo.setGender(user.getGender());
        userInfo.setPhone(user.getPhone());
        
        return userInfo;
    }

    /**
     * 绑定手机号
     *
     * @param userId 用户ID
     * @param phone 手机号
     * @return 更新后的用户信息
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserInfoDTO bindPhone(Integer userId, String phone) {
        log.info("绑定手机号，userId: {}, phone: {}", userId, phone);
        
        User user = userMapper.findById(userId);
        if (user == null) {
            log.error("用户不存在，userId: {}", userId);
            throw new RuntimeException("用户不存在");
        }
        
        // 更新手机号
        user.setPhone(phone);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        
        // 构建返回对象
        UserInfoDTO userInfo = new UserInfoDTO();
        userInfo.setId(user.getId());
        userInfo.setNickname(user.getNickname());
        userInfo.setAvatarUrl(user.getAvatarUrl());
        userInfo.setGender(user.getGender());
        userInfo.setPhone(user.getPhone());
        
        return userInfo;
    }

    /**
     * 通过ID查找用户
     *
     * @param id 用户ID
     * @return 用户对象
     */
    @Override
    public User findById(Integer id) {
        return userMapper.findById(id);
    }
    
    /**
     * 创建新用户
     *
     * @param openid 微信openid
     * @return 新创建的用户
     */
    private User createNewUser(String openid) {
        log.info("创建新用户，openid: {}", openid);
        
        User user = new User();
        user.setOpenid(openid);
        user.setNickname("用户" + openid.substring(openid.length() - 6));
        user.setAvatarUrl("");
        user.setGender(0);
        user.setStatus(1);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        userMapper.insert(user);
        
        log.info("新用户创建成功，id: {}", user.getId());
        
        return user;
    }
} 