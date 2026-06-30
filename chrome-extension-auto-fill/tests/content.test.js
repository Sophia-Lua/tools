global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  }
};

jest.mock('../utils/form-detector.js', () => ({
  __esModule: true,
  default: {
    detectForms: jest.fn().mockReturnValue([
      { id: 0, action: '/submit', method: 'POST', fields: [{ name: 'username', type: 'text' }] }
    ])
  }
}));

describe('Content Script', () => {
  let messageListener;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    jest.isolateModules(() => {
      require('../content.js');
    });
    messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
  });

  it('should listen for messages', () => {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  it('should return true to keep message channel open', () => {
    const result = messageListener({ action: 'detectForms' }, {}, jest.fn());
    expect(result).toBe(true);
  });

  it('should handle detectForms action', () => {
    const sendResponse = jest.fn();
    messageListener({ action: 'detectForms' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({
      forms: [
        { id: 0, action: '/submit', method: 'POST', fields: [{ name: 'username', type: 'text' }] }
      ]
    });
  });

  it('should handle fillForm action and set field value', () => {
    document.body.innerHTML = '<input name="username" type="text">';
    const sendResponse = jest.fn();
    messageListener({ action: 'fillForm', fieldName: 'username', value: 'testuser' }, {}, sendResponse);

    const field = document.querySelector('[name="username"]');
    expect(field.value).toBe('testuser');
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('should dispatch input and change events on fill', () => {
    document.body.innerHTML = '<input name="email" type="email">';
    const field = document.querySelector('[name="email"]');
    const inputSpy = jest.spyOn(field, 'dispatchEvent');
    const sendResponse = jest.fn();

    messageListener({ action: 'fillForm', fieldName: 'email', value: 'test@example.com' }, {}, sendResponse);

    expect(inputSpy).toHaveBeenCalledTimes(2);
    expect(inputSpy.mock.calls[0][0].type).toBe('input');
    expect(inputSpy.mock.calls[1][0].type).toBe('change');
  });

  it('should return error when field not found', () => {
    const sendResponse = jest.fn();
    messageListener({ action: 'fillForm', fieldName: 'nonexistent', value: 'test' }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: '字段未找到' });
  });
});
