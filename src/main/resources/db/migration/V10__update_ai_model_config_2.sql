-- 更新AI模型配置
-- 首先添加parameters字段
ALTER TABLE ai_model_config
ADD COLUMN parameters TEXT COMMENT '模型参数(JSON格式)' AFTER prompt_template;

-- 然后更新默认模型的参数
UPDATE ai_model_config
SET parameters = '{
  "temperature": 0.7,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "max_tokens": 800
}'
WHERE is_default = TRUE; 