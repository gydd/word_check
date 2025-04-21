package com.wordcheck.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Flyway修复配置
 * 用于修复失败的数据库迁移
 */
@Configuration
public class FlywayRepairConfig {

    @Autowired
    private DataSource dataSource;
    
    /**
     * 应用启动后自动运行Flyway修复
     */
    @Bean
    public ApplicationRunner flywayRepair() {
        return args -> {
            System.out.println("------------------------------------");
            System.out.println("正在尝试修复Flyway迁移历史...");
            
            // 创建Flyway实例
            Flyway flyway = Flyway.configure()
                    .dataSource(dataSource)
                    .load();
            
            // 执行修复
            flyway.repair();
            
            System.out.println("Flyway迁移历史修复完成！");
            System.out.println("------------------------------------");
        };
    }
} 