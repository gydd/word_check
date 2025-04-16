package com.wordcheck.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.Base64Utils;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.Security;
import java.util.HashMap;
import java.util.Map;

/**
 * 微信工具类，用于处理微信相关API操作
 */
@Component
public class WechatUtil {
    private static final Logger logger = LoggerFactory.getLogger(WechatUtil.class);
    
    @Value("${weixin.appid}")
    private String appId;
    
    @Value("${weixin.secret}")
    private String appSecret;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public WechatUtil() {
        this.restTemplate = new RestTemplate();
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
            String url = "https://api.weixin.qq.com/sns/jscode2session?appid=" + appId
                    + "&secret=" + appSecret + "&js_code=" + jsCode + "&grant_type=authorization_code";
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            String responseBody = response.getBody();
            
            logger.info("微信登录返回: {}", responseBody);
            
            // 解析响应JSON
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(responseBody, HashMap.class);
            
            // 检查是否有错误码
            if (result.containsKey("errcode") && !result.get("errcode").equals(0)) {
                logger.error("微信API返回错误: {}", result);
                throw new RuntimeException("微信登录失败: " + result.get("errmsg"));
            }
            
            return result;
        } catch (Exception e) {
            logger.error("调用微信登录API失败", e);
            throw new RuntimeException("微信登录失败", e);
        }
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