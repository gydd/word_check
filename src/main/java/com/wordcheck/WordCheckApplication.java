package com.wordcheck;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 单词检查小程序后端应用程序入口
 */
@SpringBootApplication
@MapperScan("com.wordcheck.mapper")
public class WordCheckApplication {

    public static void main(String[] args) {
        SpringApplication.run(WordCheckApplication.class, args);
    }
} 