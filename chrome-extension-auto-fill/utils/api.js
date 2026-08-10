import StorageUtils from './storage.js';

const API_TIMEOUT = 30000;

const ApiUtils = {
  async callOpenRouter(prompt) {
    const apiKey = await StorageUtils.getApiKey();
    const provider = await StorageUtils.getProvider();

    // 本地模型不需要 API 密钥
    if (!apiKey && provider !== 'local') {
      throw new Error('API密钥未配置，请在设置中添加API密钥');
    }

    const model = await StorageUtils.getModel();
    // 本地模型使用默认模型名称（如果未配置）
    const effectiveModel = model || (provider === 'local' ? 'default' : '');
    if (!effectiveModel) {
      throw new Error('模型未配置，请在设置中选择模型');
    }

    const providerConfig = StorageUtils.PROVIDERS[provider];
    if (!providerConfig) {
      throw new Error('未知的服务商');
    }

    // 对于本地模型，使用自定义 URL
    let baseUrl = providerConfig.baseUrl;
    if (provider === 'local') {
      const customUrl = await StorageUtils.getCustomBaseUrl();
      if (customUrl) {
        baseUrl = customUrl;
        // 确保 URL 以 /v1/chat/completions 结尾
        if (!baseUrl.endsWith('/v1/chat/completions')) {
          if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl + 'v1/chat/completions';
          } else {
            baseUrl = baseUrl + '/v1/chat/completions';
          }
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // 本地模型可以不需要 Authorization 头
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const body = {
        model: effectiveModel,
        messages: [{ role: 'user', content: prompt }]
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

export default ApiUtils;
