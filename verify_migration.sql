-- 1. 检查Flyway迁移历史记录
SELECT installed_rank, version, description, type, script, checksum, installed_by, 
       installed_on, execution_time, success
FROM flyway_schema_history
ORDER BY installed_rank;

-- 2. 检查所有表是否存在
SELECT table_name, table_comment
FROM information_schema.tables
WHERE table_schema = 'word_check'
ORDER BY table_name;

-- 3. 检查words表结构
DESCRIBE words;

-- 4. 检查check_records表结构
DESCRIBE check_records;

-- 5. 检查point_log表结构
DESCRIBE point_log;

-- 6. 检查carousel表结构
DESCRIBE carousel;