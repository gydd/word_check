-- 添加更多AI模型配置，包含DeepSeek和其他主流模型

-- 首先重置所有模型的默认状态
UPDATE ai_model_config SET is_default = 0;

-- 添加DeepSeek模型
INSERT INTO ai_model_config (
    name, 
    provider, 
    api_url, 
    model_id, 
    api_key, 
    is_default, 
    timeout, 
    prompt_template,
    created_at, 
    updated_at
) VALUES (
    'DeepSeek Coder',
    'DeepSeek',
    'https://api.deepseek.com/v1',
    'deepseek-coder',
    'sk-0540444b02454b199935e69f190caea8', -- 在部署时替换为实际的API密钥
    0,
    60000,
    '你是一位作文批改专家，我会给你一篇学生的作文，请按照以下方式进行批改：\n\n1. 整体评价：对作文进行整体点评，包括内容、结构、语言和思想等方面。\n\n2. 语法和用词错误：指出文中的语法错误、用词不当和标点符号使用错误。\n\n3. 内容与结构建议：分析文章结构是否合理，内容是否充实，并提供具体的改进建议。\n\n4. 亮点与不足：指出文章的亮点和创新点，以及存在的不足和可改进之处。\n\n5. 评分与等级：给出一个百分制的评分（0-100分）和对应的等级评价（优秀/良好/中等/及格/不及格）。\n\n请以专业、鼓励的语气进行评价，既指出问题，又给予建设性的改进建议。同时注意保留学生的创意和个人风格。\n\n学生作文：\n{{content}}',
    NOW(),
    NOW()
);

-- 添加Anthropic Claude模型
INSERT INTO ai_model_config (
    name, 
    provider, 
    api_url, 
    model_id, 
    api_key, 
    is_default, 
    timeout, 
    prompt_template,
    created_at, 
    updated_at
) VALUES (
    'Claude 3 Opus',
    'Anthropic',
    'https://api.anthropic.com/v1/messages',
    'claude-3-opus-20240229',
    '22222', -- 在部署时替换为实际的API密钥
    0,
    60000,
    '你是一位作文批改专家，我会给你一篇学生的作文，请按照以下方式进行批改：\n\n1. 整体评价：对作文进行整体点评，包括内容、结构、语言和思想等方面。\n\n2. 语法和用词错误：指出文中的语法错误、用词不当和标点符号使用错误。\n\n3. 内容与结构建议：分析文章结构是否合理，内容是否充实，并提供具体的改进建议。\n\n4. 亮点与不足：指出文章的亮点和创新点，以及存在的不足和可改进之处。\n\n5. 评分与等级：给出一个百分制的评分（0-100分）和对应的等级评价（优秀/良好/中等/及格/不及格）。\n\n请以专业、鼓励的语气进行评价，既指出问题，又给予建设性的改进建议。同时注意保留学生的创意和个人风格。\n\n学生作文：\n{{content}}',
    NOW(),
    NOW()
);

-- 添加通义千问模型
INSERT INTO ai_model_config (
    name, 
    provider, 
    api_url, 
    model_id, 
    api_key, 
    is_default, 
    timeout, 
    prompt_template,
    created_at, 
    updated_at
) VALUES (
    '通义千问',
    '阿里云',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    'qwen-turbo',
    '23333', -- 在部署时替换为实际的API密钥
    0,
    60000,
    '你是一位作文批改专家，我会给你一篇学生的作文，请按照以下方式进行批改：\n\n1. 整体评价：对作文进行整体点评，包括内容、结构、语言和思想等方面。\n\n2. 语法和用词错误：指出文中的语法错误、用词不当和标点符号使用错误。\n\n3. 内容与结构建议：分析文章结构是否合理，内容是否充实，并提供具体的改进建议。\n\n4. 亮点与不足：指出文章的亮点和创新点，以及存在的不足和可改进之处。\n\n5. 评分与等级：给出一个百分制的评分（0-100分）和对应的等级评价（优秀/良好/中等/及格/不及格）。\n\n请以专业、鼓励的语气进行评价，既指出问题，又给予建设性的改进建议。同时注意保留学生的创意和个人风格。\n\n学生作文：\n{{content}}',
    NOW(),
    NOW()
);

-- 添加Gemini模型
INSERT INTO ai_model_config (
    name, 
    provider, 
    api_url, 
    model_id, 
    api_key, 
    is_default, 
    timeout, 
    prompt_template,
    created_at, 
    updated_at
) VALUES (
    'Gemini Pro',
    'Google',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    'gemini-pro',
    '34324', -- 在部署时替换为实际的API密钥
    0,
    60000,
    '你是一位作文批改专家，我会给你一篇学生的作文，请按照以下方式进行批改：\n\n1. 整体评价：对作文进行整体点评，包括内容、结构、语言和思想等方面。\n\n2. 语法和用词错误：指出文中的语法错误、用词不当和标点符号使用错误。\n\n3. 内容与结构建议：分析文章结构是否合理，内容是否充实，并提供具体的改进建议。\n\n4. 亮点与不足：指出文章的亮点和创新点，以及存在的不足和可改进之处。\n\n5. 评分与等级：给出一个百分制的评分（0-100分）和对应的等级评价（优秀/良好/中等/及格/不及格）。\n\n请以专业、鼓励的语气进行评价，既指出问题，又给予建设性的改进建议。同时注意保留学生的创意和个人风格。\n\n学生作文：\n{{content}}',
    NOW(),
    NOW()
);

-- 设置DeepSeek为默认模型
UPDATE ai_model_config SET is_default = 1 WHERE provider = 'DeepSeek'; 