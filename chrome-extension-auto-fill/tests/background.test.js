global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    getURL: jest.fn().mockReturnValue('chrome-extension://test/')
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
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
    const result = messageListener({ action: 'getFillSuggestions', fields: [] }, {}, jest.fn());
    expect(result).toBe(true);
  });

  it('should call AiFiller.getFillSuggestions with fields only', async () => {
    const sendResponse = jest.fn();
    const fields = [{ name: 'email', type: 'email' }];

    mockGetFillSuggestions.mockResolvedValue([{ fieldName: 'email', suggestion: 'test@example.com', confidence: 0.9 }]);

    messageListener({ action: 'getFillSuggestions', fields }, {}, sendResponse);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockGetFillSuggestions).toHaveBeenCalledWith(fields);
  });

  it('should send suggestions back via sendResponse', async () => {
    const sendResponse = jest.fn();
    const suggestions = [{ fieldName: 'email', suggestion: 'test@example.com', confidence: 0.9 }];
    mockGetFillSuggestions.mockResolvedValue(suggestions);

    messageListener({ action: 'getFillSuggestions', fields: [{ name: 'email', type: 'email' }] }, {}, sendResponse);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(sendResponse).toHaveBeenCalledWith({ suggestions });
  });

  it('should send error back via sendResponse on failure', async () => {
    const sendResponse = jest.fn();
    mockGetFillSuggestions.mockRejectedValue(new Error('API key missing'));

    messageListener({ action: 'getFillSuggestions', fields: [] }, {}, sendResponse);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(sendResponse).toHaveBeenCalledWith({ error: 'API key missing' });
  });

  describe('handleTabMessage (detectForms/fillForm/previewFill)', () => {
    it('should return true for detectForms to keep channel open', () => {
      chrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      chrome.scripting.executeScript.mockResolvedValue([]);
      chrome.tabs.sendMessage.mockResolvedValue({ forms: [] });
      const result = messageListener({ action: 'detectForms' }, {}, jest.fn());
      expect(result).toBe(true);
    });

    it('should inject content script and forward detectForms', async () => {
      const sendResponse = jest.fn();
      chrome.tabs.query.mockResolvedValue([{ id: 42 }]);
      chrome.scripting.executeScript.mockResolvedValue([]);
      chrome.tabs.sendMessage.mockResolvedValue({ forms: [{ id: 0, fields: [] }] });

      messageListener({ action: 'detectForms' }, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 42 },
        files: ['content.js']
      });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(42, { action: 'detectForms' });
      expect(sendResponse).toHaveBeenCalledWith({ forms: [{ id: 0, fields: [] }] });
    });

    it('should forward fillForm through background', async () => {
      const sendResponse = jest.fn();
      chrome.tabs.query.mockResolvedValue([{ id: 10 }]);
      chrome.scripting.executeScript.mockResolvedValue([]);
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      messageListener({ action: 'fillForm', fieldName: 'email', value: 'test@example.com' }, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(chrome.scripting.executeScript).toHaveBeenCalled();
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(10, { action: 'fillForm', fieldName: 'email', value: 'test@example.com' });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should forward previewFill through background', async () => {
      const sendResponse = jest.fn();
      chrome.tabs.query.mockResolvedValue([{ id: 5 }]);
      chrome.scripting.executeScript.mockResolvedValue([]);
      chrome.tabs.sendMessage.mockResolvedValue({ success: true });

      messageListener({ action: 'previewFill', fieldName: 'name', value: '张三' }, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(5, { action: 'previewFill', fieldName: 'name', value: '张三' });
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle injection failure gracefully', async () => {
      const sendResponse = jest.fn();
      chrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      chrome.scripting.executeScript.mockRejectedValue(new Error('Cannot access tab'));

      messageListener({ action: 'detectForms' }, {}, sendResponse);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Cannot access tab' });
    });
  });
});
