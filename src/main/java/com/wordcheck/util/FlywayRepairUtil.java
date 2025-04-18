package com.wordcheck.util;

import org.flywaydb.core.Flyway;

/**
 * Flyway修复工具类
 * 用于手动修复Flyway迁移问题
 */
public class FlywayRepairUtil {

    /**
     * 主方法，可以直接运行此类来修复Flyway
     */
    public static void main(String[] args) {
        // 数据库连接信息
        String url = "jdbc:mysql://localhost:3306/word_check?characterEncoding=utf8&serverTimezone=Asia/Shanghai";
        String user = "root";
        String password = "199509";
        
        System.out.println("开始修复Flyway迁移...");
        
        try {
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
            // 执行SQL: DELETE FROM flyway_schema_history WHERE success = 0;
            
            System.out.println("修复完成，请重新启动应用。");
        } catch (Exception e) {
            System.err.println("修复失败：" + e.getMessage());
            e.printStackTrace();
        }
    }
}