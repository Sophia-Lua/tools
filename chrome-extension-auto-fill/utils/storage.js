const PROVIDERS = {
  openrouter: { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1/chat/completions', defaultModel: '' },
  zhipu: { name: '智谱 GLM', baseUrl: 'https://api.z.ai/api/paas/v4/chat/completions', defaultModel: 'GLM-4.7-Flash' },
  siliconflow: { name: '硅基流动', baseUrl: 'https://api.siliconflow.cn/v1/chat/completions', defaultModel: 'deepseek-ai/DeepSeek-V3' },
  opencode: { name: 'OpenCode', baseUrl: 'https://opencode.ai/zen/v1/chat/completions', defaultModel: '' }
};

const StorageUtils = {
  PROVIDERS,

  async getProvider() {
    const result = await chrome.storage.local.get('provider');
    return result.provider || 'openrouter';
  },

  async saveProvider(provider) {
    await chrome.storage.local.set({ provider });
  },

  async getModel() {
    const result = await chrome.storage.local.get('model');
    return result.model || '';
  },

  async saveModel(model) {
    await chrome.storage.local.set({ model });
  },

  async getApiKey() {
    const result = await chrome.storage.local.get('apiKey');
    return result.apiKey || '';
  },

  async saveApiKey(apiKey) {
    await chrome.storage.local.set({ apiKey });
  },

  async deleteAll() {
    await chrome.storage.local.clear();
  }
};

export default StorageUtils;
