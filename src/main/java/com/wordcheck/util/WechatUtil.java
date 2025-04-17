package com.wordcheck.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.Base64Utils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.ResourceAccessException;

import javax.annotation.PostConstruct;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.Security;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 微信工具类，用于处理微信相关API操作
 */
@Component
public class WechatUtil {
    private static final Logger logger = LoggerFactory.getLogger(WechatUtil.class);
    
    // 错误码常量
    private static final int ERROR_CODE_BEEN_USED = 40163;  // 授权码已被使用
    
    // 用于缓存已使用过的code，防止重复请求
    private final Map<String, Long> usedCodes = new ConcurrentHashMap<>();
    
    @Value("${weixin.appid}")
    private String appId;
    
    @Value("${weixin.secret}")
    private String appSecret;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public WechatUtil() {
        // 创建带有超时设置的RestTemplate
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        // 设置读取超时为10秒
        requestFactory.setReadTimeout(10000);
        // 设置连接超时为10秒
        requestFactory.setConnectTimeout(10000);
        
        this.restTemplate = new RestTemplate(requestFactory);
        this.objectMapper = new ObjectMapper();
        // 初始化BouncyCastle
        Security.addProvider(new BouncyCastleProvider());
    }
    
    /**
     * 获取微信session_key和openid
     * 
     * @param jsCode 前端登录时获取的code
     * @return 包含session_key和openid的Map
     */
    public Map<String, Object> getSessionKey(String jsCode) {
        try {
            // 首先检查code是否已经使用过
            if (usedCodes.containsKey(jsCode)) {
                logger.warn("微信授权码已被使用，code: {}", jsCode);
                throw new RuntimeException("登录凭证已失效，请重新点击登录按钮");
            }
            
            String url = "https://api.weixin.qq.com/sns/jscode2session?appid=" + appId
                    + "&secret=" + appSecret + "&js_code=" + jsCode + "&grant_type=authorization_code";
            
            logger.info("正在请求微信API: {}", url);
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            String responseBody = response.getBody();
            
            logger.info("微信登录返回: {}", responseBody);
            
            // 解析响应JSON
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(responseBody, HashMap.class);
            
            // 检查是否有错误码
            if (result.containsKey("errcode")) {
                Number errorCode = (Number) result.get("errcode");
                String errorMsg = (String) result.get("errmsg");
                
                // 特殊处理授权码已使用的情况
                if (errorCode.intValue() == ERROR_CODE_BEEN_USED) {
                    logger.error("微信授权码已被使用: {}", result);
                    // 将已使用的code缓存起来，记录当前时间
                    usedCodes.put(jsCode, System.currentTimeMillis());
                    throw new RuntimeException("登录凭证已失效，请重新点击登录按钮");
                }
                
                if (!errorCode.equals(0)) {
                    logger.error("微信API返回错误: {}", result);
                    throw new RuntimeException("微信登录失败: " + errorMsg);
                }
            }
            
            // 登录成功，将code标记为已使用
            usedCodes.put(jsCode, System.currentTimeMillis());
            return result;
        } catch (ResourceAccessException e) {
            logger.error("调用微信登录API超时", e);
            throw new RuntimeException("微信服务器请求超时，请稍后重试", e);
        } catch (Exception e) {
            // 如果是我们自定义的错误消息，直接抛出
            if (e instanceof RuntimeException && e.getMessage() != null && 
                e.getMessage().contains("登录凭证已失效")) {
            }
            logger.error("调用微信登录API失败", e);
            throw new RuntimeException("微信登录失败", e);
        }
    }
    
    /**
     * 清理过期的已使用code缓存
     * 微信授权码通常有5分钟的有效期，过期后可以从缓存中移除
     */
    public void cleanExpiredCodes() {
        long now = System.currentTimeMillis();
        long expirationTime = 5 * 60 * 1000; // 5分钟
        
        usedCodes.entrySet().removeIf(entry -> (now - entry.getValue()) > expirationTime);
    }
    
    /**
     * 解密微信加密的电话号码数据
     *
     * @param encryptedData 加密数据
     * @param sessionKey    会话密钥
     * @param iv            加密算法的初始向量
     * @return 解密后的数据
     */
    public Map<String, Object> decryptPhoneNumber(String encryptedData, String sessionKey, String iv) {
        try {
            byte[] keyBytes = Base64Utils.decodeFromString(sessionKey);
            byte[] ivBytes = Base64Utils.decodeFromString(iv);
            byte[] encryptedBytes = Base64Utils.decodeFromString(encryptedData);
            
            // 设置解密参数
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS7Padding", "BC");
            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
            AlgorithmParameters params = AlgorithmParameters.getInstance("AES");
            params.init(new IvParameterSpec(ivBytes));
            
            // 执行解密
            cipher.init(Cipher.DECRYPT_MODE, keySpec, params);
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            String decryptedText = new String(decryptedBytes, StandardCharsets.UTF_8);
            
            logger.info("解密电话号码成功，结果: {}", decryptedText);
            
            // 解析解密后的JSON
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(decryptedText, HashMap.class);
            return result;
        } catch (Exception e) {
            logger.error("解密手机号数据失败", e);
            throw new RuntimeException("解密手机号失败", e);
        }
    }
} 