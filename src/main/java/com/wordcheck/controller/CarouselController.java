package com.wordcheck.controller;

import com.wordcheck.common.ApiResponse;
import com.wordcheck.model.Carousel;
import com.wordcheck.service.CarouselService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
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
    @Operation(
        summary = "获取所有启用的轮播图", 
        description = "获取所有状态为启用的轮播图，按排序字段升序排列",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "成功获取轮播图列表",
            content = @Content(schema = @Schema(implementation = Carousel.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401", 
            description = "未授权，需要登录"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "500", 
            description = "服务器错误"
        )
    })
    public ApiResponse<List<Carousel>> getCarousels(HttpServletRequest request) {
        try {
            // 获取用户ID，可以添加权限检查
            // Integer userId = (Integer) request.getAttribute("userId");
            
            log.info("获取轮播图列表");
            List<Carousel> carousels = carouselService.getActiveCarousels();
            
            // 记录请求统计
            log.info("轮播图列表请求成功，返回{}条数据", carousels.size());
            
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
    @Operation(
        summary = "根据ID获取轮播图", 
        description = "根据轮播图ID获取详细信息",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "成功获取轮播图详情",
            content = @Content(schema = @Schema(implementation = Carousel.class))
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "401", 
            description = "未授权，需要登录"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "404", 
            description = "轮播图不存在"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "500", 
            description = "服务器错误"
        )
    })
    public ApiResponse<Carousel> getCarouselById(
        @Parameter(description = "轮播图ID", required = true) 
        @PathVariable("id") Long id, 
        HttpServletRequest request
    ) {
        try {
            // 获取用户ID，可以添加权限检查
            // Integer userId = (Integer) request.getAttribute("userId");
            
            log.info("获取轮播图详情，ID: {}", id);
            Carousel carousel = carouselService.getCarouselById(id);
            
            if (carousel == null) {
                log.warn("轮播图不存在，ID: {}", id);
                return ApiResponse.error(404, "轮播图不存在");
            }
            
            // 记录请求统计
            log.info("轮播图详情请求成功，ID: {}", id);
            
            return ApiResponse.success(carousel);
        } catch (Exception e) {
            log.error("获取轮播图详情失败", e);
            return ApiResponse.error(500, "获取轮播图详情失败: " + e.getMessage());
        }
    }
    
    /**
     * 记录轮播图点击
     * @param id 轮播图ID
     * @return 操作结果
     */
    @GetMapping("/{id}/click")
    @Operation(
        summary = "记录轮播图点击", 
        description = "记录轮播图被点击的统计数据",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "记录成功"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "参数错误"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "500", 
            description = "服务器错误"
        )
    })
    public ApiResponse<Void> recordClick(
        @Parameter(description = "轮播图ID", required = true) 
        @PathVariable("id") Long id
    ) {
        try {
            if (id == null) {
                return ApiResponse.error(400, "轮播图ID不能为空");
            }
            
            boolean success = carouselService.recordClick(id);
            
            if (success) {
                return ApiResponse.success(null);
            } else {
                return ApiResponse.error(500, "记录点击失败");
            }
        } catch (Exception e) {
            log.error("记录轮播图点击失败", e);
            return ApiResponse.error(500, "记录点击失败: " + e.getMessage());
        }
    }
    
    /**
     * 记录轮播图查看
     * @param id 轮播图ID
     * @return 操作结果
     */
    @GetMapping("/{id}/view")
    @Operation(
        summary = "记录轮播图查看", 
        description = "记录轮播图被查看的统计数据",
        security = {@SecurityRequirement(name = "Authorization")}
    )
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200", 
            description = "记录成功"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "400", 
            description = "参数错误"
        ),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "500", 
            description = "服务器错误"
        )
    })
    public ApiResponse<Void> recordView(
        @Parameter(description = "轮播图ID", required = true) 
        @PathVariable("id") Long id
    ) {
        try {
            if (id == null) {
                return ApiResponse.error(400, "轮播图ID不能为空");
            }
            
            boolean success = carouselService.recordView(id);
            
            if (success) {
                return ApiResponse.success(null);
            } else {
                return ApiResponse.error(500, "记录查看失败");
            }
        } catch (Exception e) {
            log.error("记录轮播图查看失败", e);
            return ApiResponse.error(500, "记录查看失败: " + e.getMessage());
        }
    }
} 