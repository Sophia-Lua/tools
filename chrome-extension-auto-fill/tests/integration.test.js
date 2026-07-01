import FormDetector from '../utils/form-detector.js';
import AiFiller from '../utils/ai-filler.js';
import ApiUtils from '../utils/api.js';
import StorageUtils from '../utils/storage.js';

jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    callOpenRouter: jest.fn()
  }
}));

describe('Integration: Full Flow (Form Detect → API Call → Field Fill)', () => {
  let contentMessageListener;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    global.chrome = {
      runtime: {
        onMessage: { addListener: jest.fn() },
        sendMessage: jest.fn(),
        lastError: null,
        getURL: jest.fn().mockReturnValue('chrome-extension://test/')
      },
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue(),
          clear: jest.fn().mockResolvedValue()
        }
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      }
    };
  });

  it('should detect form, get AI suggestions, and fill fields end-to-end', async () => {
    document.body.innerHTML = `
      <form action="/submit" method="POST">
        <label for="name">姓名</label>
        <input type="text" id="name" name="name" placeholder="请输入姓名">
        <label for="email">邮箱</label>
        <input type="email" id="email" name="email" placeholder="请输入邮箱">
        <label for="phone">电话</label>
        <input type="tel" id="phone" name="phone" placeholder="请输入电话">
        <select name="country">
          <option value="">请选择国家</option>
          <option value="CN">中国</option>
          <option value="US">美国</option>
        </select>
      </form>
    `;

    const forms = FormDetector.detectForms();
    expect(forms.length).toBe(1);
    expect(forms[0].fields.length).toBe(4);

    const fields = forms[0].fields;
    expect(fields[0]).toEqual(expect.objectContaining({ name: 'name', type: 'text', label: '姓名' }));
    expect(fields[1]).toEqual(expect.objectContaining({ name: 'email', type: 'email', label: '邮箱' }));
    expect(fields[2]).toEqual(expect.objectContaining({ name: 'phone', type: 'tel', label: '电话' }));
    expect(fields[3]).toEqual(expect.objectContaining({ name: 'country', type: 'select' }));

    const userData = {
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138000',
      country: 'CN'
    };

    const aiResponse = JSON.stringify([
      { fieldName: 'name', suggestion: '张三', confidence: 0.95 },
      { fieldName: 'email', suggestion: 'zhangsan@example.com', confidence: 0.9 },
      { fieldName: 'phone', suggestion: '13800138000', confidence: 0.85 },
      { fieldName: 'country', suggestion: 'CN', confidence: 0.8 }
    ]);
    ApiUtils.callOpenRouter.mockResolvedValue(aiResponse);

    const suggestions = await AiFiller.getFillSuggestions(fields, userData);
    expect(suggestions.length).toBe(4);
    expect(suggestions[0]).toEqual({ fieldName: 'name', suggestion: '张三', confidence: 0.95 });
    expect(suggestions[1]).toEqual({ fieldName: 'email', suggestion: 'zhangsan@example.com', confidence: 0.9 });

    jest.isolateModules(() => {
      require('../content.js');
    });
    contentMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

    const fillResults = [];
    for (const s of suggestions) {
      const result = await new Promise(resolve => {
        contentMessageListener(
          { action: 'fillForm', fieldName: s.fieldName, value: s.suggestion },
          {},
          resolve
        );
      });
      fillResults.push(result);
    }

    expect(fillResults.every(r => r.success === true)).toBe(true);

    expect(document.querySelector('[name="name"]').value).toBe('张三');
    expect(document.querySelector('[name="email"]').value).toBe('zhangsan@example.com');
    expect(document.querySelector('[name="phone"]').value).toBe('13800138000');
    expect(document.querySelector('[name="country"]').value).toBe('CN');
  });

  it('should detect form with checkbox and radio fields and fill them correctly', async () => {
    document.body.innerHTML = `
      <form>
        <input type="checkbox" name="agree" value="on">
        <input type="radio" name="gender" value="male">
        <input type="radio" name="gender" value="female">
        <textarea name="bio" placeholder="自我介绍"></textarea>
      </form>
    `;

    const forms = FormDetector.detectForms();
    const fields = forms[0].fields;

    expect(fields).toHaveLength(4);
    expect(fields[0]).toEqual(expect.objectContaining({ name: 'agree', type: 'checkbox' }));
    expect(fields[1]).toEqual(expect.objectContaining({ name: 'gender', type: 'radio' }));
    expect(fields[3]).toEqual(expect.objectContaining({ name: 'bio', type: 'textarea' }));

    const userData = { agree: 'true', gender: 'female', bio: '我是一名软件工程师' };

    const aiResponse = JSON.stringify([
      { fieldName: 'agree', suggestion: 'true', confidence: 0.9 },
      { fieldName: 'gender', suggestion: 'female', confidence: 0.85 },
      { fieldName: 'bio', suggestion: '我是一名软件工程师', confidence: 0.8 }
    ]);
    ApiUtils.callOpenRouter.mockResolvedValue(aiResponse);

    const suggestions = await AiFiller.getFillSuggestions(fields, userData);

    jest.isolateModules(() => {
      require('../content.js');
    });
    contentMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

    for (const s of suggestions) {
      await new Promise(resolve => {
        contentMessageListener(
          { action: 'fillForm', fieldName: s.fieldName, value: s.suggestion },
          {},
          resolve
        );
      });
    }

    expect(document.querySelector('[name="agree"]').checked).toBe(true);
    expect(document.querySelector('[name="gender"][value="female"]').checked).toBe(true);
    expect(document.querySelector('[name="bio"]').value).toBe('我是一名软件工程师');
  });

  it('should handle AI returning suggestions for only some fields gracefully', async () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="姓名">
        <input type="email" name="email" placeholder="邮箱">
        <input type="text" name="company" placeholder="公司">
      </form>
    `;

    const forms = FormDetector.detectForms();
    const fields = forms[0].fields;
    const userData = { name: '张三', email: 'zhangsan@example.com' };

    const aiResponse = JSON.stringify([
      { fieldName: 'name', suggestion: '张三', confidence: 0.95 },
      { fieldName: 'email', suggestion: 'zhangsan@example.com', confidence: 0.9 }
    ]);
    ApiUtils.callOpenRouter.mockResolvedValue(aiResponse);

    const suggestions = await AiFiller.getFillSuggestions(fields, userData);
    expect(suggestions.length).toBe(3);

    const companySuggestion = suggestions.find(s => s.fieldName === 'company');
    expect(companySuggestion.suggestion).toBe('');
    expect(companySuggestion.confidence).toBe(0);

    jest.isolateModules(() => {
      require('../content.js');
    });
    contentMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

    const results = [];
    for (const s of suggestions) {
      const result = await new Promise(resolve => {
        contentMessageListener(
          { action: 'fillForm', fieldName: s.fieldName, value: s.suggestion },
          {},
          resolve
        );
      });
      results.push(result);
    }

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);
    expect(document.querySelector('[name="name"]').value).toBe('张三');
    expect(document.querySelector('[name="email"]').value).toBe('zhangsan@example.com');
  });

  it('should handle AI returning invalid JSON by returning empty suggestions', async () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="name" placeholder="姓名">
      </form>
    `;

    const forms = FormDetector.detectForms();
    const fields = forms[0].fields;
    const userData = { name: '张三' };

    ApiUtils.callOpenRouter.mockResolvedValue('This is not valid JSON');

    const suggestions = await AiFiller.getFillSuggestions(fields, userData);
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].suggestion).toBe('');
    expect(suggestions[0].confidence).toBe(0);

    jest.isolateModules(() => {
      require('../content.js');
    });
    contentMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

    const result = await new Promise(resolve => {
      contentMessageListener(
        { action: 'fillForm', fieldName: 'name', value: suggestions[0].suggestion },
        {},
        resolve
      );
    });
    expect(result.success).toBe(true);
    expect(document.querySelector('[name="name"]').value).toBe('');
  });

  it('should handle multiple forms on the same page independently', async () => {
    document.body.innerHTML = `
      <form id="login-form" action="/login">
        <input type="text" name="username" placeholder="用户名">
        <input type="password" name="password" placeholder="密码">
      </form>
      <form id="contact-form" action="/contact">
        <input type="email" name="email" placeholder="邮箱">
        <textarea name="message" placeholder="留言"></textarea>
      </form>
    `;

    const forms = FormDetector.detectForms();
    expect(forms.length).toBe(2);

    const loginFields = forms[0].fields;
    const contactFields = forms[1].fields;

    expect(loginFields.length).toBe(2);
    expect(loginFields[0].name).toBe('username');
    expect(loginFields[1].name).toBe('password');
    expect(contactFields.length).toBe(2);
    expect(contactFields[0].name).toBe('email');
    expect(contactFields[1].name).toBe('message');

    jest.isolateModules(() => {
      require('../content.js');
    });
    contentMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

    await new Promise(resolve => {
      contentMessageListener(
        { action: 'fillForm', fieldName: 'username', value: 'admin' },
        {},
        resolve
      );
    });

    await new Promise(resolve => {
      contentMessageListener(
        { action: 'fillForm', fieldName: 'email', value: 'test@example.com' },
        {},
        resolve
      );
    });

    expect(document.querySelector('#login-form [name="username"]').value).toBe('admin');
    expect(document.querySelector('#contact-form [name="email"]').value).toBe('test@example.com');
  });

  it('should detect forms with no fields and handle empty field list', () => {
    document.body.innerHTML = `
      <form action="/empty">
        <button type="submit">Submit</button>
      </form>
    `;

    const forms = FormDetector.detectForms();
    expect(forms.length).toBe(1);
    expect(forms[0].fields.length).toBe(0);
  });

  it('should handle preview then fill workflow', async () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="address" placeholder="地址">
      </form>
    `;

    jest.isolateModules(() => {
      require('../content.js');
    });
    contentMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

    const previewResult = await new Promise(resolve => {
      contentMessageListener(
        { action: 'previewFill', fieldName: 'address', value: '北京市朝阳区' },
        {},
        resolve
      );
    });
    expect(previewResult.success).toBe(true);

    const field = document.querySelector('[name="address"]');
    expect(field.style.backgroundColor).toBe('rgb(255, 249, 196)');
    expect(field.title).toBe('预览: 北京市朝阳区');

    const fillResult = await new Promise(resolve => {
      contentMessageListener(
        { action: 'fillForm', fieldName: 'address', value: '北京市朝阳区' },
        {},
        resolve
      );
    });
    expect(fillResult.success).toBe(true);
    expect(field.value).toBe('北京市朝阳区');
  });

  it('should handle select field fill by option text (Chinese)', async () => {
    document.body.innerHTML = `
      <form>
        <select name="province">
          <option value="">请选择省份</option>
          <option value="beijing">北京市</option>
          <option value="shanghai">上海市</option>
          <option value="guangdong">广东省</option>
        </select>
      </form>
    `;

    jest.isolateModules(() => {
      require('../content.js');
    });
    contentMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

    const result = await new Promise(resolve => {
      contentMessageListener(
        { action: 'fillForm', fieldName: 'province', value: '上海市' },
        {},
        resolve
      );
    });

    expect(result.success).toBe(true);
    expect(document.querySelector('[name="province"]').value).toBe('shanghai');
  });
});
