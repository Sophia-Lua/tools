import StorageUtils from './storage.js';

const API_TIMEOUT = 30000;

const ApiUtils = {
  async callOpenRouter(prompt) {
    const apiKey = await StorageUtils.getApiKey();
    if (!apiKey) {
      throw new Error('API密钥未配置，请在设置中添加API密钥');
    }

    const model = await StorageUtils.getModel();
    if (!model) {
      throw new Error('模型未配置，请在设置中选择模型');
    }

    const provider = await StorageUtils.getProvider();
    const providerConfig = StorageUtils.PROVIDERS[provider];
    if (!providerConfig) {
      throw new Error('未知的服务商');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      const body = {
        model,
        messages: [{ role: 'user', content: prompt }]
      };

      const response = await fetch(providerConfig.baseUrl, {
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
