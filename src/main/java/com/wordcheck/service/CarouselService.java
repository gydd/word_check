package com.wordcheck.service;

import com.wordcheck.model.Carousel;

import java.util.List;

/**
 * 轮播图服务接口
 */
public interface CarouselService {
    
    /**
     * 获取所有启用状态的轮播图
     * @return 轮播图列表
     */
    List<Carousel> getActiveCarousels();
    
    /**
     * 根据ID获取轮播图
     * @param id 轮播图ID
     * @return 轮播图信息
     */
    Carousel getCarouselById(Long id);
    
    /**
     * 获取所有轮播图
     * @return 轮播图列表
     */
    List<Carousel> getAllCarousels();
    
    /**
     * 记录轮播图查看
     * @param id 轮播图ID
     * @return 是否成功
     */
    boolean recordView(Long id);
    
    /**
     * 记录轮播图点击
     * @param id 轮播图ID
     * @return 是否成功
     */
    boolean recordClick(Long id);
} 