-- 为轮播图表增加统计和控制字段
ALTER TABLE `t_carousel` 
    ADD COLUMN `view_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '查看次数',
    ADD COLUMN `click_count` bigint(20) NOT NULL DEFAULT 0 COMMENT '点击次数',
    ADD COLUMN `start_time` datetime DEFAULT NULL COMMENT '开始展示时间',
    ADD COLUMN `end_time` datetime DEFAULT NULL COMMENT '结束展示时间',
    ADD COLUMN `version` int(11) NOT NULL DEFAULT 1 COMMENT '版本号，用于乐观锁';

-- 更新查询语句需要考虑时间范围
-- 示例：使用以下SQL查询有效的轮播图
-- SELECT * FROM t_carousel 
-- WHERE status = 1 
-- AND (start_time IS NULL OR start_time <= NOW()) 
-- AND (end_time IS NULL OR end_time >= NOW()) 
-- ORDER BY sort ASC, id ASC; 