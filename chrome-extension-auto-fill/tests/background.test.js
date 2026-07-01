global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
};

const mockGetFillSuggestions = jest.fn();

jest.mock('../utils/ai-filler.js', () => ({
  __esModule: true,
  default: {
    getFillSuggestions: (...args) => mockGetFillSuggestions(...args)
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
});
