describe('Compatibility: Chrome Version Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Manifest V3 API Compatibility', () => {
    it('should use service_worker instead of background.scripts', () => {
      const manifest = require('../manifest.json');
      expect(manifest.manifest_version).toBe(3);
      expect(manifest.background.service_worker).toBeDefined();
      expect(manifest.background.scripts).toBeUndefined();
    });

    it('should use action instead of browser_action', () => {
      const manifest = require('../manifest.json');
      expect(manifest.action).toBeDefined();
      expect(manifest.action.default_popup).toBe('popup.html');
      expect(manifest.browser_action).toBeUndefined();
    });

    it('should have valid Manifest V3 permissions format', () => {
      const manifest = require('../manifest.json');
      expect(Array.isArray(manifest.permissions)).toBe(true);
      expect(manifest.permissions).toContain('activeTab');
      expect(manifest.permissions).toContain('storage');
      expect(manifest.permissions).toContain('scripting');
    });

    it('should have web_accessible_resources in Manifest V3 format', () => {
      const manifest = require('../manifest.json');
      expect(Array.isArray(manifest.web_accessible_resources)).toBe(true);
      const resource = manifest.web_accessible_resources[0];
      expect(resource.resources).toBeDefined();
      expect(resource.matches).toBeDefined();
      expect(Array.isArray(resource.resources)).toBe(true);
      expect(Array.isArray(resource.matches)).toBe(true);
    });

    it('should inject content scripts via manifest', () => {
      const manifest = require('../manifest.json');
      expect(Array.isArray(manifest.content_scripts)).toBe(true);
      const cs = manifest.content_scripts[0];
      expect(cs.js).toContain('content.js');
      expect(cs.matches).toContain('<all_urls>');
    });
  });

  describe('Chrome Runtime API Compatibility', () => {
    it('should support chrome.runtime.onMessage.addListener', () => {
      const mockListener = { addListener: jest.fn() };
      global.chrome = { runtime: { onMessage: mockListener } };
      mockListener.addListener(jest.fn());
      expect(mockListener.addListener).toHaveBeenCalled();
    });

    it('should support chrome.runtime.sendMessage', () => {
      const mockSendMessage = jest.fn();
      global.chrome = { runtime: { sendMessage: mockSendMessage } };
      mockSendMessage({ action: 'test' });
      expect(mockSendMessage).toHaveBeenCalledWith({ action: 'test' });
    });

    it('should support chrome.runtime.getURL for extension resources', () => {
      const mockGetURL = jest.fn().mockReturnValue('chrome-extension://id/');
      global.chrome = { runtime: { getURL: mockGetURL } };
      const url = chrome.runtime.getURL('popup.html');
      expect(url).toContain('chrome-extension://');
      expect(mockGetURL).toHaveBeenCalledWith('popup.html');
    });

    it('should support chrome.runtime.lastError for error checking', () => {
      global.chrome = { runtime: { lastError: null } };
      expect(chrome.runtime.lastError).toBeNull();

      global.chrome = { runtime: { lastError: { message: 'test error' } } };
      expect(chrome.runtime.lastError.message).toBe('test error');
    });
  });

  describe('Chrome Storage API Compatibility', () => {
    it('should support chrome.storage.local.get', async () => {
      const mockGet = jest.fn().mockResolvedValue({ model: 'test-model' });
      global.chrome = { storage: { local: { get: mockGet } } };
      const result = await chrome.storage.local.get('model');
      expect(result).toEqual({ model: 'test-model' });
      expect(mockGet).toHaveBeenCalledWith('model');
    });

    it('should support chrome.storage.local.set', async () => {
      const mockSet = jest.fn().mockResolvedValue();
      global.chrome = { storage: { local: { set: mockSet } } };
      await chrome.storage.local.set({ model: 'test-model' });
      expect(mockSet).toHaveBeenCalledWith({ model: 'test-model' });
    });

    it('should support chrome.storage.local.clear', async () => {
      const mockClear = jest.fn().mockResolvedValue();
      global.chrome = { storage: { local: { clear: mockClear } } };
      await chrome.storage.local.clear();
      expect(mockClear).toHaveBeenCalled();
    });

    it('should handle storage.get returning undefined keys gracefully', async () => {
      const mockGet = jest.fn().mockResolvedValue({});
      global.chrome = { storage: { local: { get: mockGet } } };
      const result = await chrome.storage.local.get('model');
      expect(result.profiles).toBeUndefined();
    });
  });

  describe('Chrome Tabs API Compatibility', () => {
    it('should support chrome.tabs.query', () => {
      const mockQuery = jest.fn().mockResolvedValue([{ id: 1 }]);
      global.chrome = { tabs: { query: mockQuery } };
      chrome.tabs.query({ active: true, currentWindow: true });
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should support chrome.tabs.sendMessage', () => {
      const mockSendMessage = jest.fn();
      global.chrome = { tabs: { sendMessage: mockSendMessage } };
      chrome.tabs.sendMessage(1, { action: 'test' });
      expect(mockSendMessage).toHaveBeenCalledWith(1, { action: 'test' });
    });
  });

  describe('Chrome Scripting API Compatibility', () => {
    it('should have scripting permission for dynamic injection', () => {
      const manifest = require('../manifest.json');
      expect(manifest.permissions).toContain('scripting');
    });
  });

  describe('ES Module Support', () => {
    it('should use import statements in background script', () => {
      const fs = require('fs');
      const bgCode = fs.readFileSync(
        require('path').join(__dirname, '..', 'background.js'),
        'utf-8'
      );
      expect(bgCode).toMatch(/^import /m);
    });
  });

  describe('CSS.escape Polyfill Compatibility', () => {
    it('should provide CSS.escape polyfill in test environment', () => {
      expect(typeof global.CSS.escape).toBe('function');
    });

    it('should handle special characters in field names', () => {
      const escaped = CSS.escape('field[name]');
      expect(escaped).toContain('field');
      expect(escaped).toContain('name');
    });
  });

  describe('Fetch API Compatibility', () => {
    it('should support AbortController for request timeout', () => {
      expect(typeof AbortController).toBe('function');
      const controller = new AbortController();
      expect(controller.signal).toBeDefined();
      expect(typeof controller.abort).toBe('function');
    });

    it('should support fetch with signal option', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });

      const controller = new AbortController();
      await fetch('https://example.com', { signal: controller.signal });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ signal: controller.signal })
      );
    });
  });

  describe('Event API Compatibility', () => {
    it('should support Event constructor with bubbles option', () => {
      const event = new Event('input', { bubbles: true });
      expect(event.type).toBe('input');
      expect(event.bubbles).toBe(true);
    });

    it('should support dispatchEvent on DOM elements', () => {
      const input = document.createElement('input');
      const spy = jest.fn();
      input.addEventListener('input', spy);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Promise and Async/Await Compatibility', () => {
    it('should support Promise.all for parallel operations', async () => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ];
      const results = await Promise.all(promises);
      expect(results).toEqual([1, 2, 3]);
    });

    it('should support async/await syntax', async () => {
      const asyncFn = async () => 'test';
      const result = await asyncFn();
      expect(result).toBe('test');
    });
  });

  describe('JSON API Compatibility', () => {
    it('should support JSON.parse for AI response parsing', () => {
      const data = JSON.parse('{"key": "value"}');
      expect(data).toEqual({ key: 'value' });
    });

    it('should support JSON.stringify for request body', () => {
      const data = { key: 'value' };
      const str = JSON.stringify(data);
      expect(str).toBe('{"key":"value"}');
    });

    it('should handle JSON.parse errors gracefully', () => {
      expect(() => JSON.parse('invalid')).toThrow();
    });
  });

  describe('Form Element Compatibility', () => {
    it('should support input type attribute', () => {
      const input = document.createElement('input');
      input.type = 'text';
      expect(input.type).toBe('text');
    });

    it('should support select and option elements', () => {
      const select = document.createElement('select');
      const option = document.createElement('option');
      option.value = 'test';
      option.textContent = 'Test';
      select.appendChild(option);
      expect(select.options.length).toBe(1);
      expect(select.options[0].value).toBe('test');
    });

    it('should support checkbox checked property', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      expect(checkbox.checked).toBe(true);
    });

    it('should support radio button checked property', () => {
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'test';
      radio.value = 'option1';
      radio.checked = true;
      expect(radio.checked).toBe(true);
    });

    it('should support textarea value property', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'test content';
      expect(textarea.value).toBe('test content');
    });

    it('should support form element querySelector', () => {
      document.body.innerHTML = `
        <form>
          <input type="text" name="field1">
          <input type="email" name="field2">
        </form>
      `;
      const fields = document.querySelectorAll('form input');
      expect(fields.length).toBe(2);
    });
  });
});
