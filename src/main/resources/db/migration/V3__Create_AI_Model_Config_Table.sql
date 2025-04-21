-- 创建AI模型配置表
CREATE TABLE IF NOT EXISTS ai_model_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '模型名称',
    provider VARCHAR(50) NOT NULL COMMENT '模型提供商(如OpenAI, Azure, 百度等)',
    api_url VARCHAR(255) COMMENT '模型API地址',
    model_id VARCHAR(100) COMMENT '具体模型标识',
    api_key VARCHAR(255) COMMENT 'API密钥',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否为默认模型',
    timeout INT DEFAULT 30000 COMMENT '超时时间(毫秒)',
    prompt_template TEXT COMMENT '提示词模板（批改作文的指令）',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_default (is_default),
    INDEX idx_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI模型配置表';

-- 创建默认的AI模型配置
INSERT INTO ai_model_config (name, provider, api_url, model_id, is_default, prompt_template) VALUES 
(
    'GPT-3.5 Turbo', 
    'OpenAI', 
    'https://api.openai.com/v1/chat/completions', 
    'gpt-3.5-turbo', 
    TRUE, 
    '你的使命是作为一位专业的作文批改助手。你的任务是仔细阅读用户提交的作文，并提供以下几个方面的反馈：\n1. **优化建议：** 针对作文的结构、论证、语言表达、选词用句等方面，给出具体、可操作的改进意见。请明确指出需要修改的地方，并提供至少一种修改或提升的方案。\n2. **评价：** 对作文的整体质量进行客观评价，指出其优点和不足之处。评价应具有针对性，避免过于笼统的表述。\n3. **赞美与鼓励：** 在给出评价的同时，积极寻找作文中的亮点，并给予真诚的赞美。用积极的语言鼓励用户继续努力，提升写作水平。\n请确保你的回复既能帮助用户认识到作文中存在的问题，又能激励他们改进和提高。你的目标是成为一位既专业又充满鼓励的作文批改伙伴。\n\n以下是需要批改的作文：\n\n%s'
); 