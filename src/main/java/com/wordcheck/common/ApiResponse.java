package com.wordcheck.common;

import lombok.Data;

/**
 * 统一API响应格式类
 *
 * @param <T> 响应数据类型
 */
@Data
public class ApiResponse<T> {
    private int error;
    private String message;
    private T body;
    
    /**
     * 成功响应，仅返回数据
     *
     * @param data 响应数据
     * @param <T>  数据类型
     * @return ApiResponse对象
     */
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setError(0);
        response.setMessage("");
        response.setBody(data);
        return response;
    }
    
    /**
     * 成功响应，返回自定义消息和数据
     *
     * @param message 响应消息
     * @param data    响应数据
     * @param <T>     数据类型
     * @return ApiResponse对象
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setError(0);
        response.setMessage(message);
        response.setBody(data);
        return response;
    }
    
    /**
     * 错误响应
     *
     * @param code    错误代码
     * @param message 错误消息
     * @param <T>     数据类型
     * @return ApiResponse对象
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setError(code);
        response.setMessage(message);
        response.setBody(null);
        return response;
    }
} 