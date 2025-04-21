#!/bin/bash

# 运行Flyway修复
echo "开始运行Flyway修复..."

# 方法1：使用自定义修复工具
echo "方法1：使用自定义修复工具"
echo "运行: java -cp target/classes com.wordcheck.util.FlywayRepairUtil"
echo "如果要使用此方法，请取消下面的注释"
# java -cp target/classes com.wordcheck.util.FlywayRepairUtil

# 方法2：使用Maven命令
echo "方法2：使用Maven命令"
echo "运行: mvn flyway:repair"
echo "如果要使用此方法，请取消下面的注释"
# mvn flyway:repair

# 方法3：使用Spring Boot自动修复
echo "方法3：使用Spring Boot自动修复"
echo "只需启动应用程序，Spring Boot将尝试自动修复"
echo "请确保application.yml中设置了repair-on-migrate: true"

echo "修复完成后，请重新启动应用程序以应用迁移。" 