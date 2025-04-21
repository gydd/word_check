Write-Host "开始修复Flyway迁移问题..." -ForegroundColor Green

# 设置变量
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "./flyway_backup_$TIMESTAMP"
$NEW_MIGRATION_DIR = "./src/main/resources/db/migration_fix"

# 创建目录
Write-Host "创建备份和新迁移目录..." -ForegroundColor Cyan
New-Item -Path $BACKUP_DIR -ItemType Directory -Force | Out-Null
New-Item -Path $NEW_MIGRATION_DIR -ItemType Directory -Force | Out-Null

# 备份当前迁移文件
Write-Host "备份当前所有迁移文件..." -ForegroundColor Cyan
Copy-Item -Path "src/main/resources/db/migration/*" -Destination $BACKUP_DIR -Recurse

# 重新组织迁移文件，正确处理依赖关系
Write-Host "重新组织迁移文件..." -ForegroundColor Cyan
Copy-Item -Path "src/main/resources/db/migration/V1__Create_Users_Table.sql" -Destination "$NEW_MIGRATION_DIR/"
Copy-Item -Path "src/main/resources/db/migration/V2__Create_Point_Records_And_SignIn_Tables.sql" -Destination "$NEW_MIGRATION_DIR/"
Copy-Item -Path "src/main/resources/db/migration/V6__Create_AI_Model_Config_Table.sql" -Destination "$NEW_MIGRATION_DIR/V3__Create_AI_Model_Config_Table.sql"
Copy-Item -Path "src/main/resources/db/migration/V1.2__Add_deepseek_ai_model.sql" -Destination "$NEW_MIGRATION_DIR/V4__Add_deepseek_ai_model.sql"
Copy-Item -Path "src/main/resources/db/migration/V4__add_point_log_table.sql" -Destination "$NEW_MIGRATION_DIR/V5__add_point_log_table.sql"
Copy-Item -Path "src/main/resources/db/migration/V4__Create_Carousel_Table.sql" -Destination "$NEW_MIGRATION_DIR/V6__Create_Carousel_Table.sql"
Copy-Item -Path "src/main/resources/db/migration/V5__Alter_Carousel_Table_Add_Statistics.sql" -Destination "$NEW_MIGRATION_DIR/V7__Alter_Carousel_Table_Add_Statistics.sql"
Copy-Item -Path "src/main/resources/db/migration/V3__update_ai_model_config.sql" -Destination "$NEW_MIGRATION_DIR/V8__update_ai_model_config.sql"
Copy-Item -Path "src/main/resources/db/migration/V7__add_check_history_table.sql" -Destination "$NEW_MIGRATION_DIR/V9__add_check_history_table.sql"
Copy-Item -Path "src/main/resources/db/migration/V9__Create_Words_And_CheckRecords_Tables.sql" -Destination "$NEW_MIGRATION_DIR/V10__Create_Words_And_CheckRecords_Tables.sql"

# 替换迁移目录
Write-Host "替换迁移目录..." -ForegroundColor Cyan
Rename-Item -Path "src/main/resources/db/migration" -NewName "migration_old"
Rename-Item -Path $NEW_MIGRATION_DIR -NewName "migration"

Write-Host "完成！" -ForegroundColor Green
Write-Host "请先执行以下SQL命令清除flyway_schema_history表，然后重新启动应用：" -ForegroundColor Yellow
Write-Host "1. DROP TABLE IF EXISTS flyway_schema_history;" -ForegroundColor Yellow
Write-Host "2. 重启应用或执行: mvn flyway:migrate" -ForegroundColor Yellow