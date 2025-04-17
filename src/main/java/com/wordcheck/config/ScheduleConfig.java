package com.wordcheck.config;

import com.wordcheck.util.WechatUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * 定时任务配置类
 */
@Configuration
@EnableScheduling
public class ScheduleConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(ScheduleConfig.class);
    
    @Autowired
    private WechatUtil wechatUtil;
    
    /**
     * 定时清理过期的微信授权码缓存
     * 每5分钟执行一次
     */
    @Scheduled(fixedRate = 300000) // 5分钟 = 300000毫秒
    public void cleanExpiredWxCodes() {
        logger.info("开始清理过期的微信授权码缓存");
        wechatUtil.cleanExpiredCodes();
        logger.info("清理过期的微信授权码缓存完成");
    }
} 