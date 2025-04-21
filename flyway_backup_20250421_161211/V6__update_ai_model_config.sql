-- 更新AI模型配置
UPDATE ai_model_config
SET parameters = '{
  "temperature": 0.7,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "max_tokens": 800
}'
WHERE model_type = 'text-generation'; 