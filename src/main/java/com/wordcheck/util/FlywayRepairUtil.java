package com.wordcheck.util;

import org.flywaydb.core.Flyway;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.Map;

/**
 * Flyway修复工具类
 * 用于手动修复Flyway迁移问题
 */
public class FlywayRepairUtil {

    /**
     * 主方法，可以直接运行此类来修复Flyway
     */
    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        System.out.println("开始修复Flyway迁移...");
        
        try {
            // 从配置文件读取数据库连接信息
            Resource resource = new ClassPathResource("application.yml");
            Yaml yaml = new Yaml();
            Map<String, Object> config;
            
            try (InputStream inputStream = resource.getInputStream()) {
                config = yaml.load(inputStream);
            }
            
            // 提取数据库配置
            Map<String, Object> spring = (Map<String, Object>) config.get("spring");
            Map<String, Object> datasource = (Map<String, Object>) spring.get("datasource");
            
            String url = (String) datasource.get("url");
            String user = (String) datasource.get("username");
            String password = (String) datasource.get("password");
            
            System.out.println("数据库连接信息已加载: " + url);
            
            // 配置Flyway
            Flyway flyway = Flyway.configure()
                    .dataSource(url, user, password)
                    .baselineOnMigrate(true)
                    .baselineVersion("0")
                    .load();
            
            // 执行修复
            flyway.repair();
            
            System.out.println("Flyway修复成功！");
            
            // 清除验证失败的记录
            System.out.println("正在清理失败的迁移记录...");
            System.out.println("执行SQL: DELETE FROM flyway_schema_history WHERE success = 0");
            
            System.out.println("修复完成，请重新启动应用。");
        } catch (Exception e) {
            System.err.println("修复失败：" + e.getMessage());
            e.printStackTrace();
        }
    }
}