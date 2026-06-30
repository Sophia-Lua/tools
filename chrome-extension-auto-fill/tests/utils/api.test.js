import ApiUtils from '../../utils/api.js';

describe('ApiUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
        lastError: null
      }
    };
  });

  it('should send message to background and return result', async () => {
    const testPrompt = 'test prompt';
    const mockResponse = { success: true, data: '{"test": "data"}' };

    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      expect(message).toEqual({ type: 'callOpenRouter', prompt: testPrompt });
      callback(mockResponse);
    });

    const result = await ApiUtils.callOpenRouter(testPrompt);
    expect(result).toBe('{"test": "data"}');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('should reject when background returns error', async () => {
    const mockResponse = { success: false, error: 'API密钥未设置' };

    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      callback(mockResponse);
    });

    await expect(ApiUtils.callOpenRouter('test')).rejects.toThrow('API密钥未设置');
  });

  it('should reject when chrome.runtime.lastError exists', async () => {
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      global.chrome = { runtime: { lastError: { message: 'Connection error' } } };
      callback(null);
    });

    await expect(ApiUtils.callOpenRouter('test')).rejects.toThrow('Connection error');
  });
});
