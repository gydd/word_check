# Flyway迁移修复计划

## 当前冲突

1. 版本V8冲突：
   - `V8__Create_Words_And_CheckRecords_Tables.sql`：创建词汇表和检测记录表
   - `V8__update_ai_model_config.sql`：更新AI模型配置

2. 版本V4冲突：
   - `V4__add_point_log_table.sql`：添加积分日志表
   - `V4__Create_Carousel_Table.sql`：创建轮播图表

3. 类似脚本：
   - `V9__Create_Words_And_CheckRecords_Tables.sql`：与V8版本名称相似但内容不同

## 修复步骤

1. **检查已执行的迁移**：
   - 执行`check_flyway_history.sql`脚本查询`flyway_schema_history`表
   - 确定哪些版本已经成功执行，哪些失败或未执行

2. **重命名冲突文件**：
   - 如果V4和V8的脚本都未执行：
     - 将`V4__Create_Carousel_Table.sql`重命名为`V10__Create_Carousel_Table.sql`
     - 将`V8__update_ai_model_config.sql`重命名为`V11__update_ai_model_config.sql`
   - 如果部分脚本已执行：
     - 根据已执行情况，为未执行的脚本分配新的版本号

3. **处理V9脚本**：
   - 比较`V8__Create_Words_And_CheckRecords_Tables.sql`和`V9__Create_Words_And_CheckRecords_Tables.sql`的内容
   - 如果V9是V8的替代版本且V8未执行：删除V8保留V9
   - 如果两者是不同的表结构：保留两者但明确命名区分

4. **修复Flyway历史记录**：
   - 如果有失败的迁移记录，使用修复工具：
     ```
     java -cp target/classes com.wordcheck.util.FlywayRepairUtil
     ```
   - 或者使用Spring Boot配置的自动修复
   - 或者使用Maven命令：
     ```
     mvn flyway:repair
     ```

5. **验证修复结果**：
   - 再次查询`flyway_schema_history`表，确认所有迁移是否成功
   - 检查数据库表结构是否符合预期

## 长期解决方案

1. **版本控制规范**：
   - 采用更具描述性的版本号，如`V1.1`、`V1.2`而不是简单的`V1`、`V2`
   - 或者采用时间戳格式：`V20230512_1__Create_Table.sql`

2. **团队协作流程**：
   - 在创建新的迁移脚本前，先检查已有的版本号
   - 使用Git等版本控制系统追踪迁移脚本的变更
   - 在合并代码前进行冲突检查

3. **配置优化**：
   - 保持`repair-on-migrate: true`配置启用
   - 迁移问题解决后，重新启用验证：`validate-on-migrate: true` 