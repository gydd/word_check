package com.wordcheck.service.impl;

import com.wordcheck.mapper.AIModelConfigMapper;
import com.wordcheck.model.AIModelConfig;
import com.wordcheck.service.AIModelConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.StringUtils;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

/**
 * AI模型配置服务实现类
 */
@Slf4j
@Service
public class AIModelConfigServiceImpl implements AIModelConfigService {

    @Autowired
    private AIModelConfigMapper aiModelConfigMapper;
    
    @Autowired
    private RestTemplate restTemplate;
    
    /**
     * 默认的提示词模板
     */
    private static final String DEFAULT_PROMPT_TEMPLATE = 
            "你的使命是作为一位专业的作文批改助手。你的任务是仔细阅读用户提交的作文，并提供以下几个方面的反馈：\n" +
            "1. **优化建议：** 针对作文的结构、论证、语言表达、选词用句等方面，给出具体、可操作的改进意见。请明确指出需要修改的地方，并提供至少一种修改或提升的方案。\n" +
            "2. **评价：** 对作文的整体质量进行客观评价，指出其优点和不足之处。评价应具有针对性，避免过于笼统的表述。\n" +
            "3. **赞美与鼓励：** 在给出评价的同时，积极寻找作文中的亮点，并给予真诚的赞美。用积极的语言鼓励用户继续努力，提升写作水平。\n" +
            "请确保你的回复既能帮助用户认识到作文中存在的问题，又能激励他们改进和提高。你的目标是成为一位既专业又充满鼓励的作文批改伙伴。\n\n" +
            "以下是需要批改的作文：\n\n%s";

    /**
     * 获取所有AI模型配置
     */
    @Override
    public List<AIModelConfig> getAllConfigs() {
        return aiModelConfigMapper.findAll();
    }

    /**
     * 获取可用的AI模型配置列表
     */
    @Override
    public List<AIModelConfig> getAvailableConfigs() {
        return aiModelConfigMapper.findAvailable();
    }

    /**
     * 根据ID获取AI模型配置
     */
    @Override
    public AIModelConfig getConfigById(Integer id) {
        return aiModelConfigMapper.findById(id);
    }

    /**
     * 获取默认的AI模型配置
     */
    @Override
    public AIModelConfig getDefaultConfig() {
        AIModelConfig config = aiModelConfigMapper.findDefault();
        // 如果没有默认配置，返回第一个配置
        if (config == null) {
            List<AIModelConfig> configs = aiModelConfigMapper.findAll();
            if (!configs.isEmpty()) {
                config = configs.get(0);
            }
        }
        return config;
    }

    /**
     * 创建AI模型配置
     */
    @Override
    @Transactional
    public AIModelConfig createConfig(AIModelConfig config) {
        // 如果设置为默认，先重置其他默认配置
        if (Boolean.TRUE.equals(config.getIsDefault())) {
            aiModelConfigMapper.resetAllDefault();
        }
        
        // 设置默认的提示词模板（如果未指定）
        if (config.getPromptTemplate() == null || config.getPromptTemplate().trim().isEmpty()) {
            config.setPromptTemplate(DEFAULT_PROMPT_TEMPLATE);
        }
        
        // 设置默认超时时间
        if (config.getTimeout() == null || config.getTimeout() <= 0) {
            config.setTimeout(30000); // 默认30秒
        }
        
        aiModelConfigMapper.insert(config);
        return config;
    }

    /**
     * 更新AI模型配置
     */
    @Override
    @Transactional
    public AIModelConfig updateConfig(Integer id, AIModelConfig config) {
        AIModelConfig existingConfig = aiModelConfigMapper.findById(id);
        if (existingConfig == null) {
            throw new IllegalArgumentException("未找到ID为" + id + "的AI模型配置");
        }
        
        // 如果设置为默认，先重置其他默认配置
        if (Boolean.TRUE.equals(config.getIsDefault()) && !Boolean.TRUE.equals(existingConfig.getIsDefault())) {
            aiModelConfigMapper.resetAllDefault();
        }
        
        // 保持ID一致
        config.setId(id);
        
        aiModelConfigMapper.update(config);
        return aiModelConfigMapper.findById(id);
    }

