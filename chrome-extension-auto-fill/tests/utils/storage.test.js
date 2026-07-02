import StorageUtils from '../../utils/storage.js';

describe('StorageUtils', () => {
  beforeEach(() => {
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
  });

  it('should have PROVIDERS defined', () => {
    expect(StorageUtils.PROVIDERS).toBeDefined();
    expect(StorageUtils.PROVIDERS.openrouter).toBeDefined();
    expect(StorageUtils.PROVIDERS.zhipu).toBeDefined();
    expect(StorageUtils.PROVIDERS.zhipu.baseUrl).toBe('https://api.z.ai/api/paas/v4/chat/completions');
    expect(StorageUtils.PROVIDERS.zhipu.defaultModel).toBe('GLM-4.7-Flash');
  });

  it('should get provider from storage', async () => {
    chrome.storage.local.get.mockResolvedValue({ provider: 'zhipu' });
    const provider = await StorageUtils.getProvider();
    expect(provider).toBe('zhipu');
    expect(chrome.storage.local.get).toHaveBeenCalledWith('provider');
  });

  it('should return openrouter as default provider', async () => {
    chrome.storage.local.get.mockResolvedValue({});
    const provider = await StorageUtils.getProvider();
    expect(provider).toBe('openrouter');
  });

  it('should save provider to storage', async () => {
    await StorageUtils.saveProvider('zhipu');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ provider: 'zhipu' });
  });

  it('should get model from storage', async () => {
    chrome.storage.local.get.mockResolvedValue({ model: 'GLM-4.7-Flash' });
    const model = await StorageUtils.getModel();
    expect(model).toBe('GLM-4.7-Flash');
    expect(chrome.storage.local.get).toHaveBeenCalledWith('model');
  });

  it('should return empty string when model not in storage', async () => {
    chrome.storage.local.get.mockResolvedValue({});
    const model = await StorageUtils.getModel();
    expect(model).toBe('');
  });

  it('should save model to storage', async () => {
    await StorageUtils.saveModel('GLM-4.7-Flash');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ model: 'GLM-4.7-Flash' });
  });

  it('should get apiKey from storage', async () => {
    chrome.storage.local.get.mockResolvedValue({ apiKey: 'test-key' });
    const key = await StorageUtils.getApiKey();
    expect(key).toBe('test-key');
    expect(chrome.storage.local.get).toHaveBeenCalledWith('apiKey');
  });

  it('should return empty string when apiKey not in storage', async () => {
    chrome.storage.local.get.mockResolvedValue({});
    const key = await StorageUtils.getApiKey();
    expect(key).toBe('');
  });

  it('should save apiKey to storage', async () => {
    await StorageUtils.saveApiKey('my-api-key');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ apiKey: 'my-api-key' });
  });
});
