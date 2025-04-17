package com.wordcheck.controller;

import com.wordcheck.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 测试控制器
 */
@RestController
@RequestMapping("/test")
public class TestController {

    /**
     * 测试API是否正常响应
     */
    @GetMapping("/ping")
    public ApiResponse<Object> ping() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "pong");
        data.put("timestamp", System.currentTimeMillis());
        
        return ApiResponse.success(data);
    }
} 