    /**
     * 删除AI模型配置
     */
    @Override
    @Transactional
    public boolean deleteConfig(Integer id) {
        AIModelConfig config = aiModelConfigMapper.findById(id);
        if (config == null) {
            return false;
        }
        
        // 如果删除的是默认配置，需要设置新的默认配置
        boolean isDefault = Boolean.TRUE.equals(config.getIsDefault());
        
        int result = aiModelConfigMapper.delete(id);
        
        // 如果删除的是默认配置，尝试设置新的默认配置
        if (isDefault && result > 0) {
            List<AIModelConfig> configs = aiModelConfigMapper.findAll();
            if (!configs.isEmpty()) {
                aiModelConfigMapper.setDefault(configs.get(0).getId());
            }
        }
        
        return result > 0;
    }

    /**
     * 设置指定ID的模型为默认模型
     */
    @Override
    @Transactional
    public boolean setDefault(Integer id) {
        AIModelConfig config = aiModelConfigMapper.findById(id);
        if (config == null) {
            return false;
        }
        
        return aiModelConfigMapper.setDefault(id) > 0;
    }

    /**
     * 使用AI模型检查文章
     * @param modelId 模型ID，如果为空则使用默认模型
     * @param content 要检查的文章内容
     * @return 检查结果
     */
    @Override
    public String checkEssay(Integer modelId, String content) {
        if (StringUtils.isEmpty(content)) {
            throw new IllegalArgumentException("文章内容不能为空");
        }

        // 获取模型配置
        AIModelConfig config;
        if (modelId != null) {
            config = getConfigById(modelId);
            if (config == null) {
                log.warn("指定的模型ID不存在: {}, 使用默认模型", modelId);
                config = getDefaultConfig();
            }
        } else {
            config = getDefaultConfig();
        }

        if (config == null) {
            throw new RuntimeException("未找到可用的AI模型配置");
        }

        // 检查API URL和API Key是否已配置
        if (StringUtils.isEmpty(config.getApiUrl()) || StringUtils.isEmpty(config.getApiKey())) {
            throw new RuntimeException("AI模型配置不完整，请检查API URL和API Key");
        }

        // 替换提示模板中的内容
        String promptTemplate = config.getPromptTemplate();
        if (StringUtils.isEmpty(promptTemplate)) {
            promptTemplate = DEFAULT_PROMPT_TEMPLATE;
        }
        String prompt = promptTemplate.replace("{{content}}", content);

        // 设置超时
        int timeout = config.getTimeout() != null ? config.getTimeout() : 60000;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);
        RestTemplate restTemplate = new RestTemplate(requestFactory);

