package com.wordcheck.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 数据初始化工具类
 * 在应用启动时执行，初始化必要的数据
 */
@Slf4j
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    public void run(String... args) throws Exception {
        log.info("开始执行数据初始化...");
        
        try {
            // 初始化轮播图数据
            initCarouselData(jdbcTemplate);
            
            log.info("数据初始化完成");
        } catch (Exception e) {
            log.error("数据初始化过程中发生错误", e);
        }
    }
    
    /**
     * 检查轮播图数据初始化
     */
    private void initCarouselData(JdbcTemplate jdbcTemplate) {
        log.info("检查轮播图数据...");
        Integer count = null;
        
        try {
            count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM t_carousel", Integer.class);
        } catch (Exception e) {
            log.warn("查询轮播图数据失败，可能表不存在", e);
            return;
        }
        
        if (count == null || count == 0) {
            log.info("初始化轮播图数据...");
            
            try {
                // 修复图片路径
                jdbcTemplate.update("UPDATE t_carousel SET image_url = ? WHERE image_url = ?", 
                    "/static/images/cat_banner.png", "/static/images/cat_banner.jpg");
                    
                // 如果没有数据，插入默认数据
                if (count == 0) {
                    jdbcTemplate.update(
                        "INSERT INTO t_carousel(image_url, title, description, link_type, link_url, sort, status) VALUES(?, ?, ?, ?, ?, ?, ?)",
                        "/static/images/cat_banner.png", "单词检查服务", "高效准确的英语单词纠错", "page", "/pages/upload/upload", 1, 1
                    );
                    
                    jdbcTemplate.update(
                        "INSERT INTO t_carousel(image_url, title, description, link_type, link_url, sort, status) VALUES(?, ?, ?, ?, ?, ?, ?)",
                        "/static/images/banner1.jpg", "积分奖励活动", "每日签到获取积分", "page", "/pages/points/points", 2, 1
                    );
                    
                    jdbcTemplate.update(
                        "INSERT INTO t_carousel(image_url, title, description, link_type, link_url, sort, status) VALUES(?, ?, ?, ?, ?, ?, ?)",
                        "/static/images/banner2.jpg", "历史记录查询", "查看你的检查记录", "page", "/pages/result/result", 3, 1
                    );
                }
                
                log.info("轮播图数据初始化完成");
            } catch (Exception e) {
                log.error("初始化轮播图数据失败", e);
            }
        } else {
            log.info("轮播图数据已存在({}条)，尝试修复图片路径", count);
            try {
                int updated = jdbcTemplate.update("UPDATE t_carousel SET image_url = ? WHERE image_url = ?", 
                    "/static/images/cat_banner.png", "/static/images/cat_banner.jpg");
                log.info("修复了{}条轮播图数据的图片路径", updated);
            } catch (Exception e) {
                log.error("修复轮播图图片路径失败", e);
            }
        }
    }
} 