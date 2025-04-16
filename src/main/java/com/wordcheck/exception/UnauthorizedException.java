package com.wordcheck.exception;

/**
 * 未授权异常类
 */
public class UnauthorizedException extends RuntimeException {
    
    public UnauthorizedException() {
        super("未授权，请先登录");
    }
    
    public UnauthorizedException(String message) {
        super(message);
    }
} 