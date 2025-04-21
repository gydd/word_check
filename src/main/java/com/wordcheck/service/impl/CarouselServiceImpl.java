package com.wordcheck.service.impl;

import com.wordcheck.mapper.CarouselMapper;
import com.wordcheck.model.Carousel;
import com.wordcheck.service.CarouselService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 轮播图服务实现类
 */
@Service
@Slf4j
public class CarouselServiceImpl implements CarouselService {
    
    @Autowired
    private CarouselMapper carouselMapper;
    
    // 简单内存缓存，生产环境建议替换为Redis
    private final ConcurrentHashMap<String, CacheEntry<List<Carousel>>> carouselCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, CacheEntry<Carousel>> carouselDetailCache = new ConcurrentHashMap<>();
    private static final long CACHE_EXPIRATION_MS = TimeUnit.MINUTES.toMillis(10); // 10分钟缓存
    
    /**
     * 获取所有启用状态的轮播图
     * 使用内存缓存，缓存有效期10分钟
     * @return 轮播图列表
     */
    @Override
    public List<Carousel> getActiveCarousels() {
        String cacheKey = "active_carousels";
        
        // 尝试从缓存获取
        CacheEntry<List<Carousel>> cacheEntry = carouselCache.get(cacheKey);
        if (cacheEntry != null && !cacheEntry.isExpired()) {
            log.debug("从缓存获取轮播图列表，缓存项数: {}", cacheEntry.getData().size());
            return cacheEntry.getData();
        }
        
        // 缓存不存在或已过期，从数据库获取
        List<Carousel> carousels;
        try {
            carousels = carouselMapper.selectActiveCarousels();
            // 更新缓存
            carouselCache.put(cacheKey, new CacheEntry<>(carousels));
            log.debug("更新轮播图列表缓存，项数: {}", carousels.size());
        } catch (Exception e) {
            log.error("获取轮播图列表失败", e);
            // 返回空列表而不是null
            carousels = Collections.emptyList();
        }
        
        return carousels;
    }
    
    /**
     * 根据ID获取轮播图
     * 使用内存缓存，缓存有效期10分钟
     * @param id 轮播图ID
     * @return 轮播图信息
     */
    @Override
    public Carousel getCarouselById(Long id) {
        if (id == null) {
            return null;
        }
        
        // 尝试从缓存获取
        CacheEntry<Carousel> cacheEntry = carouselDetailCache.get(id);
        if (cacheEntry != null && !cacheEntry.isExpired()) {
            log.debug("从缓存获取轮播图详情，ID: {}", id);
            return cacheEntry.getData();
        }
        
        // 缓存不存在或已过期，从数据库获取
        Carousel carousel;
        try {
            carousel = carouselMapper.selectById(id);
            // 只缓存非空结果
            if (carousel != null) {
                carouselDetailCache.put(id, new CacheEntry<>(carousel));
                log.debug("更新轮播图详情缓存，ID: {}", id);
            }
        } catch (Exception e) {
            log.error("获取轮播图详情失败，ID: {}", id, e);
            carousel = null;
        }
        
        return carousel;
    }
    
    /**
     * 获取所有轮播图
     * @return 轮播图列表
     */
    @Override
    public List<Carousel> getAllCarousels() {
        try {
            return carouselMapper.selectAll();
        } catch (Exception e) {
            log.error("获取所有轮播图失败", e);
            return Collections.emptyList();
        }
    }
    
    /**
     * 记录轮播图查看
     * @param id 轮播图ID
     * @return 是否成功
     */
    @Override
    public boolean recordView(Long id) {
        if (id == null) {
            return false;
        }
        
        try {
            // 异步更新查看次数，避免影响性能
            new Thread(() -> {
                try {
                    carouselMapper.incrementViewCount(id);
                    log.debug("更新轮播图查看次数成功，ID: {}", id);
                    
                    // 同时清除缓存
                    carouselDetailCache.remove(id);
                    carouselCache.remove("active_carousels");
                } catch (Exception e) {
                    log.error("更新轮播图查看次数失败，ID: {}", id, e);
                }
            }).start();
            
            return true;
        } catch (Exception e) {
            log.error("记录轮播图查看失败，ID: {}", id, e);
            return false;
        }
    }
    
    /**
     * 记录轮播图点击
     * @param id 轮播图ID
     * @return 是否成功
     */
    @Override
    public boolean recordClick(Long id) {
        if (id == null) {
            return false;
        }
        
        try {
            // 异步更新点击次数，避免影响性能
            new Thread(() -> {
                try {
                    carouselMapper.incrementClickCount(id);
                    log.debug("更新轮播图点击次数成功，ID: {}", id);
                    
                    // 同时清除缓存
                    carouselDetailCache.remove(id);
                    carouselCache.remove("active_carousels");
                } catch (Exception e) {
                    log.error("更新轮播图点击次数失败，ID: {}", id, e);
                }
            }).start();
            
            return true;
        } catch (Exception e) {
            log.error("记录轮播图点击失败，ID: {}", id, e);
            return false;
        }
    }
    
    /**
     * 缓存条目内部类
     * @param <T> 缓存数据类型
     */
    private static class CacheEntry<T> {
        private final T data;
        private final long createTime;
        
        public CacheEntry(T data) {
            this.data = data;
            this.createTime = System.currentTimeMillis();
        }
        
        public T getData() {
            return data;
        }
        
        public boolean isExpired() {
            return System.currentTimeMillis() - createTime > CACHE_EXPIRATION_MS;
        }
    }
} 