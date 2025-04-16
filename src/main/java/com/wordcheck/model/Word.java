package com.wordcheck.model;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 单词实体类
 */
@Data
public class Word {
    /**
     * 单词ID
     */
    private Integer id;
    
    /**
     * 单词
     */
    private String word;
    
    /**
     * 单词含义
     */
    private String meaning;
    
    /**
     * 单词分类
     */
    private String category;
    
    /**
     * 难度级别
     */
    private String difficulty;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
} 