        // 根据不同的AI模型提供商选择不同的处理逻辑
        String provider = config.getProvider().toLowerCase();
        try {
            switch (provider) {
                case "openai":
                    return callOpenAI(restTemplate, config, prompt);
                case "azure":
                    return callAzureOpenAI(restTemplate, config, prompt);
                case "deepseek":
                    return callDeepSeek(restTemplate, config, prompt);
                case "anthropic":
                    return callAnthropic(restTemplate, config, prompt);
                case "阿里云":
                    return callQwen(restTemplate, config, prompt);
                case "google":
                    return callGemini(restTemplate, config, prompt);
                default:
                    log.warn("不支持的AI模型提供商: {}, 尝试使用通用请求格式", provider);
                    return callGenericAPI(restTemplate, config, prompt);
            }
        } catch (Exception e) {
            log.error("调用AI模型API失败: {}", e.getMessage(), e);
            throw new RuntimeException("AI服务调用失败: " + e.getMessage(), e);
        }
    }

    /**
     * 调用OpenAI API
     */
    private String callOpenAI(RestTemplate restTemplate, AIModelConfig config, String prompt) {
        String url = config.getApiUrl();
        if (!url.endsWith("/chat/completions")) {
            url = url + "/chat/completions";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(config.getApiKey());

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(message);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getModelId());
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 3000);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        // 解析响应
        Map responseBody = response.getBody();
        if (responseBody != null && responseBody.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> choice = choices.get(0);
                Map<String, Object> message1 = (Map<String, Object>) choice.get("message");
                return (String) message1.get("content");
            }
        }
        throw new RuntimeException("无法解析OpenAI响应");
    }

    /**
     * 调用Azure OpenAI API
     */
    private String callAzureOpenAI(RestTemplate restTemplate, AIModelConfig config, String prompt) {
        // Azure OpenAI API的URL格式不同
        String url = config.getApiUrl();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", config.getApiKey());

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(message);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 3000);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        // 解析响应（格式与OpenAI相同）
        Map responseBody = response.getBody();
        if (responseBody != null && responseBody.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> choice = choices.get(0);
                Map<String, Object> message1 = (Map<String, Object>) choice.get("message");
                return (String) message1.get("content");
            }
        }
        throw new RuntimeException("无法解析Azure OpenAI响应");
    }

    /**
     * 调用DeepSeek API
     */
    private String callDeepSeek(RestTemplate restTemplate, AIModelConfig config, String prompt) {
        String url = config.getApiUrl();
        if (!url.endsWith("/chat/completions")) {
            url = url + "/chat/completions";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(config.getApiKey());

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(message);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getModelId());
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 3000);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        // 解析响应（DeepSeek API的响应格式与OpenAI类似）
        Map responseBody = response.getBody();
        if (responseBody != null && responseBody.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> choice = choices.get(0);
                Map<String, Object> message1 = (Map<String, Object>) choice.get("message");
                return (String) message1.get("content");
            }
        }
        throw new RuntimeException("无法解析DeepSeek响应");
    }

    /**
     * 调用Anthropic Claude API
     */
    private String callAnthropic(RestTemplate restTemplate, AIModelConfig config, String prompt) {
        String url = config.getApiUrl();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", config.getApiKey());
        headers.set("anthropic-version", "2023-06-01");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getModelId());
        requestBody.put("prompt", "\n\nHuman: " + prompt + "\n\nAssistant:");
        requestBody.put("max_tokens_to_sample", 3000);
        requestBody.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        // 解析Claude API响应
        Map responseBody = response.getBody();
        if (responseBody != null && responseBody.containsKey("completion")) {
            return (String) responseBody.get("completion");
        }
        throw new RuntimeException("无法解析Anthropic Claude响应");
    }

    /**
     * 调用阿里云通义千问 API
     */
    private String callQwen(RestTemplate restTemplate, AIModelConfig config, String prompt) {
        String url = config.getApiUrl();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + config.getApiKey());

        Map<String, Object> input = new HashMap<>();
        input.put("prompt", prompt);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("temperature", 0.7);
        parameters.put("top_p", 0.8);
        parameters.put("max_tokens", 3000);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getModelId());
        requestBody.put("input", input);
        requestBody.put("parameters", parameters);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        // 解析阿里云API响应
        Map responseBody = response.getBody();
        if (responseBody != null && responseBody.containsKey("output")) {
            Map<String, Object> output = (Map<String, Object>) responseBody.get("output");
            if (output.containsKey("text")) {
                return (String) output.get("text");
            }
        }
        throw new RuntimeException("无法解析通义千问响应");
    }

    /**
     * 调用Google Gemini API
     */
    private String callGemini(RestTemplate restTemplate, AIModelConfig config, String prompt) {
        String url = config.getApiUrl() + "?key=" + config.getApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> content = new HashMap<>();
        content.put("role", "user");
        
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(part);
        content.put("parts", parts);

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 3000);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", content);
        requestBody.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

        // 解析Gemini API响应
        Map responseBody = response.getBody();
        if (responseBody != null && responseBody.containsKey("candidates")) {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            if (!candidates.isEmpty()) {
                Map<String, Object> candidate = candidates.get(0);
                Map<String, Object> content1 = (Map<String, Object>) candidate.get("content");
                List<Map<String, Object>> parts1 = (List<Map<String, Object>>) content1.get("parts");
                if (!parts1.isEmpty()) {
                    return (String) parts1.get(0).get("text");
                }
            }
        }
        throw new RuntimeException("无法解析Gemini响应");
    }

    /**
     * 调用通用API格式
     */
    private String callGenericAPI(RestTemplate restTemplate, AIModelConfig config, String prompt) {
        String url = config.getApiUrl();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(config.getApiKey());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", config.getModelId());
        requestBody.put("prompt", prompt);
        requestBody.put("max_tokens", 3000);
        requestBody.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        // 尝试返回原始响应内容，希望调用方能够解析
        return response.getBody();
    }
}