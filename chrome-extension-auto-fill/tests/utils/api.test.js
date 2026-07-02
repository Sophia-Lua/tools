import ApiUtils from '../../utils/api.js';
import StorageUtils from '../../utils/storage.js';

jest.mock('../../utils/storage.js', () => ({
  __esModule: true,
  default: {
    getApiKey: jest.fn(),
    getModel: jest.fn(),
    getProvider: jest.fn(),
    PROVIDERS: {
      openrouter: { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1/chat/completions', defaultModel: '' },
      zhipu: { name: '智谱 GLM', baseUrl: 'https://api.z.ai/api/paas/v4/chat/completions', defaultModel: 'GLM-4.7-Flash' }
    }
  }
}));

describe('ApiUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.chrome = {
      runtime: {
        getURL: jest.fn().mockReturnValue('chrome-extension://test/')
      }
    };
  });

  it('should call OpenRouter with correct URL', async () => {
    StorageUtils.getApiKey.mockResolvedValue('test-api-key');
    StorageUtils.getModel.mockResolvedValue('google/gemini-2.0-flash-001');
    StorageUtils.getProvider.mockResolvedValue('openrouter');
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: '[]' } }] })
    });

    const result = await ApiUtils.callOpenRouter('test prompt');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [{ role: 'user', content: 'test prompt' }]
        })
      })
    );
    expect(result).toBe('[]');
  });

  it('should call Zhipu GLM with correct URL', async () => {
    StorageUtils.getApiKey.mockResolvedValue('zhipu-key');
    StorageUtils.getModel.mockResolvedValue('GLM-4.7-Flash');
    StorageUtils.getProvider.mockResolvedValue('zhipu');
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: '{"name":"张三"}' } }] })
    });

    const result = await ApiUtils.callOpenRouter('test prompt');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.z.ai/api/paas/v4/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'GLM-4.7-Flash',
          messages: [{ role: 'user', content: 'test prompt' }]
        })
      })
    );
    expect(result).toBe('{"name":"张三"}');
  });

  it('should throw when API key is missing', async () => {
    StorageUtils.getApiKey.mockResolvedValue('');
    StorageUtils.getModel.mockResolvedValue('test-model');
    StorageUtils.getProvider.mockResolvedValue('openrouter');

    await expect(ApiUtils.callOpenRouter('test')).rejects.toThrow('API密钥未配置');
  });

  it('should throw when model is missing', async () => {
    StorageUtils.getApiKey.mockResolvedValue('test-key');
    StorageUtils.getModel.mockResolvedValue('');
    StorageUtils.getProvider.mockResolvedValue('openrouter');

    await expect(ApiUtils.callOpenRouter('test')).rejects.toThrow('模型未配置');
  });

  it('should throw on HTTP error', async () => {
    StorageUtils.getApiKey.mockResolvedValue('test-key');
    StorageUtils.getModel.mockResolvedValue('test-model');
    StorageUtils.getProvider.mockResolvedValue('zhipu');
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Unauthorized' } })
    });

    await expect(ApiUtils.callOpenRouter('test')).rejects.toThrow('Unauthorized');
  });

  it('should throw on network error', async () => {
    StorageUtils.getApiKey.mockResolvedValue('test-key');
    StorageUtils.getModel.mockResolvedValue('test-model');
    StorageUtils.getProvider.mockResolvedValue('openrouter');
    global.fetch.mockRejectedValue(new Error('Network failure'));

    await expect(ApiUtils.callOpenRouter('test')).rejects.toThrow('Network failure');
  });
});
