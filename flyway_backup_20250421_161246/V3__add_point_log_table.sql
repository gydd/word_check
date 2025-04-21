-- 创建积分变动日志表
CREATE TABLE IF NOT EXISTS `point_log` (
  `id` VARCHAR(32) NOT NULL COMMENT '日志ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `points` INT NOT NULL COMMENT '积分数量',
  `change_type` TINYINT NOT NULL COMMENT '变动类型：1=增加, 2=减少',
  `reason` VARCHAR(200) COMMENT '变动原因',
  `create_time` DATETIME NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分变动日志表'; 