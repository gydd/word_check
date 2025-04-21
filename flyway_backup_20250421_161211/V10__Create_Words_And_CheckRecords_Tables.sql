-- 创建单词表
CREATE TABLE IF NOT EXISTS `words` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '单词ID',
  `word` VARCHAR(100) NOT NULL COMMENT '单词',
  `meaning` TEXT NOT NULL COMMENT '含义',
  `example` TEXT COMMENT '例句',
  `difficulty` TINYINT NOT NULL DEFAULT 1 COMMENT '难度等级：1-简单，2-中等，3-困难',
  `category` VARCHAR(50) COMMENT '单词分类',
  `create_time` DATETIME NOT NULL COMMENT '创建时间',
  `update_time` DATETIME NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_word` (`word`),
  INDEX `idx_difficulty` (`difficulty`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单词表';

-- 创建用户单词检测记录表
CREATE TABLE IF NOT EXISTS `check_records` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `word_id` INT COMMENT '单词ID',
  `input_word` VARCHAR(100) COMMENT '用户输入的单词',
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否正确：0-错误，1-正确',
  `check_time` DATETIME NOT NULL COMMENT '检测时间',
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_word_id` (`word_id`),
  INDEX `idx_check_time` (`check_time`),
  CONSTRAINT `fk_check_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_check_records_word_id` FOREIGN KEY (`word_id`) REFERENCES `words` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户单词检测记录表'; 