-- 更新AI模型配置表，添加积分梯度消费字段
ALTER TABLE `ai_model_config`
ADD COLUMN `base_points_cost` INT DEFAULT 3 COMMENT '基础积分消耗（不足字数阈值时收取的积分）' AFTER `prompt_template`,
ADD COLUMN `word_threshold` INT DEFAULT 1000 COMMENT '字数阈值（达到该字数时开始按阶梯计费）' AFTER `base_points_cost`,
ADD COLUMN `word_increment` INT DEFAULT 1000 COMMENT '字数增量（每增加多少字进行一次计费）' AFTER `word_threshold`,
ADD COLUMN `increment_points_cost` INT DEFAULT 2 COMMENT '增量积分消耗（每增加一个wordIncrement消耗的积分）' AFTER `word_increment`,
ADD COLUMN `points_cost_type` INT DEFAULT 0 COMMENT '积分计费方式：0=固定积分，1=按字数梯度' AFTER `increment_points_cost`; 