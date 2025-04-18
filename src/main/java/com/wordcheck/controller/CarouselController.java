package com.wordcheck.controller;

import com.wordcheck.common.ApiResponse;
import com.wordcheck.model.Carousel;
import com.wordcheck.service.CarouselService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 轮播图控制器
 */
@RestController
@RequestMapping("/carousels")
@Tag(name = "轮播图", description = "轮播图相关接口")
@Slf4j
public class CarouselController {
    
    @Autowired
    private CarouselService carouselService;
    
    /**
     * 获取所有启用状态的轮播图
     * @return 轮播图列表
     */
    @GetMapping("")
    @Operation(summary = "获取所有启用的轮播图")
    public ApiResponse<List<Carousel>> getCarousels() {
        try {
            log.info("获取轮播图列表");
            List<Carousel> carousels = carouselService.getActiveCarousels();
            return ApiResponse.success(carousels);
        } catch (Exception e) {
            log.error("获取轮播图列表失败", e);
            return ApiResponse.error(500, "获取轮播图列表失败: " + e.getMessage());
        }
    }
    
    /**
     * 根据ID获取轮播图详情
     * @param id 轮播图ID
     * @return 轮播图详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取轮播图")
    public ApiResponse<Carousel> getCarouselById(@PathVariable("id") Long id) {
        try {
            log.info("获取轮播图详情，ID: {}", id);
            Carousel carousel = carouselService.getCarouselById(id);
            if (carousel == null) {
                return ApiResponse.error(404, "轮播图不存在");
            }
            return ApiResponse.success(carousel);
        } catch (Exception e) {
            log.error("获取轮播图详情失败", e);
            return ApiResponse.error(500, "获取轮播图详情失败: " + e.getMessage());
        }
    }
} 