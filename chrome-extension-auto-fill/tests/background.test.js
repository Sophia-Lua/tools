global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    getURL: jest.fn().mockReturnValue('chrome-extension://test/')
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

global.fetch = jest.fn();

const mockGetFillSuggestions = jest.fn();
const mockGetApiKey = jest.fn();

jest.mock('../utils/ai-filler.js', () => ({
  __esModule: true,
  default: {
    getFillSuggestions: (...args) => mockGetFillSuggestions(...args)
  }
}));

jest.mock('../utils/storage.js', () => ({
  __esModule: true,
  default: {
    getApiKey: (...args) => mockGetApiKey(...args)
  }
}));

describe('Background Script', () => {
  let messageListener;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      require('../background.js');
    });
    messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
  });

  it('should listen for messages', () => {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  it('should return true to keep message channel open for getFillSuggestions', () => {
    mockGetFillSuggestions.mockResolvedValue([]);
    const result = messageListener({ action: 'getFillSuggestions', fields: [], userData: {} }, {}, jest.fn());
    expect(result).toBe(true);
  });

  it('should call AiFiller.getFillSuggestions with fields and userData', async () => {
    const sendResponse = jest.fn();
    const fields = [{ name: 'email', type: 'email' }];
    const userData = { email: 'test@example.com' };

    mockGetFillSuggestions.mockResolvedValue([{ fieldName: 'email', suggestion: 'test@example.com', confidence: 0.9 }]);

    messageListener({ action: 'getFillSuggestions', fields, userData }, {}, sendResponse);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockGetFillSuggestions).toHaveBeenCalledWith(fields, userData);
  });

  it('should send suggestions back via sendResponse', async () => {
    const sendResponse = jest.fn();
    const suggestions = [{ fieldName: 'email', suggestion: 'test@example.com', confidence: 0.9 }];
    mockGetFillSuggestions.mockResolvedValue(suggestions);

    messageListener({ action: 'getFillSuggestions', fields: [{ name: 'email', type: 'email' }], userData: { email: 'test@example.com' } }, {}, sendResponse);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(sendResponse).toHaveBeenCalledWith({ suggestions });
  });

  it('should send error back via sendResponse on failure', async () => {
    const sendResponse = jest.fn();
    mockGetFillSuggestions.mockRejectedValue(new Error('API key missing'));

    messageListener({ action: 'getFillSuggestions', fields: [], userData: {} }, {}, sendResponse);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(sendResponse).toHaveBeenCalledWith({ error: 'API key missing' });
  });

  describe('callOpenRouter handler', () => {
    it('should return true to keep message channel open', () => {
      mockGetApiKey.mockResolvedValue('test-key');
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: '[]' } }] })
      });
      const result = messageListener({ type: 'callOpenRouter', prompt: 'test' }, {}, jest.fn());
      expect(result).toBe(true);
    });

    it('should call API with correct headers and body', async () => {
      const sendResponse = jest.fn();
      mockGetApiKey.mockResolvedValue('test-api-key');
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: '{"result":"ok"}' } }] })
      });

      messageListener({ type: 'callOpenRouter', prompt: 'test prompt' }, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockGetApiKey).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          }),
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [{ role: 'user', content: 'test prompt' }]
          })
        })
      );
    });

    it('should return success with data on successful API call', async () => {
      const sendResponse = jest.fn();
      mockGetApiKey.mockResolvedValue('test-api-key');
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'test response' } }] })
      });

      messageListener({ type: 'callOpenRouter', prompt: 'test' }, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({ success: true, data: 'test response' });
    });

    it('should return error when API key is missing', async () => {
      const sendResponse = jest.fn();
      mockGetApiKey.mockResolvedValue('');

      messageListener({ type: 'callOpenRouter', prompt: 'test' }, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'API密钥未配置，请在设置中添加OpenRouter API密钥'
      });
    });

    it('should return error on API failure', async () => {
      const sendResponse = jest.fn();
      mockGetApiKey.mockResolvedValue('test-api-key');
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } })
      });

      messageListener({ type: 'callOpenRouter', prompt: 'test' }, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 4000));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    }, 10000);
  });
});
