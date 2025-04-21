-- 创建检测历史表
CREATE TABLE IF NOT EXISTS `check_history` (
  `id` VARCHAR(32) NOT NULL COMMENT '历史记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `content` TEXT COMMENT '检测内容',
  `content_length` INT DEFAULT 0 COMMENT '内容长度（字符数）',
  `check_type` VARCHAR(50) COMMENT '检测类型（如"作文批改"、"单词检测"等）',
  `model_id` INT COMMENT '使用的模型ID',
  `model_name` VARCHAR(100) COMMENT '模型名称',
  `check_result` TEXT COMMENT '检测结果（JSON格式）',
  `score` INT COMMENT '检测评分',
  `points_cost` INT DEFAULT 0 COMMENT '消耗的积分',
  `create_time` DATETIME NOT NULL COMMENT '创建时间',
  `update_time` DATETIME NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='检测历史记录表'; 